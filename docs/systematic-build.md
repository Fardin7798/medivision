# Systematic Project Build Tracking — MediVision

> Project-specific methodology and phase execution checklist for MediVision (3D Medical Image Segmentation, Registration & Navigation).
> Implements the master framework from `/home/shaikhfardin/templates/systematic-build-template.md`.

---

## Core Principles for MediVision

1. **Verify, never assume:** Real test calls for MONAI downloads, Hugging Face model loading, and SimpleITK transforms before writing dependent application code.
2. **Build in small, independently-testable steps:** Build single modules (`src/data.py`, `src/preprocess.py`, `src/segment.py`), verify them in notebooks/CLI scripts, then connect them into the Streamlit UI.
3. **Contract-first module design:** Establish function signatures, array shapes, and return types in `docs/api-docs.md` before coding logic.
4. **Label fake vs. real out loud:** Clearly distinguish between mock placeholders (e.g. dummy masks, interim rule-based summaries) and trained deep learning models.
5. **Deploy and verify early in the real target environment:** Verify imports and headless Streamlit execution in Python 3.10+ environments early.
6. **Fix root causes, not symptoms:** When stpyvista fails or SimpleITK diverges, diagnose version mismatches and coordinate frames instead of applying superficial workarounds.
7. **Keep documentation in sync with reality:** Update `CONTEXT.md` and `TEST.md` after every single verified milestone.

---

## The Per-Change Loop (Applied to Every Modification)

1. **Write** the smallest atomic piece of code.
2. **Test directly** via CLI smoke tests or isolated notebook cells logged in `TEST.md`.
3. **Commit** with a descriptive message detailing *what* changed, *why*, and *how* it was verified.
4. **Push** to the remote Git repository.
5. **Deploy / Test in Target Runtime** (e.g. Streamlit Cloud / local server).
6. **Verify behavior** in the real interface or execution context.
7. If any defect is found, loop back immediately to fix the root cause before moving to the next feature.

---

## Phase Execution Checklist

### Phase 0 — Comprehensive Specification & Requirement Review
- [x] Read and understand all medical imaging AI requirements and scope.
- [x] Establish hard deadline: **16 September 2026**.
- [x] Explicitly define non-goals (clinical certification, real hardware tracking).
- [x] Produce standardized `PRD.md`, `architecture.md`, `tech-stack.md`, `api-docs.md`, `CONTEXT.md`, and `TEST.md`.

### Phase 1 — External Dependency & Environment Verification
- [x] Verify MONAI 1.6.0, SimpleITK 2.5.6, PyTorch 2.14.0, NiBabel 5.4.2 in clean venv.
- [x] Identify and resolve Streamlit / `stpyvista` compatibility bug (pin `streamlit==1.40.0`, `stpyvista==0.1.4`).
- [x] Verify Kaggle (30h/week quota) and Colab GPU compute availability.
- [x] Execute programmatic download verification of MSD Task02_Heart dataset (S3 URL 200 OK, 455.7 MB).
- [x] Perform Hugging Face Hub upload/download integration test with dummy checkpoint (`backend/app/services/segment_service.py`).

### Phase 2 — Documentation Standardization & Stale Asset Cleanup
- [x] Clean redundant template placeholders from `docs/`.
- [x] Standardize all markdown files with clear GitHub Flavored Markdown syntax and clickable links.

### Phase 3 — Skeleton Pipeline with Mock Data
- [x] Build basic `app/main.py` and page stubs returning mock NIfTI tensors and synthetic cube meshes (`streamlit_app.py`, `frontend/`).
- [x] Verify multi-page navigation and session state persistence in Streamlit (`streamlit_app.py`).

### Phase 4 — Early Cloud Deployment & Target Environment Verification
- [x] Push skeleton repo to GitHub (`https://github.com/Fardin7798/medivision`).
- [x] Connect repository to Streamlit Community Cloud and verify live headless boot (`https://medivision-a.streamlit.app/`).

### Phase 5 — Infrastructure & Secret Management
- [x] Create `.gitignore` ignoring large datasets (`data/`), model weights (`models/`), virtual environments (`venv/`), and `.env`.
- [x] Set up local `.env.example` documenting required environment variables (`.env.example`).
- [x] Ensure Supabase and Hugging Face tokens are securely configured (`.env.example`).

### Phase 6 — Core Data Ingestion & Preprocessing Pipeline
- [x] Build `src/data.py` (NIfTI loading, metadata parsing, dataset extraction).
- [x] Build `src/preprocess.py` (Isotropic resampling, percentile intensity clipping, z-score normalization).
- [x] Test generalization across Task02_Heart cases via multi-case benchmark suite (`backend/app/benchmark.py`).

### Phase 7 — Honest Interim Logic & Placeholders
- [x] Clearly label dummy segmentation outputs before trained weights are loaded (`segment_service.py`).
- [x] Display prominent **Medical Safety Disclaimer** on all interface views (Frontend & Streamlit banners).

### Phase 8 — Model Training & ML Core (`src/segment.py`)
- [x] Create reproducible training script (`backend/app/train.py`) and notebook (`notebooks/02_train_unet.ipynb`).
- [x] Create 3D U-Net training pipeline using `DiceCELoss` (`backend/app/train.py`, `notebooks/02_train_unet.ipynb`).
- [x] Model checkpoint fallback & Hugging Face Hub loader (`backend/app/services/segment_service.py`).
- [x] Implement `backend/app/services/metrics_service.py` (Dice, IoU, 95% Hausdorff Distance, ASD, Volumetric Similarity).

### Phase 9 — 3D Reconstruction & Registration Core
- [x] Implement Marching Cubes surface extraction, Laplacian smoothing, and STL/OBJ export in `backend/app/services/reconstruct_service.py`.
- [x] Implement SimpleITK Euler3D/Affine registration in `backend/app/services/register_service.py`.
- [x] Implement Three.js 3D WebGL interactive rendering in `frontend/` and Matplotlib/STL in `streamlit_app.py`.

### Phase 10 — Multichannel Experiment & VLM Module
- [x] Implement 3D Sobel, Laplacian, and Gabor feature extraction in `backend/app/services/spectral_service.py`.
- [x] Implement 4-channel spatial gradient feature extractor (`backend/app/services/spectral_service.py`).
- [x] Implement zero-cost clinical diagnostic summary generator in `backend/app/services/report_service.py`.

### Phase 11 — Full Streamlit UI Assembly, Deployment & Verification
- [x] Build and wire full Streamlit 9-module suite in `streamlit_app.py` & `app/main.py`.
- [x] Deploy complete application to Streamlit Community Cloud (`https://medivision-a.streamlit.app/`).
- [x] Verify live cloud inference and 3D mesh rendering in production browser (`https://medivision-a.streamlit.app/`).

---

## Bug Log & Resolution History

| # | Bug / Issue | Root Cause | Fix |
|---|---|---|---|
| 1 | Streamlit runtime crash on `import stpyvista` | Upstream `streamlit==1.63.0` introduced Components v2 architecture incompatible with `stpyvista 0.2.1`. | Pinned `streamlit==1.40.0` and `stpyvista==0.1.4` in `requirements.txt`. |
