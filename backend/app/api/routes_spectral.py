"""Multi-parametric spectral decomposition API endpoints."""
import io
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from backend.app.domain.schemas import SpectralExtractRequest
from backend.app.services.spectral_service import extract_multi_parametric_maps, SPECTRAL_CHANNELS
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Multi-Parametric Spectral Maps"])

@router.post("/spectral/extract")
def extract_spectral_maps(payload: SpectralExtractRequest):
    """Extract 4-channel multi-parametric spectral gradient decomposition."""
    file_id = payload.file_id
    if not file_id or file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid file_id required.")

    data, aff, meta = load_medical_image(FILE_REGISTRY[file_id]["path"])
    maps = extract_multi_parametric_maps(data)

    channel_list = []
    for c_idx, ch_info in enumerate(SPECTRAL_CHANNELS):
        ch_name = ch_info["name"]
        channel_list.append({
            "channel_index": c_idx,
            "name": ch_name,
            "description": ch_info["description"],
            "colormap": ch_info["colormap"],
            "mean_intensity": round(float(np.mean(maps[c_idx])), 4),
            "max_intensity": round(float(np.max(maps[c_idx])), 4),
        })

    return {
        "status": "success",
        "file_id": file_id,
        "spectral_channels": channel_list,
        "shape": list(data.shape),
    }

@router.get("/slice/channel")
def get_spectral_channel_slice(
    file_id: str = Query(...),
    channel: int = Query(0, ge=0, le=3),
    axis: str = Query("axial", pattern="^(axial|coronal|sagittal)$"),
    index: int = Query(0, ge=0),
):
    """Return 2D PNG slice of a specific multi-parametric spectral channel."""
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="file_id not found in registry.")

    data, _, _ = load_medical_image(FILE_REGISTRY[file_id]["path"])
    maps = extract_multi_parametric_maps(data)

    ch_data = maps[channel]
    ch_info = SPECTRAL_CHANNELS[channel]

    shape = ch_data.shape
    if axis == "axial":
        idx = max(0, min(index, shape[0] - 1))
        slice_2d = ch_data[idx, :, :]
    elif axis == "coronal":
        idx = max(0, min(index, shape[1] - 1))
        slice_2d = ch_data[:, idx, :]
    else:
        idx = max(0, min(index, shape[2] - 1))
        slice_2d = ch_data[:, :, idx]

    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(slice_2d, cmap=ch_info["colormap"], origin="lower")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")
