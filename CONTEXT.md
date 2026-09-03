# CONTEXT.md — MediVision

> **Living status doc** — read this first at the start of every session, and update it as part of finishing every real change.

---

## Project Overview

- **What it is:** **MediVision** is a modern, 100% Non-Python, 1-Click Deployable Unified Next.js Fullstack medical imaging AI and surgical navigation platform. It features synchronized 4-quadrant MPR & Curved Multi-Planar Reconstruction (CMPR), 3D anatomical organ meshes, client-side WebGPU ONNX AI segmentation (MedSAM ViT-B), real-time 60Hz NDI Polaris optical tracking emulation, Kabsch SVD / Horn's Quaternion landmark registration, custom DICOM/NIfTI drag-and-drop import, dual trajectory planning, and clinical plan exports.
- **Status:** **Unified Next.js Fullstack Architecture Active (1-Click Free Deploy Ready for Vercel/Render with 0 CORS & 0 Port Conflicts).**
- **Last worked on:**
  1. Converted all API routes to Next.js App Router handlers (`src/app/api/health`, `src/app/api/cases`, `src/app/api/register`, `src/app/api/segment`).
  2. Created `render.yaml` blueprint for 1-click free Render deployment.
  3. Tested all API routes and UI components in unified build ($2.0\text{s}$ build, 0 errors).
  4. Updated all documentation (`architecture.md`, `instructions.md`, `CONTEXT.md`).

---

## Tech Stack
- **Fullstack Platform:** Next.js 16 (App Router + Built-in API Handlers) + React 19 + TypeScript + Tailwind CSS
- **AI Engine:** Client WebGPU / WASM ONNX Runtime (`onnxruntime-web`) + Cloud Serverless API
- **3D Engine:** Three.js (PBR Shaders, Orbit Controls, Surgical Stylus, Trajectory Beams)
- **Medical Viewports:** Synchronized MPR Layout + Catmull-Rom CMPR Spline Engine + `@niivue/niivue`
- **Math & Hardware:** OpticalTrackerStream (60Hz), CoordinatePipeline, Kabsch SVD & Horn's Quaternion
- **Storage Layer:** LocalStorage / IndexedDB Case & Landmark Cache
- **Deployment Blueprint:** `render.yaml` & Vercel 1-Click Free Tier Ready

---

## Rules for Antigravity / Agent
**Never:**
- Never use Python backends for core platform operations.
- Always use terminal commands (`cat`, `sed`, `head`, `tail`, `cat << 'EOF'`) for file modifications.
- Do not leave background server processes running when work turn ends to keep system memory light.
