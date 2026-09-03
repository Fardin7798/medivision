# MediVision — Product Requirements Document (PRD)

> **Status:** Active / Production-Ready  
> **Target Audience:** Radiologists, Cardiac & Neurosurgeons, Clinical AI Researchers

---

## 1. Executive Summary
MediVision is an AI-powered 3D medical imaging and anatomical digital twin platform designed to bridge radiological imaging and surgical planning through real-time cloud-streamed 3D digital twins, quantitative segmentation metrics, and automated EHR reporting.

---

## 2. Core Functional Requirements

### FR-1: 3D Volumetric Ingestion & MPR
* Support NIfTI (`.nii`, `.nii.gz`) and DICOM medical imaging standards.
* Deliver sub-second 2D slice extraction across Axial, Coronal, and Sagittal orthogonal views.
* Interactive voxel coordinate and Hounsfield Unit (HU) / MRI intensity probing.

### FR-2: Cloud-Deployed 3D Anatomical Digital Twin Suite
* 60 FPS interactive client-side WebGL rendering for 6 core anatomical systems (Cardiac 4K Animated, 4-Chamber Labeled, Deep Brain, Airflow Lungs, Abdomen CT, Full Body).
* 0 MB server GPU memory load (<10MB total memory footprint on deployment server).
* Sub-voxel Gaussian smoothed watertight STL CAD generation for physical 3D surgical printing.

### FR-3: Deep Learning 3D Segmentation
* Automated segmentation for Left Atrium (Cardiac MRI) and Multi-Organ structures.
* Exact volumetric computation ($cm^3$) and voxel count calculation.
* Translucent colored overlays on anatomical MPR slices.

### FR-4: Spatial Image Registration
* Rigid Euler3D and Affine 2x multi-resolution spatial alignment.
* Real-time difference and fusion overlay visualization.

### FR-5: Quantitative Clinical Metrics
* Quantitative validation against ground truth: Dice Similarity Coefficient, IoU (Jaccard), Hausdorff 95 ($mm$), and Average Surface Distance ($mm$).

### FR-6: AI Diagnostic Reporting
* Automated structured diagnostic reports with clinical findings, quantitative metrics, recommendations, and disclaimer.

### FR-7: Supabase Cloud Database & Telemetry
* Secure persistent patient history, scan metadata, segmentation metrics, and latency audit trail.

---

## 3. Non-Functional Requirements
* **Memory Constrained Performance:** Safe execution within 2.7GB RAM limit on Streamlit Cloud.
* **Architecture:** Clean layered architecture with Pydantic domain models.
* **Testing:** 100% endpoint pass rate across automated test suite and Playwright MCP verification.
