"""Evaluation and clinical metrics API endpoints."""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Body
from backend.app.services.metrics_service import compute_segmentation_metrics, evaluate_mask_files
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Evaluation"])

@router.post("/evaluate")
def evaluate_segmentation(payload: dict = Body(...)):
    """Compute clinical segmentation metrics (Dice, IoU, HD95, ASD) comparing prediction to ground truth."""
    pred_id = payload.get("pred_mask_id")
    gt_id = payload.get("gt_mask_id")

    # If gt_id is not specified, use synthetic ground truth if available
    if not gt_id:
        synth_lbl = Path("./data/synthetic/synthetic_heart_label.nii.gz")
        if synth_lbl.is_file():
            gt_id = "sample_heart_label"
            FILE_REGISTRY[gt_id] = {"path": str(synth_lbl)}

    if not pred_id or pred_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid pred_mask_id required.")
    if not gt_id or gt_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid gt_mask_id required.")

    pred_path = FILE_REGISTRY[pred_id]["path"]
    gt_path = FILE_REGISTRY[gt_id]["path"]

    metrics = evaluate_mask_files(pred_path, gt_path)
    return {
        "status": "success",
        "pred_mask_id": pred_id,
        "gt_mask_id": gt_id,
        "metrics": metrics,
    }
