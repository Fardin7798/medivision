"""Automated Clinical Radiologist Diagnostic Report API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse

from backend.app.domain.schemas import ReportGenerateRequest
from backend.app.services.report_service import generate_radiologist_report, format_report_as_markdown

router = APIRouter(prefix="/api/report", tags=["Clinical Diagnostic Report"])
REPORT_STORE = {}

@router.post("/generate")
def create_diagnostic_report(payload: ReportGenerateRequest):
    """Generate structured radiological diagnostic report."""
    scan_meta = payload.scan_meta
    seg_meta = payload.seg_meta
    eval_metrics = payload.eval_metrics
    patient_id = payload.patient_id
    indication = payload.clinical_indication

    report = generate_radiologist_report(
        scan_meta=scan_meta,
        seg_meta=seg_meta,
        eval_metrics=eval_metrics,
        patient_id=patient_id,
        clinical_indication=indication,
    )

    report_id = report["report_id"]
    REPORT_STORE[report_id] = report

    return {
        "status": "success",
        "report_id": report_id,
        "report": report,
    }

@router.get("/markdown")
def get_report_markdown(report_id: str = Query(...)):
    """Retrieve diagnostic report formatted as clean GitHub-style clinical Markdown."""
    if report_id not in REPORT_STORE:
        raise HTTPException(status_code=404, detail="Report ID not found.")

    report = REPORT_STORE[report_id]
    md_text = format_report_as_markdown(report)
    return PlainTextResponse(content=md_text, media_type="text/markdown")
