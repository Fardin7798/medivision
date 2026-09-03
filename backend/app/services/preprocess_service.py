"""Volumetric medical image preprocessing pipeline for MediVision."""
from pathlib import Path
from typing import Dict, Optional, Tuple, Any, List

import nibabel as nib
import numpy as np
import scipy.ndimage
import torch

from monai.transforms import (
    Compose,
    LoadImaged,
    EnsureChannelFirstd,
    Spacingd,
    Orientationd,
    ScaleIntensityRangePercentilesd,
    NormalizeIntensityd,
    CropForegroundd,
    RandCropByPosNegLabeld,
    RandRotated,
    RandFlipd,
    EnsureTyped,
)

from backend.app.config import get_config
from backend.app.services.data_service import load_medical_image, save_nifti


def resample_to_spacing(
    image: np.ndarray,
    current_spacing: Tuple[float, float, float],
    target_spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    is_label: bool = False,
) -> Tuple[np.ndarray, Tuple[float, float, float]]:
    """
    Resample a 3D numpy array to target voxel spacing using spline interpolation.

    Args:
        image: 3D array of shape (D, H, W).
        current_spacing: Tuple of (sz, sy, sx) or (sx, sy, sz) in mm.
        target_spacing: Target isotropic resolution in mm.
        is_label: If True, uses nearest neighbor interpolation (order=0).

    Returns:
        resampled_image: 3D array at target spacing.
        new_spacing: Final spacing tuple.
    """
    zoom_factors = [
        current / target
        for current, target in zip(current_spacing, target_spacing)
    ]
    order = 0 if is_label else 3
    resampled = scipy.ndimage.zoom(image, zoom_factors, order=order, mode="nearest")

    if is_label:
        resampled = np.round(resampled).astype(np.uint8)
    else:
        resampled = resampled.astype(np.float32)

    return resampled, target_spacing


def normalize_intensity(
    image: np.ndarray,
    p_min: float = 1.0,
    p_max: float = 99.0,
    z_score: bool = True,
) -> np.ndarray:
    """
    Clip extreme intensity outliers and normalize voxel values.

    Args:
        image: 3D array of float32 intensities.
        p_min: Lower percentile cutoff (e.g. 1.0%).
        p_max: Upper percentile cutoff (e.g. 99.0%).
        z_score: If True, applies standard z-score normalization (zero-mean, unit-variance).

    Returns:
        Normalized 3D array.
    """
    v_min = np.percentile(image, p_min)
    v_max = np.percentile(image, p_max)
    clipped = np.clip(image, v_min, v_max)

    if z_score:
        mean = np.mean(clipped)
        std = np.std(clipped)
        if std > 1e-6:
            normalized = (clipped - mean) / std
        else:
            normalized = clipped - mean
    else:
        denom = v_max - v_min
        if denom > 1e-6:
            normalized = (clipped - v_min) / denom
        else:
            normalized = np.zeros_like(clipped)

    return normalized.astype(np.float32)


def pad_or_crop(
    volume: np.ndarray,
    target_shape: Tuple[int, int, int] = (96, 96, 96),
    pad_value: float = 0.0,
) -> np.ndarray:
    """
    Center-crop or pad a 3D volume to a fixed spatial dimension.

    Args:
        volume: 3D array of shape (D, H, W).
        target_shape: Target dimensions (tD, tH, tW).
        pad_value: Constant value used for padding edges.

    Returns:
        3D array with exact shape equal to target_shape.
    """
    res = np.full(target_shape, pad_value, dtype=volume.dtype)
    cur_shape = volume.shape

    # Calculate crop/pad slices for each dimension
    src_slices = []
    dst_slices = []

    for cur_dim, tgt_dim in zip(cur_shape, target_shape):
        if cur_dim >= tgt_dim:
            # Crop source
            start = (cur_dim - tgt_dim) // 2
            src_slices.append(slice(start, start + tgt_dim))
            dst_slices.append(slice(0, tgt_dim))
        else:
            # Pad target
            start = (tgt_dim - cur_dim) // 2
            src_slices.append(slice(0, cur_dim))
            dst_slices.append(slice(start, start + cur_dim))

    res[tuple(dst_slices)] = volume[tuple(src_slices)]
    return res


def get_monai_transforms(
    train: bool = True,
    roi_size: Tuple[int, int, int] = (96, 96, 96),
    num_samples: int = 4,
) -> Compose:
    """
    Construct standard MONAI transform pipelines for training and validation.

    Args:
        train: If True, includes stochastic spatial augmentations and patch cropping.
        roi_size: Sub-volume crop size for 3D sliding window.
        num_samples: Number of sub-volume patches extracted per scan during training.

    Returns:
        monai.transforms.Compose pipeline.
    """
    cfg = get_config()
    target_spacing = tuple(cfg["preprocessing"]["target_spacing"])
    p_clip = cfg["preprocessing"]["intensity_clip_percentiles"]

    keys = ["image", "label"] if train else ["image"]

    base_transforms = [
        LoadImaged(keys=keys),
        EnsureChannelFirstd(keys=keys),
        Orientationd(keys=keys, axcodes="RAS"),
        Spacingd(keys=keys, pixdim=target_spacing, mode=["bilinear", "nearest"] if train else ["bilinear"]),
        ScaleIntensityRangePercentilesd(
            keys=["image"],
            lower=p_clip[0],
            upper=p_clip[1],
            b_min=0.0,
            b_max=1.0,
            clip=True,
        ),
        NormalizeIntensityd(keys=["image"], nonzero=True, channel_wise=True),
        EnsureTyped(keys=keys, track_meta=False),
    ]

    if train:
        train_transforms = [
            CropForegroundd(keys=["image", "label"], source_key="image"),
            RandCropByPosNegLabeld(
                keys=["image", "label"],
                label_key="label",
                spatial_size=roi_size,
                pos=1,
                neg=1,
                num_samples=num_samples,
                image_key="image",
                image_threshold=0,
            ),
            RandFlipd(keys=["image", "label"], spatial_axis=[0, 1, 2], prob=0.5),
            RandRotated(
                keys=["image", "label"],
                range_x=0.3,
                range_y=0.3,
                range_z=0.3,
                mode=["bilinear", "nearest"],
                prob=0.5,
            ),
        ]
        return Compose(base_transforms + train_transforms)

    return Compose(base_transforms)


def preprocess_volume_file(
    input_file: str | Path,
    output_file: Optional[str | Path] = None,
    is_label: bool = False,
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Execute end-to-end preprocessing on a NIfTI file and optionally save result.

    Returns:
        (preprocessed_volume, new_affine, metadata)
    """
    raw_data, affine, meta = load_medical_image(input_file)
    cur_spacing = tuple(meta["spacing"])

    # 1. Resample
    resampled, target_spacing = resample_to_spacing(raw_data, cur_spacing, (1.0, 1.0, 1.0), is_label=is_label)

    # 2. Normalize (for images only)
    if not is_label:
        processed = normalize_intensity(resampled)
    else:
        processed = resampled

    # 3. Compute new affine matrix with isotropic spacing
    new_affine = affine.copy()
    for i in range(3):
        col_norm = np.linalg.norm(new_affine[:3, i])
        if col_norm > 1e-6:
            new_affine[:3, i] = (new_affine[:3, i] / col_norm) * target_spacing[i]

    out_meta = {
        "original_shape": meta["shape"],
        "preprocessed_shape": list(processed.shape),
        "target_spacing": list(target_spacing),
        "min_val": float(np.min(processed)),
        "max_val": float(np.max(processed)),
        "mean_val": float(np.mean(processed)),
    }

    if output_file is not None:
        save_nifti(processed, new_affine, output_file)

    return processed, new_affine, out_meta


if __name__ == "__main__":
    print("Testing preprocessing module...")
    from backend.app.services.data_service import create_synthetic_sample
    img_p, lbl_p = create_synthetic_sample()
    
    proc_img, aff, meta = preprocess_volume_file(img_p, output_file="./outputs/preprocessed_test.nii.gz")
    print("Preprocessing completed successfully:")
    print(f"  Shape: {meta['original_shape']} -> {meta['preprocessed_shape']}")
    print(f"  Value Range: [{meta['min_val']:.2f}, {meta['max_val']:.2f}]")
