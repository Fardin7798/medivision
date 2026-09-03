"""Supabase Cloud Synchronization API endpoints."""
from fastapi import APIRouter, HTTPException, Body
from backend.app.services.supabase_service import (
    record_patient,
    record_scan,
    record_segmentation,
    record_evaluation,
    get_clinical_history,
    is_connected,
)

router = APIRouter(prefix="/api/cloud", tags=["Supabase Cloud"])

@router.get("/history")
def get_cloud_history():
    """Fetch past patient scans, segmentations, and evaluations from Supabase Cloud."""
    history = get_clinical_history()
    return {
        "status": "success",
        "connected": is_connected(),
        "count": len(history),
        "history": history,
    }

@router.post("/sync")
def sync_pipeline_record(payload: dict = Body(...)):
    """Sync REAL current-session pipeline results into Supabase Cloud database.

    Every numeric field must be supplied by the caller from an actual
    completed pipeline run (segment/evaluate). No fabricated fallback
    metrics are substituted here — see CONTEXT.md 'Rules for MediVision'.
    """
    patient_id = payload.get("patient_id")
    scan_id = payload.get("scan_id")
    volume_cm3 = payload.get("volume_cm3")
    voxel_count = payload.get("voxel_count")
    dice_score = payload.get("dice_coefficient")
    iou = payload.get("iou_jaccard")
    hd95 = payload.get("hd95_mm")
    asd = payload.get("asd_mm")
    shape = payload.get("shape")
    spacing = payload.get("spacing")

    required = {
        "patient_id": patient_id,
        "scan_id": scan_id,
        "volume_cm3": volume_cm3,
        "voxel_count": voxel_count,
        "dice_coefficient": dice_score,
        "shape": shape,
        "spacing": spacing,
    }
    missing = [k for k, v in required.items() if v is None]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required real pipeline result(s): {', '.join(missing)}. "
                   f"Run segment + evaluate first — this endpoint no longer accepts fabricated defaults.",
        )

    patient_name = payload.get("patient_name", "Anonymous Research Subject")
    filename = payload.get("filename", "unnamed_scan.nii.gz")

    record_patient(patient_id, patient_name)
    record_scan(patient_id, scan_id, filename, shape, spacing, payload.get("snr_db"))
    record_segmentation(scan_id, f"mask_{scan_id}", volume_cm3, voxel_count)
    if dice_score is not None and iou is not None and hd95 is not None and asd is not None:
        record_evaluation(f"mask_{scan_id}", dice_score, iou, hd95, asd)

    return {
        "status": "success",
        "message": "Synchronized real clinical pipeline record to Supabase Cloud PostgreSQL.",
    }
