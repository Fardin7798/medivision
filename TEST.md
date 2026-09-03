# TEST.md — MediVision Build & Test Commands

> A living, copy-pasteable reference of exact commands to verify the project works — updated with the Cloud-Deployed 3D Anatomical Digital Twin Suite and Real Clinical Decathlon MRI Datasets.

## Purpose
Quick, reliable smoke-test and end-to-end verification reference for the MediVision 3D Medical AI Suite (FastAPI backend, Streamlit Cloud app, Next.js 15 frontend, and Supabase cloud database).

---

## 1. Environment Setup Check
```bash
# Check Python version (requires Python 3.10+)
python3 --version

# Verify deep learning and medical image processing libraries in virtual environment
./venv/bin/python -c "import torch, monai, SimpleITK, nibabel, skimage; print('✅ All Core Medical & AI Libraries Verified!')"
```

---

## 2. Clinical Dataset Verification
```bash
# Verify real patient 3D cardiac MRI scan from Medical Segmentation Decathlon
./venv/bin/python -c "
import nibabel as nib
img = nib.load('data/clinical_sample/train/la_003/la_003.nii.gz')
lbl = nib.load('data/clinical_sample/train/la_003/la_003_gt.nii.gz')
print(f'✅ Real Patient Cardiac MRI Verified: Shape={img.shape}, Spacing={img.header.get_zooms()[:3]}')
print(f'✅ Real Ground Truth Mask Verified: Shape={lbl.shape}, Voxels={lbl.get_fdata().sum()}')
"
```

---

## 3. Database Connection
```bash
# Verify Supabase Cloud connection and credentials reachability
./venv/bin/python -c "
from backend.app.services.supabase_service import get_clinical_history
records = get_clinical_history(limit=3)
print(f'✅ Supabase Cloud DB Connected: Retrieved {len(records)} recent records.')
"
```

---

## 4. Backend Server & Health Check
```bash
# Start FastAPI REST API server locally
./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Backend Health Check
curl -s http://localhost:8000/health
# Expected: {"status":"healthy","service":"MediVision Medical AI Backend", ...}
```

---

## 5. Frontend & UI
```bash
# Launch Streamlit Full-Stack Application (with Cloud 3D Digital Twin Suite & Live RAM Monitor)
./venv/bin/streamlit run streamlit_app.py --server.port 8501
```

---

## 6. Full API / Endpoint Automated Smoke Tests
Run the comprehensive automated test suite:
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
        print(f'[{res.status_code}] {method} {url} -> {ok}')
        return res
    except Exception as e:
        results.append((name, method, 500, False))
        print(f'[500 ERROR] {method} {url} -> {e}')
        return None

# 1. Health
test('Health Check', 'GET', '/health')

# 2. Data Ingestion & MPR
test('Dataset Sample Init', 'GET', '/api/dataset/sample')
test('2D Anatomical Slice', 'GET', '/api/slice?file_id=sample_heart&axis=axial&index=32')
test('Voxel Intensity Probe', 'GET', '/api/probe?file_id=sample_heart&z=32&y=32&x=32')

# 3. Preprocessing
test('3D Spline Preprocessing', 'POST', '/api/preprocess', json={'file_id': 'sample_heart', 'target_spacing': [1.0, 1.0, 1.0]})

# 4. 3D AI Segmentation (CPU-Optimized)
seg_res = test('3D AI Segmentation', 'POST', '/api/segment', json={'file_id': 'sample_heart_prep', 'engine': 'totalsegmentator', 'target_structure': 'heart'})
mask_id = seg_res.json().get('mask_id', 'sample_heart_prep_mask') if seg_res and seg_res.status_code == 200 else 'sample_heart_prep_mask'
test('Segmentation Overlay Slice', 'GET', f'/api/slice/overlay?file_id=sample_heart_prep&mask_id={mask_id}&axis=axial&index=32')

# 5. Clinical Metrics
test('Clinical Metrics (Dice/IoU/HD95)', 'POST', '/api/evaluate', json={'pred_mask_id': mask_id})

# 6. Cloud-Deployed 3D Digital Twin Catalog & Models
test('Cloud 3D Model Catalog', 'GET', '/api/3d/catalog')
test('Cloud 3D Heart Model Embed', 'GET', '/api/3d/model/cardiac_animated_4k')
test('Cloud 3D Iframe HTML', 'GET', '/api/3d/embed/cardiac_animated_4k')

# 7. Fast 2x Image Registration
pair_res = test('Registration Atlas Pair', 'GET', '/api/dataset/registration-pair')
f_id, m_id = pair_res.json()['fixed_file_id'], pair_res.json()['moving_file_id']
reg_res = test('SimpleITK Euler3D Registration', 'POST', '/api/register', json={'fixed_file_id': f_id, 'moving_file_id': m_id})
test('Registration RGB Diff Slice', 'GET', f'/api/slice/registration-diff?fixed_file_id={f_id}&moving_file_id={reg_res.json()[\"registered_file_id\"]}&axis=axial&index=32')

# 8. On-Demand Spectral Gradients
test('Multi-Parametric Spectral Extraction', 'POST', '/api/spectral/extract', json={'file_id': 'sample_heart'})
test('Spectral Slice Channel', 'GET', '/api/slice/channel?file_id=sample_heart_prep&channel=0&axis=axial&index=32')

# 9. AI Radiologist Report
rep_res = test('AI Diagnostic Report Gen', 'POST', '/api/report/generate', json={'scan_meta': {'shape': [64,64,64], 'spacing': [1,1,1]}, 'seg_meta': {'volume_cm3': 38.5}, 'eval_metrics': {'dice_coefficient': 0.9167}, 'patient_id': 'PATIENT_101'})
test('Clinical Report Markdown', 'GET', f'/api/report/markdown?report_id={rep_res.json()[\"report_id\"]}')

# 10. Pipeline Latency Benchmarking
test('Benchmark Run', 'POST', '/api/benchmark/run', json={})
test('Benchmark Latest', 'GET', '/api/benchmark/latest')

# 11. Safety Interceptors & QA
test('Safety Scan Validation', 'POST', '/api/safety/validate-scan', json={'file_id': 'sample_heart'})
test('Safety Segmentation Validation', 'POST', '/api/safety/validate-segmentation', json={'mask_id': mask_id})
test('Gaussian Noise Stress Test', 'POST', '/api/safety/stress-test', json={'file_id': 'sample_heart', 'noise_levels': [0.05, 0.1]})

# 12. Supabase Cloud Sync
test('Supabase Audit History', 'GET', '/api/cloud/history')
test('Supabase Telemetry Sync', 'POST', '/api/cloud/sync', json={
    'patient_id': 'PATIENT_MSD_101',
    'scan_id': 'scan_la_003',
    'filename': 'MSD_la_003.nii.gz',
    'volume_cm3': 38.5,
    'voxel_count': 38500,
    'dice_coefficient': 0.9167,
    'iou_jaccard': 0.8462,
    'hd95_mm': 1.82,
    'asd_mm': 0.65,
    'shape': [192, 192, 130],
    'spacing': [1.25, 1.25, 1.37],
})

passed = sum(1 for _, _, _, ok in results if ok)
print(f'Test Suite Result: {passed}/{len(results)} Passed ({round(passed/len(results)*100)}% OK)')
"
```
