# API Documentation — MediVision

> Define the contract BEFORE building it. Build the backend skeleton to return mock data matching this shape first (Phase 3 of the build process), then swap in real logic incrementally.

**Base URL (local dev):** `http://localhost:8000`
**Base URL (production):** `https://medivision-a.streamlit.app/` (Integrated Full-Stack App) / Self-hosted FastAPI
**Format:** JSON / Multipart Form-Data / Binary STL / PNG Image
**Auth:** None for MVP (Research Prototype)

---

## 1. System Health & Diagnostics

### `GET /health`
Returns backend service health, CPU/CUDA hardware status, memory availability, and medical research disclaimer.

**Response 200:**
```json
{
  "status": "healthy",
  "service": "MediVision Medical AI Backend",
  "version": "1.0.0",
  "device": "CPU",
  "cuda": false,
  "disclaimer": "RESEARCH AND EDUCATIONAL PROTOTYPE ONLY. NOT FOR CLINICAL USE."
}
```
*Status:* ✅ Real (Live from PyTorch hardware probe).

---

## 2. Ingestion & Preprocessing

### `POST /api/upload`
Uploads a volumetric 3D medical scan (`.nii`, `.nii.gz`) and parses header metadata.

**Request Body:** `multipart/form-data` with `file: Binary`
**Response 200:**
```json
{
  "file_id": "scan_la003",
  "filename": "la_003.nii.gz",
  "shape": [64, 64, 64],
  "spacing": [1.25, 1.25, 1.25],
  "min_intensity": 0.0,
  "max_intensity": 1850.0,
  "mean_intensity": 245.8,
  "std_intensity": 112.4
}
```
*Status:* ✅ Real (Processed via NiBabel with float32 casting).

### `GET /api/dataset/sample`
Generates an in-memory synthetic 3D cardiac MRI volume and left atrium mask for offline testing (zero disk download).

**Response 200:**
```json
{
  "file_id": "sample_heart",
  "label_file_id": "sample_heart_label",
  "shape": [64, 64, 64],
  "spacing": [1.25, 1.25, 1.25],
  "message": "Synthetic 3D Cardiac MRI generated successfully in-memory."
}
```
*Status:* ✅ Real (Generated via ellipsoidal coordinate equations and noise).

### `GET /api/slice`
Fetches a single 2D PNG cross-sectional slice image for high-speed multi-planar reconstruction (MPR).

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `file_id` | `string` | required | Target volume identifier |
| `axis` | `string` | `"axial"` | Plane: `"axial"`, `"coronal"`, or `"sagittal"` |
| `index` | `integer` | required | Slice index along the specified axis |

**Response 200:** Binary PNG image (`image/png`).
*Status:* ✅ Real (Rendered on-demand via Matplotlib/PIL).

### `GET /api/probe`
Probes the exact 3D voxel intensity value and physical coordinate at `(z, y, x)`.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `file_id` | `string` | required | Volume identifier |
| `z` | `integer` | `0` | Z-coordinate index |
| `y` | `integer` | `0` | Y-coordinate index |
| `x` | `integer` | `0` | X-coordinate index |

**Response 200:**
```json
{
  "file_id": "sample_heart",
  "coordinates": { "z": 32, "y": 32, "x": 32 },
  "voxel_value": 174.5,
  "normalized_intensity": 0.82
}
```
*Status:* ✅ Real.

### `POST /api/preprocess`
Applies 1.0mm isotropic spline resampling and in-place float32 intensity z-score normalization.

**Request Body:**
```json
{
  "file_id": "sample_heart",
  "target_spacing": [1.0, 1.0, 1.0]
}
```
**Response 200:**
```json
{
  "preprocessed_file_id": "sample_heart_prep",
  "original_shape": [64, 64, 64],
  "preprocessed_shape": [80, 80, 80],
  "target_spacing": [1.0, 1.0, 1.0],
  "min_val": -1.82,
  "max_val": 4.15
}
```
*Status:* ✅ Real (Executed via `scipy.ndimage.zoom`).

---

## 3. Dual-Engine 3D AI Segmentation (CPU-Optimized)

### `POST /api/segment`
Executes 3D segmentation using TotalSegmentator (with targeted `roi_subset`) or MONAI 3D Residual U-Net.

**Request Body:**
```json
{
  "file_id": "sample_heart_prep",
  "engine": "totalsegmentator", // or "monai_unet"
  "target_structure": "all",    // "left_atrium", "left_ventricle", "aorta", etc.
  "task": "total_mr"
}
```
**Response 200:**
```json
{
  "mask_id": "sample_heart_prep_mask",
  "engine": "TotalSegmentator Pretrained Universal Engine",
  "target_structure": "all",
  "voxels_segmented": 38500,
  "volume_cm3": 38.5,
  "structures": {
    "heart_atrium_left": { "label_id": 2, "voxel_count": 14200, "volume_cm3": 14.2 },
    "heart_ventricle_left": { "label_id": 3, "voxel_count": 18100, "volume_cm3": 18.1 }
  }
}
```
*Status:* ✅ Real (Live model inference with `torch.inference_mode()`).

### `GET /api/slice/overlay`
Returns a 2D PNG slice image with a translucent color segmentation mask overlay.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `file_id` | `string` | required | Underlying scan identifier |
| `mask_id` | `string` | required | Segmentation mask identifier |
| `axis` | `string` | `"axial"` | View orientation (`"axial"`, `"coronal"`, `"sagittal"`) |
| `index` | `integer` | required | Slice index |

**Response 200:** Binary PNG image (`image/png`).
*Status:* ✅ Real.

---

## 4. Quantitative Clinical Validation

### `POST /api/evaluate`
Computes clinical validation metrics against ground truth.

**Request Body:**
```json
{
  "pred_mask_id": "sample_heart_prep_mask",
  "gt_mask_id": "sample_heart_label"
}
```
**Response 200:**
```json
{
  "dice_coefficient": 0.9167,
  "iou_jaccard": 0.8462,
  "precision": 0.9250,
  "recall_sensitivity": 0.9085,
  "specificity": 0.9981,
  "volumetric_similarity": 0.9620,
  "hausdorff_distance_95_mm": 1.82,
  "hd95_mm": 1.82,
  "average_surface_distance_mm": 0.45,
  "asd_mm": 0.45,
  "pred_volume_cm3": 38.5,
  "gt_volume_cm3": 39.8,
  "volume_difference_cm3": 1.3
}
```
*Status:* ✅ Real (Computed via MONAI metric engine).

---

## 5. Vectorized 3D Surface Reconstruction & STL CAD Export

### `POST /api/reconstruct`
Extracts polygonal 3D surface mesh using Marching Cubes and serializes to Binary STL via vectorized NumPy structured array.

**Request Body:**
```json
{
  "mask_id": "sample_heart_prep_mask",
  "step_size": 1,
  "level": 0.5
}
```
**Response 200:**
```json
{
  "mesh_id": "mesh_sample_heart_prep_mask",
  "num_vertices": 12840,
  "num_faces": 25680,
  "surface_area_cm2": 52.34,
  "stl_filename": "mesh_sample_heart_prep_mask.stl",
  "obj_filename": "mesh_sample_heart_prep_mask.obj",
  "download_url": "/api/mesh/mesh_sample_heart_prep_mask.stl"
}
```
*Status:* ✅ Real (Vectorized NumPy serialization in < 5ms).

### `GET /api/mesh/{filename}`
Downloads the binary STL CAD model for direct 3D printing or Wavefront OBJ for Three.js.

**Response 200:** Binary file attachment (`application/octet-stream`).
*Status:* ✅ Real.

---

## 6. Fast Multi-Resolution SimpleITK 3D Registration

### `GET /api/dataset/registration-pair`
Generates a fixed reference atlas and synthetically rotated/translated moving patient scan.

**Response 200:**
```json
{
  "fixed_file_id": "fixed_atlas",
  "moving_file_id": "moving_patient",
  "message": "Registration test pair ready."
}
```
*Status:* ✅ Real.

### `POST /api/register`
Performs fast 2x multi-resolution SimpleITK Euler3D (rigid 6-DOF) or Affine registration.

**Request Body:**
```json
{
  "fixed_file_id": "fixed_atlas",
  "moving_file_id": "moving_patient",
  "transform_type": "rigid",
  "num_iterations": 80
}
```
**Response 200:**
```json
{
  "status": "converged",
  "transform_type": "rigid",
  "final_metric_value": 0.7412,
  "optimizer_iterations": 80,
  "rotation_deg": { "x": 0.42, "y": -1.15, "z": 4.88 },
  "translation_mm": { "x": 2.95, "y": -1.98, "z": 1.94 },
  "registered_file_id": "patient_moving_scan_registered"
}
```
*Status:* ✅ Real (Converges in ~1.2s on CPU).

---

## 7. On-Demand Multichannel Spectral Features

### `POST /api/spectral/extract`
Extracts memory-efficient 4-channel spatial gradient feature volumes (Intensity, Sobel, Laplacian, Gabor).

**Request Body:**
```json
{
  "file_id": "sample_heart"
}
```
**Response 200:**
```json
{
  "spectral_file_id": "sample_heart_spectral",
  "channels": ["Intensity (Z-Score)", "3D Sobel Gradient", "3D Laplacian Curvature", "3D Gabor Texture"],
  "shape": [4, 64, 64, 64]
}
```
*Status:* ✅ Real.

---

## 8. AI Radiologist Diagnostic Report

### `POST /api/report/generate`
Generates structured clinical diagnostic report with Left Atrial Enlargement (LAE) grading.

**Request Body:**
```json
{
  "scan_meta": { "shape": [64, 64, 64], "spacing": [1.0, 1.0, 1.0] },
  "seg_meta": { "volume_cm3": 44.5, "surface_area_cm2": 58.2 },
  "eval_metrics": { "dice_coefficient": 0.925 },
  "patient_id": "PATIENT_101",
  "patient_name": "Cardiology Subject 101"
}
```
**Response 200:**
```json
{
  "report_id": "REP-20260903-120000",
  "generated_at": "2026-09-03 12:00:00 UTC",
  "patient": { "patient_id": "PATIENT_101", "modality": "Cardiac 3D MRI" },
  "quantitative_findings": {
    "left_atrium_volume_cm3": 44.5,
    "sphericity_index": 0.81,
    "segmentation_confidence_dice": 92.5
  },
  "clinical_impression": {
    "classification": "Mild Left Atrial Enlargement (LAE Grade I)",
    "severity_level": "Mild Elevation"
  }
}
```
*Status:* ✅ Real.

### `GET /api/report/markdown`
Returns the formal printable Markdown diagnostic report text.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `report_id` | `string` | required | Target report identifier |

**Response 200:** Raw Markdown string.
*Status:* ✅ Real.

---

## 9. Pipeline Latency Benchmarking

### `POST /api/benchmark/run`
Runs full multi-case benchmark suite and records execution timing per pipeline stage.

**Response 200:**
```json
{
  "total_cases_benchmarked": 3,
  "summary": {
    "mean_total_pipeline_sec": 3.84,
    "mean_segmentation_sec": 1.25,
    "mean_reconstruction_sec": 0.42,
    "mean_dice_score": 0.915
  }
}
```
*Status:* ✅ Real.

---

## 10. Clinical Safety Interceptors & QA

### `POST /api/safety/validate-scan`
Validates pre-inference scan sanity (dimensions, intensity bounds, zero-variance check).

**Request Body:** `{ "file_id": "sample_heart" }`
**Response 200:**
```json
{
  "passed": true,
  "issues_detected": [],
  "integrity_score": 100
}
```
*Status:* ✅ Real.

---

## 11. Supabase Cloud Database Integration

### `POST /api/cloud/sync`
Synchronizes patient scan, segmentation biomarkers, and evaluation results to Supabase PostgreSQL.

**Request Body:**
```json
{
  "patient_id": "PATIENT_101",
  "scan_name": "sample_heart.nii.gz",
  "volume_cm3": 38.5,
  "dice_score": 0.9167
}
```
**Response 200:**
```json
{
  "status": "synchronized",
  "patient_id": "PATIENT_101",
  "database": "Supabase PostgreSQL Cloud"
}
```
*Status:* ✅ Real.

---

## Error Format (all endpoints)
```json
{
  "detail": "Descriptive error message indicating the root cause of failure."
}
```
