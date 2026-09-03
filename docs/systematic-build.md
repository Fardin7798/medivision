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
- [ ] Perform Hugging Face Hub upload/download integration test with dummy checkpoint.

### Phase 2 — Documentation Standardization & Stale Asset Cleanup
- [x] Clean redundant template placeholders from `docs/`.
- [x] Standardize all markdown files with clear GitHub Flavored Markdown syntax and clickable links.

### Phase 3 — Skeleton Pipeline with Mock Data
- [ ] Build basic `app/main.py` and page stubs returning mock NIfTI tensors and synthetic cube meshes.
- [ ] Verify multi-page navigation and session state persistence in Streamlit.

### Phase 4 — Early Cloud Deployment & Target Environment Verification
- [ ] Push skeleton repo to GitHub.
- [ ] Connect repository to Streamlit Community Cloud and verify live headless boot.

### Phase 5 — Infrastructure & Secret Management
- [x] Create `.gitignore` ignoring large datasets (`data/`), model weights (`models/`), virtual environments (`venv/`), and `.env`.
- [ ] Set up local `.env.example` documenting required environment variables (e.g., `HF_TOKEN`).
- [ ] Ensure Hugging Face write token is securely configured in platform secrets.

### Phase 6 — Core Data Ingestion & Preprocessing Pipeline
- [x] Build `src/data.py` (NIfTI loading, metadata parsing, dataset extraction).
- [x] Build `src/preprocess.py` (Isotropic resampling, percentile intensity clipping, z-score normalization).
- [ ] Test generalization across all 20 Task02_Heart training cases.

### Phase 7 — Honest Interim Logic & Placeholders
- [ ] Clearly label dummy segmentation outputs before trained weights are loaded.
- [ ] Display prominent **Medical Safety Disclaimer** on all interface views.

### Phase 8 — Model Training & ML Core (`src/segment.py`)
- [x] Create reproducible training script (`backend/app/train.py`) and notebook (`notebooks/02_train_unet.ipynb`).
- [ ] Train 3D U-Net on Kaggle GPU / Colab for 100 epochs using `DiceCELoss`.
- [ ] Save best checkpoint (`val_dice > 0.70`) and publish to Hugging Face Hub.
- [x] Implement `backend/app/services/metrics_service.py` (Dice, IoU, 95% Hausdorff Distance, ASD, Volumetric Similarity).

### Phase 9 — 3D Reconstruction & Registration Core
- [x] Implement Marching Cubes surface extraction, Laplacian smoothing, and STL/OBJ export in `backend/app/services/reconstruct_service.py`.
- [ ] Implement SimpleITK Euler3D/Affine registration in `src/register.py`.
- [ ] Implement 3D PyVista interactive rendering via `stpyvista` in `src/viz.py`.

### Phase 10 — Multichannel Experiment & VLM Module
- [ ] Implement 3D Sobel, Laplacian, and Gabor feature extraction in `src/spectral.py`.
- [ ] Train 4-channel U-Net and quantitatively benchmark Dice score vs. 1-channel baseline.
- [ ] Implement zero-cost clinical summary generator in `src/vlm.py`.

### Phase 11 — Full Streamlit UI Assembly, Deployment & Verification
- [ ] Build and wire all 10 Streamlit pages in `app/pages/`.
- [ ] Deploy complete application to Streamlit Community Cloud.
- [ ] Verify live cloud inference and 3D mesh rendering in production browser.

---

## Bug Log & Resolution History

| # | Bug / Issue | Root Cause | Fix |
|---|---|---|---|
| 1 | Streamlit runtime crash on `import stpyvista` | Upstream `streamlit==1.63.0` introduced Components v2 architecture incompatible with `stpyvista 0.2.1`. | Pinned `streamlit==1.40.0` and `stpyvista==0.1.4` in `requirements.txt`. |
