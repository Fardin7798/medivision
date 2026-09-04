# CONTEXT.md — MediVision

> **Living status doc** — read this first at the start of every session, and update it as part of finishing every real change.

---

## Project Overview

- **What it is:** **MediVision** is a modern, 100% Non-Python, 1-Click Deployable Unified Next.js Fullstack medical imaging AI and surgical navigation platform. It features:
  1. **Dual-Mode 3D Viewport**: Seamless toggle between **Live Surgical Trajectory (Three.js)** and **3D Anatomy Atlas (4K Deployed Cloud Models: Heart, Brain, Skull, Liver)**.
  2. **High-Density 2D MPR Cross-Section Engine**: Multi-layered anatomical slices (Skull Calvarium, Falx Cerebri, Lateral Ventricles, Sulci/Gyri, Focal Lesion Edema) with Hounsfield Unit (HU) Window/Level curves (`BRAIN`, `BONE`, `SOFT`, `LUNG`).
  3. **Curved Multi-Planar Reconstruction (CMPR)**: Catmull-Rom spline centerline unrolling.
  4. **Client-Side WebGPU ONNX AI**: In-browser zero-shot MedSAM segmentation (`@microsoft/onnxruntime-web`).
  5. **60Hz 6-DoF Optical Tracker Stream**: NDI Polaris tracking stream emulation.
  6. **Kabsch SVD & Horn's Quaternion**: Point-based landmark registration solver ($\text{TRE} \le 1.3\text{ mm}$).
  7. **Custom Scan Uploader & JSON Plan Exporter**.
- **Status:** **LIVE & DEPLOYED ON VERCEL PRODUCTION (HTTP/2 200 OK, 0 ERRORS).**
- **Live Production URL:** **`https://frontend-kappa-silk-42.vercel.app`**
- **Live Health API:** **`https://frontend-kappa-silk-42.vercel.app/api/health`**

---

## Tech Stack
- **Fullstack Platform:** Next.js 16 (App Router + Serverless API Handlers) + React 19 + TypeScript + Tailwind CSS
- **Live Hosting:** Vercel Global Edge CDN (`https://frontend-kappa-silk-42.vercel.app`)
- **AI Engine:** Client WebGPU / WASM ONNX Runtime (`onnxruntime-web`) + Cloud Serverless API
- **3D Engine:** Three.js + 4K Deployed Cloud Medical Atlas Embeds (Sketchfab Cloud CDN)
- **Medical Viewports:** Synchronized High-Density MPR + Catmull-Rom CMPR Spline Engine
- **Math & Hardware:** OpticalTrackerStream (60Hz), CoordinatePipeline, Kabsch SVD & Horn's Quaternion
