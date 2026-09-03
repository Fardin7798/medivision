# System Architecture — MediVision (Unified Next.js Fullstack)

## 1. High-Level Unified Fullstack Architecture

```
[ Unified Next.js 16 Fullstack Platform (Port 3000 / 1-Click Deploy) ]
  │
  ├── 🖥️ Client-Side Viewports & Navigation UI:
  │     ├── 3D Viewport: Photorealistic Anatomy Meshes + Surgical Stylus + Trajectory Beams
  │     ├── MPR & CMPR Viewports:
  │     │     ├── Orthogonal 3-Plane (Axial, Coronal, Sagittal)
  │     │     └── Curved Multi-Planar Reconstruction (Catmull-Rom Spline Centerline)
  │     ├── Surgical Telemetry HUD:
  │     │     ├── Live Margin Distance (mm), Progress Gauge, Insertion Angles
  │     │     ├── Dual Trajectory Toggle (Bilateral Leads)
  │     │     └── NDI Polaris Optical Tracking Stream (60Hz 6-DoF Stream)
  │     ├── AI Segmentation Panel:
  │     │     ├── WebGPU / WASM ONNX Client Runtime (onnxruntime-web)
  │     │     └── Serverless Cloud API Proxy
  │     ├── Custom Scan Uploader: Drag & Drop DICOM / NIfTI Client Parser
  │     ├── Plan Export Modal: Formatted Clinical Plan (JSON Export)
  │     └── Registration Modal: 3-Point Fiducial Calibration (Kabsch SVD & Horn's Quaternion)
  │
  └── ⚡ Next.js App Router Built-in Route Handlers (Same Origin /api/):
        ├── GET  /api/health       -> Service health & timestamp
        ├── GET  /api/cases        -> 5 Verified Clinical Scenarios
        ├── GET  /api/cases/[id]   -> Single Case Details
        ├── POST /api/segment      -> MedSAM Serverless Proxy & Simulated Fallback
        └── POST /api/register     -> Closed-Form SVD Landmark Rigid Solver
              │
              ▼ (External Sourced CDNs)
        ├── NiiVue CDN (Direct NIfTI Volume Stream: mni152, CT_Abdo, CT_Electrodes, chris_MRA)
        └── Hugging Face Serverless API (wanglab/medsam-vit-base)
```

---

## 2. Deployment Architecture (1-Click Vercel / Render Blueprint)

- **Root Deploy**: Single-service deployment via `render.yaml` or Vercel Next.js builder.
- **Zero CORS**: Client and API route handlers execute on the same host origin.
- **Build Command**: `npm install && npm run build` (Builds in $<2.2\text{s}$).
- **Start Command**: `npm start`.
