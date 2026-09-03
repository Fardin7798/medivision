# CONTEXT.md — MediVision Project Context

> **Last Updated:** September 3, 2026 — Milestone 9 (Cloud-Native AI Architecture, BioDigital/Sketchfab 3D Digital Twins, Clean Domain Schemas & Playwright MCP)

---

## 1. Project Identity & Clinical Vision

**MediVision** is a cloud-native 3D medical image AI segmentation, registration, and anatomical digital twin platform. It provides an end-to-end clinical workflow connecting radiologists, surgeons, and healthcare institutions with AI-driven volumetric analytics and photorealistic 3D anatomical models.

### Primary Objectives:
1. **Interactive Multi-Planar Reconstruction (MPR):** Synchronous Axial, Coronal, and Sagittal orthogonal cross-sectional exploration of volumetric NIfTI/DICOM scans.
2. **Cloud-Deployed 3D Anatomical Digital Twins:** 60 FPS client-side WebGL PBR interactive 3D anatomy models (BioDigital Human & Sketchfab Cloud infrastructure) with zero server GPU/RAM overhead (<10MB footprint).
3. **Deep Learning Segmentation & Validation:** Quantitative anatomical volume metrics ($cm^3$), Dice similarity, IoU (Jaccard), and Hausdorff 95 distance ($mm$) aligned with ground truth.
4. **Multimodal Clinical Diagnostic Reporting:** Automated structured radiological findings (BIRADS/RADS compliant) with diagnostic impressions and recommendation matrices.
5. **Multi-Resolution 3D Image Registration:** Fast 2-level Euler3D and Affine spatial alignment for longitudinal Pre/Post-Op comparative analysis.
6. **Supabase Cloud PostgreSQL & Telemetry:** Full HIPAA-aligned audit trails, patient scan histories, and execution latency benchmarks.

---

## 2. Technical Stack & Clean Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **API Gateway / Backend** | FastAPI + Pydantic v2 | Clean layered architecture (Domain Schemas $\rightarrow$ Services $\rightarrow$ API Routers) |
| **Deep Learning Inference** | MONAI + PyTorch + TotalSegmentator | CPU-optimized volumetric neural network inference (`OMP_NUM_THREADS=1`) |
| **Medical Image Processing** | SimpleITK + NiBabel + SciPy | 3D spline interpolation, intensity normalization, Euler3D registration |
| **3D Anatomical Viewport** | WebGL + BioDigital / Sketchfab Embed API | 60 FPS interactive PBR 3D anatomical digital twins with organ dissection |
| **Cloud Database & Audit** | Supabase Cloud (PostgreSQL) | Persistent patient registries, telemetry, and segmentation audit logs |
| **Testing & E2E Automation** | Playwright MCP + Pytest | Automated accessibility snapshots (`ref=eX`), smoke tests, and UI verification |
| **Deployment Targets** | Streamlit Cloud & Vercel (Next.js 15) | Live application deployment (`https://medivision-a.streamlit.app/`) |

---

## 3. Directory Layout (Clean Architecture)

```
Project 3/
├── backend/
│   └── app/
│       ├── api/               # Presentation / REST API Routers
│       │   ├── routes_data.py         # DICOM/NIfTI Ingestion & MPR Slices
│       │   ├── routes_preprocess.py   # 3D Spline Resampling
│       │   ├── routes_segment.py      # MONAI & TotalSegmentator 3D Inference
│       │   ├── routes_reconstruct.py  # Cloud 3D Digital Twin Catalog & STL CAD
│       │   ├── routes_register.py     # SimpleITK Euler3D/Affine Registration
│       │   ├── routes_evaluate.py     # Clinical Metrics (Dice, IoU, HD95, ASD)
│       │   ├── routes_spectral.py     # Multi-Parametric Tissue Gradients
│       │   ├── routes_report.py       # AI Clinical Diagnostic Reporting
│       │   ├── routes_benchmark.py    # Pipeline Latency Benchmarking
│       │   ├── routes_safety.py       # Quality Interceptors & Stress Testing
│       │   └── routes_cloud.py        # Supabase Cloud PostgreSQL Sync
│       ├── domain/            # Domain Entities & Data Contracts
│       │   └── schemas.py             # Pydantic request/response schemas
│       ├── services/          # Business Logic & Core Algorithms
│       │   ├── reconstruct_service.py # Cloud 3D Catalog & Smoothed Surfaces
│       │   ├── data_service.py        # Decathlon MRI Ingestion & HF Hub Fallback
│       │   ├── segment_service.py     # AI Segmentation Core
│       │   ├── metrics_service.py     # Shape-Aligned Validation Service
│       │   ├── register_service.py    # Spatial Registration Engine
│       │   ├── report_service.py      # Diagnostic Report Generator
│       │   └── supabase_service.py    # Cloud Database Operations
│       ├── core/              # Global Configurations & Interceptors
│       └── main.py            # FastAPI Application Root
├── streamlit_app.py           # Streamlit Live Application Entrypoint
├── app/main.py                # Mirror Entrypoint for Streamlit Cloud
├── data/                      # Clinical Sample Scans (Decathlon Task02_Heart)
├── configs/                   # YAML Runtime Configurations
├── docs/                      # PRD, Architecture, and Instructions Docs
├── TEST.md                    # Automated Test Commands & Smoke Harness
└── README.md                  # Project Overview & Architecture Guide
```

---

## 4. Key Milestones Completed

- **Milestone 1-4:** Core data ingestion, 3D spline preprocessing, MONAI U-Net segmentation, and SimpleITK registration.
- **Milestone 5-7:** Multi-parametric spectral analysis, AI diagnostic report generator, and Supabase Cloud database integration.
- **Milestone 8:** Cloud-Deployed 3D Anatomical Digital Twin Suite (6 organ systems) and genuine Medical Segmentation Decathlon clinical cardiac MRI dataset integration.
- **Milestone 9:** Clean Domain-Driven Architecture (Pydantic Schemas), full cleanup of heavy local test files (~400MB saved), and Playwright MCP browser automation integration.
