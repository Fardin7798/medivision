# 🩺 MediVision — 3D Medical Imaging AI & Surgical Navigation Platform

> A modern, 100% Non-Python, 1-Click Deployable Next.js 16 full-stack medical imaging research and surgical navigation simulation suite.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-black?style=for-the-badge&logo=vercel)](https://frontend-kappa-silk-42.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL2-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![WebGPU](https://img.shields.io/badge/ONNX-WebGPU%20AI-orange?style=for-the-badge)](https://onnxruntime.ai/)

---

## 🌐 Live URLs & Documentation
* 🚀 **Live Production App**: **[https://frontend-kappa-silk-42.vercel.app](https://frontend-kappa-silk-42.vercel.app)**
* ⚡ **Live Health API**: **[https://frontend-kappa-silk-42.vercel.app/api/health](https://frontend-kappa-silk-42.vercel.app/api/health)**
* 📖 **The Ultimate Master Guide & 360° Q&A (Aasan Bhasha Me)**: **[GUIDE.md](GUIDE.md)**
* 📄 **Technical Master Report & Presentation Guide**: **[docs/PROJECT_COMPLETE_REPORT.md](docs/PROJECT_COMPLETE_REPORT.md)**

---

## 🌟 Key Capabilities
1. **Dual-Mode 3D Viewport**:
   - **Surgical Trajectory Mode**: Real 3D Brain (`brain.glb`) and Skull (`skull.glb`) meshes with tracked surgical probe needle, laser trajectory beam, and margin distance telemetry.
   - **3D Anatomy Atlas Mode**: 4K Deployed Cloud Models for Beating Heart V2.0, Head & Brain Sagittal Section, Vertebral Column, and Skull & Skeleton.
2. **High-Density 2D MPR Slices**: Axial, Coronal, Sagittal anatomical cross-sections (calvarium bone, lateral ventricles, falx cerebri, focal edema) with Hounsfield Unit (HU) curves.
3. **Curved Multi-Planar Reconstruction (CMPR)**: Catmull-Rom spline centerline unrolling.
4. **Client-Side WebGPU ONNX AI**: Zero-latency MedSAM tensor segmentation in-browser.
5. **60Hz 6-DoF Optical Tracking Stream**: Operating room NDI Polaris tracking stream emulation.
6. **Point-Based Landmark Registration**: Kabsch SVD + Horn's Quaternion rigid transform solver ($\text{TRE} \le 1.319\text{ mm} < 2.0\text{ mm}$).
7. **Custom Scan Uploader & JSON Plan Exporter**: Drag-and-drop local `.nii` / `.dcm` files.

---

## 🚀 Quick Start (Local Run)

```bash
# Clone the repository
git clone https://github.com/Fardin7798/medivision.git
cd medivision/frontend

# Install dependencies & run development server
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
