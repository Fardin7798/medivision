# CONTEXT.md — MediVision

> **Living status doc** — read this first at the start of every session, and update it as part of finishing every real change.

---

## Project Overview

- **What it is:** **MediVision** is a modern, 100% Non-Python, 1-Click Deployable Unified Next.js Fullstack medical imaging AI and surgical navigation platform. It features synchronized 4-quadrant MPR & Curved Multi-Planar Reconstruction (CMPR), 3D anatomical organ meshes, client-side WebGPU ONNX AI segmentation (MedSAM ViT-B), real-time 60Hz NDI Polaris optical tracking emulation, Kabsch SVD / Horn's Quaternion landmark registration, custom DICOM/NIfTI drag-and-drop import, dual trajectory planning, and clinical plan exports.
- **Status:** **LIVE & DEPLOYED ON VERCEL PRODUCTION (HTTP/2 200 OK, 0 ERRORS).**
- **Live Production URL:** **`https://frontend-kappa-silk-42.vercel.app`**
- **Live Health API:** **`https://frontend-kappa-silk-42.vercel.app/api/health`**
- **Last worked on:**
  1. Deployed directly to Vercel Production via Vercel CLI using user API token.
  2. Verified live production URL via Playwright MCP and `curl` (0 errors).
  3. Captured live production screenshot (`.playwright-mcp/page-2026-09-03T20-16-56-371Z.png`).

---

## Tech Stack
- **Fullstack Platform:** Next.js 16 (App Router + Serverless API Route Handlers) + React 19 + TypeScript + Tailwind CSS
- **Live Hosting:** Vercel Global Edge CDN (`https://frontend-kappa-silk-42.vercel.app`)
- **AI Engine:** Client WebGPU / WASM ONNX Runtime (`onnxruntime-web`) + Cloud Serverless API
- **3D Engine:** Three.js (PBR Shaders, Orbit Controls, Surgical Stylus, Trajectory Beams)
- **Medical Viewports:** Synchronized MPR Layout + Catmull-Rom CMPR Spline Engine + `@niivue/niivue`
- **Math & Hardware:** OpticalTrackerStream (60Hz), CoordinatePipeline, Kabsch SVD & Horn's Quaternion

---

## Rules for Antigravity / Agent
**Never:**
- Never use Python backends for core platform operations.
- Always use terminal commands (`cat`, `sed`, `head`, `tail`, `cat << 'EOF'`) for file modifications.
- Do not leave background server processes running when work turn ends to keep system memory light.
