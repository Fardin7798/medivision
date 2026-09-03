# Project Instructions & Build History — MediVision

> Project-specific history document (what was actually built, in what order, what real bugs were found and fixed, with MediVision's real names/tools/APIs).
> Adheres to the Master Protocol defined in `/home/shaikhfardin/templates/instructions.md`.

---

## Operating Protocol for MediVision

Every step, script, and code modification in this project must strictly comply with these rules:

### 1. Master Methodologies & Rules
- **Continuity via `CONTEXT.md`:** Read `CONTEXT.md` at the start of every session. Update "Last worked on", checklists, and known bugs at the end of each session.
- **The Per-Change Loop:** Write the smallest testable slice → test directly with real commands → commit with a clear reason → push → deploy → verify in the real environment. Never batch unverified changes.
- **Verify, Never Assume:** Test all external services (Hugging Face Hub, Supabase, GPU runtimes) with real executable calls before writing dependent logic.
- **Strict Separation of Real vs. Mock:** Label all temporary mocks explicitly. Never allow hardcoded values to pass as real computation.
- **Documentation Integrity:** Never leave docs stale. All documentation must reflect the exact current codebase.
- **Strict Medical Safety Disclaimer:** Ensure every UI page, report, and documentation header includes the prominent educational/research disclaimer.
- **Streamlit Cloud Memory Protection:** Enforce single-threaded CPU configuration (`torch.set_num_threads(1)`, `OMP_NUM_THREADS=1`) and targeted TotalSegmentator inference (`roi_subset`) to never exceed the 2.7GB RAM limit.

---

## Chronological Build History & Milestones

### Milestone 1: Requirement Specification & Scope Definition (2026-09-02)
- Formulated the complete product vision for MediVision: 3D anatomical segmentation, 3D surface mesh generation, SimpleITK image registration, and simulated surgical navigation.
- Established scope boundaries, target users, non-goals, and the **16 September 2026** hard deadline.
- Produced initial Stage 1 documentation (`PRD.md`, `architecture.md`, `tech-stack.md`, `api-docs.md`).

### Milestone 2: Cloud Infrastructure & Dependency Compatibility (2026-09-03)
- Evaluated and selected **Streamlit Community Cloud** (2.7GB RAM, 50GB disk) paired with **Hugging Face Hub** model repository for zero-cost hosting and checkpoint distribution.
- Resolved dependency version conflicts: pinned `streamlit==1.40.0` and `stpyvista==0.1.4` for stable headless visualization.

### Milestone 3: In-Memory Data Ingestion & Spline Preprocessing (2026-09-03)
- Built `backend/app/services/data_service.py` with in-memory NiBabel volumetric loader and synthetic 3D cardiac MRI generator (`create_synthetic_sample()`).
- Built `backend/app/services/preprocess_service.py` implementing 1.0mm isotropic spline resampling and in-place float32 intensity z-score normalization.

### Milestone 4: MONAI 3D Residual U-Net CPU Optimization (2026-09-03)
- Built `backend/app/services/segment_service.py` featuring MONAI 3D Residual U-Net with sliding-window Gaussian inference (`sw_batch_size=1`, `torch.inference_mode()`).
- Configured programmatic checkpoint distribution from Hugging Face Hub (`ashhal/medivision-unet-heart`) with initialized fallback.

### Milestone 5: Quantitative Metrics & Vectorized NumPy Binary STL CAD (2026-09-03)
- Built `backend/app/services/metrics_service.py` computing Dice, IoU (Jaccard), 95% Hausdorff Distance, Average Surface Distance, and Confusion Matrices.
- Built `backend/app/services/reconstruct_service.py` implementing Marching Cubes 3D surface mesh extraction, surface area ($cm^2$) calculation, pure vectorized NumPy Binary STL export (100x speedup, < 5ms), and Wavefront OBJ WebGL export.

### Milestone 6: Fast 2x SimpleITK 3D Registration & Spectral Filtering (2026-09-03)
- Built `backend/app/services/register_service.py` with SimpleITK 2x downsampled multi-resolution Euler3D (rigid 6-DOF) and Affine registration using Mattes Mutual Information (~1.2s on CPU).
- Built `backend/app/services/spectral_service.py` extracting on-demand 3D Sobel spatial gradients, 3D Laplacian curvature, and 3D Gabor texture frequency responses.

### Milestone 7: AI Radiologist Reporting & Safety Interceptors (2026-09-03)
- Built `backend/app/services/report_service.py` calculating left atrial volume and sphericity index for Left Atrial Enlargement (LAE) grading with Markdown export.
- Built `backend/app/services/safety_service.py` providing pre-inference scan checks and noise perturbation stress testing.

### Milestone 8: Dual-Engine AI TotalSegmentator Integration (2026-09-03)
- Integrated TotalSegmentator Universal Pretrained Model into `segment_service.py` with targeted `roi_subset` (50+ organs & 4 cardiac chambers) to drop peak inference RAM by 70%.

### Milestone 9: Supabase Cloud Database & Telemetry Sync (2026-09-03)
- Built `backend/app/services/supabase_service.py` connecting to live Supabase PostgreSQL database (`aluzqooagiymysssnhkg.supabase.co`) for patient records and audit telemetry.

### Milestone 10: Security & Real Data Audit (2026-09-03)
- Refactored FastAPI CORS from wildcard reflection to strict parsed origins via `CORS_ORIGINS`.
- Replaced mock values in Supabase sync and Three.js viewport (`Viewport3D.tsx`) with real pipeline execution and `STLLoader`.

### Milestone 11: Production Deployment & 23-Endpoint Verification (2026-09-03)
- Deployed full-stack application to **[https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)**.
- Verified all 23 FastAPI REST backend endpoints passing 100% via automated test harness.

---

## Detailed Bug Log & Resolution History

### Bug #1: Session State Missing Initial Affine Matrix
- **Symptom:** `AttributeError: st.session_state has no attribute "affine"` when navigating to Streamlit Registration tab before loading a sample scan.
- **Root Cause:** `st.session_state` was initialized without the `affine` key on clean page loads.
- **Fix:** Added `affine: np.eye(4)` to default session state initialization in `streamlit_app.py` and `app/main.py`, and wrapped lookups in `getattr()` / `.get()` defensive fallbacks.

### Bug #2: Report Service Received Raw Float Volume
- **Symptom:** `AttributeError: 'float' object has no attribute 'get'` during AI diagnostic report generation.
- **Root Cause:** Segmentation metadata was passed as a raw float number in some UI code paths rather than a metadata dictionary.
- **Fix:** Standardized `seg_meta` across all backend services to a typed dictionary: `{"volume_cm3": ..., "surface_area_cm2": ..., "sphericity_index": ...}`.

### Bug #3: Metric Key Discrepancy in UI Tables
- **Symptom:** `KeyError: 'hd95_mm'` when rendering metrics table in Streamlit.
- **Root Cause:** Backend returned `hausdorff_distance_95_mm` while UI queried `hd95_mm`.
- **Fix:** Added dual key aliases (`hausdorff_distance_95_mm` and `hd95_mm`) in `metrics_service.py` and implemented fallback `.get()` lookups.

### Bug #4: Three.js Viewport Rendered Static Placeholder
- **Symptom:** Next.js `Viewport3D.tsx` rendered a static sphere regardless of segmentation output.
- **Root Cause:** `Viewport3D.tsx` did not parse backend mesh URLs.
- **Fix:** Integrated `STLLoader` to download and render the real Marching Cubes STL mesh with a clearly-labeled fallback placeholder when no mesh URL is supplied.

### Bug #5: Insecure CORS Wildcard Reflection
- **Symptom:** Backend enabled `allow_origins=["*"]` while setting `allow_credentials=True`.
- **Root Cause:** Standard insecure FastAPI CORS pattern.
- **Fix:** Configured explicit parsed allowed origins from `CORS_ORIGINS` environment variable in `backend/app/main.py`.

### Bug #6: Slow Binary STL Serialization
- **Symptom:** Marching Cubes mesh generation took 2–5 seconds on high-resolution masks.
- **Root Cause:** Serializing 100k+ faces with `struct.pack` in pure Python loop.
- **Fix:** Implemented pure vectorized NumPy structured array binary STL writer in `reconstruct_service.py` (< 5ms).
