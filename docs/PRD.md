# Product Requirements Document (PRD)
## MediVision — 3D Medical Image AI Segmentation, Registration & Navigation System

> **Status:** Stage 1 Specification Complete. Implementation details and live statuses are maintained in `docs/architecture.md`, `docs/tech-stack.md`, and `CONTEXT.md`.

> ⚠️ **CRITICAL MEDICAL SAFETY DISCLAIMER**
> MediVision is an **educational and research prototype only**. It is **NOT** a certified medical device, diagnostic tool, or clinical surgical navigation system (no FDA 510(k), CE-IVD, or MDR certification). It must **never** be used for clinical decision-making, patient diagnosis, surgery planning, or live surgical guidance.

---

## 1. Overview

### 1.1 Purpose
MediVision is an end-to-end, reproducible, open-source Python framework and interactive web/desktop application that processes 3D medical imaging scans (MRI/CT), performs automated anatomical segmentation using 3D deep learning (MONAI U-Net on MSD Task02_Heart), reconstructs anatomical structures into interactive 3D surface meshes (Marching Cubes + PyVista), executes rigid/affine multi-modal image registration (SimpleITK), and renders simulated surgical-navigation overlays accompanied by optional local Vision-Language Model (VLM) clinical summaries.

### 1.2 Problem Statement
Developing and experimenting with complete medical imaging AI workflows currently requires expensive proprietary clinical software suites (e.g., Mimics, 3D Slicer custom workstations) and fragmented developer tooling. Researchers, students, and ML engineers lack a lightweight, single-codebase pipeline that unifies volumetric preprocessing, deep learning segmentation, spectral multichannel feature experiments, 3D mesh rendering, and registration with an intuitive, zero-install browser interface.

### 1.3 Goals
- Deliver an automated 3D U-Net segmentation pipeline trained on public medical data (MSD Task02_Heart Left Atrium) achieving validation Dice coefficient > 0.70.
- Quantitatively evaluate whether augmenting standard MRI volumes with derived multichannel features (Sobel 3D spatial gradients, Laplacian edge filters, Gabor texture energy) enhances segmentation boundaries.
- Generate smoothed 3D surface meshes from volumetric binary masks and render them interactively inside a Streamlit web application with STL/OBJ export capabilities.
- Implement rigid and affine 3D image registration using SimpleITK to align patient scans to canonical anatomical atlases or pre-operative reference scans.
- Provide a simulated multi-planar surgical navigation visualization demonstrating real-time 2D cross-sectional slice tracking with 3D orientation markers.
- Provide a modular, fully documented codebase formatted for research proposals and portfolio review.

### 1.4 Non-Goals
- Hardware integration with optical/electromagnetic surgical tracking systems (e.g., NDI Polaris).
- Real-time intra-operative live imaging or low-latency video streaming.
- Multi-user authentication, patient billing, or cloud-hosted electronic health record (EHR) integrations.
- Replacing clinical radiologist interpretation or generating legally binding diagnostic reports.

---

## 2. Target Users
- **Biomedical Engineering & ML Researchers:** Prototyping novel volumetric segmentation, feature extraction, and registration algorithms.
- **Medical Students & Educators:** Visualizing 3D anatomical structures, spatial orientations, and AI segmentation predictions interactively.
- **Computer Vision & Healthcare AI Engineers:** Reviewing a clean, production-grade reference architecture for MONAI, SimpleITK, and PyVista integration.

---

## 3. Key Features

### 3.1 Medical Image Ingestion & Metadata Inspector
Accepts volumetric NIfTI (`.nii`, `.nii.gz`), DICOM series, and 2D medical formats (PNG/TIFF). Extracts and displays voxel dimensions, field-of-view (FOV), affine coordinate transform, and intensity histograms.

### 3.2 Medical Image Preprocessing Pipeline
Standardizes raw volumetric scans:
- Isotropic voxel resampling to `(1.0, 1.0, 1.0) mm` spacing.
- Intensity windowing / HU clipping (1st to 99th percentile contrast enhancement).
- Spatial padding, center cropping, and zero-mean unit-variance normalization.

### 3.3 3D U-Net Baseline Segmentation
Deep learning segmentation model built with MONAI and PyTorch:
- Architecture: 3D U-Net with residual encoder units and deep supervision.
- Loss Function: Composite `DiceCELoss` (Dice Loss + Cross-Entropy Loss).
- Sliding-window volumetric inference with Gaussian patch weighting to eliminate tile boundary artifacts.

### 3.4 Multichannel & Derived Spectral Feature Experiment
An experimental module evaluating whether feeding hand-crafted spatial filters alongside raw voxel intensities improves model convergence and edge delineation:
- Channel 0: Normalized voxel intensity.
- Channel 1: 3D Sobel spatial gradient magnitude (structural boundaries).
- Channel 2: 3D Laplacian / Hessian eigenvalues (curvature and ridges).
- Channel 3: Local Gabor texture frequency filter.

### 3.5 Quantitative Evaluation Suite
Computes clinical segmentation metrics comparing predicted masks to ground truth:
- Volumetric Overlap: Dice Similarity Coefficient (DSC), Intersection-over-Union (IoU / Jaccard Index).
- Boundary Precision: 95th percentile Hausdorff Distance (HD95), Average Surface Distance (ASD).
- Classification Metrics: Sensitivity (Recall), Specificity, Precision.

### 3.6 3D Surface Mesh Reconstruction & STL Export
Converts binary segmentation masks into high-fidelity 3D polygonal surface meshes:
- Applies scikit-image Marching Cubes algorithm with sub-voxel vertex interpolation.
- Performs Laplacian surface smoothing and decimation to produce clean CAD-ready geometries.
- Exporters: Direct download of `.stl` (3D printing) and `.obj` formats.

### 3.7 Medical Image Registration (SimpleITK)
Aligns moving patient scans to a canonical fixed atlas or prior baseline scan:
- Transform Models: `Euler3DTransform` (6 DOF rigid) and `AffineTransform` (12 DOF).
- Metric: Mattes Mutual Information or Normalized Correlation.
- Optimizer: Regular Step Gradient Descent with multi-resolution Gaussian pyramid.

### 3.8 Simulated Surgical Navigation Visualization
Renders a simulated intra-operative navigation interface:
- Multi-Planar Reconstruction (MPR): Synchronized Axial, Coronal, and Sagittal orthogonal cross-sections with segmentation overlays.
- 3D Virtual Tool Tracking: Interactive pointer tool positioned relative to reconstructed 3D anatomical meshes using embedded `stpyvista`.

### 3.9 Local Vision-Language Model (VLM) Clinical Report
Generates structured anatomical descriptions and quantitative metric summaries using local lightweight LLMs/VLMs without sending confidential patient scans to external commercial APIs.

### 3.10 Interactive Modern Next.js & Three.js Web Frontend
Clean, modern dark-mode Streamlit frontend organized into logical sequential stages (`01_upload` through `10_export`) with persistent session state.

---

## 4. User Stories
- **As a researcher**, I want to upload a patient NIfTI MRI scan and run automated 3D segmentation, so that I can inspect the predicted anatomical boundary in seconds.
- **As a biomechanical engineer**, I want to export the segmented organ geometry as an STL mesh, so that I can prepare anatomical models for 3D printing or finite-element analysis.
- **As an algorithmic researcher**, I want to compare validation Dice curves between the single-channel baseline and the 4-channel spectral U-Net, so that I can publish rigorous ablation findings.
- **As a surgical trainee**, I want to interactively move a crosshair across MPR slices and see the corresponding 3D tool position on the organ mesh, so that I can understand spatial registration in surgical navigation.

---

## 5. Technical Requirements

### 5.1 Data Sources / External Dependencies
- **Medical Segmentation Decathlon (MSD) Task02_Heart:** Public benchmark dataset containing 20 training and 10 testing mono-modal 3D MRI scans of the left atrium (`https://msd-for-monai.s3-us-west-2.amazonaws.com/Task02_Heart.tar`).
- **Hugging Face Hub:** Host for pre-trained U-Net weights and checkpoint versioning (`huggingface_hub`).

### 5.2 Architecture
Decoupled full-stack application (Next.js TypeScript Frontend + FastAPI Python Backend). Training is decoupled into Kaggle/Colab notebooks; inference, preprocessing, reconstruction, and UI are executed within a unified Streamlit runtime (see `docs/architecture.md`).

### 5.3 Tech Stack
Python 3.10+, PyTorch 2.14.0, MONAI 1.6.0, SimpleITK 2.5.6, NiBabel 5.4.2, scikit-image 0.26.0, Streamlit 1.40.0 (pinned), stpyvista 0.1.4 (pinned), PyVista (see `docs/tech-stack.md`).

### 5.4 Hardware / Infra Constraints
- **Inference & UI:** Runs on standard CPU or lightweight GPU (< 2.7GB RAM limit on Streamlit Community Cloud).
- **Training:** Executed on free-tier Kaggle GPU (30 hours/week, 16GB P100 / 32GB T4x2) or Google Colab (12h session max).

### 5.5 API Access Requirements
- Hugging Face Hub User Access Token (Fine-grained write scope for checkpoint publication; read-only/anonymous for public model download).

---

## 6. Success Metrics
- **Segmentation Accuracy:** Validation Mean Dice Similarity Coefficient > 0.70 on MSD Task02_Heart Left Atrium.
- **Reconstruction Quality:** Marching Cubes produces manifold, watertight STL meshes with zero self-intersecting degenerate faces.
- **Registration Accuracy:** Target Registration Error (TRE) < 3.0 mm on synthetic rigid transformation tests.
- **UI Responsiveness:** 3D PyVista viewport renders with interactive frame rates (> 20 FPS) on standard client browsers.

---

## 7. Scope & Milestones (suggested)
- **Phase 1:** Dataset Ingestion & Preprocessing Pipeline (`src/data.py`, `src/preprocess.py`).
- **Phase 2:** Baseline 3D U-Net Training & Checkpoint Export (`src/segment.py`).
- **Phase 3:** Evaluation & Validation Metrics Suite (`src/metrics.py`).
- **Phase 4:** 3D Surface Reconstruction & STL Export (`src/reconstruct.py`).
- **Phase 5:** SimpleITK 3D Registration Pipeline (`src/register.py`).
- **Phase 6:** Multichannel Derived Feature Experiment (`src/spectral.py`).
- **Phase 7:** Local Clinical VLM Explanation Generator (`src/vlm.py`).
- **Phase 8:** Multi-Page Streamlit User Interface (`app/`).
- **Phase 9:** Live Streamlit Cloud Deployment & Final Project Delivery.

---

## 8. Risks & Limitations
- **Medical Disclaimer:** Strict limitation to non-clinical educational research.
- **Compute Constraints:** Colab GPU disconnects and session timeouts require robust epoch-level checkpointing on validation score improvement.
- **Streamlit / PyVista Rendering Incompatibilities:** Streamlit frontend architecture changes require strictly pinning `streamlit==1.40.0` and `stpyvista==0.1.4`.

---

## 9. Open Questions & Resolution Log
| # | Question / Uncertainty | Resolution / Decision |
|---|---|---|
| 1 | Should the backend be a standalone FastAPI service or embedded in Streamlit? | **Resolved (2026-09-02):** Embedded single-process Streamlit app. For a local/demo research prototype, FastAPI adds unnecessary networking overhead and duplicate data serialization. |
| 2 | Where should the application be deployed for free public access? | **Resolved (2026-09-03):** Streamlit Community Cloud (2.7GB RAM, 50GB storage). Render was dropped due to 512MB memory limit. Checkpoints stored on Hugging Face Hub to avoid Git LFS costs. |
| 3 | How to handle `stpyvista` incompatibility with recent Streamlit versions? | **Resolved (2026-09-03):** Pinned `streamlit==1.40.0` and `stpyvista==0.1.4` in `requirements.txt`. Verified working in clean venv. |
