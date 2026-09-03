# Tech Stack — MediVision

## Overview
MediVision is engineered as an enterprise-grade, decoupled full-stack medical imaging AI platform. It pairs a high-performance **Python FastAPI & MONAI/PyTorch** backend with a modern **Node.js (Next.js, TypeScript, Three.js)** frontend for interactive 3D anatomical visualization and simulated surgical navigation.

---

## 1. Data Sources (External APIs/Dependencies)

| Source | Data Provided | Cost | Verification Status | Notes |
|---|---|---|---|---|
| MSD Task02_Heart S3 Bucket | 3D Mono-modal Cardiac MRI volumes (`.nii.gz`) | Free / Public | ✅ Verified | Direct download URL `https://msd-for-monai.s3-us-west-2.amazonaws.com/Task02_Heart.tar` (455.7 MB) verified. |
| Hugging Face Hub | Checkpoint storage for trained U-Net models | Free | ✅ Verified | Python library `huggingface_hub==1.29.0` verified. Model weights (< 100MB) bypass Git LFS costs. |

---

## 2. Backend & Core Compute Frameworks

| Component | Technology | Version | Verification | Why |
|---|---|---|---|---|
| Web API Framework | FastAPI | **0.115.0+** | ✅ Verified | High-throughput asynchronous REST API framework with native Pydantic v2 data validation and OpenAPI docs. |
| ASGI Web Server | Uvicorn | **0.30.0+** | ✅ Verified | Production ASGI server supporting fast non-blocking I/O and streaming responses. |
| Deep Learning / Medical Framework | MONAI | **1.6.0** | ✅ Verified | Gold-standard healthcare imaging framework providing optimized 3D transforms, U-Net architectures, and loss functions. |
| Tensor Engine | PyTorch | **2.14.0** | ✅ Verified | Primary compute backend for MONAI; supports CUDA/CPU inference and automatic mixed precision (`torch.cuda.amp`). |
| Image Registration & Resampling | SimpleITK | **2.5.6** | ✅ Verified | Efficient C++ wrapped toolkit for medical image multi-resolution Euler3D/Affine registration and physical coordinate transforms. |
| NIfTI I/O | NiBabel | **5.4.2** | ✅ Verified | Standard library for reading and writing volumetric NIfTI `.nii.gz` file formats and spatial affine matrices. |
| 3D Surface Extraction | scikit-image | **0.26.0** | ✅ Verified | Fast Marching Cubes algorithm (`skimage.measure.marching_cubes`) for sub-voxel surface mesh generation. |
| Checkpoint Management | huggingface_hub | **1.29.0** | ✅ Verified | Programmatic weight downloading and version control. |

---

## 3. Frontend & Client-Side Visualization

| Component | Technology | Version | Verification | Why |
|---|---|---|---|---|
| Frontend Framework | Next.js (App Router) | **15.x / 14.x** | ✅ Verified | React server components, optimized client-side routing, and zero-config production bundling. |
| Language | TypeScript | **5.x** | ✅ Verified | End-to-end type safety for API requests, mesh structures, and coordinate transforms. |
| 3D WebGL Engine | Three.js | **0.170.0+** | ✅ Verified | Industry-standard WebGL 3D library for rendering interactive organ surface meshes, lighting, and virtual surgical instruments. |
| UI & Icons | Lucide React | **0.450.0+** | ✅ Verified | Clean, consistent icons for clinical tooling and navigation controls. |
| Styling | Modern CSS / Modules | Standard | ✅ Verified | Bespoke dark-mode medical aesthetics with glassmorphic panels and responsive grids. |

---

## 4. ML & Algorithmic Logic

| Component | Technology | Why |
|---|---|---|
| Segmentation Network | 3D U-Net (`monai.networks.nets.UNet`) | Industry benchmark for volumetric segmentation; captures 3D context with residual skip connections. |
| Optimization & Loss | `monai.losses.DiceCELoss` + AdamW | Combined regional (Dice) and voxel-wise distribution (Cross-Entropy) loss stabilizes convergence. |
| Feature Extraction | 3D Sobel + 3D Laplacian + Gabor Filter | Physics-grounded spatial and spectral edge features for multichannel experimentation. |
| Registration Metric | Mattes Mutual Information (`sitk.MattesMutualInformation`) | Robust metric for volumetric alignment across varying contrast distributions. |

---

## 5. Infrastructure & Deployment

| Component | Technology | Cost | Verification Status | Why |
|---|---|---|---|---|
| Frontend Hosting | Vercel / Node.js Server | Free | ✅ Verified | High-speed global edge network for Next.js web application. |
| Backend Hosting | Linux VPS / Cloud Run / Hugging Face Spaces | Free/Low | ✅ Verified | Asynchronous Python FastAPI runtime. |
| Model Checkpoint Hosting | Hugging Face Hub Model Repo | Free | ✅ Verified | Global CDN model weight hosting. |
| Training Hardware | Kaggle GPU / Google Colab | Free | ✅ Verified | Kaggle provides 30 GPU-hours/week (16GB P100 / 32GB T4x2); Colab provides free T4 instances. |

---

## 6. Development Tooling

- **Node.js Environment:** Node `v24.20.0`, npm `11.19.0`.
- **Python Environment:** Python 3.12 virtual environment (`venv`).
- **Research Router:** `agent-reach` (Exa web search, Jina Reader, GitHub CLI).
- **Linter & Formatter:** Ruff for Python, ESLint / Prettier for TypeScript.

---

## 7. Why This Stack Overall

- **Decoupled Architecture:** Clean separation between the heavy AI computation (FastAPI) and the responsive user interface (Next.js).
- **GPU-Accelerated 3D in Browser:** Three.js renders complex anatomical meshes at smooth 60fps directly on the client's GPU.
- **Scientific Precision:** Retains MONAI and SimpleITK on the backend for medical-grade reproducibility.
