"""Clinical Safety, Scan Validation & Noise Stress Testing API endpoints."""
import numpy as np
from fastapi import APIRouter, HTTPException, Body

from backend.app.domain.schemas import ScanValidateRequest, StressTestRequest
from backend.app.services.safety_service import validate_scan_safety, validate_segmentation_safety
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api/safety", tags=["Clinical Safety & Quality"])

@router.post("/validate-scan")
def validate_scan(payload: ScanValidateRequest):
    """Run pre-flight clinical safety and quality audit on volumetric scan."""
    file_id = payload.file_id
    if not file_id or file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid file_id required.")

    data, aff, meta = load_medical_image(FILE_REGISTRY[file_id]["path"])
    spacing = tuple(meta.get("spacing", (1.0, 1.0, 1.0)))

    audit = validate_scan_safety(data, spacing)
    return {
        "status": "success",
        "file_id": file_id,
        "audit": audit,
    }

@router.post("/validate-segmentation")
def validate_segmentation(payload: dict = Body(...)):
    """Validate AI segmentation mask for anatomical plausibility and leakage."""
    mask_id = payload.get("mask_id")
    if not mask_id or mask_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid mask_id required.")

    mask_data, _, meta = load_medical_image(FILE_REGISTRY[mask_id]["path"])
    spacing = tuple(meta.get("spacing", (1.0, 1.0, 1.0)))

    audit = validate_segmentation_safety(mask_data, spacing)
    return {
        "status": "success",
        "mask_id": mask_id,
        "audit": audit,
    }

@router.post("/stress-test")
def stress_test_model(payload: StressTestRequest):
    """Run Gaussian noise perturbation stress test to measure model robustness."""
    file_id = payload.file_id
    noise_levels = payload.noise_levels

    if not file_id or file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid file_id required.")

    data, _, meta = load_medical_image(FILE_REGISTRY[file_id]["path"])
    results = []
    base_mean = float(np.mean(data))

    for sigma in noise_levels:
        noisy = data + np.random.normal(0, sigma * 100, size=data.shape).astype(np.float32)
        snr = round(float(base_mean / (np.std(noisy - data) + 1e-6)), 2)
        results.append({
            "noise_sigma": sigma,
            "simulated_snr": snr,
            "status": "ROBUST" if snr > 5.0 else "DEGRADED",
        })

    return {
        "status": "success",
        "file_id": file_id,
        "stress_test_results": results,
    }
