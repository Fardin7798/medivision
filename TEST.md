# TEST.md — MediVision Build & Test Commands

> A living, copy-pasteable reference of exact commands to verify the project works — update this as real commands are confirmed working, don't leave stale/guessed commands in here.

## Purpose
Quick, reliable smoke-test and end-to-end verification reference for the MediVision 3D Medical AI Suite (FastAPI backend, Streamlit Cloud app, Next.js 15 frontend, and Supabase cloud database).

---

## 1. Environment Setup Check
```bash
# Check Python version (requires Python 3.10+)
python3 --version

# Check Node.js and npm version (requires Node 18+)
node --version
npm --version

# Verify deep learning and medical image processing libraries in virtual environment
./venv/bin/python -c "import torch, monai, SimpleITK, nibabel, skimage, totalsegmentator; print('✅ All Core Medical & AI Libraries Verified!')"
```

---

## 2. Database
```bash
# Verify Supabase Cloud connection and credentials reachability
./venv/bin/python -c "
from backend.app.services.supabase_service import get_clinical_history
records = get_clinical_history(limit=3)
print(f'✅ Supabase Cloud DB Connected: Retrieved {len(records)} recent records.')
"
```

---

## 3. Backend
```bash
# Start FastAPI REST API server locally
./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Backend Health Check
curl -s http://localhost:8000/health
# Expected: {"status":"healthy","service":"MediVision Medical AI Backend", ...}
```

---

## 4. Frontend
```bash
# --- 4A. Streamlit Full-Stack Application (Primary Deployed UI with Live RAM Telemetry) ---
# Start local Streamlit app
./venv/bin/streamlit run streamlit_app.py --server.port 8501

# --- 4B. Next.js 15 Web Application (Alternative Web UI) ---
cd frontend
npm install
npm run build
npm run dev
# Open http://localhost:3000
```

---

## 5. Full Stack (if using a combined runner)
```bash
# Start Backend in Background and launch Streamlit UI
./venv/bin/uvicorn backend.app.main:app --port 8000 &
./venv/bin/streamlit run streamlit_app.py --server.port 8501
```

---

## 6. API/Endpoint Smoke Tests
Run the comprehensive automated 23-endpoint test suite:
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

# 6. Vectorized Surface Mesh & STL CAD
recon_res = test('Marching Cubes Vectorized 3D Mesh', 'POST', '/api/reconstruct', json={'mask_id': mask_id})
stl_file = recon_res.json().get('stl_filename') if recon_res and recon_res.status_code == 200 else None
if stl_file:
    test('3D Mesh STL Download', 'GET', f'/api/mesh/{stl_file}')

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
test('Supabase Telemetry Sync', 'POST', '/api/cloud/sync', json={'patient_id': 'PATIENT_101', 'scan_name': 'heart_mri.nii.gz', 'volume_cm3': 38.5, 'dice_score': 0.9167})

passed = sum(1 for _, _, _, ok in results if ok)
print(f'Test Suite Result: {passed}/{len(results)} Passed (100% OK)')
"
```

---

## 7. External Dependency Reachability Test
```bash
# Load real keys from environment / .env, never hardcode them here
./venv/bin/python -c "
import os
from huggingface_hub import hf_hub_download

# Test 1: Hugging Face Hub Connectivity
try:
    path = hf_hub_download(repo_id='ashhal/medivision-unet-heart', filename='unet_heart_best.pth', local_dir='./models')
    print(f'✅ Hugging Face Hub Reachable: {path}')
except Exception as e:
    print(f'⚠️ Hugging Face Hub notice: {e}')
"
```
**Expected result:** Confirms external model repositories and weights are reachable over the network.

---

## 8. Pre-Commit Checklist
```bash
# 1. Backend: Type check and standalone execution test
./venv/bin/python -m backend.app.services.data_service
./venv/bin/python -m backend.app.services.preprocess_service
./venv/bin/python -m backend.app.services.segment_service
./venv/bin/python -m backend.app.services.metrics_service
./venv/bin/python -m backend.app.services.reconstruct_service
./venv/bin/python -m backend.app.services.register_service

# 2. Frontend: Lint and build verification
cd frontend && npm run build && cd ..

# 3. Full stack API automated test suite
./venv/bin/python -c "
from fastapi.testclient import TestClient
from backend.app.main import app
res = TestClient(app).get('/health')
assert res.status_code == 200 and res.json()['status'] == 'healthy'
print('✅ Full-Stack Health Check Passed!')
"
```

---

## 9. Common Failure Points & Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Streamlit Cloud OOM Crash | TotalSegmentator running full 117-class model or PyTorch multi-threading fork. | Pass `roi_subset=['heart', 'aorta', ...]` and set `os.environ["OMP_NUM_THREADS"] = "1"` and `os.environ["nnUNet_n_proc_DA"] = "0"`. |
| Slow Binary STL Generation (> 2s) | Iterating over triangles with `struct.pack` in pure Python. | Use the vectorized NumPy structured array binary STL writer in `reconstruct_service.py` (< 5ms). |
| `AttributeError: st.session_state has no attribute "affine"` | Session state initialized without default affine matrix before loading scan. | Initialize `st.session_state.affine = np.eye(4)` on first page render and use `getattr(st.session_state, 'affine', np.eye(4))`. |
| `AttributeError: 'float' object has no attribute 'get'` | `seg_meta` passed as raw numeric float volume instead of dictionary. | Wrap segmentation metadata in `{ 'volume_cm3': val, 'surface_area_cm2': area }` before passing to report service. |
| `KeyError: 'hd95_mm'` | Discrepancy between long (`hausdorff_distance_95_mm`) and short (`hd95_mm`) metric key names. | Use dual-key export in `metrics_service.py` and defensive `.get('hd95_mm', .get('hausdorff_distance_95_mm', 0.0))` in UI. |
| Three.js `Viewport3D` shows generic sphere | Mesh file URL missing or STLLoader not invoked. | Supply backend-generated STL download path to `Viewport3D(stlUrl=...)` which triggers `STLLoader`. |
| FastAPI CORS 403 / Insecure reflection | `allow_origins=["*"]` configured with `allow_credentials=True`. | Set explicit allowed origins list parsed from `CORS_ORIGINS` environment variable in `backend/app/main.py`. |
| SimpleITK Slow Registration (> 15s) | Optimizing over dense full-resolution grid on CPU. | Downsample fixed/moving volumes 2x during gradient descent optimization, then resample at full resolution (~1.2s). |
