# Architecture — MediVision

> Fill this in after the PRD, before writing code. Defines the shape of the system so implementation has something concrete to build against.

---

## 1. High-Level Architecture Diagram (text form)

```
╔═════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        CLIENT TIER                                          ║
║                                                                                             ║
║   1. Primary Streamlit Cloud Application (https://medivision-a.streamlit.app/)              ║
║      ├── 9-Module Interactive Workflow Tabs                                                 ║
║      ├── Real-time MPR Orthogonal Slice Viewer (Axial, Coronal, Sagittal)                   ║
║      ├── 3D Surface Rendering (PyVista / Matplotlib / Vectorized STL Download)              ║
║      └── Live Process RAM Telemetry Widget (psutil memory bar with health status)           ║
║                                                                                             ║
║   2. Alternative Next.js 15 Web Application (http://localhost:3000)                         ║
║      ├── Next.js App Router (Upload, Segment, Register, Reconstruct, Report, Safety, Cloud) ║
║      └── Three.js 60fps WebGL 3D Viewport (STLLoader + Interactive OrbitControls)           ║
╚══════════════════════════════════════════════════╤══════════════════════════════════════════╝
                                                   │ HTTP / REST API (JSON & Multipart)
                                                   │ (Configured via CORS_ORIGINS)
╔══════════════════════════════════════════════════▼══════════════════════════════════════════╗
║                          OPTIMIZED CPU & CLOUD BACKEND ENGINE TIER                          ║
║                                                                                             ║
║   FastAPI Application (:8000) & Python Core Services (`backend/app/`)                      ║
║   ├── Data Ingestion: In-memory NiBabel loader & Synthetic 3D Cardiac Generator             ║
║   ├── Preprocessing: Spline resampling (1.0mm) & float32 in-place z-score normalization     ║
║   ├── AI Segmentation Dual-Engine (Zero Local/Remote Training Needed):                      ║
║   │   ├── Engine 1: TotalSegmentator with `roi_subset` (3mm fast targeted sub-models)       ║
║   │   └── Engine 2: MONAI 3D Residual U-Net (Hugging Face Hub `ashhal/medivision-unet-heart`)║
║   ├── Quantitative Validation: MONAI metrics (Dice, IoU, HD95 mm, ASD mm, Confusion Matrix) ║
║   ├── Surface CAD Mesh: Marching Cubes ──► Pure Vectorized NumPy Binary STL Export (100x)   ║
║   ├── Fast Registration: SimpleITK 2x Multi-Resolution Rigid (Euler3D) & Affine (~1.2s CPU) ║
║   ├── Spectral Features: Memory-efficient on-demand 3D Sobel, Laplacian & Gabor texture     ║
║   ├── Clinical Reporting: Left Atrial Enlargement (LAE) classification & Markdown export    ║
║   ├── Safety & QA: Scan validation, boundary checks, and noise stress tester               ║
║   └── Benchmark Suite: Granular per-stage pipeline execution latency tracker                ║
╚══════════════════════════════════════════════════╤══════════════════════════════════════════╝
                                                   │ PostgreSQL Protocol / REST
╔══════════════════════════════════════════════════▼══════════════════════════════════════════╗
║                                        PERSISTENCE TIER                                     ║
║                                                                                             ║
║   1. Supabase PostgreSQL Cloud Database (`aluzqooagiymysssnhkg.supabase.co`)                ║
║      ├── `patients` table (Demographics & subject metadata)                                 ║
║      ├── `scans` table (Dimensions, spacing, file hashes)                                   ║
║      ├── `segmentations` table (Engine type, volume cm3, surface area cm2, sphericity)      ║
║      └── `evaluations` table (Dice, IoU, HD95, ASD validation metrics)                      ║
║                                                                                             ║
║   2. Local Weights Cache (`models/`)                                                        ║
║      └── Hugging Face Hub Checkpoints (`ashhal/medivision-unet-heart`)                      ║
╚═════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Component Breakdown

### 2.1 Data Ingestion & Preprocessing Layer
- **`data_service.py`:** Fast in-memory NIfTI volume loader using NiBabel with explicit float32 casting. Provides `create_synthetic_sample()` for zero-download offline execution.
- **`preprocess_service.py`:** Applies isotropic 3D spline resampling to 1.0mm resolution and in-place intensity z-score normalization with zero memory duplication.

### 2.2 Database Layer
- **Supabase Cloud PostgreSQL:** Relational cloud database hosting 4 tables (`patients`, `scans`, `segmentations`, `evaluations`) for clinical telemetry and audit history.
- **`supabase_service.py`:** Python SDK client executing asynchronous upserts with graceful offline fallbacks.

### 2.3 ML & Core Logic Layer
- **`segment_service.py`:** Implements zero-training dual-engine inference:
  - *TotalSegmentator Engine:* Uses `roi_subset` to isolate targeted organs (e.g. `heart`, `aorta`, `liver`) using the 3mm fast model, dropping peak memory consumption by 70%. Configured with `OMP_NUM_THREADS=1` and `nnUNet_n_proc_DA=0`.
  - *MONAI 3D Residual U-Net:* Sliding-window Gaussian inference with `sw_batch_size=1`, `torch.inference_mode()`, and single-threaded CPU configuration.
- **`metrics_service.py`:** Computes clinical validation metrics (Dice, IoU, HD95 mm, ASD mm, Confusion Matrix) using MONAI metric primitives.
- **`reconstruct_service.py`:** Converts 3D masks into polygonal meshes via Marching Cubes and serializes them using a vectorized NumPy structured array Binary STL writer (generates 200,000 triangles in < 5ms).
- **`register_service.py`:** Optimizes SimpleITK Euler3D (rigid 6-DOF) and Affine registration on a 2x downsampled spatial pyramid, reducing CPU optimization time from 15s to ~1.2s.
- **`spectral_service.py`:** Generates 3D spatial gradient (Sobel), second-derivative curvature (Laplacian), and Gabor texture energy maps on-demand without memory accumulation.
- **`report_service.py`:** Computes Left Atrial Volume and 3D sphericity index to assign Left Atrial Enlargement (LAE) clinical classification and generates formal Markdown diagnostic reports.
- **`safety_service.py`:** Validates pre-inference scan dimensions, intensity bounds, zero-variance artifacts, and executes noise stress tests.
- **`benchmark_service.py`:** Runs multi-case end-to-end benchmarking and logs stage-by-stage compute latencies.

### 2.4 Backend API
- **FastAPI Layer (`backend/app/main.py` & `backend/app/api/`):** Exposes 23 REST endpoints across 11 sub-routers with parsed CORS headers (`CORS_ORIGINS`) and health diagnostics.

### 2.5 Frontend
- **Streamlit Full-Stack Application (`streamlit_app.py`):** Primary production interface deployed on Streamlit Community Cloud with 9 modular tabs and live RAM usage telemetry.
- **Next.js 15 Web Application (`frontend/`):** Alternative client with React 19, TypeScript, Lucide icons, glassmorphic dark theme, and Three.js 60fps WebGL viewport (`Viewport3D.tsx`).

---

## 3. Data Flow Summary
1. **Upload / Sample Init:** User uploads a NIfTI scan or generates an in-memory synthetic 3D cardiac volume.
2. **Preprocessing:** Volume is resampled to $(1.0, 1.0, 1.0)$ mm isotropic resolution and z-score normalized.
3. **AI Segmentation:** Targeted structure (e.g. `heart`, `aorta`, `left_atrium`) is passed to TotalSegmentator with `roi_subset` or MONAI 3D Residual U-Net in `torch.inference_mode()`.
4. **Surface CAD Extraction:** Sub-voxel Marching Cubes extracts vertices/faces $\rightarrow$ Vectorized NumPy binary STL writer saves the CAD model in < 5ms.
5. **Clinical Validation & Reporting:** Mask metrics (Dice/HD95) are calculated $\rightarrow$ Left atrial biomarkers are evaluated $\rightarrow$ Structured Radiologist Report is generated.
6. **Cloud Audit Sync:** Resulting metrics and patient metadata are saved to Supabase PostgreSQL database.

---

## 4. Deployment Architecture (MVP)
- **Primary Live Production:** Streamlit Community Cloud hosting `streamlit_app.py` at **[https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)** (free tier, 2.7GB RAM limit, single-vCPU).
- **Backend API Server (Local / Self-Hosted):** FastAPI with Uvicorn ASGI server running on `http://localhost:8000`.
- **Alternative Frontend Server (Local):** Next.js 15 on Node.js running on `http://localhost:3000`.
- **Cloud Database:** Hosted Supabase PostgreSQL on AWS `us-east-1`.

---

## 5. Scalability & Future Considerations
- **Memory Quota Protection:** Live memory telemetry widget alerts when RAM exceeds 2.0GB, with automatic session state garbage collection.
- **PACS Integration:** Future support for direct DICOM Web (WADO-RS / QIDO-RS) hospital network queries.
- **WebGL Level-of-Detail (LOD):** Dynamic mesh decimation for instant 60fps rendering of multi-million polygon anatomical geometries.
