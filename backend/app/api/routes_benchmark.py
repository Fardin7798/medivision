"""Multi-Case Pipeline Benchmark API endpoints."""
from fastapi import APIRouter, HTTPException, Body, Query
from backend.app.services.benchmark_service import run_pipeline_benchmark

router = APIRouter(prefix="/api", tags=["Benchmark"])

# In-memory cached latest benchmark run
LATEST_BENCHMARK = None

@router.post("/benchmark/run")
def run_benchmark_endpoint(payload: dict = Body(...)):
    """Execute end-to-end multi-case benchmark suite and return granular stage latencies & metrics."""
    num_cases = payload.get("num_cases", 3)
    num_cases = max(1, min(int(num_cases), 10)) # Clamped between 1 and 10

    results = run_pipeline_benchmark(num_cases=num_cases)
    global LATEST_BENCHMARK
    LATEST_BENCHMARK = results

    return {
        "status": "success",
        "benchmark_summary": results,
    }

@router.get("/benchmark/latest")
def get_latest_benchmark():
    """Retrieve latest benchmark execution results."""
    global LATEST_BENCHMARK
    if LATEST_BENCHMARK is None:
        # Run a quick 1-case benchmark if none exists
        LATEST_BENCHMARK = run_pipeline_benchmark(num_cases=1)
    return {
        "status": "success",
        "benchmark_summary": LATEST_BENCHMARK,
    }
