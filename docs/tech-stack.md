# Tech Stack — MediVision

## Overview
MediVision is engineered as a **100% Non-Python, Cloud-Native, Modern TypeScript Web Application**. By utilizing cutting-edge WebGL2 medical engines (`@niivue/niivue`), Three.js 3D rendering, and serverless Hugging Face AI endpoints, the entire surgical navigation and medical imaging experience runs with zero local setup, zero GPU server costs, and instant browser accessibility.

---

## 1. External Data Sources & APIs (Phase 1 Verified)

| Source | Role / Asset Provided | Live Verified Status | Cost | Verification Notes |
|---|---|---|---|---|
| **NiiVue Medical CDN** | Standard NIfTI scans (`mni152.nii.gz`, `visiblehuman.nii.gz`) | ✅ Verified (HTTP 200 OK) | Free / Open Source | Tested via curl. `access-control-allow-origin: *` confirmed for direct client loading. |
| **BodyParts3D (DBCLS)** | Pre-built anatomical 3D organ meshes (Brain, Skull, Liver, Skeleton) | ✅ Verified (HTTP 200 OK) | Free (CC BY-SA 2.1 JP) | DBCLS archive confirmed accessible. Models formatted as web-optimized `.glb` / `.obj`. |
| **Hugging Face Inference API** | `wanglab/medsam-vit-base` / Medical AI Segmentation | ✅ Verified Active | Free Tier Serverless | Serverless REST API with graceful fallback to high-fidelity client-side generator. |
| **Hugging Face ONNX CDN** | `schmuell/sam-b-fp16` WebGPU ONNX weights | ✅ Verified (HTTP 302 / CDN OK) | Free / Open Source | CDN redirect confirmed active for direct in-browser WebGPU inference. |

---

## 2. Frontend & Medical Rendering Core

| Component | Technology | Version | Justification |
|---|---|---|---|
| **Framework** | **Next.js (App Router) / React** | `16+ / 19+` | Robust component architecture, Turbopack, fast routing, enterprise TypeScript support |
| **Language** | **TypeScript** | `5.0+` | Complete type safety across 3D math, coordinates, and medical headers |
| **Styling** | **Tailwind CSS** | `4.0+` | Modern dark-mode clinical UI styling, responsive layouts, glassmorphism |
| **Icons** | **Lucide React** | `Latest` | Crisp, modern clinical & navigation iconography |
| **Medical Viewport** | **`@niivue/niivue`** | `0.57+` | Industry standard WebGL2 engine for 2D MPR (Axial, Coronal, Sagittal) and 3D Volume rendering |
| **3D Navigation Scene** | **Three.js** | `0.183+` | 60 FPS 3D rendering of anatomical organs, surgical pointer gizmo, trajectory line vectors |
| **Linear Algebra & Math** | **`gl-matrix` / Three.js Matrix4** | `3.4+` | High-speed matrix operations for Kabsch landmark registration and Euclidean distance |

---

## 3. Backend & Infrastructure

| Component | Technology | Justification |
|---|---|---|
| **Backend API** | **Node.js + Express + TypeScript** | Lightweight REST microservice (`http://localhost:5000`) for AI proxy & case coordination |
| **Hosting & Edge** | **Vercel / Static Edge CDN** | Instant global edge delivery, automated CI/CD from GitHub, zero server maintenance |

---

## 4. Why This Stack Overall

1. **Zero Python / Zero C++ Compilation**: Eliminates hours of compiler setup, PyTorch CUDA incompatibilities, and heavy local Docker images.
2. **Instant Accessibility**: Any doctor, student, or researcher can open a URL on Chrome/Firefox/Edge and experience full 3D surgical navigation.
3. **Hardware Acceleration via WebGL2/WebGPU**: Delivers smooth 60 FPS interaction directly utilizing client GPU without server strain.
4. **Clean Decoupling**: AI model execution is cleanly offloaded to serverless APIs and browser WebGPU, keeping the codebase lightweight and maintainable.
