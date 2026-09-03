# MediVision — 3D Medical Image AI Segmentation, Registration & Navigation System

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![MONAI](https://img.shields.io/badge/MONAI-1.6.0-green.svg)](https://project-monai.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-orange.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> ⚠️ **MEDICAL SAFETY DISCLAIMER**
> MediVision is a **research and educational prototype only**. It is **NOT** a certified clinical diagnostic system, medical device, or surgical navigation guidance system. It must **never** be used for clinical decision-making or real patient care.

---

## 🌟 Overview

**MediVision** is an end-to-end full-stack medical AI platform designed for volumetric anatomical segmentation, clinical metric evaluation, 3D interactive mesh generation, and simulated surgical navigation.

- **Backend:** Python FastAPI, MONAI 1.6, PyTorch 2.14, SimpleITK 2.5, NiBabel 5.4, scikit-image 0.26.
- **Frontend:** Next.js 15 App Router, React 18, TypeScript, Three.js 60fps WebGL 3D Viewport, Lucide Icons, Dark-Mode Glassmorphism.

---

## 🚀 Key Features

1. **Medical Image Ingestion:** Volumetric NIfTI (`.nii`, `.nii.gz`) and DICOM loader with metadata parsing.
2. **Preprocessing Pipeline:** Isotropic 3D spline resampling (`(1.0, 1.0, 1.0) mm`), intensity percentile windowing, and z-score normalization.
3. **3D Deep Learning Segmentation:** 3D Residual U-Net trained on the Medical Segmentation Decathlon (MSD Task02_Heart) with sliding-window Gaussian inference.
4. **Quantitative Clinical Evaluation:** Computes Dice Similarity Coefficient (DSC), Intersection-over-Union (Jaccard Index), 95% Hausdorff Distance (HD95), Average Surface Distance (ASD), and confusion matrices.
5. **3D Surface Mesh Reconstruction:** Sub-voxel Marching Cubes surface extraction, surface area ($cm^2$) integration, and 1-click binary **STL** CAD export (3D-printing ready).
6. **Simulated Surgical Navigation:** Synchronized 2D Multi-Planar Reconstruction (MPR) slice viewer with live segmentation overlays and 3D WebGL anatomical models.

---

## 🛠️ Quick Start

### 1. Backend Setup (FastAPI)

```bash
# Clone the repository
git clone https://github.com/Fardin7798/medivision.git
cd medivision

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on port 8000)
uvicorn backend.app.main:app --port 8000 --reload
```

### 2. Frontend Setup (Next.js)

```bash
# In a new terminal
cd medivision/frontend

# Install dependencies
npm install

# Start Next.js development server (runs on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

```bash
# Run data ingestion test
python3 -m backend.app.services.data_service

# Run preprocessing test
python3 -m backend.app.services.preprocess_service

# Run 3D U-Net inference test
python3 -m backend.app.services.segment_service

# Run quantitative evaluation test
python3 -m backend.app.services.metrics_service

# Run Marching Cubes and STL export test
python3 -m backend.app.services.reconstruct_service
```

---

## 📚 Project Documentation

- [Product Requirements Document (PRD)](docs/PRD.md)
- [System Architecture Specification](docs/architecture.md)
- [Technology Matrix](docs/tech-stack.md)
- [REST API Documentation](docs/api-docs.md)
- [Systematic Build Tracking](docs/systematic-build.md)
- [Project Instructions & Protocol](docs/instructions.md)
- [Living Test Reference (TEST.md)](TEST.md)

---

## 📄 License
This project is open-source under the MIT License.
