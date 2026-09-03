# Product Requirements Document (PRD)
## MediVision — 3D Medical Image AI Segmentation, Registration & Navigation System

> Fill this in from the user's idea before writing any code. This is Step 1 of starting a new project — see `instructions.md`.

> ⚠️ **MANDATORY MEDICAL SAFETY DISCLAIMER**
> MediVision is a **research and educational prototype only**. It is **NOT** a certified clinical diagnostic system, medical device, or surgical navigation guidance system (no FDA 510(k), CE-IVD, or MDR certification). It must **never** be used for clinical decision-making, patient diagnosis, or real surgical care.

---

## 1. Overview

### 1.1 Purpose
MediVision is an end-to-end full-stack medical AI platform designed for volumetric anatomical segmentation, quantitative clinical metric evaluation, 3D interactive mesh reconstruction, multi-resolution spatial registration, and simulated surgical navigation. It provides researchers, biomedical engineers, and medical educators with a unified, browser-accessible environment optimized for single-vCPU / 2.7GB RAM cloud hosting (Streamlit Community Cloud).

### 1.2 Problem Statement
Clinical 3D imaging AI research currently relies on fragmented, expensive software suites or heavyweight GPU workstations. Existing open-source tools frequently crash on constrained cloud environments due to unoptimized 3D tensor allocations, full-body ensemble inference spikes, and slow mesh serializers. MediVision solves this by engineering a lightweight, CPU-optimized backend with targeted anatomical sub-model inference (`roi_subset`), vectorized binary mesh exporters, and real-time memory telemetry.

### 1.3 Goals
- Provide zero-shot 3D anatomical segmentation using a dual-engine architecture: TotalSegmentator with targeted organ selection (`roi_subset`) and MONAI 3D Residual U-Net (Hugging Face Hub weights).
- Enforce strict Streamlit Community Cloud runtime compliance (peak memory < 1.8GB, well below the 2.7GB hard cap).
- Implement standard 1.0mm isotropic spline resampling and intensity z-score normalization.
- Compute quantitative clinical validation metrics (Dice Similarity Coefficient, IoU Jaccard Index, 95% Hausdorff Distance, Average Surface Distance, and Confusion Matrix).
- Extract 3D polygonal surface meshes using Marching Cubes, compute surface area in $cm^2$, and provide 1-click ultra-fast Vectorized Binary STL CAD export (3D-printing ready) and Wavefront OBJ WebGL export.
- Execute 2x multi-resolution rigid 6-DOF (Euler3D) and 12-DOF affine 3D image registration using SimpleITK with Mattes Mutual Information (converging in < 2 seconds on CPU).
- Extract on-demand 4-channel spectral spatial features (3D Sobel gradients, Laplacian curvature, Gabor texture).
- Generate structured AI Radiologist Diagnostic Reports with Left Atrial Enlargement (LAE) grading and printable Markdown formatting.
- Implement clinical safety interceptors, anomaly volume detection, and synthetic noise stress testing.
- Display real-time RAM usage telemetry in the UI sidebar (`RAM: XXX MB / 2700 MB`) with defensive memory cleanup.
- Connect to live Supabase PostgreSQL cloud database for patient audit telemetry.

### 1.4 Non-Goals
- Local or cloud-based model training loops (all training pipelines removed; system relies strictly on pretrained zero-shot inference).
- Hardware integration with optical/electromagnetic surgical tracking hardware (e.g., NDI Polaris).
- Real-time intra-operative live video streaming.
- Legally binding clinical diagnosis or replacing licensed radiologist interpretation.

---

## 2. Target Users
- **Biomedical & AI Researchers:** Prototyping volumetric deep learning, feature extraction, and registration algorithms.
- **Medical Students & Educators:** Interactively exploring 3D anatomical structures, spatial orientations, and AI segmentation predictions in real-time.
- **Healthcare AI Engineers:** Utilizing a clean, production-grade reference architecture for CPU-optimized MONAI, SimpleITK, Three.js, and Streamlit.

---

## 3. Key Features

### 3.1 Volumetric Medical Ingestion & Synchronized MPR Slicer
Supports loading 3D NIfTI (`.nii`, `.nii.gz`) and DICOM volumes with metadata extraction (voxel dimensions, spatial affine matrix, intensity statistics) and real-time synchronized Multi-Planar Reconstruction (MPR) scrubbing across Axial, Coronal, and Sagittal planes.

### 3.2 Dual-Engine 3D AI Segmentation (CPU & Cloud Optimized)
- **Engine 1 (TotalSegmentator Pretrained Universal):** Targeted organ selection (`roi_subset`) for 50+ anatomical organs and 4 cardiac chambers (LA, LV, RA, RV, Myocardium, Aorta, Pulmonary Artery) with `fast=True` 3mm low-memory execution.
- **Engine 2 (MONAI 3D Residual U-Net):** Sliding-window Gaussian patch inference with `sw_batch_size=1`, `torch.inference_mode()`, and single-thread CPU execution.

### 3.3 Quantitative Clinical Validation & Biomarkers
Automated computation of Dice Similarity Coefficient (DSC), Intersection-over-Union (IoU), 95% Hausdorff Distance (HD95 mm), Average Surface Distance (ASD mm), Sensitivity/Recall, Specificity, and 2x2 Confusion Matrices.

### 3.4 Vectorized 3D Surface Reconstruction & Binary STL CAD Export
Sub-voxel Marching Cubes polygonal mesh extraction, anatomical surface area ($cm^2$) computation, pure C-memory NumPy structured array Binary STL export (100x speedup), and Wavefront OBJ export for Three.js WebGL rendering.

### 3.5 Fast Multi-Resolution SimpleITK 3D Image Registration
2x downsampled multi-resolution Gaussian pyramid rigid 6-DOF Euler3D and Affine spatial alignment using Mattes Mutual Information and Regular Step Gradient Descent optimizer (converges in ~1.2s on CPU).

### 3.6 On-Demand Multichannel Spectral Feature Extraction
Memory-efficient on-demand 3D Sobel spatial gradients ($\|\nabla I\|$), Laplacian second-derivative curvature, and Gabor texture energy filters.

### 3.7 AI Radiologist Diagnostic Report Generator
Computes left atrial volume ($cm^3$) and 3D sphericity index to classify Left Atrial Enlargement (LAE Grade: Normal, Mild, Moderate, Severe) with formal printable Markdown report export.

### 3.8 Clinical Safety Interceptors & Adversarial QA Audits
Pre-inference input validation (intensity sanity, dimension check, zero-variance artifact detection), segmentation volume anomaly boundary checking, and Gaussian noise stress testing.

### 3.9 Live RAM Telemetry & Memory Hygiene
Real-time process memory monitor rendered in the Streamlit sidebar with automated garbage collection (`gc.collect()`) upon tab switching or file ingestion.

### 3.10 Supabase Cloud Database Integration & Telemetry
Stores patient records, scan metadata, segmentation metrics, and execution history in a persistent Supabase PostgreSQL database.

---

## 4. User Stories
- **As a researcher**, I want to upload a 3D cardiac MRI scan, so that I can automatically segment specific organs (e.g. left ventricle, aorta) in seconds without crashing the 2.7GB cloud runtime.
- **As a medical educator**, I want to instantly download an accurate 3D binary STL CAD model, so that I can 3D print physical anatomical models for student training.
- **As a clinician**, I want to spatially register patient scans against a canonical atlas, so that I can inspect misalignment parameters within 2 seconds.
- **As a developer**, I want to monitor live memory consumption in the UI sidebar, so that I have complete visibility into RAM utilization.

---

## 5. Technical Requirements

### 5.1 Data Sources / External Dependencies
- **Hugging Face Hub:** Checkpoint repository (`ashhal/medivision-unet-heart`) for automated PyTorch model weight distribution.
- **TotalSegmentator Pretrained Models:** Downloaded on-demand via `totalsegmentator` Python API with `roi_subset` targeting.
- **Supabase Cloud Database:** PostgreSQL database instance (`aluzqooagiymysssnhkg.supabase.co`) for audit telemetry.

### 5.2 Architecture
Decoupled multi-tier system with FastAPI backend service (`backend/app/`), Streamlit Cloud application (`streamlit_app.py`), Next.js 15 WebGL client (`frontend/`), and Supabase database. Detailed in `docs/architecture.md`.

### 5.3 Tech Stack
Python 3.12, PyTorch 2.14, MONAI 1.6, TotalSegmentator, SimpleITK 2.5, NiBabel 5.4, scikit-image 0.26, FastAPI, Streamlit, Next.js 15, Three.js, and TypeScript. Detailed in `docs/tech-stack.md`.

### 5.4 Hardware / Infra Constraints
- **Primary Live Target:** Streamlit Community Cloud (2.7 GB RAM limit, single-vCPU environment). Enforces single-threaded execution (`OMP_NUM_THREADS=1`, `torch.set_num_threads(1)`) and targeted sub-model execution.
- **Local / On-Premise:** Supports both CPU-only execution and NVIDIA CUDA GPU hardware acceleration.

### 5.5 API Access Requirements
- Supabase API credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) managed via environment variables.

---

## 6. Success Metrics
- Zero Out-Of-Memory (OOM) crashes on Streamlit Community Cloud (< 1.8GB peak RAM).
- Fast 3D binary STL export in < 10ms for meshes up to 200,000 faces.
- SimpleITK registration convergence < 2.0 seconds on standard CPU.
- 100% automated test suite pass rate across all 23 REST API endpoints.

---

## 7. Scope & Milestones (suggested)
- **Phase 0 — Specification & Architecture:** Complete PRD, architecture specs, and API contracts. *(Completed)*
- **Phase 1 — Ingestion & Preprocessing:** Spline resampling, normalization, synthetic generator. *(Completed)*
- **Phase 2 — Dual-Engine AI Segmentation:** TotalSegmentator with `roi_subset` + MONAI 3D Residual U-Net. *(Completed)*
- **Phase 3 — Clinical Metrics & Vectorized STL:** Dice/HD95 computation and NumPy binary STL export. *(Completed)*
- **Phase 4 — Fast Registration & Spectral Filters:** SimpleITK 2x multi-resolution and on-demand Gabor extraction. *(Completed)*
- **Phase 5 — Clinical Reports & Safety QA:** LAE classification, RAM telemetry, and adversarial interceptors. *(Completed)*
- **Phase 6 — Cloud Database & Deployment:** Supabase PostgreSQL sync and Streamlit Cloud live launch. *(Completed)*

---

## 8. Risks & Limitations
- **Memory Spikes during High-Res Inference:** Mitigated via `roi_subset`, `sw_batch_size=1`, and single-threaded CPU configuration.
- **Non-Clinical Research Status:** Clear visual disclaimers rendered across all frontend views and API outputs.

---

## 9. Open Questions
- *Resolved:* How to eliminate Colab/Kaggle training dependencies completely? $\rightarrow$ Migrated 100% to Pretrained Universal TotalSegmentator and Hugging Face weights.
- *Resolved:* How to prevent Streamlit Cloud 2.7GB RAM crashes? $\rightarrow$ Implemented `roi_subset` targeted segmentation, single-threaded PyTorch, and active RAM telemetry.
