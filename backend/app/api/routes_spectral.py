"""Multichannel & Spectral Feature Extraction API endpoints."""
import io
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import Response

from backend.app.services.spectral_service import extract_multichannel_volume
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Multichannel Features"])

# In-memory cached multichannel tensors
SPECTRAL_CACHE = {}

@router.post("/spectral/extract")
def extract_spectral_features(payload: dict = Body(...)):
    """Extract 4-channel spectral tensor (Intensity, Sobel Gradient, Laplacian, Gabor Texture)."""
    file_id = payload.get("file_id", "sample_heart_prep")
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="file_id not found in registry.")

    scan_path = FILE_REGISTRY[file_id]["path"]
    data, _, meta = load_medical_image(scan_path)
    
    mc_tensor = extract_multichannel_volume(data)
    SPECTRAL_CACHE[file_id] = mc_tensor

    return {
        "status": "success",
        "file_id": file_id,
        "num_channels": 4,
        "tensor_shape": list(mc_tensor.shape),
        "channels": [
            {"index": 0, "name": "Raw Normalized MRI Intensity", "purpose": "Baseline anatomical voxel values"},
            {"index": 1, "name": "3D Sobel Spatial Gradient Magnitude", "purpose": "Boundary transition & edge enhancement"},
            {"index": 2, "name": "3D Laplacian Second Derivative", "purpose": "Curvature, ridges & anatomical contours"},
            {"index": 3, "name": "3D Gabor Spatial Texture Response", "purpose": "Local directional myocardial tissue frequency"},
        ],
    }

@router.get("/slice/channel")
def get_channel_slice(
    file_id: str = Query("sample_heart_prep", description="File ID"),
    channel: int = Query(0, ge=0, le=3, description="Channel index (0 to 3)"),
    axis: str = Query("axial", pattern="^(axial|coronal|sagittal)$"),
    index: int = Query(32, ge=0),
):
    """Return a 2D PNG slice of a specific derived spectral feature channel."""
    if file_id not in SPECTRAL_CACHE:
        if file_id not in FILE_REGISTRY:
            raise HTTPException(status_code=404, detail="Scan file_id not found.")
        data, _, _ = load_medical_image(FILE_REGISTRY[file_id]["path"])
        SPECTRAL_CACHE[file_id] = extract_multichannel_volume(data)

    mc_tensor = SPECTRAL_CACHE[file_id] # (4, D, H, W)
    ch_volume = mc_tensor[channel]

    shape = ch_volume.shape
    if axis == "axial":
        idx = max(0, min(index, shape[0] - 1))
        slice_2d = ch_volume[idx, :, :]
    elif axis == "coronal":
        idx = max(0, min(index, shape[1] - 1))
        slice_2d = ch_volume[:, idx, :]
    else:
        idx = max(0, min(index, shape[2] - 1))
        slice_2d = ch_volume[:, :, idx]

    # Colormaps tailored to feature type
    colormaps = ["gray", "inferno", "magma", "viridis"]
    cmap = colormaps[channel]

    s_min, s_max = np.min(slice_2d), np.max(slice_2d)
    norm_slice = (slice_2d - s_min) / (s_max - s_min + 1e-5)

    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(norm_slice, cmap=cmap, origin="lower")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")
