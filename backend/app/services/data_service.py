"""Data ingestion and dataset management module for MediVision."""
import os
import json
import tarfile
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import nibabel as nib
import numpy as np

from backend.app.config import get_config


def load_medical_image(file_path: str | Path) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Load a volumetric medical image (NIfTI format).

    Args:
        file_path: Path to the .nii or .nii.gz file.

    Returns:
        voxel_data: np.ndarray of shape (D, H, W) or (H, W, D) cast to float32.
        affine: 4x4 spatial affine transformation matrix.
        metadata: Dictionary containing voxel spacing, shape, min/max intensity, and header details.
    """
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Medical image file not found: {path}")

    # Load via NiBabel
    nii = nib.load(str(path))
    data = nii.get_fdata(dtype=np.float32)
    affine = nii.affine.copy()
    header = nii.header

    # Extract spacing (pixdim in NIfTI header)
    zooms = header.get_zooms()
    spacing = tuple(float(z) for z in zooms[:3]) if len(zooms) >= 3 else (1.0, 1.0, 1.0)

    metadata = {
        "file_name": path.name,
        "shape": list(data.shape),
        "spacing": list(spacing),
        "affine": affine.tolist(),
        "min_intensity": float(np.min(data)),
        "max_intensity": float(np.max(data)),
        "mean_intensity": float(np.mean(data)),
        "std_intensity": float(np.std(data)),
        "data_type": str(data.dtype),
    }

    return data, affine, metadata


def save_nifti(data: np.ndarray, affine: np.ndarray, output_path: str | Path) -> str:
    """
    Save a 3D numpy array as a compressed NIfTI image (.nii.gz).

    Args:
        data: 3D numpy array (e.g. uint8 for masks, float32 for scans).
        affine: 4x4 spatial transformation matrix.
        output_path: Destination path.

    Returns:
        Resolved output file path string.
    """
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    nii_img = nib.Nifti1Image(data, affine)
    nib.save(nii_img, str(out_path))
    return str(out_path.resolve())


def download_msd_heart(root_dir: str | Path = "./data") -> str:
    """
    Download and extract the Medical Segmentation Decathlon Task02_Heart dataset.

    Args:
        root_dir: Directory where the dataset will be saved.

    Returns:
        Path to the extracted Task02_Heart directory.
    """
    cfg = get_config()
    target_dir = Path(root_dir).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    task_dir = target_dir / cfg["dataset"]["task_name"]

    if task_dir.is_dir() and (task_dir / "dataset.json").is_file():
        print(f"[MediVision Data] Dataset already extracted at: {task_dir}")
        return str(task_dir)

    tar_path = target_dir / f"{cfg["dataset"]["task_name"]}.tar"
    url = cfg["dataset"]["download_url"]

    if not tar_path.is_file():
        print(f"[MediVision Data] Downloading {cfg["dataset"]["task_name"]} from {url}...")
        urllib.request.urlretrieve(url, str(tar_path))
        print(f"[MediVision Data] Download complete: {tar_path} ({tar_path.stat().st_size} bytes)")

    print(f"[MediVision Data] Extracting {tar_path}...")
    with tarfile.open(str(tar_path), "r:*") as tar:
        tar.extractall(path=str(target_dir))
    print(f"[MediVision Data] Extraction complete to {task_dir}")

    return str(task_dir)


def get_dataset_split(
    dataset_dir: str | Path = "./data/Task02_Heart",
    val_split: float = 0.2,
    seed: int = 42
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    """
    Parse dataset.json and return reproducible train and validation file lists.

    Args:
        dataset_dir: Path to extracted Task02_Heart directory.
        val_split: Fraction of training samples reserved for validation.
        seed: Random seed for deterministic splitting.

    Returns:
        train_files: List of {"image": path, "label": path} dicts.
        val_files: List of {"image": path, "label": path} dicts.
    """
    d_path = Path(dataset_dir)
    json_path = d_path / "dataset.json"
    if not json_path.is_file():
        raise FileNotFoundError(f"dataset.json not found in {d_path}")

    with open(json_path, "r") as f:
        data_info = json.load(f)

    raw_training = data_info.get("training", [])
    formatted_pairs = []

    for item in raw_training:
        img_rel = item["image"].lstrip("./")
        lbl_rel = item["label"].lstrip("./")
        img_full = str((d_path / img_rel).resolve())
        lbl_full = str((d_path / lbl_rel).resolve())
        if Path(img_full).is_file() and Path(lbl_full).is_file():
            formatted_pairs.append({"image": img_full, "label": lbl_full})

    rng = np.random.default_rng(seed)
    indices = np.arange(len(formatted_pairs))
    rng.shuffle(indices)

    num_val = max(1, int(len(formatted_pairs) * val_split))
    val_idx = indices[:num_val]
    train_idx = indices[num_val:]

    train_files = [formatted_pairs[i] for i in train_idx]
    val_files = [formatted_pairs[i] for i in val_idx]

    return train_files, val_files


def create_synthetic_sample(
    output_dir: str | Path = "./data/synthetic",
    shape: Tuple[int, int, int] = (64, 64, 64)
) -> Tuple[str, str]:
    """
    Create a synthetic 3D cardiac MRI scan and ground truth left atrium mask
    for offline testing and CI smoke tests without downloading full dataset.

    Returns:
        (image_path, label_path)
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    img_path = out_dir / "synthetic_heart_mri.nii.gz"
    lbl_path = out_dir / "synthetic_heart_label.nii.gz"

    D, H, W = shape
    # Create coordinate grid
    z, y, x = np.ogrid[:D, :H, :W]
    center = (D // 2, H // 2, W // 2)

    # Synthetic anatomy: sphere/ellipsoid for left atrium
    radius = min(shape) // 4
    dist_sq = ((z - center[0]) ** 2) / 1.0 + ((y - center[1]) ** 2) / 1.2 + ((x - center[2]) ** 2) / 0.8
    label = (dist_sq <= radius ** 2).astype(np.uint8)

    # Background MRI intensity gradient with noise
    background = (50 + 20 * np.sin(z / 5.0) + 30 * np.cos(y / 6.0)).astype(np.float32)
    noise = np.random.normal(0, 5, size=shape).astype(np.float32)
    image = background + noise
    # Enhanced contrast inside atrium
    image[label == 1] += 120.0

    affine = np.eye(4, dtype=np.float32)
    np.fill_diagonal(affine[:3, :3], 1.25) # 1.25mm voxel spacing

    save_nifti(image, affine, img_path)
    save_nifti(label, affine, lbl_path)

    return str(img_path.resolve()), str(lbl_path.resolve())


if __name__ == "__main__":
    print("Testing data ingestion module...")
    img_p, lbl_p = create_synthetic_sample()
    print(f"Synthetic sample generated: Image={img_p}, Label={lbl_p}")
    data, aff, meta = load_medical_image(img_p)
    print(f"Loaded image successfully: shape={meta['shape']}, spacing={meta['spacing']}")
