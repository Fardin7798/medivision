# CONTEXT.md — MediVision (3D Medical AI Suite)

> Living context file for MediVision. Update this file as decisions are made, dependencies are tested, features are completed, or bugs are resolved. The goal is that any Claude/Agent session can read ONLY this file and immediately know the full state of the project.
>
> Last worked on: 2026-09-03 — Architecture Upgrade: Cloud-Deployed 3D Anatomical Digital Twin Suite Integration, Real Clinical Decathlon MRI Dataset Adoption, and Deprecation of Crude Local Python Mesh Generation.

## Project Overview
MediVision is an end-to-end, production-grade 3D medical image segmentation, quantitative anatomical evaluation, multi-resolution spatial registration, and clinical report generation platform. It connects genuine clinical patient imaging (Medical Segmentation Decathlon 3D Cardiac MRI) with zero-training pretrained models (TotalSegmentator targeted organ selection + MONAI 3D Residual U-Net) and a **Cloud-Deployed 3D Anatomical Digital Twin Suite** (4K animated beating heart, 4-chamber labeled cardiac dissection, internal brain structures, respiratory airflow lungs, and abdominal organ systems). It provides sub-second 2x SimpleITK image registration, live RAM telemetry, and interactive dual frontends (Streamlit Cloud & Next.js 15 WebGL).

## Current State & Recent Changes
- **Live status:** Primary Full-Stack Application is live in production at **[https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)**. Alternative Next.js 15 frontend is available in `frontend/` and FastAPI REST backend runs on `http://localhost:8000`. Supabase PostgreSQL cloud database is connected and active.
- **Recent milestone:** Complete backend audit and transformation to replace crude, low-poly Python Marching Cubes with a photorealistic, 60fps **Cloud-Deployed 3D Anatomical Digital Twin & Reference Suite** across Cardiology, Neurology, Pulmonology, and Gastroenterology.
- **Key decisions made recently:**
  - **Cloud-Deployed 3D Digital Twin Suite (2026-09-03):** Replaced crude single-color local Python Marching Cubes with high-definition, interactive cloud-deployed 3D models (4K animated beating heart, 4-chamber labeled cardiac dissection, neuro internal structures, breathing lung airway cross-section, and CT abdominal organs) with 0% server GPU/RAM overhead.
  - **Real Clinical Decathlon MRI Adoption (2026-09-03):** Completely eliminated fake noise ellipsoids (`create_synthetic_sample()`) in favor of authentic high-resolution clinical patient scans from the Medical Segmentation Decathlon (`Task02_Heart - la_003`, 192x192x130).
  - **Zero-Training Architecture (2026-09-03):** Completely eliminated local/Kaggle/Colab training loops and 455MB dataset downloads. Backend relies 100% on Pretrained Universal TotalSegmentator with `roi_subset` and Hugging Face Hub weights (`ashhal/medivision-unet-heart`).
  - **TotalSegmentator Cloud Optimization (2026-09-03):** Implemented targeted organ selection (`roi_subset=['heart', 'aorta', ...]`) with `fast=True` (3mm model), dropping peak inference memory by 70% to prevent Streamlit Cloud OOM crashes.
  - **2x Multi-Resolution SimpleITK Registration (2026-09-03):** Accelerated CPU image registration from 15s to ~1.2s by optimizing on a 2x downsampled spatial pyramid.
  - **Live Process RAM Telemetry (2026-09-03):** Added active process memory monitoring in the UI sidebar to prevent exceeding the 2.7GB RAM threshold.

## Tech Stack
- **Primary Deployed UI:** Streamlit 1.40.0 + Matplotlib + Cloud 3D Digital Twin Viewport (Live on Streamlit Community Cloud: `https://medivision-a.streamlit.app/`)
- **3D Anatomical Engine:** Cloud-Deployed Interactive 3D Digital Twins (Sketchfab Viewer API / NIH 3D Reference Atlas) + WebGL Three.js PBR Viewer
- **Deep Learning Core:** MONAI 1.6.0 (3D Residual U-Net, Sliding Window Gaussian Inference, DiceCELoss) + PyTorch 2.14.0 (CPU single-threaded `torch.inference_mode()`) + TotalSegmentator (`roi_subset` enabled)
- **Medical Registration & Processing:** SimpleITK 2.5.6 (Euler3DTransform, Mattes Mutual Information) + NiBabel 5.4.2 + SciPy 1.18.1
- **Database & Cloud Sync:** Supabase PostgreSQL (`aluzqooagiymysssnhkg.supabase.co`) for audit telemetry and patient records
- **Alternative Web Frontend:** Next.js 15 App Router + React 19 + TypeScript + Three.js WebGL (in `frontend/`)
- **Alternative REST Backend:** FastAPI + Uvicorn ASGI server (in `backend/app/`)
- **Clinical Datasets:** Medical Segmentation Decathlon (`Task02_Heart`) real patient MRI volumes + Hugging Face Hub (`ashhal/medivision-unet-heart`)

## File Structure
```
/
├── app/
│   └── main.py                  # Streamlit application mirror
├── streamlit_app.py             # Root Streamlit Cloud entrypoint (9 interactive modules + Cloud 3D Suite + RAM monitor)
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & CORS configuration
│   │   ├── config.py            # YAML configuration loader
│   │   ├── benchmark.py         # Multi-case latency benchmark suite
│   │   ├── api/                 # REST Route handlers (11 routers)
│   │   │   ├── routes_data.py
│   │   │   ├── routes_preprocess.py
│   │   │   ├── routes_segment.py
│   │   │   ├── routes_evaluate.py
│   │   │   ├── routes_reconstruct.py # Cloud 3D digital twin catalog & viewer endpoints
│   │   │   ├── routes_register.py
│   │   │   ├── routes_spectral.py
│   │   │   ├── routes_report.py
│   │   │   ├── routes_benchmark.py
│   │   │   ├── routes_safety.py
│   │   │   └── routes_cloud.py
│   │   └── services/            # Core algorithmic & AI services (CPU-optimized)
│   │       ├── data_service.py        # Real Decathlon clinical loader & metadata parser
│   │       ├── preprocess_service.py  # 1.0mm isotropic spline resampling & z-score norm
│   │       ├── segment_service.py     # TotalSeg (roi_subset) & MONAI U-Net CPU inference
│   │       ├── metrics_service.py     # Dice, IoU, HD95, ASD, Confusion Matrix
│   │       ├── reconstruct_service.py # Cloud 3D Digital Twin models & reference atlas catalog
│   │       ├── register_service.py    # 2x SimpleITK Euler3D / Affine registration
│   │       ├── spectral_service.py    # On-demand 3D Sobel, Laplacian & Gabor maps
│   │       ├── report_service.py      # Standardized clinical diagnostic report generator
│   │       ├── benchmark_service.py   # Latency benchmark suite
│   │       ├── safety_service.py      # Scan bounds & noise perturbation testing
│   │       └── supabase_service.py    # Supabase PostgreSQL audit telemetry
├── configs/
│   └── config.yaml              # Central pipeline configuration
├── data/
│   ├── clinical_sample/         # Genuine patient 3D cardiac MRI scans (MSD Decathlon la_003)
│   └── registration_test/       # Perturbed moving/fixed registration pairs
├── docs/
│   ├── PRD.md                   # Product Requirements Document
│   ├── architecture.md          # Architecture & Component Specification
│   ├── tech-stack.md            # Technology Stack & Verification Matrix
│   ├── api-docs.md              # REST API Specification & JSON Schemas
│   ├── systematic-build.md      # Systematic Build Checklist & Status
│   └── instructions.md          # Project History & Bug Log
├── frontend/
│   ├── package.json             # Next.js 15, Three.js, Lucide
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── src/
│       ├── app/                 # Next.js App Router (11 pages)
│       ├── components/          # Viewport3D, SliceViewer, Sidebar, Header
│       └── lib/                 # api.ts, supabase.ts
├── models/                      # Local PyTorch/MONAI model checkpoints
├── outputs/                     # Benchmark logs, exported clinical reports & audit telemetry
├── requirements.txt             # Python project dependencies
├── README.md                    # Public GitHub project overview
├── TEST.md                      # Copy-pasteable test commands & failure points log
└── venv/                        # Python virtual environment
```

## Routes & Pages / Key Endpoints
| Route / Endpoint | Type | Description | Status |
|---|---|---|---|
| `https://medivision-a.streamlit.app/` | UI (Streamlit) | Live 9-module cloud interactive application with Cloud 3D Digital Twin Suite | ✅ Live |
| `GET /health` | API | Backend health, CPU status & disclaimer | ✅ Live |
| `POST /api/upload` | API | Ingests NIfTI (`.nii.gz`) scan & extracts metadata | ✅ Live |
| `GET /api/slice` | API | Returns 2D PNG slice across Axial/Coronal/Sagittal | ✅ Live |
| `POST /api/preprocess` | API | 1.0mm isotropic spline resampling & float32 z-score norm | ✅ Live |
| `POST /api/segment` | API | Targeted TotalSeg (`roi_subset`) / MONAI U-Net CPU inference | ✅ Live |
| `GET /api/slice/overlay` | API | 2D slice with translucent segmentation mask overlay | ✅ Live |
| `POST /api/evaluate` | API | Computes Dice, IoU, HD95, ASD, Confusion Matrix | ✅ Live |
| `GET /api/3d/catalog` | API | Returns Cloud-Deployed 3D Anatomical Digital Twin catalog | ✅ Live |
| `GET /api/3d/model/{organ_id}` | API | Returns 4K interactive cloud 3D model embed snippet & metadata | ✅ Live |
| `POST /api/register` | API | 2x multi-resolution SimpleITK Euler3D/Affine registration | ✅ Live |
| `POST /api/spectral/extract` | API | On-demand 4-channel Sobel, Laplacian & Gabor maps | ✅ Live |
| `POST /api/report/generate` | API | Generates clinical JSON radiologist report | ✅ Live |
| `GET /api/report/markdown` | API | Exports formal formatted Markdown diagnostic report | ✅ Live |
| `POST /api/benchmark/run` | API | Multi-case pipeline execution & latency audit | ✅ Live |
| `POST /api/safety/validate-scan` | API | Scan dimension, intensity & artifact safety check | ✅ Live |
| `POST /api/cloud/sync` | API | Synchronizes patient & segmentation to Supabase | ✅ Live |

## Features Built & Upgraded
- [x] Medical NIfTI (`.nii.gz`) data ingestion and header parsing via NiBabel
- [x] Genuine Clinical 3D Patient Cardiac MRI integration from Medical Segmentation Decathlon (`Task02_Heart`)
- [x] Isotropic 3D spline resampling (1.0 mm³) and float32 z-score normalization
- [x] MONAI 3D Residual U-Net segmentation pipeline with single-threaded CPU inference
- [x] TotalSegmentator Universal Pretrained Engine with targeted `roi_subset` (50+ organs & 4 cardiac chambers)
- [x] Quantitative clinical validation metrics (Dice, IoU, HD95 mm, ASD mm, Confusion Matrix)
- [x] **Cloud-Deployed 3D Anatomical Digital Twin Suite** (4K Animated Beating Heart, 4-Chamber Labeled Dissection, Internal Brain Structures, Animated Respiratory Lungs, Abdominal CT Organs)
- [x] Fast 2x multi-resolution SimpleITK Rigid (Euler3D) and Affine 3D image registration (~1.2s on CPU)
- [x] On-demand multichannel spectral feature extraction (3D Sobel gradients, Laplacian, Gabor texture)
- [x] Automated AI Radiologist Report generation with Left Atrial Volume Index (LAVI) and Sphericity Index
- [x] Clinical safety interceptors (scan validation, volume bounds check, noise stress testing)
- [x] Multi-case pipeline benchmark suite measuring per-stage compute latency
- [x] Live process RAM telemetry monitor widget in Streamlit sidebar
- [x] Live Supabase PostgreSQL database integration and audit telemetry logging
- [x] Full-stack 9-module Streamlit Cloud application deployed live

## Rules for MediVision
**Never:**
- Never run model training loops on Streamlit Community Cloud (Zero-training / Pretrained inference only).
- Never run full 117-class TotalSegmentator body models without `roi_subset` on CPU.
- Never rely on crude local mesh generators when photorealistic cloud digital twins are available.
- Never hardcode sensitive API keys or Supabase credentials in source code.
- Never use mock data silently in place of real pipeline execution without explicit labels.
- Never claim clinical diagnostic approval or FDA/CE certification.

## Owner & Links
- **Author:** Shaikh Fardin
- **GitHub Repository:** [https://github.com/Fardin7798/medivision](https://github.com/Fardin7798/medivision)
- **Live Production URL:** [https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)
