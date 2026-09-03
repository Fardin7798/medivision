# Product Requirements Document (PRD) — MediVision

## 1. Problem Statement
Traditional medical image analysis and surgical planning workflows are siloed, requiring high-cost desktop software (e.g. Brainlab, 3D Slicer) or complex Python/CUDA environments. Students, clinical researchers, and surgical trainees lack instant, browser-based access to:
1. Synchronized Multi-Planar Reconstruction (MPR) and Curved Multi-Planar Reconstruction (CMPR).
2. 3D Anatomical Organ Meshes with real-time transparency/opacity controls.
3. Client-Side WebGPU ONNX Zero-Shot Structure Segmentation (MedSAM ViT-B).
4. Real-time patient-to-image landmark registration (Kabsch SVD & Horn's Quaternion solvers).
5. Simulated surgical navigation with laser trajectory guidance, dual/bilateral trajectories, live margin safety distance calculation, and 60Hz Optical Tracker emulation.
6. Custom local DICOM/NIfTI drag-and-drop scan import.

---

## 2. Target Users & Clinical Use Cases
- **Neurosurgery & Spine Trainees**: Simulating cranial tumor approaches, deep brain stimulation (DBS) electrode placements, and pedicle screw trajectories.
- **Hepatobiliary Surgeons**: Planning hepatic segmentectomies and avoiding major portal/hepatic vasculature.
- **Medical Students**: Interactive exploration of cross-sectional DICOM/NIfTI anatomy.

---

## 3. Core Features & Functional Requirements

### 3.1 Synchronized 4-Quadrant Viewport (MPR + CMPR + 3D)
- **FR-1.1**: Display synchronized Axial, Coronal, and Sagittal orthogonal cross-sections.
- **FR-1.2**: **Curved Multi-Planar Reconstruction (CMPR)**: Catmull-Rom spline interpolation along tortuous vascular/spinal paths with unrolled longitudinal and cross-sectional lumen views.
- **FR-1.3**: 3D interactive anatomical scene rendered via Three.js with orbit/zoom controls at 60 FPS.
- **FR-1.4**: Window/Level (W/L) density presets: `Brain`, `Bone`, `Soft Tissue`, `Lung`.

### 3.2 5 Advanced Clinical Scenarios + Custom Scan Import
- **FR-2.1**: Cranial Glioma Resection (`mni152.nii.gz` - MRI T1-CE).
- **FR-2.2**: Hepatic Segmentectomy VI/VII (`CT_Abdo.nii.gz` - Tri-phase CT).
- **FR-2.3**: Lumbar Spine Pedicle Screw Trajectory (`mni152.nii.gz` - Spine CT).
- **FR-2.4**: Deep Brain Stimulation STN Lead Navigation (`CT_Electrodes.nii.gz` - Stereotactic CT).
- **FR-2.5**: Cerebral AVM / Aneurysm Vascular Clipping (`chris_MRA.nii.gz` - 3D MRA Angiography).
- **FR-2.6**: **Custom Scan Uploader Modal**: Drag-and-drop import for user `.nii`, `.nii.gz`, `.dcm`, and `.glb` files with instant client-side volume creation.

### 3.3 Surgical Telemetry HUD & Margin State Machine
- **FR-3.1**: Compute Euclidean distance ($d\text{ mm}$) between virtual surgical probe tip ($P_{probe}$) and Target Core ($P_{target}$).
- **FR-3.2**: Safety Margin Boundary State Machine:
  - $d > 2.5 \times \text{Margin}$ $\to$ 🟢 **SAFE ZONE**
  - $\text{Margin} < d \le 2.5 \times \text{Margin}$ $\to$ 🟡 **APPROACHING MARGIN (Warning)**
  - $d \le \text{Margin}$ $\to$ 🔴 **CRITICAL MARGIN BREACH (Alarm)**
- **FR-3.3**: Trajectory insertion depth, spherical azimuth angle ($\alpha$), and elevation angle ($\beta$).
- **FR-3.4**: **Dual / Bilateral Trajectory Mode** for dual pedicle screws or bilateral DBS STN leads.
- **FR-3.5**: **NDI Polaris Optical Tracking Stream (60Hz 6-DoF)**: Real-time optical hardware stream simulation with sub-millimeter precision ($Q > 0.99$, RMS $< 0.15\text{ mm}$).

### 3.4 Interactive AI Segmentation (WebGPU ONNX + Cloud MedSAM)
- **FR-4.1**: Client-side **WebGPU / WASM ONNX Runtime (`onnxruntime-web`)** executing zero-shot MedSAM point/box prompts in-browser with zero API latency.
- **FR-4.2**: Hugging Face Serverless Cloud API fallback.
- **FR-4.3**: Return segmented lesion contour, cross-sectional area ($\text{mm}^2$), and confidence percentage.

### 3.5 Point-Based Landmark Registration
- **FR-5.1**: Paired 3D landmark points calibration with closed-form Translation Vector and Target Registration Error ($\text{TRE} \le 1.319\text{ mm} < 2.0\text{ mm}$).
- **FR-5.2**: Dual Solver support (Kabsch SVD & Horn's Quaternion).

### 3.6 Surgical Plan Export Summary
- **FR-6.1**: One-click export of complete clinical plan, trajectory angles, margin distances, and TRE errors as formatted JSON (`PlanExportModal`).
