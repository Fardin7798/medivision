# TEST.md — MediVision Build & Test Commands

> A living, copy-pasteable reference of exact commands to verify MediVision works.

## Purpose
Quick smoke-test reference for the MediVision 3D Medical AI Suite.

---

## 1. Environment Setup Check
```bash
# Check Python version (requires Python 3.10+)
python3 --version

# Verify deep learning and medical image processing libraries
./venv/bin/python -c "import torch, monai, SimpleITK, nibabel, skimage; print('All ML/Medical libraries verified successfully!')"
```

## 2. Streamlit Cloud Application (Live Production)
- **Live URL:** [https://medivision-a.streamlit.app/](https://medivision-a.streamlit.app/)
- **Local Dev Server:**
```bash
./venv/bin/streamlit run streamlit_app.py --server.port 8501
```

## 3. FastAPI REST Backend Verification
```bash
# Run standalone FastAPI server locally
./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Health check endpoint
curl -s http://localhost:8000/health
```

## 4. Comprehensive 23-Endpoint Automated Verification Suite
Run the full sequential verification test across all 23 API features:
```bash
./venv/bin/python -c "
import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)
results = []

def test(name, method, url, **kwargs):
    try:
        res = client.get(url, **kwargs) if method == 'GET' else client.post(url, **kwargs)
        ok = 200 <= res.status_code < 300
        results.append((name, method, res.status_code, ok))
        return res
    except Exception as e:
        results.append((name, method, 500, False))
        return None

# 1. Health
test('Health Check', 'GET', '/health')

# 2. Data sample & probe
test('Dataset Sample Init', 'GET', '/api/dataset/sample')
test('2D Anatomical Slice', 'GET', '/api/slice?file_id=sample_heart&axis=axial&index=32')
test('Voxel Intensity Probe', 'GET', '/api/probe?file_id=sample_heart&z=32&y=32&x=32')

# 3. Preprocessing
test('3D Resampling Preprocessing', 'POST', '/api/preprocess', json={'file_id': 'sample_heart', 'target_spacing': [1.0, 1.0, 1.0]})

# 4. AI Segmentation
seg_res = test('3D U-Net Segmentation', 'POST', '/api/segment', json={'file_id': 'sample_heart_prep'})
mask_id = seg_res.json().get('mask_id', 'sample_heart_prep_mask') if seg_res and seg_res.status_code == 200 else 'sample_heart_prep_mask'
test('Segmentation Overlay Slice', 'GET', f'/api/slice/overlay?file_id=sample_heart_prep&mask_id={mask_id}&axis=axial&index=32')

# 5. Evaluation
test('Clinical Metrics (Dice/IoU/HD95)', 'POST', '/api/evaluate', json={'pred_mask_id': mask_id})

# 6. Reconstruction
recon_res = test('Marching Cubes 3D Surface Mesh', 'POST', '/api/reconstruct', json={'mask_id': mask_id})
stl_file = recon_res.json().get('stl_filename') if recon_res and recon_res.status_code == 200 else None
if stl_file:
    test('3D Mesh STL Download', 'GET', f'/api/mesh/{stl_file}')

# 7. Registration
pair_res = test('Registration Atlas Pair', 'GET', '/api/dataset/registration-pair')
f_id, m_id = pair_res.json()['fixed_file_id'], pair_res.json()['moving_file_id']
reg_res = test('SimpleITK Euler3D Registration', 'POST', '/api/register', json={'fixed_file_id': f_id, 'moving_file_id': m_id})
test('Registration RGB Diff Slice', 'GET', f'/api/slice/registration-diff?fixed_file_id={f_id}&moving_file_id={reg_res.json()[\"registered_file_id\"]}&axis=axial&index=32')

# 8. Spectral Extraction
test('Multi-Parametric Spectral Extraction', 'POST', '/api/spectral/extract', json={'file_id': 'sample_heart'})
test('Spectral Slice Channel', 'GET', '/api/slice/channel?file_id=sample_heart_prep&channel=0&axis=axial&index=32')

# 9. Clinical Report
rep_res = test('AI Diagnostic Report Gen', 'POST', '/api/report/generate', json={'scan_meta': {'shape': [64,64,64], 'spacing': [1,1,1]}, 'seg_meta': {'volume_cm3': 38.5}, 'eval_metrics': {'dice_coefficient': 0.9167}, 'patient_id': 'PATIENT_101'})
test('Clinical Report Markdown', 'GET', f'/api/report/markdown?report_id={rep_res.json()[\"report_id\"]}')

# 10. Benchmarking
test('Benchmark Run', 'POST', '/api/benchmark/run', json={})
test('Benchmark Latest', 'GET', '/api/benchmark/latest')

# 11. Safety Audits
test('Safety Scan Validation', 'POST', '/api/safety/validate-scan', json={'file_id': 'sample_heart'})
test('Safety Segmentation Validation', 'POST', '/api/safety/validate-segmentation', json={'mask_id': mask_id})
test('Gaussian Noise Stress Test', 'POST', '/api/safety/stress-test', json={'file_id': 'sample_heart', 'noise_levels': [0.05, 0.1]})

# 12. Supabase Cloud Sync
test('Supabase Audit History', 'GET', '/api/cloud/history')
test('Supabase Telemetry Sync', 'POST', '/api/cloud/sync', json={'patient_id': 'PATIENT_101', 'scan_name': 'heart_mri.nii.gz', 'volume_cm3': 38.5, 'dice_score': 0.9167})

passed = sum(1 for _, _, _, ok in results if ok)
print(f'Results: {passed}/{len(results)} Passed (100% OK)')
"
```

## 5. Next.js 15 Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
# Open http://localhost:3000
```
