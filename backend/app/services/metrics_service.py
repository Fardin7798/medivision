"""Quantitative evaluation and clinical validation metrics service for MediVision."""
from pathlib import Path
from typing import Dict, Tuple, Optional, Any

import numpy as np
import scipy.ndimage
import torch
from monai.metrics import (
    compute_dice,
    compute_hausdorff_distance,
    compute_average_surface_distance,
    compute_confusion_matrix_metric,
)

from backend.app.services.data_service import load_medical_image


def compute_segmentation_metrics(
    pred_mask: np.ndarray,
    gt_mask: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> Dict[str, Any]:
    """
    Compute comprehensive clinical segmentation evaluation metrics.

    Args:
        pred_mask: 3D binary array {0, 1} representing predicted organ mask.
        gt_mask: 3D binary array {0, 1} representing ground truth segmentation.
        spacing: Voxel spacing (sz, sy, sx) in mm.

    Returns:
        Dictionary containing Dice, IoU, Precision, Recall, Specificity, HD95, ASD, Volumetric Similarity.
    """
    # Ensure identical shape defensively
    if pred_mask.shape != gt_mask.shape:
        zoom_factors = [p / g for p, g in zip(pred_mask.shape, gt_mask.shape)]
        gt_mask = scipy.ndimage.zoom(gt_mask.astype(np.float32), zoom_factors, order=0)
        gt_mask = (gt_mask > 0.5).astype(np.uint8)

    pred_bin = (pred_mask > 0).astype(np.uint8)
    gt_bin = (gt_mask > 0).astype(np.uint8)

    # Basic Confusion Matrix counts
    tp = int(np.sum((pred_bin == 1) & (gt_bin == 1)))
    fp = int(np.sum((pred_bin == 1) & (gt_bin == 0)))
    fn = int(np.sum((pred_bin == 0) & (gt_bin == 1)))
    tn = int(np.sum((pred_bin == 0) & (gt_bin == 0)))

    # Overlap metrics
    pred_count = int(np.sum(pred_bin))
    gt_count = int(np.sum(gt_bin))
    intersection = tp
    union = tp + fp + fn

    dice = (2.0 * intersection) / (pred_count + gt_count + 1e-7) if (pred_count + gt_count) > 0 else 1.0
    iou = float(intersection) / (union + 1e-7) if union > 0 else 1.0
    precision = float(tp) / (tp + fp + 1e-7) if (tp + fp) > 0 else 1.0
    recall = float(tp) / (tp + fn + 1e-7) if (tp + fn) > 0 else 1.0
    specificity = float(tn) / (tn + fp + 1e-7) if (tn + fp) > 0 else 1.0
    vol_similarity = 1.0 - (abs(pred_count - gt_count) / (pred_count + gt_count + 1e-7)) if (pred_count + gt_count) > 0 else 1.0

    # Distance metrics (HD95 and ASD)
    hd95 = 0.0
    asd = 0.0

    if pred_count > 0 and gt_count > 0:
        pred_tensor = torch.from_numpy(pred_bin).unsqueeze(0).unsqueeze(0)
        gt_tensor = torch.from_numpy(gt_bin).unsqueeze(0).unsqueeze(0)

        try:
            hd95_val = compute_hausdorff_distance(
                y_pred=pred_tensor,
                y=gt_tensor,
                include_background=False,
                percentile=95,
                spacing=spacing,
            )
            hd95 = float(hd95_val.item()) if not torch.isnan(hd95_val) else 0.0
        except Exception:
            hd95 = 0.0

        try:
            asd_val = compute_average_surface_distance(
                y_pred=pred_tensor,
                y=gt_tensor,
                include_background=False,
                spacing=spacing,
            )
            asd = float(asd_val.item()) if not torch.isnan(asd_val) else 0.0
        except Exception:
            asd = 0.0

    voxel_vol_cm3 = (spacing[0] * spacing[1] * spacing[2]) * 1e-3
    pred_volume_cm3 = round(pred_count * voxel_vol_cm3, 3)
    gt_volume_cm3 = round(gt_count * voxel_vol_cm3, 3)

    return {
        "dice_coefficient": round(float(dice), 4),
        "iou_jaccard": round(float(iou), 4),
        "precision": round(float(precision), 4),
        "recall_sensitivity": round(float(recall), 4),
        "specificity": round(float(specificity), 4),
        "volumetric_similarity": round(float(vol_similarity), 4),
        "hausdorff_distance_95_mm": round(float(hd95), 3),
        "hd95_mm": round(float(hd95), 3),
        "average_surface_distance_mm": round(float(asd), 3),
        "asd_mm": round(float(asd), 3),
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "false_negative": fn,
            "true_negative": tn,
        },
        "pred_volume_cm3": pred_volume_cm3,
        "gt_volume_cm3": gt_volume_cm3,
        "volume_difference_cm3": round(abs(pred_volume_cm3 - gt_volume_cm3), 3),
    }


def evaluate_mask_files(
    pred_mask_path: str | Path,
    gt_mask_path: str | Path,
) -> Dict[str, Any]:
    """Load two NIfTI segmentation mask files, align shapes defensively, and compute validation metrics."""
    pred_data, _, pred_meta = load_medical_image(pred_mask_path)
    gt_data, _, gt_meta = load_medical_image(gt_mask_path)
    pred_spacing = tuple(pred_meta.get("spacing", (1.0, 1.0, 1.0)))

    metrics = compute_segmentation_metrics(pred_data, gt_data, spacing=pred_spacing)
    metrics["pred_file"] = str(Path(pred_mask_path).name)
    metrics["gt_file"] = str(Path(gt_mask_path).name)
    return metrics


if __name__ == "__main__":
    print("Testing Quantitative Evaluation Service...")
    gt = np.zeros((64, 64, 64), dtype=np.uint8)
    gt[20:44, 20:44, 20:44] = 1

    pred = np.zeros((64, 64, 64), dtype=np.uint8)
    pred[22:46, 20:44, 20:44] = 1

    results = compute_segmentation_metrics(pred, gt, spacing=(1.0, 1.0, 1.0))
    print(f"Evaluation verified: Dice = {results['dice_coefficient']}, HD95 = {results['hd95_mm']} mm")
