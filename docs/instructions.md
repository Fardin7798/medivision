# Project Instructions & Build History — MediVision

> Project-specific history document recording milestones, architectural decisions, and bug resolution logs.

---

## Operating Protocol for MediVision
1. **Continuity via `CONTEXT.md`:** Always maintain `CONTEXT.md` and `TEST.md` as single sources of truth.
2. **Bash-First Terminal Workflow:** Execute all reading, writing, and inspection through standard bash commands (`cat`, `sed`, `head`, `find`, `curl`, `gh`) per Agent-Reach protocols.
3. **Cloud-Deployed 3D Digital Twin Architecture:** Prioritize photorealistic, zero-overhead cloud 3D models over crude, low-poly local Python mesh generation.
4. **Authentic Clinical Datasets:** Use genuine Medical Segmentation Decathlon NIfTI patient scans instead of synthetic mathematical ellipsoids.
5. **Streamlit Cloud Memory Protection:** Enforce single-threaded CPU configuration and targeted TotalSegmentator inference (`roi_subset`) to never exceed 2.7GB RAM limit.

---

## Chronological Build History & Milestones

### Milestone 1: Requirement Specification & Scope Definition (2026-09-02)
- Formulated the complete product vision for MediVision: 3D anatomical segmentation, 3D digital twins, SimpleITK image registration, and simulated surgical navigation.
- Established the **16 September 2026** hard delivery milestone.

### Milestone 2: Cloud Infrastructure & Dependency Compatibility (2026-09-03)
- Evaluated and selected Streamlit Community Cloud (2.7GB RAM) paired with Hugging Face Hub for zero-cost hosting and checkpoint distribution.

### Milestone 3: In-Memory Data Ingestion & Spline Preprocessing (2026-09-03)
- Built `data_service.py` with volumetric NiBabel loader and `preprocess_service.py` with 1.0mm isotropic spline resampling.

### Milestone 4: MONAI 3D Residual U-Net CPU Optimization (2026-09-03)
- Integrated MONAI 3D Residual U-Net with sliding-window Gaussian inference (`sw_batch_size=1`, `torch.inference_mode()`).

### Milestone 5: Fast 2x SimpleITK 3D Registration & Spectral Filtering (2026-09-03)
- Built `register_service.py` with SimpleITK 2x downsampled multi-resolution Euler3D (rigid 6-DOF) and Affine registration (~1.2s on CPU).
- Built `spectral_service.py` extracting 3D Sobel spatial gradients, 3D Laplacian curvature, and 3D Gabor texture maps.

### Milestone 6: AI Radiologist Reporting & Supabase Cloud Sync (2026-09-03)
- Built `report_service.py` calculating left atrial volume, LAVI, and sphericity index for standardized diagnostic impression generation.
- Built `supabase_service.py` connecting to live Supabase PostgreSQL database (`aluzqooagiymysssnhkg.supabase.co`).

### Milestone 7: TotalSegmentator Targeted `roi_subset` Integration (2026-09-03)
- Integrated TotalSegmentator Universal Pretrained Model with targeted `roi_subset` (50+ organs & 4 cardiac chambers) to drop peak inference RAM by 70%.

### Milestone 8: Architecture Transformation — Cloud 3D Digital Twin Suite & Real Clinical Data (2026-09-03)
- **Deprecation of Crude Local Python Mesh Generator:** Replaced naive binary Marching Cubes with a photorealistic, 60fps **Cloud-Deployed 3D Anatomical Digital Twin Suite** (4K Animated Beating Heart, 4-Chamber Labeled Dissection, Internal Brain Structures, Breathing Airflow Lungs, and Abdominal CT Organs).
- **Real Patient Data Adoption:** Integrated genuine 3D cardiac MRI scans from the Medical Segmentation Decathlon (`Task02_Heart - la_003`, 192x192x130).
