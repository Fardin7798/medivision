# CONTEXT.md — MediVision (3D Medical AI Suite)

> Living context file for MediVision. Update this file as decisions are made, dependencies are tested, features are completed, or bugs are resolved.

## Project Overview
MediVision is a production-grade 3D medical image segmentation, quantitative anatomical evaluation, multi-resolution spatial registration, and clinical report generation platform. It targets 3D mono-modal cardiac MRI volumes (MSD Task02_Heart dataset) using MONAI, PyTorch 3D Residual U-Net, SimpleITK, Marching Cubes, and Supabase PostgreSQL.

## Current State & Recent Changes
- **Live Deployment:** Streamlit Full-Stack Application is live and accessible at **[https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)**.
- **Automated Verification:** All 23 FastAPI REST backend endpoints and health check verified passing (`23 / 23 Passed, 100% OK`).
- **Bug Resolution (2026-09-03):**
  - Resolved `AttributeError: 'float' object has no attribute 'get'` in `streamlit_app.py` and `report_service.py` by packaging `seg_meta` into a typed dictionary (`volume_cm3`, `voxel_count`, `surface_area_cm2`, `sphericity_index`).
  - Resolved `KeyError: 'hd95_mm'` by adding metric key aliases (`hd95_mm`, `asd_mm`) in `metrics_service.py` and implementing defensive `.get()` getters with defaults in UI modules.
  - Resolved registration dictionary attribute lookups in Streamlit Module 5.
- **Model Checkpoints:** Seamless Hugging Face Hub loading from `ashhal/medivision-unet-heart` with initialized weight fallback when offline.
- **Master Protocol Alignment:** All documentation (`PRD.md`, `architecture.md`, `tech-stack.md`, `api-docs.md`, `systematic-build.md`, `instructions.md`, `CONTEXT.md`, `TEST.md`) conforms to `/home/shaikhfardin/templates/`.
- **Security & Route Alignment Audit (2026-09-03):** Verified via Agent-Reach Exa search that FastAPI CORS wildcard `allow_origins=["*"]` with `allow_credentials=True` is an insecure reflection anti-pattern; refactored to explicit parsed origins from `CORS_ORIGINS`. Updated `frontend/src/lib/api.ts` fallback from Streamlit URL to `http://localhost:8000`. Fixed legacy import in `preprocess_service.py` and added top-level `report_id` to `/api/report/generate`. Re-verified full 23-endpoint test suite passing 100%.
- **Dual-Engine AI Segmentation (2026-09-03):** Integrated Pretrained Universal Engine (TotalSegmentator with 50+ MRI organs and 4-Chamber Heart: Left/Right Atria, Left/Right Ventricles, Myocardium, Aorta) alongside MONAI 3D Residual U-Net baseline. Added organ/chamber selection in Streamlit Module 2 (`streamlit_app.py`, `app/main.py`) and FastAPI REST backend (`routes_segment.py`). All 23 backend endpoints verified passing 100%.
- **Fake/Hardcoded Data Audit & Fix (2026-09-03):** Full codebase audit against "Rules for MediVision" found and fixed real vs. mock violations — see Bug Log #4–#6 below. `Viewport3D.tsx` now loads real backend-generated STL meshes via `STLLoader` (falls back to a clearly-labeled placeholder only when no mesh URL is available); the Supabase Cloud sync page runs the actual segment→evaluate pipeline before syncing instead of posting fixed demo numbers; hardcoded Supabase credentials were removed from source in favor of env vars.

## Tech Stack
- **Primary Deployed UI/App:** Streamlit 1.40.0 + PyVista/Matplotlib + NiBabel 5.4.2 (Live on Streamlit Community Cloud: `https://medivision-a.streamlit.app/`)
- **Deep Learning Core:** MONAI 1.6.0 (3D Residual U-Net, Sliding Window Gaussian Inference, DiceCELoss) + PyTorch 2.14.0
- **Medical Registration & Geometry:** SimpleITK 2.5.6 (Euler3DTransform, Mattes Mutual Information) + scikit-image 0.26.0 (Marching Cubes 3D Surface Reconstruction, STL/OBJ generation)
- **Database & Cloud Sync:** Supabase PostgreSQL (`aluzqooagiymysssnhkg.supabase.co`) for audit telemetry and patient records
- **Alternative Web Frontend:** Next.js 15 + TypeScript + Tailwind CSS + Three.js WebGL (in `frontend/`)
- **Alternative REST Backend:** FastAPI + Uvicorn (in `backend/app/`)
- **Pretrained AI Inference (Zero Local/Remote Training Needed):** TotalSegmentator Universal Pretrained Model + Hugging Face Hub (`ashhal/medivision-unet-heart`), eliminating external Kaggle/Colab training pipelines.

## File Structure
```
Project 3/
├── app/
│   └── main.py                  # Streamlit application mirror
├── streamlit_app.py             # Root Streamlit Cloud entrypoint
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & CORS
│   │   ├── config.py            # YAML configuration loader
│   │   ├── api/                 # REST Route handlers (11 routers)
│   │   ├── services/            # Core AI & Medical logic
│   │   └── train.py             # PyTorch/MONAI training script
│   └── requirements.txt
├── frontend/
│   ├── package.json             # Next.js 15, React 19, Three.js, Lucide
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── src/
│       ├── app/                 # Next.js App Router (14 pages)
│       ├── components/          # Viewport3D, MPRViewer, Navbar
│       └── lib/                 # api.ts, supabase.ts
├── configs/
│   └── config.yaml              # Global pipeline parameters
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── tech-stack.md
│   ├── api-docs.md
│   ├── systematic-build.md
│   └── instructions.md
├── CONTEXT.md
├── TEST.md
└── README.md
```

## Routes & Modules / Key Capabilities
| # | Module / Route | Engine | Purpose & Verified Output |
|---|---|---|---|
| 1 | `Volumetric Ingestion & MPR Slicer` (`/api/slice`, `/api/probe`) | NiBabel + NumPy | Axial, coronal, sagittal slicing with interactive voxel intensity & spacing probing. |
| 2 | `3D U-Net AI Segmentation` (`/api/segment`, `/api/preprocess`) | MONAI 3D U-Net | Sliding-window inference producing binary volume masks and anatomical organ measurements. |
| 3 | `Quantitative Evaluation Suite` (`/api/evaluate`) | MONAI Metrics | Multi-metric validation (Dice Score, IoU, 95% Hausdorff Distance, ASD, Volumetric Similarity). |
| 4 | `3D Marching Cubes & STL Export` (`/api/reconstruct`, `/api/mesh`) | scikit-image + STL | Watertight binary STL/OBJ generation for surgical 3D printing and WebGL rendering. |
| 5 | `SimpleITK 3D Image Registration` (`/api/register`, `/api/slice/registration-diff`) | SimpleITK Euler3D | Mattes Mutual Information multi-resolution rigid alignment and subtraction difference visualization. |
| 6 | `4-Channel Spectral Gradient Filters` (`/api/spectral/extract`, `/api/slice/channel`) | SciPy + Filters | Multi-channel Sobel, Laplacian, and 3D Gabor texture extraction. |
| 7 | `AI Radiologist Diagnostic Report` (`/api/report/generate`, `/api/report/markdown`) | Rule-based VLM engine | Structured diagnostic impression, LA enlargement classification, and clinical recommendations. |
| 8 | `Clinical Safety & Adversarial Interceptors` (`/api/safety/*`) | Safety Service | Pre-flight integrity validation, SNR computation, and Gaussian noise stress testing. |
| 9 | `Supabase Cloud Database Sync` (`/api/cloud/*`) | Supabase Client | Remote audit logging, scan metadata persistence, and clinical history tracking. |

## Features Built
- [x] Environment & Dependency Pinning (`requirements.txt`, `.gitignore`)
- [x] Medical image upload & synthetic volume fallback (`backend/app/services/data_service.py`)
- [x] Isotropic resampling & HU normalization pipeline (`backend/app/services/preprocess_service.py`)
- [x] Baseline 3D Residual U-Net architecture & Hugging Face Hub integration (`backend/app/services/segment_service.py`)
- [x] Clinical evaluation metrics suite (`backend/app/services/metrics_service.py`)
- [x] 3D Marching Cubes polygonization & binary STL download (`backend/app/services/reconstruct_service.py`)
- [x] SimpleITK Euler3D Rigid registration (`backend/app/services/register_service.py`)
- [x] Multi-channel 3D spatial filter tensor extraction (`backend/app/services/spectral_service.py`)
- [x] Automated clinical diagnostic report generator (`backend/app/services/report_service.py`)
- [x] Pre-flight scan safety validator & noise robustness stress tester (`backend/app/services/safety_service.py`)
- [x] Supabase PostgreSQL cloud sync integration (`backend/app/services/supabase_service.py`)
- [x] Complete Streamlit Cloud application live at `https://medivision-a.streamlit.app/` (`streamlit_app.py`, `app/main.py`)
- [x] 23/23 FastAPI REST backend endpoints verified with automated test suite

## Bug Log & Resolution History
| # | Bug / Issue | Root Cause | Fix |
|---|---|---|---|
| 1 | Streamlit runtime crash on `import stpyvista` | Upstream `streamlit==1.63.0` introduced Components v2 incompatible with legacy `stpyvista`. | Pinned `streamlit==1.40.0` and `stpyvista==0.1.4` in `requirements.txt`. |
| 2 | `AttributeError: 'float' object has no attribute 'get'` | `run_segmentation_inference` returned tuple `(pred_mask, volume_cm3)` where volume was float; UI expected dictionary. | Packaged `seg_meta` into typed dictionary with `volume_cm3`, `voxel_count`, `surface_area_cm2`, `sphericity_index` and added type checks. |
| 3 | `KeyError: 'hd95_mm'` in Module 3 | `compute_segmentation_metrics` returned `hausdorff_distance_95_mm` while UI queried `hd95_mm`. | Added `hd95_mm` and `asd_mm` aliases to return dictionary and used `.get()` with safe defaults in UI. |
| 4 | `Viewport3D.tsx` never showed real patient anatomy | Component always rendered a hardcoded rotating sphere geometry instead of loading the backend's Marching Cubes STL output, despite `architecture.md` and `systematic-build.md` Phase 9 claiming it was done. | Added `STLLoader`-based real mesh loading with `stlUrl` prop, auto-centering/scaling; wired `reconstruct/page.tsx` to pass the real `stl_download_url`. Falls back to a clearly-labeled placeholder (not a silent fake) when no mesh is available. |
| 5 | Cloud sync always posted fake demo numbers | `cloud/page.tsx` "Sync Current Session" and `POST /api/cloud/sync` both hardcoded `volume_cm3: 38.5`, `dice_coefficient: 0.9167`, and fabricated scan metadata (`[64,64,64]`, SNR `29.5`) regardless of what was actually processed — violates "Never report simulated/fabricated metrics." Scorecards also showed invented infra facts (fake bucket count, fake region, a Postgres hostname that didn't even match the real project ref). | Frontend now runs the real sample→preprocess→segment→evaluate pipeline and syncs the actual returned numbers. Backend `/api/cloud/sync` now requires real fields and returns `400` if they're missing instead of silently substituting fake defaults. Scorecards replaced with a real `connected` status sourced from `/api/cloud/history`. |
| 6 | Hardcoded Supabase secret key in source | `supabase_service.py` and `frontend/src/lib/supabase.ts` both embedded a live Supabase anon JWT as a fallback default — violates "Never hardcode API keys, secrets, or write tokens in code." The frontend client was also dead code (never actually called). | Removed both hardcoded fallbacks; credentials now come only from `SUPABASE_URL`/`SUPABASE_KEY` (backend) and `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend) env vars per `.env.example`. Added `is_connected()` so the UI reports real status instead of assuming. **⚠️ Action still needed:** since this key was committed to the public GitHub repo, treat it as exposed — rotate/regenerate the Supabase anon key from the Supabase dashboard even though the code no longer references it. |

## Rules for MediVision
- **Never** hardcode API keys, secrets, or write tokens in code, docs, or git history.
- **Never** upload patient or medical imaging data to unauthorized external cloud services.
- **Never** report simulated/fabricated metrics (Dice/IoU); always report true measured values from validation folds.
- **Never** omit the **Medical Safety Disclaimer** on any UI page or generated report.
- **Never** mark a feature or pipeline stage as done without verified execution and test logs in `TEST.md`.

## Owner & Links
- **Author:** shaikhfardin
- **Repo:** https://github.com/Fardin7798/medivision
- **Live Streamlit App:** https://medivision-a.streamlit.app/
- **Supabase Project:** https://aluzqooagiymysssnhkg.supabase.co
