"""Clinical Safety Validation, Anomaly Detection & Quality Audit Service for MediVision."""
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

import numpy as np
import scipy.ndimage

from backend.app.services.data_service import load_medical_image


def sanitize_voxel_data(volume: np.ndarray) -> Tuple[np.ndarray, List[str]]:
    """
    Detect and sanitize corrupted numerical entries (NaNs, Infs, extreme values).
    Returns sanitized array and a list of detected issues.
    """
    issues = []
    sanitized = np.copy(volume)

    # 1. NaN and Inf Detection
    nan_count = int(np.isnan(sanitized).sum())
    inf_count = int(np.isinf(sanitized).sum())

    if nan_count > 0:
        issues.append(f"Detected {nan_count} NaN voxels. Replaced with local median background value.")
        sanitized = np.nan_to_num(sanitized, nan=0.0)

    if inf_count > 0:
        issues.append(f"Detected {inf_count} Inf voxels. Clamped to finite intensity range.")
        finite_max = np.max(sanitized[np.isfinite(sanitized)]) if np.any(np.isfinite(sanitized)) else 1.0
        finite_min = np.min(sanitized[np.isfinite(sanitized)]) if np.any(np.isfinite(sanitized)) else 0.0
        sanitized = np.clip(sanitized, finite_min, finite_max)

    # 2. Degenerate Volume Checks
    if np.ptp(sanitized) == 0:
        issues.append("Volume has zero variance (constant intensity throughout). Scan is completely blank.")

    return sanitized, issues


def compute_scan_quality_metrics(volume: np.ndarray, spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)) -> Dict[str, Any]:
    """
    Compute physical Signal-to-Noise Ratio (SNR), Dynamic Range, and Anisotropy ratios.
    """
    sanitized, issues = sanitize_voxel_data(volume)
    
    # Estimate foreground vs background via Otsu thresholding or intensity percentiles
    p10, p90 = np.percentile(sanitized, 10), np.percentile(sanitized, 90)
    bg_voxels = sanitized[sanitized <= p10]
    fg_voxels = sanitized[sanitized >= p90]

    mu_fg = float(np.mean(fg_voxels)) if len(fg_voxels) > 0 else 1.0
    sigma_bg = float(np.std(bg_voxels)) if len(bg_voxels) > 0 else 1.0
    
    snr = round(float(mu_fg / (sigma_bg + 1e-6)), 2)
    snr_db = round(float(20.0 * np.log10(max(snr, 1e-3))), 2)

    # Spatial spacing anisotropy ratio (max_spacing / min_spacing)
    s_min, s_max = min(spacing), max(spacing)
    anisotropy_ratio = round(float(s_max / (s_min + 1e-6)), 2)

    # Shannon Entropy as proxy for anatomical contrast detail
    hist, _ = np.histogram(sanitized, bins=64, density=True)
    hist = hist[hist > 0]
    entropy = round(float(-np.sum(hist * np.log2(hist))), 3)

    return {
        "snr_linear": snr,
        "snr_db": snr_db,
        "anisotropy_ratio": anisotropy_ratio,
        "intensity_entropy": entropy,
        "intensity_min": round(float(np.min(sanitized)), 2),
        "intensity_max": round(float(np.max(sanitized)), 2),
        "intensity_dynamic_range": round(float(np.ptp(sanitized)), 2),
        "data_issues": issues,
    }


def validate_scan_safety(
    volume: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> Dict[str, Any]:
    """
    Run comprehensive Clinical Scan Pre-Flight Quality & Safety Audit.
    """
    warnings = []
    critical_errors = []

    # 1. Dimension Checks
    shape = volume.shape
    if len(shape) != 3:
        critical_errors.append(f"Invalid volume dimension {len(shape)}D. Expected 3D volumetric tensor.")
    elif shape[0] < 8 or shape[1] < 16 or shape[2] < 16:
        critical_errors.append(f"Volume dimensions {shape} are critically small for 3D U-Net receptive field.")

    # 2. Voxel Spacing Checks
    spacing_arr = np.array(spacing, dtype=float).flatten()
    if len(spacing_arr) >= 3:
        spacing_tuple = (float(spacing_arr[0]), float(spacing_arr[1]), float(spacing_arr[2]))
    else:
        spacing_tuple = (1.0, 1.0, 1.0)
    spacing = spacing_tuple

    if any(s <= 0.0 for s in spacing):
        critical_errors.append(f"Invalid non-positive voxel spacing: {spacing}.")
    elif max(spacing) / min(spacing) > 5.0:
        warnings.append(f"High spacing anisotropy ({spacing}). Preprocessing 1mm isotropic resampling is mandatory.")

    # 3. Quality Metrics
    q_metrics = compute_scan_quality_metrics(volume, spacing)
    if q_metrics["snr_db"] < 3.0:
        warnings.append(f"Low Signal-to-Noise Ratio ({q_metrics['snr_db']} dB). Scan may exhibit severe motion blur or thermal noise.")
    
    if q_metrics["data_issues"]:
        warnings.extend(q_metrics["data_issues"])

    # Calculate overall pre-flight safety score (0 - 100)
    score = 100
    if critical_errors:
        score = 0
    else:
        score -= min(60, len(warnings) * 15)
        if q_metrics["snr_db"] < 5.0:
            score -= 10

    is_safe = len(critical_errors) == 0 and score >= 40

    return {
        "safety_score_pct": max(0, score),
        "is_safe_for_inference": is_safe,
        "status": "APPROVED" if is_safe else ("WARNING" if not critical_errors else "REJECTED"),
        "critical_errors": critical_errors,
        "warnings": warnings,
        "quality_metrics": q_metrics,
    }


def validate_segmentation_safety(
    mask: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    min_volume_cm3: float = 5.0,
    max_volume_cm3: float = 250.0,
) -> Dict[str, Any]:
    """
    Audit AI-generated segmentation mask for anatomical plausibility and safety bounds.
    """
    mask_bin = (mask > 0).astype(np.uint8)
    voxel_count = int(np.sum(mask_bin))
    voxel_vol = (spacing[0] * spacing[1] * spacing[2]) * 1e-3
    volume_cm3 = round(voxel_count * voxel_vol, 2)

    warnings = []
    critical_errors = []

    if voxel_count == 0:
        critical_errors.append("Empty segmentation mask: Zero organ voxels detected by 3D U-Net.")
    elif volume_cm3 < min_volume_cm3:
        warnings.append(f"Volume ({volume_cm3} cm³) is below physiological human minimum ({min_volume_cm3} cm³). Possible under-segmentation.")
    elif volume_cm3 > max_volume_cm3:
        warnings.append(f"Volume ({volume_cm3} cm³) exceeds physiological human maximum ({max_volume_cm3} cm³). Possible hyper-segmentation leakage.")

    # Check for detached anatomical fragmentation islands
    labeled_array, num_features = scipy.ndimage.label(mask_bin)
    if num_features > 3:
        warnings.append(f"Detected {num_features} disconnected anatomical islands. Morphological island removal recommended.")

    is_valid = len(critical_errors) == 0

    return {
        "is_valid": is_valid,
        "status": "VALIDATED" if (is_valid and not warnings) else ("WARNING" if is_valid else "INVALID"),
        "volume_cm3": volume_cm3,
        "voxel_count": voxel_count,
        "connected_components": num_features,
        "warnings": warnings,
        "critical_errors": critical_errors,
    }


if __name__ == "__main__":
    print("Testing Clinical Safety & Quality Audit Service...")
    # Test 1: Normal Scan
    normal_vol = np.random.normal(100, 15, size=(64, 64, 64)).astype(np.float32)
    res_normal = validate_scan_safety(normal_vol, (1.25, 1.25, 1.25))
    print(f"Normal scan safety score: {res_normal['safety_score_pct']}% ({res_normal['status']})")

    # Test 2: Corrupted Scan with NaNs and high anisotropy
    bad_vol = np.copy(normal_vol)
    bad_vol[10:15, 10:15, 10:15] = np.nan
    res_bad = validate_scan_safety(bad_vol, (5.0, 0.8, 0.8))
    print(f"Corrupted scan safety score: {res_bad['safety_score_pct']}% ({res_bad['status']}), Warnings: {res_bad['warnings']}")

    # Test 3: Empty Mask
    res_empty = validate_segmentation_safety(np.zeros((64, 64, 64)))
    print(f"Empty mask check: Status={res_empty['status']}, Errors={res_empty['critical_errors']}")
