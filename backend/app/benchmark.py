"""CLI Benchmark Runner for MediVision."""
import argparse
from backend.app.services.benchmark_service import run_pipeline_benchmark

def main():
    parser = argparse.ArgumentParser(description="Run MediVision 3D Pipeline Benchmark")
    parser.add_argument("--cases", type=int, default=3, help="Number of benchmark test cases to process")
    parser.add_argument("--output-dir", type=str, default="./outputs/benchmark", help="Output directory")
    args = parser.parse_args()

    results = run_pipeline_benchmark(num_cases=args.cases, output_dir=args.output_dir)
    print("\n🚀 MediVision Benchmark Complete!")
    print(f"Mean Pipeline Latency: {results['latency_stats_sec']['mean']}s")
    print(f"Throughput: {results['throughput_cases_per_min']} scans/minute")
    print(f"Mean Dice Score: {results['segmentation_accuracy']['mean_dice']}")

if __name__ == "__main__":
    main()
