# Product Requirements Document (PRD) — MediVision

> Production Specification for MediVision (3D Medical AI Suite & Cloud 3D Digital Twin Platform).

---

## 1. Executive Summary
MediVision is a production-grade 3D medical intelligence platform combining real clinical patient imaging (Medical Segmentation Decathlon 3D Cardiac MRI), automated deep learning segmentation (TotalSegmentator & MONAI), and an interactive **Cloud-Deployed 3D Anatomical Digital Twin Suite** (Cardiology, Neurology, Pulmonology, and Gastroenterology). It delivers sub-second 3D registration, quantitative biomathematics (LAVI, Sphericity), and automated clinical diagnostic reporting in a cloud-hardened runtime.

---

## 2. Key User Personas
* **Radiologists & Cardiologists:** Require instant multi-planar MPR inspection, quantitative left atrial volumetric grading, and automated diagnostic impression drafting.
* **Surgical Teams & Medical Educators:** Require interactive 3D digital twins with 4K textures, cardiac cycle animation, and internal chamber dissection to plan interventions and teach anatomy.
* **Clinical Researchers:** Require reproducible Dice/HD95 validation metrics, 3D registration alignment, and synchronized cloud telemetry in Supabase.

---

## 3. Product Modules & Functional Requirements

### Module 1: Patient Data Ingestion & MPR Slice Exploration
* Ingests real clinical NIfTI (`.nii.gz`) scans from Medical Segmentation Decathlon (`Task02_Heart`).
* Provides interactive Axial, Coronal, and Sagittal orthogonal cross-section slice navigation with real-time voxel intensity probing.

### Module 2: 3D Spline Preprocessing
* Performs 1.0mm isotropic spline resampling and robust float32 z-score normalization.

### Module 3: 3D Deep Learning Segmentation
* Executes TotalSegmentator with targeted `roi_subset` (heart, aorta, liver, etc.) and MONAI 3D Residual U-Net on CPU.
* Displays synchronized translucent segmentation overlays on raw anatomical slices.

### Module 4: Cloud-Deployed 3D Anatomical Digital Twin Suite
* Replaces crude single-color local mesh generation with photorealistic 60fps cloud-deployed 3D models:
  * **Cardiology:** 3D Animated Beating Heart V2.0 & Labelled 4-Chamber Cardiac Dissection.
  * **Neurology:** Human Brain Deep Internal Structures Dissection & Cerebrum Scan.
  * **Pulmonology:** Animated Respiratory Tree & Lung Airflow Cross-Section.
  * **Gastroenterology:** Abdominal Organs Clinical CT Model & Human Liver Scan.
* Provides full 360° rotation, pan, zoom, layer toggles, and internal dissection controls.

### Module 5: 3D Image Registration
* Fast 2x downsampled SimpleITK Euler3D (rigid 6-DOF) and Affine registration using Mattes Mutual Information (~1.2s convergence).

### Module 6: Derived Multi-Channel Spectral Maps
* On-demand 3D Sobel spatial gradients, 3D Laplacian curvature, and 3D Gabor texture frequency responses.

### Module 7: AI Diagnostic Radiologist Reporting
* Calculates Left Atrial Volume ($cm^3$), Left Atrial Volume Index ($LAVI\ ml/m^2$), and Sphericity Index.
* Generates standardized clinical impression classifications and exportable Markdown reports.

### Module 8: Multi-Case Latency Benchmarking
* Granular per-stage compute latency audit and throughput measurement.

### Module 9: Supabase Cloud Telemetry & Records
* Real-time PostgreSQL audit synchronization for patient records, scan telemetry, and segmentation biomarkers.

---

## 4. Technical Non-Functional Requirements
* **RAM Efficiency:** Peak memory footprint must stay strictly below 2.0GB (well within Streamlit Cloud's 2.7GB limit).
* **Zero Mock Policy:** All clinical scans, segmentation inferences, and registration metrics must execute through real computational pipelines.
