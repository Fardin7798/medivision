# REST API Documentation — MediVision

> **Base URL (Local Dev):** `http://localhost:8000/api`
> **Format:** JSON / Multipart Form-Data / Binary STL
> **Auth:** None (Research Prototype)
> **CORS Origin:** `http://localhost:3000`

---

## 1. System Health

### `GET /health`
Returns backend service and GPU status.

**Response 200:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "device": "cuda" // or "cpu"
}
```

---

## 2. Ingestion & Preprocessing

### `POST /api/upload`
Uploads a volumetric NIfTI (`.nii`, `.nii.gz`) or DICOM scan.

**Request:** `multipart/form-data` with `file: Binary`
**Response 200:**
```json
{
  "file_id": "scan_la003",
  "filename": "la_003.nii.gz",
  "shape": [64, 64, 64],
  "spacing": [1.25, 1.25, 1.25],
  "intensity_range": [0.0, 1850.0]
}
```

### `GET /api/slice`
Fetches a single 2D slice image for high-speed multi-planar scrubbing.

**Query Params:**
- `file_id`: `string`
- `axis`: `"axial"` | `"coronal"` | `"sagittal"`
- `index`: `integer`

**Response 200:** `image/png`

### `POST /api/preprocess`
Applies isotropic resampling (1.0mm) and z-score normalization.

**Request:** `{ "file_id": "scan_la003", "target_spacing": [1.0, 1.0, 1.0] }`
**Response 200:**
```json
{
  "file_id": "scan_la003_preprocessed",
  "new_shape": [80, 80, 80],
  "spacing": [1.0, 1.0, 1.0]
}
```

---

## 3. AI Segmentation & Evaluation

### `POST /api/segment`
Executes 3D U-Net sliding-window inference on preprocessed scan.

**Request:** `{ "file_id": "scan_la003_preprocessed", "model_type": "baseline" }`
**Response 200:**
```json
{
  "mask_id": "mask_la003",
  "voxels_segmented": 42150,
  "volume_cm3": 42.15
}
```

### `POST /api/evaluate`
Computes clinical validation metrics against ground truth.

**Request:** `{ "pred_mask_id": "mask_la003", "gt_mask_id": "gt_la003" }`
**Response 200:**
```json
{
  "dice_score": 0.842,
  "iou_jaccard": 0.728,
  "precision": 0.865,
  "recall": 0.821,
  "hausdorff_distance_95": 4.12
}
```

---

## 4. 3D Reconstruction & Mesh

### `POST /api/reconstruct`
Applies Marching Cubes algorithm and generates 3D polygonal surface mesh.

**Request:** `{ "mask_id": "mask_la003", "smooth_iterations": 15 }`
**Response 200:**
```json
{
  "mesh_id": "mesh_la003",
  "num_vertices": 12450,
  "num_faces": 24900,
  "mesh_url": "/api/mesh/mesh_la003.obj"
}
```

### `GET /api/mesh/{mesh_id}.stl`
Downloads binary STL file directly for 3D printing.

---

## 5. Image Registration

### `POST /api/register`
Performs SimpleITK 3D multi-resolution rigid/affine registration.

**Request:** `{ "moving_file_id": "scan_la003", "fixed_file_id": "atlas_heart", "transform_type": "rigid" }`
**Response 200:**
```json
{
  "status": "converged",
  "final_metric": 0.684,
  "translation_mm": [1.2, -0.4, 3.1],
  "rotation_deg": [0.5, -1.2, 0.8]
}
```
