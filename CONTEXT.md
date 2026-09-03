# CONTEXT.md — MediVision

> This is the **living status doc** — read this first at the start of
> every session, and update it as part of finishing every real change,
> not as an afterthought. This is how continuity works across sessions.

## Project Overview

- **What it is:** MediVision is a lightweight, reproducible AI pipeline and interactive desktop/web interface that performs anatomical segmentation on 3D medical images (MSD Task02_Heart), converts binary segmentations into 3D interactive surface meshes, executes rigid/affine image registration (SimpleITK), and renders simulated surgical-navigation overlays with an optional local vision-language clinical report.
- **Status:** Phase 6 (Multichannel Spectral Features) Complete. 4-Channel spatial filters, API endpoints & Next.js Multichannel UI verified.
- **Last worked on:** (2026-09-03)
  - Deployment architecture formalized: Streamlit Community Cloud (free, 2.7GB RAM, 50GB storage) for web application hosting + Hugging Face Hub model repo for weights/checkpoint storage (circumvents GitHub 100MB file limit). Render dropped (512MB RAM free tier insufficient for MONAI/PyTorch).
  - Dependency compatibility verified in local venv: Discovered critical upstream bug with latest `streamlit==1.63.0` and `stpyvista==0.2.1` (Components v2 import failure). Successfully pinned and verified working combination: `streamlit==1.40.0` + `stpyvista==0.1.4`.
  - Pinned core dependencies in `requirements.txt`: `torch==2.14.0`, `monai==1.6.0`, `SimpleITK==2.5.6`, `nibabel==5.4.2`, `scikit-image==0.26.0`, `huggingface_hub==1.29.0`, `streamlit==1.40.0`, `stpyvista==0.1.4`.
  - Security hygiene: Identified leaked HF write token pasted in chat; flagged for immediate revocation/regeneration. Environment rules established to use only secret managers / local `.env`.
  - Master protocol standardization: All documentation (`PRD.md`, `architecture.md`, `tech-stack.md`, `api-docs.md`, `systematic-build.md`, `instructions.md`, `CONTEXT.md`, `TEST.md`) aligned with `/home/shaikhfardin/templates/`.

## Tech Stack
Backend: FastAPI + MONAI 1.6.0 + PyTorch 2.14.0 + SimpleITK 2.5.6 + NiBabel 5.4.2 + scikit-image 0.26.0. Frontend: Node.js + Next.js + TypeScript + Three.js WebGL + Lucide Icons, Hugging Face Hub (checkpoint hosting), Kaggle GPU (30h/week quota) / Google Colab for model training. No backend server, no database. Full reasoning lives in `docs/tech-stack.md`.

## File Structure
```
Project 3/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app & CORS
│   │   ├── config.py            # YAML configuration loader
│   │   ├── api/                 # REST Route handlers
│   │   └── services/            # Core AI & Medical logic
│   └── requirements.txt
├── frontend/
│   ├── package.json             # Next.js, React, Three.js, Lucide
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── src/
│       ├── app/                 # Next.js App Router pages
│       ├── components/          # Viewport3D, MPRViewer, Navbar
│       └── lib/api.ts           # FastAPI client
├── configs/
│   └── config.yaml
├── data/                        (gitignored)
├── models/                      (gitignored)
├── outputs/                     (gitignored)
├── notebooks/
├── docs/
├── CONTEXT.md
└── TEST.md
```

## Database Schema
None — MediVision operates strictly on in-memory tensors and file-system artifacts (NIfTI `.nii.gz`, STL meshes, NumPy arrays, YAML configs).

## Routes & Pages / Key Endpoints
No HTTP/REST endpoints. The application exposes an interactive Streamlit UI with the following multi-page navigation flow:
| Page | Module | Purpose |
|---|---|---|
| `main.py` | Dashboard | Overview, system status, dataset loader, and pipeline index |
| `01_upload.py` | `src/data.py` | Upload & inspect patient NIfTI/DICOM/PNG images and metadata |
| `02_preprocess.py` | `src/preprocess.py` | Resampling (isotropic voxel spacing), HU clipping, normalization |
| `03_segment.py` | `src/segment.py` | Run 3D U-Net inference for left atrium / cardiac segmentation |
| `04_evaluate.py` | `src/metrics.py` | Compute Dice score, IoU, Precision, Recall, and Hausdorff distance |
| `05_multichannel.py` | `src/spectral.py` | Multichannel derived features (Sobel gradients, Laplacian, Gabor texture) |
| `06_reconstruct.py` | `src/reconstruct.py` | Marching Cubes 3D mesh generation, smoothing, and STL export |
| `07_register.py` | `src/register.py` | Rigid/Affine registration (Euler3DTransform) to atlas/pre-op scan |
| `08_visualize.py` | `src/viz.py` | Simulated surgical navigation overlay (2D multi-planar + 3D PyVista) |
| `09_vlm.py` | `src/vlm.py` | Optional local VLM clinical report generation |
| `10_export.py` | Pipeline Export | Package binary masks, 3D meshes (STL/OBJ), transformation matrices, metrics |

## Features Built
- [x] Environment & Dependency Pinning (`requirements.txt`, `.gitignore`)
- [x] Medical image upload & validation (`src/data.py`)
- [x] Preprocessing pipeline (`src/preprocess.py`)
- [x] Baseline U-Net training script & inference engine (`backend/app/services/segment_service.py`, `backend/app/train.py`)
- [x] Quantitative evaluation suite (`backend/app/services/metrics_service.py`, `backend/app/api/routes_evaluate.py`)
- [ ] Multichannel / derived spectral feature experiment (`src/spectral.py`)
- [x] 3D surface mesh reconstruction & STL export (`backend/app/services/reconstruct_service.py`, `backend/app/api/routes_reconstruct.py`)
- [x] Rigid/Affine registration engine (`backend/app/services/register_service.py`, `backend/app/api/routes_register.py`)
- [ ] Simulated surgical navigation viewer (`src/viz.py`)
- [ ] Local VLM explanation generator (`src/vlm.py`)
- [ ] Complete Streamlit multi-page application (`app/`)

## Current WIP & Bugs

**In progress:**
- Phase 1: Verify `DecathlonDataset` download, test HF model repository upload/download workflow, create `configs/config.yaml`, and build `src/data.py`.

**Known bugs:**
- [Resolved 2026-09-03] **Bug #1 — Streamlit / stpyvista Components v2 Crash:** Upstream `streamlit==1.63.0` + `stpyvista==0.2.1` causes fatal runtime import errors due to Streamlit's new frontend component architecture.
  - *Root Cause:* `stpyvista` release 0.2.1 relies on legacy component wrappers incompatible with Streamlit >= 1.50.
  - *Fix:* Pinned `streamlit==1.40.0` and `stpyvista==0.1.4` in `requirements.txt`. Verified clean import and visual render.

## Roadmap
1. **Phase 1 (Dataset & Preprocessing):** Download MSD Task02_Heart subset, build `src/data.py` and `src/preprocess.py`, verify NIfTI loading in a notebook. (Target: Sep 4)
2. **Phase 2 (Baseline Segmentation):** Train 3D U-Net on Kaggle GPU / Colab, track validation Dice score (>0.70), save best checkpoint to Hugging Face Hub. (Target: Sep 7)
3. **Phase 3 (Evaluation & Metrics):** Implement Dice, IoU, precision, recall in `src/metrics.py`. (Target: Sep 8)
4. **Phase 4 (3D Reconstruction):** Implement Marching Cubes, PyVista mesh generation, and STL exporter in `src/reconstruct.py`. (Target: Sep 9)
5. **Phase 5 (Registration):** Implement SimpleITK Euler3D/Affine registration in `src/register.py`. (Target: Sep 11)
6. **Phase 6 (Multichannel Experiment):** Implement Sobel/Laplacian/Gabor derived channels in `src/spectral.py`, train multichannel model, compare metrics against baseline. (Target: Sep 13)
7. **Phase 7 (Local VLM Explanation):** Implement zero-cost local clinical explanation module in `src/vlm.py`. (Target: Sep 14)
8. **Phase 8 (Streamlit UI Assembly):** Build 10-page Streamlit application in `app/`. (Target: Sep 15)
9. **Phase 9 (Final Deployment & Polish):** Deploy to Streamlit Community Cloud, verify live inference, finalize documentation and portfolio presentation. (Target: Sep 16)

⚠️ **Hard Deadline:** 16 September 2026.
*Contingency Priority:* Baseline Segmentation (Phases 1–3) → 3D Mesh (Phase 4) → Registration (Phase 5) → Streamlit UI (Phase 8). If time runs short, Multichannel (Phase 6) and VLM (Phase 7) will be scoped as future work.

## Rules for MediVision
**Never:**
- Never hardcode API keys, secrets, or write tokens in code, docs, or git history.
- Never upload patient or medical imaging data to unauthorized external cloud services (VLM must run locally or use explicitly approved endpoints).
- Never report simulated/fabricated metrics (Dice/IoU); always report true measured values from validation folds.
- Never omit the **Medical Safety Disclaimer** on any UI page or generated report.
- Never mark a feature or pipeline stage as done without verified execution and test logs in `TEST.md`.
- Never unpin `streamlit==1.40.0` or `stpyvista==0.1.4` without re-verifying component rendering.

## Owner & Links
- **Author:** shaikhfardin
- **Repo:** https://github.com/Fardin7798/medivision
- **Live URL(s):** (Streamlit Community Cloud deployment pending Phase 8)
- **Documentation:**
  - `docs/PRD.md`
  - `docs/architecture.md`
  - `docs/tech-stack.md`
  - `docs/api-docs.md`
  - `docs/systematic-build.md`
  - `docs/instructions.md`
  - `TEST.md`
