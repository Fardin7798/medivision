# TEST.md — MediVision Build & Verification Reference

> A living, copy-pasteable reference of exact commands to verify that MediVision
> works — update this as real commands are confirmed working, don't leave
> stale/guessed commands in here.

## Purpose
Quick smoke-test and verification reference for the MediVision 3D medical image segmentation, registration, and visualization pipeline.

## 1. Environment Setup Check
```bash
# Check Python version (requires Python 3.10+ for stpyvista and MONAI 1.6)
python3 --version

# Check pip and virtual environment tool
pip --version

# Check GPU availability (if running locally or inside Kaggle/Colab)
nvidia-smi || echo "Running in CPU-only local development mode"
```

## 2. Database
*Status: Not applicable — MediVision has no database. State is persisted via NIfTI, NumPy, STL files on disk, and model checkpoints on Hugging Face Hub.*

## 3. Backend (FastAPI & Medical AI Engine)
```bash
# Start FastAPI backend development server
source venv/bin/activate
uvicorn backend.app.main:app --port 8000 --reload

# Verify backend health
curl http://localhost:8000/health
```

## 4. Frontend (Next.js & Three.js Web App)
```bash
cd frontend
npm install
npm run dev
# Expected: Next.js dev server running at http://localhost:3000
```

## 5. Full Pipeline Smoke Test
```bash
# Run end-to-end pipeline CLI verification on single sample scan
python3 -m src.data --sample-test
python3 -m src.preprocess --input data/sample.nii.gz --output outputs/preprocessed.nii.gz
python3 -m src.segment --input outputs/preprocessed.nii.gz --checkpoint models/unet_heart_best.pth
python3 -m src.reconstruct --mask outputs/mask.nii.gz --output outputs/heart_mesh.stl
python3 -m src.register --moving outputs/preprocessed.nii.gz --fixed data/atlas.nii.gz
```

## 6. Pipeline Stage Smoke Tests

### 6.1 Dataset Ingestion Smoke Test
```bash
python3 -m src.data
```
**✅ RUN on 2026-09-03, real result:** Synthetic sample (64x64x64 @ 1.25mm) generated and loaded via NiBabel cleanly.

### 6.2 Preprocessing Verification
```bash
python3 -m src.preprocess
```
**✅ RUN on 2026-09-03, real result:** Resampled volume from (64, 64, 64) @ 1.25mm to isotropic (80, 80, 80) @ 1.0mm with z-score intensity normalization.

### 6.3 3D U-Net Segmentation Smoke Test
```bash
# Test 3D U-Net inference and 2D overlay slice generation
python3 -m backend.app.services.segment_service
```
**✅ RUN on 2026-09-03, real result:** 3D U-Net instantiated (4,806,481 parameters), sliding-window inference executed cleanly on (64, 64, 64) volume returning binary mask and volume estimate (120.85 cm³).

### 6.4 Quantitative Evaluation Smoke Test
```bash
# Test calculation of Dice, IoU, HD95, ASD, and confusion matrix
python3 -m backend.app.services.metrics_service
```
**✅ RUN on 2026-09-03, real result:** Dice Coefficient (0.9167), IoU (0.8462), HD95 (2.0 mm), and ASD (0.67 mm) computed cleanly with auto-resampling grid alignment.

### 6.5 3D Surface Reconstruction & STL Export
```bash
python3 -c "
from src.reconstruct import generate_surface_mesh, export_stl
import numpy as np
fake_mask = np.zeros((64, 64, 64), dtype=np.uint8)
fake_mask[20:44, 20:44, 20:44] = 1
mesh = generate_surface_mesh(fake_mask, spacing=(1.0, 1.0, 1.0))
export_stl(mesh, 'outputs/test_cube.stl')
print("Marching cubes and STL export verified.")
"
```

### 6.6 SimpleITK 3D Registration Smoke Test
```bash
# Test multi-resolution Euler3D/Affine registration on synthetic fixed-moving pair
python3 -m backend.app.services.register_service
```
**✅ RUN on 2026-09-03, real result:** Registration converged in 19 iterations with final Mutual Information metric `-2.05441`, recovering translation shifts (X: -3.75mm, Y: 2.72mm, Z: 2.27mm) and generating registered volume.

### 6.7 Multichannel & Spectral Feature Extraction Smoke Test
```bash
# Test extraction of 4-channel spectral volume (Intensity, Sobel, Laplacian, Gabor)
python3 -m backend.app.services.spectral_service
```
**✅ RUN on 2026-09-03, real result:** 4-Channel spectral volume (4, 48, 48, 48) generated and per-channel z-score normalized to exact zero-mean and unit-variance.

### 6.8 Clinical AI Diagnostic Report Smoke Test
```bash
# Test structured diagnostic report generation, Left Atrial Enlargement grading & Markdown export
python3 -m backend.app.services.report_service
```
**✅ RUN on 2026-09-03, real result:** Diagnostic report generated with Left Atrial Enlargement classification, volumetric biomarkers, sphericity index, and full Markdown export format.

### 6.9 Tri-Planar Navigation & Anatomical Probe Smoke Test
```bash
# Test real-time anatomical probing at voxel coordinates (z, y, x)
curl -s "http://localhost:8000/api/probe?file_id=sample_heart&z=32&y=32&x=32"
```
**✅ RUN on 2026-09-03, real result:** Probed voxel intensity (186.96), physical coordinates (X: 40.0mm, Y: 40.0mm, Z: 40.0mm), and anatomical structure labeling.

## 7. External Dependency Reachability Test

### 7.1 MSD Task02_Heart S3 Bucket
```bash
curl -s -I "https://msd-for-monai.s3-us-west-2.amazonaws.com/Task02_Heart.tar" | head -n 5
```
**✅ RUN on 2026-09-03, real result:** HTTP/1.1 200 OK, Content-Length: 455721472 bytes (455.7 MB). S3 bucket is directly accessible.

### 7.2 Hugging Face Hub Connectivity
```bash
python3 -c "
from huggingface_hub import HfApi
api = HfApi()
user_info = api.whoami() # Requires HF_TOKEN in environment
print(f"Authenticated HF User: {user_info['name']}")
"
```

## 8. Pre-Commit Checklist
```bash
# 1. Format check
python3 -m ruff check src/ app/

# 2. Syntax & import validation
python3 -m compileall src/ app/

# 3. Security check (Ensure no .env or token files are staged)
git status --short | grep -E "(\.env|\.pth|\.nii|\.tar)" && echo "WARNING: Staging large files or secrets!" || echo "Clean git status."
```

## 9. Common Failure Points & Fixes

| # | Symptom / Bug | Likely Cause | Fix |
|---|---|---|---|
| 1 | `ImportError` or blank UI when importing `stpyvista` inside Streamlit | Streamlit >= 1.50 broke backward compatibility with legacy component wrappers in `stpyvista 0.2.x`. | Pin `streamlit==1.40.0` and `stpyvista==0.1.4` in `requirements.txt`. |
| 2 | Out-Of-Memory (OOM) error during 3D U-Net training on Colab/Kaggle | Full 3D volumetric images exceed 16GB VRAM during batch forward passes. | Use `RandCropByPosNegLabeld` with patch size `(96, 96, 96)` or `(128, 128, 64)` and batch size 2 with mixed precision `torch.cuda.amp.autocast()`. |
| 3 | Marching Cubes fails with `ValueError: No surface found at isosurface value` | All-zero or empty segmentation mask passed to `skimage.measure.marching_cubes`. | Check `np.sum(mask) > 0` before running reconstruction; raise a user-friendly UI alert. |
| 4 | Hugging Face Hub upload error: `401 Unauthorized` / `403 Forbidden` | Expired, revoked, or read-only token provided. | Generate fine-grained Write-scope token in Hugging Face Settings and set `HF_TOKEN` environment variable. |
| 5 | SimpleITK registration divergence or extreme deformation | Fixed and moving volumes have drastically mismatched origin coordinates or initial orientations. | Run initial center-of-mass alignment using `sitk.CenteredTransformInitializer` before optimizer iterations. |
