"""3D AI Segmentation API endpoints."""
import io
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import Response

from backend.app.services.segment_service import segment_volume_file
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Segmentation"])

@router.post("/segment")
def segment_scan(payload: dict = Body(...)):
    """Run 3D AI segmentation (TotalSegmentator Pretrained Universal Engine or MONAI 3D Residual U-Net)."""
    file_id = payload.get("file_id")
    if not file_id or file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid file_id required.")

    engine = payload.get("engine", "totalsegmentator")
    target_structure = payload.get("target_structure", "all")
    task = payload.get("task", "total_mr")

    input_path = FILE_REGISTRY[file_id]["path"]
    out_dir = Path("./outputs")
    out_dir.mkdir(parents=True, exist_ok=True)
    mask_path = out_dir / f"{file_id}_mask.nii.gz"

    mask, aff, meta = segment_volume_file(
        input_path,
        output_mask_file=mask_path,
        engine=engine,
        target_structure=target_structure,
        task=task,
    )

    mask_id = f"{file_id}_mask"
    FILE_REGISTRY[mask_id] = {
        "path": str(mask_path),
        "filename": f"{file_id}_mask.nii.gz",
        "shape": meta["mask_shape"],
        "voxels_segmented": meta["voxels_segmented"],
        "volume_cm3": meta["volume_cm3"],
        "engine": meta.get("engine", engine),
        "structures": meta.get("structures", {}),
    }

    return {
        "mask_id": mask_id,
        "input_file_id": file_id,
        "engine_used": meta.get("engine", engine),
        "target_structure": target_structure,
        "mask_shape": meta["mask_shape"],
        "voxels_segmented": meta["voxels_segmented"],
        "volume_cm3": meta["volume_cm3"],
        "structures": meta.get("structures", {}),
        "message": f"3D {meta.get('engine', engine)} segmentation executed successfully."
    }

@router.get("/slice/overlay")
def get_overlay_slice(
    file_id: str = Query(..., description="Anatomical scan file ID"),
    mask_id: str = Query(..., description="Segmentation mask file ID"),
    axis: str = Query("axial", pattern="^(axial|coronal|sagittal)$"),
    index: int = Query(0, ge=0),
):
    """Return 2D PNG slice with colored segmentation overlay on anatomical MRI."""
    if file_id not in FILE_REGISTRY or mask_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="file_id or mask_id not found in registry.")

    scan_data, _, _ = load_medical_image(FILE_REGISTRY[file_id]["path"])
    mask_data, _, _ = load_medical_image(FILE_REGISTRY[mask_id]["path"])

    shape = scan_data.shape
    if axis == "axial":
        idx = max(0, min(index, shape[0] - 1))
        scan_slice = scan_data[idx, :, :]
        mask_slice = mask_data[idx, :, :]
    elif axis == "coronal":
        idx = max(0, min(index, shape[1] - 1))
        scan_slice = scan_data[:, idx, :]
        mask_slice = mask_data[:, idx, :]
    else:
        idx = max(0, min(index, shape[2] - 1))
        scan_slice = scan_data[:, :, idx]
        mask_slice = mask_data[:, :, idx]

    # Normalize scan to 0-1
    s_min, s_max = np.min(scan_slice), np.max(scan_slice)
    norm_scan = (scan_slice - s_min) / (s_max - s_min + 1e-5)

    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    ax.imshow(norm_scan, cmap="gray", origin="lower")
    
    # Overlay mask with alpha transparency (cyan color)
    masked_overlay = np.ma.masked_where(mask_slice == 0, mask_slice)
    ax.imshow(masked_overlay, cmap="cool", alpha=0.55, origin="lower")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")
