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
    Resample a 3D numpy array to target voxel spacing using spline (order 3) or nearest (order 0) interpolation.
    """
    zoom_factors = [c / t for c, t in zip(current_spacing, target_spacing)]
    order = 0 if is_label else 3
    resampled = scipy.ndimage.zoom(image, zoom_factors, order=order, mode="nearest")
    return resampled, target_spacing


def normalize_intensity(
    volume: np.ndarray,
    method: str = "z_score",
    lower_percentile: float = 0.5,
    upper_percentile: float = 99.5,
) -> np.ndarray:
    """
    Intensity normalization: Percentile clipping + Z-score standardization.
    """
    p_low = np.percentile(volume, lower_percentile)
    p_high = np.percentile(volume, upper_percentile)
    clipped = np.clip(volume, p_low, p_high)

    if method == "z_score":
        mean = np.mean(clipped)
        std = np.std(clipped)
        normalized = (clipped - mean) / (std + 1e-8)
    elif method == "min_max":
        normalized = (clipped - p_low) / (p_high - p_low + 1e-8)
    else:
        normalized = clipped

    return normalized.astype(np.float32)


def get_monai_transforms(
    target_spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    spatial_size: Tuple[int, int, int] = (96, 96, 96),
    is_train: bool = True,
    keys: Tuple[str, ...] = ("image", "label"),
) -> Compose:
    """
    Construct standardized MONAI Dictionary transformation pipeline for 3D Medical Volumes.
    """
    base_transforms = [
        LoadImaged(keys=keys, image_only=True),
        EnsureChannelFirstd(keys=keys),
        Orientationd(keys=keys, axcodes="RAS"),
        Spacingd(
            keys=keys,
            pixdim=target_spacing,
            mode=("bilinear", "nearest"),
        ),
        ScaleIntensityRangePercentilesd(
            keys=["image"],
            lower=0.5,
            upper=99.5,
            b_min=0.0,
            b_max=1.0,
            clip=True,
        ),
        NormalizeIntensityd(keys=["image"], nonzero=True, channel_wise=True),
        CropForegroundd(keys=keys, source_key="image"),
    ]

    if is_train and "label" in keys:
        base_transforms.extend([
            RandCropByPosNegLabeld(
                keys=keys,
                label_key="label",
                spatial_size=spatial_size,
                pos=1,
                neg=1,
                num_samples=2,
                image_key="image",
                image_threshold=0,
            ),
            RandRotated(
                keys=keys,
                range_x=0.3,
                range_y=0.3,
                range_z=0.3,
                mode=("bilinear", "nearest"),
                prob=0.5,
            ),
            RandFlipd(keys=keys, prob=0.5, spatial_axis=0),
            RandFlipd(keys=keys, prob=0.5, spatial_axis=1),
            RandFlipd(keys=keys, prob=0.5, spatial_axis=2),
        ])

    base_transforms.append(EnsureTyped(keys=keys, data_type="tensor"))
    return Compose(base_transforms)


def preprocess_volume_file(
    input_file: str | Path,
    output_file: Optional[str | Path] = None,
    target_spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
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
    resampled, actual_spacing = resample_to_spacing(raw_data, cur_spacing, target_spacing, is_label=is_label)

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
            new_affine[:3, i] = (new_affine[:3, i] / col_norm) * actual_spacing[i]

    out_meta = {
        "original_shape": meta["shape"],
        "preprocessed_shape": list(processed.shape),
        "target_spacing": list(actual_spacing),
        "min_val": float(np.min(processed)),
        "max_val": float(np.max(processed)),
        "mean_val": float(np.mean(processed)),
    }

    if output_file is not None:
        save_nifti(processed, new_affine, output_file)
        out_meta["output_file"] = str(Path(output_file).resolve())

    return processed, new_affine, out_meta
