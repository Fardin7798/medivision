"""Preprocessing API endpoints."""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Body
from backend.app.services.preprocess_service import preprocess_volume_file
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Preprocessing"])

@router.post("/preprocess")
def preprocess_scan(payload: dict = Body(...)):
    """Resample volumetric scan to 1.0mm isotropic resolution and apply intensity normalization."""
    file_id = payload.get("file_id")
    if not file_id or file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid file_id required.")

    raw_path = FILE_REGISTRY[file_id]["path"]
    out_dir = Path("./outputs")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{file_id}_preprocessed.nii.gz"

    proc_data, aff, meta = preprocess_volume_file(raw_path, output_file=out_path)

    prep_id = f"{file_id}_prep"
    FILE_REGISTRY[prep_id] = {
        "path": str(out_path),
        "filename": f"{file_id}_preprocessed.nii.gz",
        "shape": meta["preprocessed_shape"],
        "spacing": meta["target_spacing"],
    }

    return {
        "preprocessed_file_id": prep_id,
        "original_shape": meta["original_shape"],
        "preprocessed_shape": meta["preprocessed_shape"],
        "target_spacing": meta["target_spacing"],
        "min_val": meta["min_val"],
        "max_val": meta["max_val"],
    }
