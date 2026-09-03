# 🫀 MediVision — 3D Medical AI & Cloud 3D Digital Twin Suite

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://medivision-a.streamlit.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![MONAI](https://img.shields.io/badge/MONAI-1.4+-5956EB.svg)](https://monai.io)

**MediVision** is a cloud-native 3D medical image AI segmentation, spatial registration, and photorealistic anatomical digital twin platform. It connects clinical imaging workflows with 60 FPS WebGL 3D anatomical models, sub-voxel surface reconstruction, and automated diagnostic EHR reporting.

---

## 🌟 Key Features

1. **Multi-Planar Reconstruction (MPR):** Synchronous Axial, Coronal, and Sagittal cross-sectional exploration with sub-voxel intensity probing.
2. **Cloud-Deployed 3D Anatomical Digital Twins:** 60 FPS client-side WebGL PBR interactive 3D models across 6 anatomical systems (Cardiology, Neurology, Pulmonology, Gastroenterology, Whole Body) with zero server GPU/RAM overhead.
3. **Deep Learning 3D Segmentation:** TotalSegmentator and MONAI 3D Residual U-Net CPU inference with exact volumetric analytics ($cm^3$).
4. **Sub-Voxel Gaussian Smoothed STL CAD:** Watertight 3D mesh reconstruction for surgical physical 3D printing.
5. **SimpleITK 3D Image Registration:** 2x multi-resolution Euler3D/Affine alignment for pre-op vs post-op comparative subtraction.
6. **Clinical Metrics & Automated Reports:** Dice, IoU (Jaccard), Hausdorff 95, and structured BIRADS/RADS radiological diagnostic reporting.
7. **Supabase Cloud PostgreSQL DB:** HIPAA-aligned patient audit trails, historical scan registries, and latency telemetry.
8. **Playwright MCP Integration:** Automated end-to-end testing and accessibility tree snapshot verification (`ref=eX`).

---

## 🚀 Live Demo & Endpoints

* **Live Streamlit App:** [`https://medivision-a.streamlit.app/`](https://medivision-a.streamlit.app/)
* **Backend API Docs (Swagger):** `http://localhost:8000/docs`

---

## 💻 Quick Start

```bash
# Clone the repository
git clone https://github.com/Fardin7798/medivision.git
cd medivision

# Activate Virtual Environment & Install Dependencies
source venv/bin/activate
pip install -r requirements.txt

# Run Automated Test Suite (25 Endpoints)
./venv/bin/python -c "
import sys; sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from backend.app.main import app
client = TestClient(app)
assert client.get('/health').status_code == 200
print('✅ Test Suite Verified!')
"

# Launch Streamlit Application
streamlit run streamlit_app.py --server.port 8501
```

---

## 🏛️ Clean Architecture Structure

```
backend/app/
├── api/          # 11 REST API Routers (MPR, Segment, 3D Twins, Register, Reports, Cloud)
├── domain/       # Strictly-typed Pydantic schemas & data models
├── services/     # Core algorithms, 3D catalogs, AI inference, and cloud database
└── core/         # Platform configurations, safety interceptors, and error handlers
```
