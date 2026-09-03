# Architecture & Component Specification — MediVision

> Comprehensive System Architecture and Dataflow for MediVision (3D Medical AI Suite).

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph "Client Layer"
        UI_Streamlit["Streamlit Cloud UI (medivision-a.streamlit.app)"]
        UI_NextJS["Next.js 15 Web Application (frontend/)"]
        Cloud_3D["Cloud 3D Medical Digital Twin Viewport (WebGL 60fps)"]
    end

    subgraph "Cloud 3D Model Catalog"
        Model_Heart["3D Animated 4K Beating Heart (Sketchfab / NIH 3D)"]
        Model_Chambers["Labelled 4-Chamber Cardiac Dissection"]
        Model_Brain["Deep Brain Internal Structures Scan"]
        Model_Lungs["Animated Respiratory Tree & Cross-Section"]
        Model_Liver["Abdominal Cavity CT Scan Model"]
    end

    subgraph "Core AI & Processing Engine (CPU-Optimized)"
        Ingest["Data Ingestion & NiBabel Volumetric Parser"]
        SplinePrep["Isotropic Spline 3D Resampling & Normalization"]
        AI_TotalSeg["TotalSegmentator Universal Pretrained Engine (roi_subset)"]
        AI_MONAI["MONAI 3D Residual U-Net Engine"]
        Metrics["Clinical Validation Metrics (Dice, IoU, HD95, ASD)"]
        Register["2x Multi-Resolution SimpleITK Registration"]
        ReportGen["AI Diagnostic Report & Biomarker Generator (LAVI, Sphericity)"]
        Safety["Clinical Safety Interceptors & Noise Testing"]
    end

    subgraph "Cloud Persistence & Telemetry"
        DB_Supabase[("Supabase PostgreSQL Database")]
        Dataset_MSD[("Medical Segmentation Decathlon la_003 3D Cardiac MRI")]
    end

    UI_Streamlit --> Ingest
    UI_Streamlit --> Cloud_3D
    Cloud_3D --- Model_Heart
    Cloud_3D --- Model_Chambers
    Cloud_3D --- Model_Brain
    Cloud_3D --- Model_Lungs
    Cloud_3D --- Model_Liver

    Ingest --> Dataset_MSD
    Ingest --> SplinePrep
    SplinePrep --> AI_TotalSeg
    SplinePrep --> AI_MONAI
    AI_TotalSeg --> Metrics
    AI_MONAI --> Metrics
    Metrics --> ReportGen
    ReportGen --> DB_Supabase
```

---

## 2. Core Subsystems

### Subsystem 1: Clinical Dataset & Ingestion
* **Real Patient Ingestion:** Loads Medical Segmentation Decathlon (`Task02_Heart`) patient MRI scans (`.nii.gz`) with spatial affine matrices and anisotropic pixdim spacing.
* **Pre-processing:** Resamples scan to 1.0mm isotropic resolution using third-order spline interpolation and applies float32 z-score normalization.

### Subsystem 2: Dual-Engine 3D AI Segmentation
* **TotalSegmentator Universal Engine:** Targeted `roi_subset` (heart, aorta, liver, spleen, kidneys) running on CPU with zero thread contention (`OMP_NUM_THREADS=1`).
* **MONAI 3D Residual U-Net:** Sliding-window Gaussian inference with Hugging Face Hub pretrained weights (`ashhal/medivision-unet-heart`).

### Subsystem 3: Cloud-Deployed 3D Anatomical Digital Twin Suite
* **Zero-Lag 60fps WebGL Rendering:** Eliminates server-side rendering bottlenecks by connecting directly to cloud-hosted, textured, and animated 3D medical assets.
* **Specialties Covered:**
  1. **Cardiovascular:** 4K Animated beating heart with coronary vessels and 4-chamber labeled cardiac dissection.
  2. **Neurology:** Human brain with selectable internal structure dissection (Thalamus, Ventricles, Hippocampus).
  3. **Pulmonology:** Animated breathing respiratory tree with directional airflow cross-section.
  4. **Gastroenterology:** Abdominal cavity multi-organ CT 3D model and human liver donor scan.

### Subsystem 4: AI Diagnostic Reporting & Quantitative Biomathematics
* **Automated Biomarkers:** Left Atrial Volume ($cm^3$), Left Atrial Volume Index ($LAVI\ ml/m^2$), Sphericity Index, and Hausdorff 95 boundary error.
* **Standardized Diagnostic Impression:** Grades Left Atrial Enlargement (LAE) according to AHA/ESC guidelines and generates printable clinical markdown reports.

### Subsystem 5: Supabase Cloud Telemetry
* **Synchronous Audit Logging:** Records patient demographics, scan metadata, segmentation volumetrics, and validation metrics to remote PostgreSQL (`aluzqooagiymysssnhkg.supabase.co`).
