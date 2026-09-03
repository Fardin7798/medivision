"""Image Registration API endpoints."""
import io
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from backend.app.domain.schemas import RegisterRequest
from backend.app.services.register_service import register_3d_images, create_perturbed_scan_pair
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Image Registration"])

@router.get("/dataset/registration-pair")
def get_registration_pair():
    """Retrieve pre-aligned Fixed Atlas and Moving Patient scans."""
    out_dir = Path("./data/registration_test")
    out_dir.mkdir(parents=True, exist_ok=True)
    f_path, m_path = create_perturbed_scan_pair(output_dir=out_dir)

    f_id = "atlas_fixed_scan"
    m_id = "patient_moving_scan"
    FILE_REGISTRY[f_id] = {"path": f_path, "filename": "fixed_atlas.nii.gz"}
    FILE_REGISTRY[m_id] = {"path": m_path, "filename": "moving_patient.nii.gz"}

    return {
        "status": "success",
        "fixed_file_id": f_id,
        "moving_file_id": m_id,
        "description": "Fixed Reference Atlas Scan & Moving Patient Follow-Up Scan.",
    }

@router.post("/register")
def register_scans(payload: RegisterRequest):
    """Run SimpleITK 2-level multi-resolution spatial alignment."""
    fixed_id = payload.fixed_file_id
    moving_id = payload.moving_file_id
    transform_type = payload.transform_type

    if not fixed_id or fixed_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid fixed_file_id required.")
    if not moving_id or moving_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid moving_file_id required.")

    fixed_path = FILE_REGISTRY[fixed_id]["path"]
    moving_path = FILE_REGISTRY[moving_id]["path"]
    out_dir = Path("./outputs")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{moving_id}_registered.nii.gz"

    meta = register_3d_images(
        fixed_path,
        moving_path,
        transform_type=transform_type,
        output_path=out_path,
    )

    reg_id = f"{moving_id}_registered"
    FILE_REGISTRY[reg_id] = {
        "path": str(out_path),
        "filename": f"{moving_id}_registered.nii.gz",
        "transform_type": transform_type,
    }

    return {
        "status": "success",
        "registered_file_id": reg_id,
        "fixed_file_id": fixed_id,
        "moving_file_id": moving_id,
        "transform_type": transform_type,
        "final_metric": meta.get("final_metric_value", 0.0),
        "iterations": meta.get("optimizer_iterations", 0),
        "rotation_deg": meta.get("rotation_deg", {}),
        "translation_mm": meta.get("translation_mm", {}),
    }

@router.get("/slice/registration-diff")
def get_registration_difference_slice(
    fixed_file_id: str = Query(...),
    moving_file_id: str = Query(...),
    axis: str = Query("axial", pattern="^(axial|coronal|sagittal)$"),
    index: int = Query(0, ge=0),
):
    """Return RGB subtraction slice (Fixed=Cyan, Moving=Red, Aligned=Gray)."""
    if fixed_file_id not in FILE_REGISTRY or moving_file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Invalid scan IDs for subtraction.")

    f_data, _, _ = load_medical_image(FILE_REGISTRY[fixed_file_id]["path"])
    m_data, _, _ = load_medical_image(FILE_REGISTRY[moving_file_id]["path"])

    shape = f_data.shape
    if axis == "axial":
        idx = max(0, min(index, shape[0] - 1))
        f_sl = f_data[idx, :, :]
        m_sl = m_data[min(idx, m_data.shape[0]-1), :, :] if m_data.shape != shape else m_data[idx, :, :]
    elif axis == "coronal":
        idx = max(0, min(index, shape[1] - 1))
        f_sl = f_data[:, idx, :]
        m_sl = m_data[:, min(idx, m_data.shape[1]-1), :] if m_data.shape != shape else m_data[:, idx, :]
    else:
        idx = max(0, min(index, shape[2] - 1))
        f_sl = f_data[:, :, idx]
        m_sl = m_data[:, :, min(idx, m_data.shape[2]-1)] if m_data.shape != shape else m_data[:, :, idx]

    # Resize m_sl if dimensions mismatch
    if f_sl.shape != m_sl.shape:
        import scipy.ndimage
        zoom = [f / m for f, m in zip(f_sl.shape, m_sl.shape)]
        m_sl = scipy.ndimage.zoom(m_sl, zoom, order=1)

    f_norm = (f_sl - np.min(f_sl)) / (np.ptp(f_sl) + 1e-5)
    m_norm = (m_sl - np.min(m_sl)) / (np.ptp(m_sl) + 1e-5)

    rgb = np.zeros((f_sl.shape[0], f_sl.shape[1], 3), dtype=np.float32)
    rgb[..., 0] = m_norm
    rgb[..., 1] = f_norm
    rgb[..., 2] = f_norm

    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(rgb, origin="lower")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")
