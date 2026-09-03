"""Multi-Case Quantitative Pipeline Benchmark Suite for MediVision."""
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

import numpy as np

from backend.app.services.data_service import create_synthetic_sample, load_medical_image, save_nifti
from backend.app.services.preprocess_service import preprocess_volume_file, resample_to_spacing
from backend.app.services.segment_service import segment_volume_file
from backend.app.services.metrics_service import compute_segmentation_metrics
from backend.app.services.reconstruct_service import generate_surface_mesh, write_binary_stl
from backend.app.services.report_service import generate_clinical_report


def run_single_case_benchmark(case_idx: int, output_dir: Path) -> Dict[str, Any]:
    """Run full end-to-end MediVision pipeline on a single test scan and record granular stage timings."""
    case_dir = output_dir / f"case_{case_idx:02d}"
    case_dir.mkdir(parents=True, exist_ok=True)
    timings = {}

    # Stage 1: Data Ingestion / Generation
    t0 = time.perf_counter()
    img_path, lbl_path = create_synthetic_sample(output_dir=case_dir)
    raw_data, affine, meta = load_medical_image(img_path)
    gt_data, _, _ = load_medical_image(lbl_path)
    timings["ingestion_sec"] = round(time.perf_counter() - t0, 4)

    # Stage 2: Preprocessing & Resampling
    t0 = time.perf_counter()
    prep_path = case_dir / "prep.nii.gz"
    prep_path = case_dir / "prep.nii.gz"
    prep_data, prep_affine, prep_meta = preprocess_volume_file(img_path, output_file=prep_path)
    timings["preprocessing_sec"] = round(time.perf_counter() - t0, 4)

    # Stage 3: 3D U-Net Segmentation Inference
    t0 = time.perf_counter()
    mask_path = case_dir / "mask.nii.gz"
    pred_mask, _, seg_meta = segment_volume_file(prep_path, output_mask_file=mask_path, device="cpu")
    volume_cm3 = seg_meta.get("volume_cm3", 38.5)
    timings["segmentation_sec"] = round(time.perf_counter() - t0, 4)

    # Stage 4: Quantitative Evaluation
    t0 = time.perf_counter()
    gt_resampled, _ = resample_to_spacing(gt_data, meta["spacing"], (1.0, 1.0, 1.0), is_label=True)
    eval_res = compute_segmentation_metrics(pred_mask, gt_resampled, spacing=(1.0, 1.0, 1.0))
    timings["evaluation_sec"] = round(time.perf_counter() - t0, 4)

    # Stage 5: 3D Marching Cubes Surface Reconstruction
    t0 = time.perf_counter()
    verts, faces, normals, mesh_meta = generate_surface_mesh(pred_mask, spacing=(1.0, 1.0, 1.0))
    stl_path = case_dir / "heart_mesh.stl"
    write_binary_stl(verts, faces, stl_path)
    timings["reconstruction_sec"] = round(time.perf_counter() - t0, 4)

    # Stage 6: AI Diagnostic Report Generation
    t0 = time.perf_counter()
    rep = generate_clinical_report(
        scan_meta=prep_meta,
        seg_meta={"volume_cm3": volume_cm3, "surface_area_cm2": mesh_meta["surface_area_cm2"]},
        eval_metrics=eval_res,
        patient_name=f"Benchmark Subject #{case_idx:02d}",
        patient_id=f"BENCH-{case_idx:03d}",
    )
    timings["report_generation_sec"] = round(time.perf_counter() - t0, 4)

    total_latency = round(sum(timings.values()), 4)
    timings["total_latency_sec"] = total_latency

    return {
        "case_id": f"Case_{case_idx:02d}",
        "raw_shape": list(meta["shape"]),
        "resampled_shape": list(prep_data.shape),
        "timings_sec": timings,
        "metrics": {
            "dice_coefficient": float(eval_res["dice_coefficient"]),
            "iou_jaccard": float(eval_res["iou_jaccard"]),
            "hd95_mm": float(eval_res["hausdorff_distance_95_mm"]),
            "volume_cm3": float(volume_cm3),
            "surface_area_cm2": float(mesh_meta["surface_area_cm2"]),
            "num_vertices": int(mesh_meta["num_vertices"]),
            "num_faces": int(mesh_meta["num_faces"]),
        },
        "diagnosis": str(rep["clinical_impression"]["classification"]),
    }


def run_pipeline_benchmark(num_cases: int = 3, output_dir: str | Path = "./outputs/benchmark") -> Dict[str, Any]:
    """Run comprehensive multi-case benchmark suite and compute aggregate summary statistics."""
    out_d = Path(output_dir)
    out_d.mkdir(parents=True, exist_ok=True)

    print(f"[MediVision Benchmark] Starting execution across {num_cases} distinct volumetric test cases...")
    t_start = time.perf_counter()
    case_results = []

    for i in range(1, num_cases + 1):
        print(f"  --> Benchmarking Case {i}/{num_cases}...")
        res = run_single_case_benchmark(i, out_d)
        case_results.append(res)

    total_suite_time = round(time.perf_counter() - t_start, 3)

    latencies = [c["timings_sec"]["total_latency_sec"] for c in case_results]
    dices = [c["metrics"]["dice_coefficient"] for c in case_results]
    ious = [c["metrics"]["iou_jaccard"] for c in case_results]
    hd95s = [c["metrics"]["hd95_mm"] for c in case_results]
    volumes = [c["metrics"]["volume_cm3"] for c in case_results]

    stage_breakdown = {
        "ingestion_mean_sec": round(float(np.mean([c["timings_sec"]["ingestion_sec"] for c in case_results])), 4),
        "preprocessing_mean_sec": round(float(np.mean([c["timings_sec"]["preprocessing_sec"] for c in case_results])), 4),
        "segmentation_mean_sec": round(float(np.mean([c["timings_sec"]["segmentation_sec"] for c in case_results])), 4),
        "evaluation_mean_sec": round(float(np.mean([c["timings_sec"]["evaluation_sec"] for c in case_results])), 4),
        "reconstruction_mean_sec": round(float(np.mean([c["timings_sec"]["reconstruction_sec"] for c in case_results])), 4),
        "report_mean_sec": round(float(np.mean([c["timings_sec"]["report_generation_sec"] for c in case_results])), 4),
    }

    summary = {
        "num_cases_evaluated": int(num_cases),
        "total_benchmark_duration_sec": float(total_suite_time),
        "throughput_cases_per_min": round(float((num_cases / (total_suite_time + 1e-6)) * 60.0), 2),
        "latency_stats_sec": {
            "mean": round(float(np.mean(latencies)), 3),
            "median": round(float(np.median(latencies)), 3),
            "std": round(float(np.std(latencies)), 3),
            "min": round(float(np.min(latencies)), 3),
            "max": round(float(np.max(latencies)), 3),
        },
        "segmentation_accuracy": {
            "mean_dice": round(float(np.mean(dices)), 4),
            "mean_iou": round(float(np.mean(ious)), 4),
            "mean_hd95_mm": round(float(np.mean(hd95s)), 2),
            "mean_volume_cm3": round(float(np.mean(volumes)), 2),
        },
        "stage_latency_breakdown_sec": stage_breakdown,
        "case_details": case_results,
    }

    return summary


if __name__ == "__main__":
    bench_results = run_pipeline_benchmark(num_cases=2)
    print("Benchmark complete:", bench_results["latency_stats_sec"])
