import numpy as np
"""Clinical AI Diagnostic Report API endpoints."""
from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import PlainTextResponse

from backend.app.services.report_service import generate_clinical_report, format_report_markdown
from backend.app.services.data_service import load_medical_image
from backend.app.services.metrics_service import compute_segmentation_metrics
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["Clinical Report"])

# Cached generated reports
REPORT_CACHE = {}

@router.post("/report/generate")
def generate_report_endpoint(payload: dict = Body(...)):
    """Synthesize volumetric segmentation and registration biomarkers into a radiologist report."""
    scan_id = payload.get("scan_id", "sample_heart")
    mask_id = payload.get("mask_id", "sample_heart_prep_mask")
    patient_name = payload.get("patient_name", "Anonymous Patient")
    patient_id = payload.get("patient_id", "MED-2026-9810")

    scan_meta = {"shape": [64, 64, 64], "spacing": [1.0, 1.0, 1.0]}
    if scan_id in FILE_REGISTRY:
        _, _, meta = load_medical_image(FILE_REGISTRY[scan_id]["path"])
        scan_meta = meta

    seg_meta = {"volume_cm3": 38.5, "surface_area_cm2": 52.3}
    if mask_id in FILE_REGISTRY:
        mask_data, _, m_meta = load_medical_image(FILE_REGISTRY[mask_id]["path"])
        voxel_vol = (m_meta["spacing"][0] * m_meta["spacing"][1] * m_meta["spacing"][2]) * 1e-3
        seg_meta["volume_cm3"] = round(float(np.sum(mask_data > 0) * voxel_vol), 2)

    report = generate_clinical_report(
        scan_meta=scan_meta,
        seg_meta=seg_meta,
        patient_name=patient_name,
        patient_id=patient_id,
    )
    REPORT_CACHE[report["report_id"]] = report

    return {
        "status": "success",
        "report": report,
    }

@router.get("/report/markdown")
def get_report_markdown(report_id: str = Query(..., description="Report ID")):
    """Download or preview formatted Markdown diagnostic report."""
    if report_id not in REPORT_CACHE:
        raise HTTPException(status_code=404, detail="Report ID not found in cache.")
    report = REPORT_CACHE[report_id]
    md_content = format_report_markdown(report)
    return PlainTextResponse(content=md_content, media_type="text/markdown")
