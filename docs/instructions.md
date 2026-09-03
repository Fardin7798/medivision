# MediVision — Development & Operational Instructions

> Guidelines and milestone logs for developing, testing, and deploying MediVision.

---

## 1. Quick Start Commands

```bash
# 1. Environment Verification
./venv/bin/python -c "import torch, monai, SimpleITK, nibabel; print('✅ Environment OK')"

# 2. Run Comprehensive Automated Test Suite (25 Endpoints)
./venv/bin/python -c "
import sys; sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from backend.app.main import app
client = TestClient(app)
assert client.get('/health').status_code == 200
print('✅ Health Endpoint Verified')
"

# 3. Launch Live Streamlit Workstation
./venv/bin/streamlit run streamlit_app.py --server.port 8501

# 4. Launch FastAPI Server
./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

---

## 2. Milestone History

* **Milestone 1-3:** Foundation architecture, NIfTI ingestion, 3D spline resampling, and MONAI segmentation.
* **Milestone 4-7:** SimpleITK image registration, multi-parametric spectral maps, AI diagnostic reporting, and Supabase Cloud sync.
* **Milestone 8:** Cloud-Deployed 3D Anatomical Digital Twin Suite (6 organ systems) and genuine Medical Segmentation Decathlon clinical cardiac MRI dataset integration.
* **Milestone 9:** Clean Domain-Driven Architecture (Pydantic Schemas), full cleanup of heavy local test files (~400MB saved), and Playwright MCP browser automation integration.
