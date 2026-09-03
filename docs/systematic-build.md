# Systematic Project Build Tracking — MediVision

> Project-specific methodology and phase execution tracking for MediVision (3D Medical Image AI Segmentation, Registration & Navigation).
> Implements the master framework from `/home/shaikhfardin/templates/systematic-build-template.md`.

---

## Core Principles for MediVision

1. **Verify, never assume:** Before trusting any external API, library, or service, actually call/test it. A real response is the only valid proof of functionality.
2. **Build in small, independently-testable steps:** Never write a large untested chunk. Write one module, verify it directly via test scripts, then move to the next.
3. **Contract-first when building an API or interface:** Define function signatures, array shapes, and return formats in `docs/api-docs.md` before coding logic.
4. **Label fake vs. real, always, out loud:** If something is a temporary placeholder, say so explicitly in code and docs. Never let "looks done" pass as "is done."
5. **Deploy/run early, verify constantly in the real environment:** Check execution in the actual runtime (Streamlit Community Cloud 2.7GB limit) early and often.
6. **Fix root causes, not symptoms:** When something breaks, read the full traceback and diagnose the root cause instead of applying superficial retry loops.
7. **Keep documentation in sync with reality:** Update `CONTEXT.md` and `TEST.md` as part of finishing every single change.
8. **Get explicit buy-in before pivoting architecture:** Document real tradeoffs before swapping frameworks, models, or databases.
9. **Local dev environment ≠ deploy target ≠ clean install:** Distinguish between local machine resources (e.g. 64GB RAM) and deploy target constraints (Streamlit Cloud 2.7GB RAM limit).

---

## The Per-Change Loop (Applied to Every Single Modification)

1. **Write** the smallest atomic piece of the change.
2. **Test it locally/directly** — run it, call it, check its output for real.
3. **Commit** with a message stating what changed, why, and what was verified.
4. **Push** to version control repository.
5. **Deploy** to target runtime (Streamlit Cloud / local server).
6. **Verify in production/the real target** — check live interactive behavior.
7. If verification finds any defect, loop back immediately to fix the root cause before moving on.

---

## Phase-by-Phase Execution Checklist

### Phase 0 — Comprehensive Specification & Requirements Review
- [x] Formulate complete system vision, target users, and non-goals.
- [x] Establish hard delivery milestone: **16 September 2026**.
- [x] Produce standardized `PRD.md`, `architecture.md`, `tech-stack.md`, `api-docs.md`, `CONTEXT.md`, and `TEST.md`.

### Phase 1 — External Dependency & Environment Verification
- [x] Verify Python 3.12 virtual environment and dependency compatibility.
- [x] Verify Hugging Face Hub checkpoint repository (`ashhal/medivision-unet-heart`).
- [x] Verify TotalSegmentator zero-shot pretrained model ecosystem on CPU.
- [x] Verify Supabase PostgreSQL cloud database connectivity (`aluzqooagiymysssnhkg.supabase.co`).

### Phase 2 — In-Memory Data Ingestion & Spline Preprocessing
- [x] Build `data_service.py` with in-memory NiBabel loader and synthetic 3D cardiac generator.
- [x] Build `preprocess_service.py` implementing isotropic spline resampling (1.0mm) and in-place float32 z-score normalization.
- [x] Verify MPR slice rendering across Axial, Coronal, and Sagittal planes.

### Phase 3 — Zero-Training Dual-Engine 3D AI Segmentation (CPU-Optimized)
- [x] Implement MONAI 3D Residual U-Net with `sw_batch_size=1`, single-thread CPU execution, and `torch.inference_mode()`.
- [x] Integrate TotalSegmentator Universal Pretrained Model with targeted `roi_subset` (50+ organs & 4 cardiac chambers) and `fast=True` 3mm execution.
- [x] Configure zero-thread-contention environment (`OMP_NUM_THREADS=1`, `nnUNet_n_proc_DA=0`).

### Phase 4 — Quantitative Clinical Validation & Vectorized Surface CAD
- [x] Implement MONAI-based metric calculation: Dice, IoU (Jaccard), HD95 mm, ASD mm, and Confusion Matrix.
- [x] Implement sub-voxel Marching Cubes 3D surface mesh extraction in `reconstruct_service.py`.
- [x] Implement 1-click pure Vectorized NumPy structured array Binary STL CAD export (100x speedup) and Wavefront OBJ WebGL export.

### Phase 5 — Fast 2x Multi-Resolution 3D Registration & Spectral Filtering
- [x] Implement SimpleITK 2x downsampled multi-resolution Euler3D (rigid 6-DOF) and Affine registration with Mattes Mutual Information (~1.2s on CPU).
- [x] Implement on-demand 4-channel spectral feature maps (3D Sobel spatial gradients, Laplacian curvature, Gabor texture).

### Phase 6 — AI Radiologist Diagnostic Reporting & Safety Interceptors
- [x] Implement Left Atrial Volume ($cm^3$) and sphericity calculation for Left Atrial Enlargement (LAE) grading.
- [x] Generate formal printable Markdown diagnostic reports.
- [x] Implement pre-inference scan safety validation, volume boundary checks, and noise stress testing.

### Phase 7 — Multi-Case Pipeline Latency Benchmarking
- [x] Implement `benchmark_service.py` recording granular per-stage timings (Ingestion, Preprocessing, Inference, Reconstruction, Reporting).

### Phase 8 — Supabase Cloud Database Integration
- [x] Implement `supabase_service.py` syncing patient demographics, scan metadata, segmentation biomarkers, and evaluation history to live Supabase PostgreSQL.

### Phase 9 — Streamlit Cloud 2.7GB RAM Telemetry & Production Hardening
- [x] Integrate live process RAM telemetry monitor widget in the Streamlit sidebar (`RAM: XXX MB / 2700 MB`).
- [x] Implement active session state memory garbage collection (`gc.collect()`) to eliminate RAM accumulation across tab navigations.
- [x] Deploy full 9-module application to **[https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)**.
- [x] Run 23-endpoint automated test suite via FastAPI TestClient (`23 / 23 Passed, 100% OK`).
