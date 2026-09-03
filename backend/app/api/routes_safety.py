"""Clinical Safety & Quality Assurance API endpoints."""
from fastapi import APIRouter, HTTPException, Body
import numpy as np

from backend.app.services.safety_service import (
    validate_scan_safety,
    validate_segmentation_safety,
    sanitize_voxel_data,
)
from backend.app.services.data_service import load_medical_image
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api/safety", tags=["Clinical Safety"])

@router.post("/validate-scan")
def validate_scan_endpoint(payload: dict = Body(...)):
    """Run clinical pre-flight scan quality & safety audit."""
    file_id = payload.get("file_id", "sample_heart")
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="File ID not found in registry.")

    scan_path = FILE_REGISTRY[file_id]["path"]
    data, _, meta = load_medical_image(scan_path)
    spacing = tuple(meta.get("spacing", (1.0, 1.0, 1.0)))

    audit = validate_scan_safety(data, spacing)
    return {
        "status": "success",
        "file_id": file_id,
        "audit": audit,
    }

@router.post("/validate-segmentation")
def validate_segmentation_endpoint(payload: dict = Body(...)):
    """Run post-inference anatomical plausibility & safety audit on segmentation mask."""
    mask_id = payload.get("mask_id", "sample_heart_prep_mask")
    if mask_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Mask ID not found in registry.")

    mask_path = FILE_REGISTRY[mask_id]["path"]
    data, _, meta = load_medical_image(mask_path)
    spacing = tuple(meta.get("spacing", (1.0, 1.0, 1.0)))

    audit = validate_segmentation_safety(data, spacing)
    return {
        "status": "success",
        "mask_id": mask_id,
        "audit": audit,
    }

@router.post("/stress-test")
def run_edge_case_stress_test():
    """Execute simulated edge-case adversarial stress tests against safety interceptors."""
    test_results = []

    # 1. NaN / Corrupted Values Test
    corrupted_vol = np.random.normal(50, 10, size=(48, 48, 48)).astype(np.float32)
    corrupted_vol[10:15, 10:15, 10:15] = np.nan
    nan_audit = validate_scan_safety(corrupted_vol, (1.0, 1.0, 1.0))
    test_results.append({
        "scenario": "Numerical NaN / Corrupted Voxels",
        "description": "Injected 125 NaN voxels into 3D volume",
        "interceptor_result": nan_audit["status"],
        "safety_score_pct": nan_audit["safety_score_pct"],
        "issues_caught": nan_audit["warnings"],
        "passed": any("NaN" in w for w in nan_audit["warnings"]),
    })

    # 2. Extreme Spacing Anisotropy Test
    anisotropic_vol = np.random.normal(50, 10, size=(48, 48, 48)).astype(np.float32)
    aniso_audit = validate_scan_safety(anisotropic_vol, (6.0, 0.8, 0.8))
    test_results.append({
        "scenario": "Severe Spacing Anisotropy (7.5:1 ratio)",
        "description": "Thick-slice acquisition with 6mm slice thickness vs 0.8mm in-plane",
        "interceptor_result": aniso_audit["status"],
        "safety_score_pct": aniso_audit["safety_score_pct"],
        "issues_caught": aniso_audit["warnings"],
        "passed": any("anisotropy" in w.lower() for w in aniso_audit["warnings"]),
    })

    # 3. Degenerate Flat / Empty Volume Test
    flat_vol = np.zeros((48, 48, 48), dtype=np.float32)
    flat_audit = validate_scan_safety(flat_vol, (1.0, 1.0, 1.0))
    test_results.append({
        "scenario": "Zero-Variance Blank Volume",
        "description": "Completely blank scan with 0.0 intensity throughout",
        "interceptor_result": flat_audit["status"],
        "safety_score_pct": flat_audit["safety_score_pct"],
        "issues_caught": flat_audit["warnings"],
        "passed": any("variance" in w.lower() or "blank" in w.lower() for w in flat_audit["warnings"]),
    })

    # 4. Empty Mask Interceptor Test
    empty_mask = np.zeros((48, 48, 48), dtype=np.uint8)
    empty_mask_audit = validate_segmentation_safety(empty_mask, (1.0, 1.0, 1.0))
    test_results.append({
        "scenario": "Zero-Voxel Empty Segmentation Mask",
        "description": "3D U-Net returns 0 foreground organ voxels",
        "interceptor_result": empty_mask_audit["status"],
        "safety_score_pct": 0,
        "issues_caught": empty_mask_audit["critical_errors"],
        "passed": not empty_mask_audit["is_valid"],
    })

    all_passed = all(t["passed"] for t in test_results)

    return {
        "status": "success",
        "all_interceptor_tests_passed": all_passed,
        "total_scenarios_tested": len(test_results),
        "scenarios": test_results,
    }
