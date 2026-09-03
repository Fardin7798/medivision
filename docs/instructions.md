# Project Instructions & Build History — MediVision

> Project-specific build protocol, execution history, and active standards for MediVision.
> Adheres strictly to the Master Protocol defined in `/home/shaikhfardin/templates/instructions.md`.

---

## Operating Protocol for MediVision

Every step, script, and code modification in this project must strictly comply with these rules:

### 1. Master Methodologies & Rules
- **Continuity via `CONTEXT.md`:** Read `CONTEXT.md` at the start of every session. Update "Last worked on", checklists, and known bugs at the end of each session.
- **The Per-Change Loop:** Write the smallest testable slice → test directly with real commands → commit with a clear reason → push → deploy → verify in the real environment. Never batch unverified changes.
- **Verify, Never Assume:** Test all external services (MONAI dataset S3 endpoints, Hugging Face Hub, GPU runtimes) with real executable calls before writing dependent logic.
- **Strict Separation of Real vs. Mock:** Label all temporary mocks explicitly. Never allow hardcoded values to pass as real computation.
- **Documentation Integrity:** Never leave docs stale. All documentation must reflect the exact current codebase. No references to deleted tools or deprecated implementations.
- **Strict Medical Safety Disclaimer:** Ensure every UI page, report, and documentation header includes the prominent educational/research disclaimer.

---

## Build History & Milestones

### Milestone 1: Requirement Specification & Scope Definition (2026-09-02)
- Formulated the complete product vision for MediVision: 3D anatomical segmentation on MSD Task02_Heart, 3D surface mesh generation, SimpleITK image registration, and simulated surgical navigation.
- Established scope boundaries, target users, non-goals, and the critical **16 September 2026** hard deadline.
- Produced initial Stage 1 documentation drafts (`PRD.md`, `architecture.md`, `tech-stack.md`, `api-docs.md`).

### Milestone 2: Cloud Infrastructure & Deployment Optimization (2026-09-03)
- Evaluated and ruled out Render for hosting due to 512MB RAM free tier limitations (insufficient for PyTorch/MONAI volumetric tensors).
- Selected **Streamlit Community Cloud** (2.7GB RAM, 50GB disk) paired with **Hugging Face Hub** model repository for zero-cost hosting and checkpoint distribution.
- Investigated Kaggle vs. Colab GPU compute: confirmed Kaggle provides a predictable 30 GPU-hours/week quota with P100 (16GB) / T4x2 (32GB) GPUs.

### Milestone 3: Real Dependency Compatibility & Environment Verification (2026-09-03)
- Provisioned clean local Python virtual environment and tested installation of all core libraries.
- Discovered and resolved fatal upstream compatibility issue between `streamlit==1.63.0` and `stpyvista==0.2.1` by pinning `streamlit==1.40.0` and `stpyvista==0.1.4`.
- Created standardized `requirements.txt` and security-hardened `.gitignore`.

### Milestone 4: Master Protocol Documentation Standardization (2026-09-03)
- Completely refactored all project documentation (`CONTEXT.md`, `TEST.md`, `docs/PRD.md`, `docs/architecture.md`, `docs/tech-stack.md`, `docs/api-docs.md`, `docs/systematic-build.md`, `docs/instructions.md`) to adhere strictly to `/home/shaikhfardin/templates/`.
- Cleaned all redundant raw template artifacts out of `docs/`.

---

## Next Steps for Project Completion (Phase-by-Phase)

1. **Phase 1 (Data Pipeline & Ingestion):**
   - Verify `DecathlonDataset` download for `Task02_Heart`.
   - Build `src/data.py` (image loading and metadata extraction) and `src/preprocess.py` (resampling and intensity normalization).
   - Test data loading in `notebooks/01_data_exploration.ipynb`.

2. **Phase 2 (3D U-Net Training & Checkpoint Export):**
   - Build `src/segment.py` with MONAI 3D U-Net and `DiceCELoss`.
   - Execute training on Kaggle GPU / Colab, save best checkpoint (`val_dice > 0.70`), and publish to Hugging Face Hub.

3. **Phase 3 (3D Mesh & Registration):**
   - Implement Marching Cubes and STL export in `src/reconstruct.py`.
   - Implement SimpleITK Euler3D registration in `src/register.py`.

4. **Phase 4 (Streamlit UI & Navigation):**
   - Build multi-page Streamlit application (`app/main.py` + `app/pages/*`) embedding `stpyvista` 3D viewport and simulated navigation viewer.
   - Deploy to Streamlit Community Cloud and verify live production functionality.
