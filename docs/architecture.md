# Architecture — MediVision

> Architectural design specification for MediVision. Researched and verified for decoupled Full-Stack Node.js + FastAPI deployment.

---

## 1. High-Level Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════════════╗
║                                 CLIENT TIER (Node.js / Next.js)                           ║
║                                                                                           ║
║   Browser Client (http://localhost:3000)                                                  ║
║   ├── Next.js App Router (Upload, Preprocess, Segment, Evaluate, 3D Mesh, Register, Nav)  ║
║   ├── Three.js WebGL Viewport (Hardware-accelerated 3D anatomical mesh rendering)         ║
║   └── Interactive 2D MPR Slice Viewers (Axial, Coronal, Sagittal synchronous crosshairs)  ║
╚═════════════════════════════════════════════════╤═════════════════════════════════════════╝
                                                  │ HTTP / REST API (JSON & Multipart)
                                                  │ (CORS Enabled)
╔═════════════════════════════════════════════════▼═════════════════════════════════════════╗
║                              BACKEND TIER (Python / FastAPI :8000)                        ║
║                                                                                           ║
║   FastAPI Application (`backend/app/main.py`)                                             ║
║   ├── /api/upload          ──► Ingests NIfTI (.nii.gz) & DICOM, extracts metadata         ║
║   ├── /api/slice           ──► Generates lightweight 2D slice images for 60fps MPR viewer ║
║   ├── /api/preprocess      ──► Resamples to isotropic (1.0mm) & normalizes intensity      ║
║   ├── /api/segment         ──► Executes MONAI 3D U-Net sliding-window inference           ║
║   ├── /api/reconstruct     ──► Marching Cubes ──► Smoothed 3D Mesh (STL/OBJ/JSON format)   ║
║   ├── /api/register        ──► SimpleITK Multi-resolution Euler3D/Affine Registration     ║
║   ├── /api/evaluate        ──► Computes Dice, IoU, 95% Hausdorff Distance, Surface Dist   ║
║   └── /api/export          ──► Packages STL meshes, masks, and metrics into ZIP archive   ║
║                                                                                           ║
║   Storage & Checkpoints:                                                                  ║
║   ├── Local Data & Outputs (`data/`, `outputs/`)                                          ║
║   └── Remote Model Weights (Hugging Face Hub CDN ──► `models/`)                           ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Component Breakdown

### 2.1 Frontend Client (`frontend/`)
- **Next.js App Router:** Type-safe dynamic routes (`/upload`, `/preprocess`, `/segment`, `/evaluate`, `/reconstruct`, `/register`, `/navigation`, `/export`).
- **Three.js 3D Viewport (`Viewport3D.tsx`):** Renders organ geometries exported by the backend Marching Cubes endpoint using WebGL with smooth orbit controls and interactive lighting.
- **2D MPR Slice Viewer (`MPRViewer.tsx`):** Scrubbable multi-planar viewer fetching lightweight 2D cross-sections on demand.
- **API Client Layer (`lib/api.ts`):** Typed HTTP client interacting with the FastAPI backend.

### 2.2 Backend Application (`backend/app/`)
- **FastAPI Layer (`backend/app/main.py` & `backend/app/api/`):** Asynchronous endpoints handling file uploads, compute triggers, and binary/JSON serialization.
- **Services Layer (`backend/app/services/`):**
  - `data_service.py`: NIfTI and medical image parsing via NiBabel.
  - `preprocess_service.py`: Isotropic resampling, windowing, and z-score normalization.
  - `segment_service.py`: MONAI 3D U-Net inference engine.
  - `reconstruct_service.py`: Marching Cubes surface extraction and mesh smoothing.
  - `register_service.py`: SimpleITK multi-resolution image registration.
  - `metrics_service.py`: Clinical metric calculations.
  - `vlm_service.py`: Clinical summary generation.

### 2.3 Storage & Model Weights
- **Model Checkpoints:** Pulled dynamically from Hugging Face Hub (`shaikhfardin/medivision-unet-heart`) onto disk cache.
- **File System Outputs:** Ephemeral masks, meshes, and temporary files written to `./outputs/`.

---

## 3. Data Flow Summary

1. **Upload:** User selects `la_003.nii.gz` in Next.js UI; file streams to `POST /api/upload`. Backend parses header and returns metadata.
2. **2D MPR Scrubbing:** Frontend requests `GET /api/slice?axis=axial&index=32` for instant 2D image preview.
3. **Preprocessing:** User clicks "Preprocess"; `POST /api/preprocess` resamples volume to 1.0mm isotropic voxels.
4. **Segmentation:** `POST /api/segment` runs U-Net sliding-window inference and generates binary mask.
5. **3D Mesh Extraction:** `POST /api/reconstruct` converts binary mask into 3D vertices/faces via Marching Cubes. Frontend renders interactive 3D model in Three.js.
6. **Registration & Navigation:** `POST /api/register` computes Euler3D alignment to reference scan, displaying registered crosshairs in the navigation view.
7. **Export:** User downloads CAD-ready `.stl` mesh and validation summary.

---

## 4. Deployment Architecture (MVP)

- **Frontend:** Vercel / Node.js Server (`http://localhost:3000`).
- **Backend:** Linux Server / Cloud Container (`http://localhost:8000`).
- **Model Weights:** Hugging Face Hub model repository.
- **Training:** Kaggle GPU (30h/week quota) / Colab T4.
