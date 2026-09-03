"""Data ingestion and slice retrieval API routes."""
import os
import io
import uuid
from pathlib import Path
from typing import Optional

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import Response, JSONResponse

from backend.app.services.data_service import (
    load_medical_image,
    save_nifti,
    create_synthetic_sample,
)

router = APIRouter(prefix="/api", tags=["Data & Ingestion"])

UPLOAD_DIR = Path("./data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory metadata / cache registry
FILE_REGISTRY = {}

@router.post("/upload")
async def upload_medical_image(file: UploadFile = File(...)):
    """Upload a volumetric NIfTI image (.nii or .nii.gz)."""
    if not (file.filename.endswith(".nii") or file.filename.endswith(".nii.gz")):
        raise HTTPException(status_code=400, detail="Only .nii and .nii.gz files are supported.")

    file_id = f"scan_{uuid.uuid4().hex[:8]}"
    saved_path = UPLOAD_DIR / f"{file_id}_{file.filename}"

    with open(saved_path, "wb") as f:
        content = await file.read()
        f.write(content)

    data, affine, meta = load_medical_image(saved_path)
    FILE_REGISTRY[file_id] = {
        "path": str(saved_path),
        "filename": file.filename,
        "shape": meta["shape"],
        "spacing": meta["spacing"],
        "min_intensity": meta["min_intensity"],
        "max_intensity": meta["max_intensity"],
        "mean_intensity": meta["mean_intensity"],
        "affine": meta["affine"],
    }

    return {
        "file_id": file_id,
        "filename": file.filename,
        "shape": meta["shape"],
        "spacing": meta["spacing"],
        "min_intensity": meta["min_intensity"],
        "max_intensity": meta["max_intensity"],
    }

@router.get("/slice")
def get_2d_slice(
    file_id: str = Query(..., description="File ID returned from upload or sample"),
    axis: str = Query("axial", pattern="^(axial|coronal|sagittal)$"),
    index: int = Query(0, ge=0),
):
    """Extract and return a 2D grayscale slice as PNG image for fast MPR scrubbing."""
    if file_id not in FILE_REGISTRY:
        # Check if synthetic exists
        synth_img = Path("./data/synthetic/synthetic_heart_mri.nii.gz")
        if synth_img.is_file() and file_id == "sample_heart":
            data, _, meta = load_medical_image(synth_img)
            FILE_REGISTRY[file_id] = {"path": str(synth_img), "shape": meta["shape"]}
        else:
            raise HTTPException(status_code=404, detail="File ID not found in registry.")

    file_info = FILE_REGISTRY[file_id]
    data, _, _ = load_medical_image(file_info["path"])
    shape = data.shape

    # Slicing along requested axis
    # Assumes shape (D, H, W) -> (Z, Y, X)
    if axis == "axial":
        idx = max(0, min(index, shape[0] - 1))
        slice_2d = data[idx, :, :]
    elif axis == "coronal":
        idx = max(0, min(index, shape[1] - 1))
        slice_2d = data[:, idx, :]
    else: # sagittal
        idx = max(0, min(index, shape[2] - 1))
        slice_2d = data[:, :, idx]

    # Normalize slice to 0-255 for PNG rendering
    s_min, s_max = np.min(slice_2d), np.max(slice_2d)
    if s_max - s_min > 1e-5:
        norm_slice = ((slice_2d - s_min) / (s_max - s_min) * 255).astype(np.uint8)
    else:
        norm_slice = np.zeros_like(slice_2d, dtype=np.uint8)

    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(norm_slice, cmap="gray", origin="lower")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/dataset/sample")
def get_or_create_sample():
    """Generate or return a synthetic 3D cardiac MRI sample for instant testing."""
    img_p, lbl_p = create_synthetic_sample()
    data, _, meta = load_medical_image(img_p)
    file_id = "sample_heart"
    FILE_REGISTRY[file_id] = {
        "path": img_p,
        "filename": "synthetic_heart_mri.nii.gz",
        "shape": meta["shape"],
        "spacing": meta["spacing"],
        "min_intensity": meta["min_intensity"],
        "max_intensity": meta["max_intensity"],
    }
    return {
        "file_id": file_id,
        "filename": "synthetic_heart_mri.nii.gz",
        "shape": meta["shape"],
        "spacing": meta["spacing"],
        "min_intensity": meta["min_intensity"],
        "max_intensity": meta["max_intensity"],
        "message": "Synthetic cardiac MRI generated successfully."
    }

@router.get("/probe")
def probe_voxel_coordinates(
    file_id: str = Query("sample_heart", description="File ID"),
    mask_id: Optional[str] = Query(None, description="Optional mask file ID"),
    z: int = Query(32, ge=0),
    y: int = Query(32, ge=0),
    x: int = Query(32, ge=0),
):
    """Probe voxel intensity, segmentation label, and physical coordinate (mm) at (z, y, x)."""
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Scan file_id not found.")

    data, affine, meta = load_medical_image(FILE_REGISTRY[file_id]["path"])
    shape = data.shape

    # Clamp coordinates
    cz = max(0, min(z, shape[0] - 1))
    cy = max(0, min(y, shape[1] - 1))
    cx = max(0, min(x, shape[2] - 1))

    intensity = float(data[cz, cy, cx])
    spacing = meta.get("spacing", [1.0, 1.0, 1.0])

    # Physical coordinates in mm from origin
    phys_x = round(float(cx * spacing[2]), 2)
    phys_y = round(float(cy * spacing[1]), 2)
    phys_z = round(float(cz * spacing[0]), 2)

    label = 0
    if mask_id and mask_id in FILE_REGISTRY:
        mask_data, _, _ = load_medical_image(FILE_REGISTRY[mask_id]["path"])
        if mask_data.shape == shape:
            label = int(mask_data[cz, cy, cx])

    return {
        "voxel_indices": {"z": cz, "y": cy, "x": cx},
        "physical_coords_mm": {"x": phys_x, "y": phys_y, "z": phys_z},
        "intensity": round(intensity, 2),
        "segmentation_label": label,
        "structure": "Left Atrial Cavity" if label > 0 else "Background / Surrounding Tissue",
        "shape": list(shape),
    }
