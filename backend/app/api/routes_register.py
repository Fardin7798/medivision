"""Medical Image Registration API endpoints."""
import io
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import Response

from backend.app.services.register_service import register_3d_images, create_perturbed_scan_pair
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Registration"])

OUTPUT_DIR = Path("./outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/dataset/registration-pair")
def get_or_create_registration_pair():
    """Generate or retrieve synthetic fixed atlas and moving patient scans for registration."""
    fixed_p, moving_p = create_perturbed_scan_pair()
    fixed_data, _, f_meta = load_medical_image(fixed_p)
    moving_data, _, m_meta = load_medical_image(moving_p)

    f_id = "atlas_fixed_scan"
    m_id = "patient_moving_scan"

    FILE_REGISTRY[f_id] = {"path": fixed_p, "filename": "fixed_atlas.nii.gz", "shape": f_meta["shape"]}
    FILE_REGISTRY[m_id] = {"path": moving_p, "filename": "moving_patient.nii.gz", "shape": m_meta["shape"]}

    return {
        "fixed_file_id": f_id,
        "moving_file_id": m_id,
        "shape": f_meta["shape"],
        "message": "Fixed reference atlas and misaligned patient scan pair prepared."
    }

@router.post("/register")
def register_scans(payload: dict = Body(...)):
    """Align moving patient scan to fixed reference scan using SimpleITK multi-resolution registration."""
    fixed_id = payload.get("fixed_file_id", "atlas_fixed_scan")
    moving_id = payload.get("moving_file_id", "patient_moving_scan")
    transform_type = payload.get("transform_type", "rigid")

    # If ids are not in registry, generate pair
    if fixed_id not in FILE_REGISTRY or moving_id not in FILE_REGISTRY:
        get_or_create_registration_pair()

    fixed_path = FILE_REGISTRY[fixed_id]["path"]
    moving_path = FILE_REGISTRY[moving_id]["path"]
    out_file = OUTPUT_DIR / f"{moving_id}_registered.nii.gz"

    reg_result = register_3d_images(
        fixed_image_path=fixed_path,
        moving_image_path=moving_path,
        transform_type=transform_type,
        output_path=out_file,
    )

    reg_id = f"{moving_id}_registered"
    FILE_REGISTRY[reg_id] = {
        "path": str(out_file),
        "filename": f"{moving_id}_registered.nii.gz",
    }

    return {
        "status": "converged",
        "registered_file_id": reg_id,
        "fixed_file_id": fixed_id,
        "moving_file_id": moving_id,
        "transform_type": transform_type,
        "final_metric_value": reg_result["final_metric_value"],
        "optimizer_iterations": reg_result["optimizer_iterations"],
        "rotation_deg": reg_result["rotation_deg"],
        "translation_mm": reg_result["translation_mm"],
    }

@router.get("/slice/registration-diff")
def get_registration_diff_slice(
    fixed_file_id: str = Query(..., description="Fixed atlas scan ID"),
    moving_file_id: str = Query(..., description="Moving or registered scan ID"),
    axis: str = Query("axial", pattern="^(axial|coronal|sagittal)$"),
    index: int = Query(32, ge=0),
):
    """Generate a dual-color composite view (Red=Fixed Atlas, Green=Moving Scan) to visualize spatial alignment."""
    if fixed_file_id not in FILE_REGISTRY or moving_file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Scan IDs not found in registry.")

    fixed_data, _, _ = load_medical_image(FILE_REGISTRY[fixed_file_id]["path"])
    moving_data, _, _ = load_medical_image(FILE_REGISTRY[moving_file_id]["path"])

    shape = fixed_data.shape
    if axis == "axial":
        idx = max(0, min(index, shape[0] - 1))
        f_slice = fixed_data[idx, :, :]
        m_slice = moving_data[idx, :, :]
    elif axis == "coronal":
        idx = max(0, min(index, shape[1] - 1))
        f_slice = fixed_data[:, idx, :]
        m_slice = moving_data[:, idx, :]
    else:
        idx = max(0, min(index, shape[2] - 1))
        f_slice = fixed_data[:, :, idx]
        m_slice = moving_data[:, :, idx]

    # Normalize both to 0-1
    f_norm = (f_slice - np.min(f_slice)) / (np.ptp(f_slice) + 1e-5)
    m_norm = (m_slice - np.min(m_slice)) / (np.ptp(m_slice) + 1e-5)

    # Composite RGB image: Red = Fixed, Green = Moving, Blue = 0.5 * (Fixed + Moving)
    rgb = np.zeros((*f_norm.shape, 3), dtype=np.float32)
    rgb[:, :, 0] = f_norm # Red
    rgb[:, :, 1] = m_norm # Green
    rgb[:, :, 2] = (f_norm + m_norm) * 0.25 # Subdued blue

    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(rgb, origin="lower")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")
