"""MediVision FastAPI Application Entrypoint."""
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes_data import router as data_router
from backend.app.api.routes_preprocess import router as prep_router
from backend.app.api.routes_segment import router as seg_router
from backend.app.api.routes_evaluate import router as eval_router
from backend.app.api.routes_reconstruct import router as recon_router
from backend.app.api.routes_register import router as reg_router
from backend.app.api.routes_spectral import router as spectral_router
from backend.app.api.routes_report import router as report_router
from backend.app.api.routes_benchmark import router as bench_router
from backend.app.config import get_config

cfg = get_config()

app = FastAPI(
    title=cfg["project"]["name"],
    version=cfg["project"]["version"],
    description=cfg["project"]["description"],
)

# Enable CORS for Next.js frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register sub-routers
app.include_router(data_router)
app.include_router(prep_router)
app.include_router(seg_router)
app.include_router(eval_router)
app.include_router(recon_router)
app.include_router(reg_router)
app.include_router(spectral_router)
app.include_router(report_router)
app.include_router(bench_router)

@app.get("/health")
def health_check():
    """System health check endpoint."""
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU"
    return {
        "status": "healthy",
        "service": "MediVision Medical AI Backend",
        "version": cfg["project"]["version"],
        "device": device_name,
        "cuda": cuda_available,
        "disclaimer": cfg["project"]["disclaimer"],
    }
