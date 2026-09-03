"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { 
  Gauge, 
  Play, 
  Clock, 
  Zap, 
  Target, 
  Cpu, 
  CheckCircle2, 
  Activity, 
  Layers,
  FileCheck
} from "lucide-react";

interface CaseDetail {
  case_id: string;
  raw_shape: number[];
  resampled_shape: number[];
  timings_sec: {
    ingestion_sec: number;
    preprocessing_sec: number;
    segmentation_sec: number;
    evaluation_sec: number;
    reconstruction_sec: number;
    report_generation_sec: number;
    total_latency_sec: number;
  };
  metrics: {
    dice_coefficient: number;
    iou_jaccard: number;
    hd95_mm: number;
    volume_cm3: number;
    surface_area_cm2: number;
    num_vertices: number;
    num_faces: number;
  };
  diagnosis: string;
}

interface BenchmarkSummary {
  num_cases_evaluated: number;
  total_benchmark_duration_sec: number;
  throughput_cases_per_min: number;
  latency_stats_sec: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
  segmentation_accuracy: {
    mean_dice: number;
    mean_iou: number;
    mean_hd95_mm: number;
    mean_volume_cm3: number;
  };
  stage_latency_breakdown_sec: {
    ingestion_mean_sec: number;
    preprocessing_mean_sec: number;
    segmentation_mean_sec: number;
    evaluation_mean_sec: number;
    reconstruction_mean_sec: number;
    report_mean_sec: number;
  };
  case_details: CaseDetail[];
}

export default function BenchmarkPage() {
  const [benchmark, setBenchmark] = useState<BenchmarkSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [caseCount, setCaseCount] = useState(3);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/benchmark/latest`);
        if (res.ok) {
          const data = await res.json();
          setBenchmark(data.benchmark_summary);
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const handleRunBenchmark = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/benchmark/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_cases: caseCount }),
      });
      if (!res.ok) throw new Error("Benchmark failed");
      const data = await res.json();
      setBenchmark(data.benchmark_summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Gauge color="var(--accent-cyan)" />
            Multi-Case End-to-End Pipeline Benchmark Suite
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Automated stress-testing across full volumetric ingestion, preprocessing, U-Net inference, mesh extraction, and clinical reporting.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <select
            value={caseCount}
            onChange={(e) => setCaseCount(parseInt(e.target.value))}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <option value={2}>2 Test Cases</option>
            <option value={3}>3 Test Cases</option>
            <option value={5}>5 Test Cases</option>
          </select>

          <button
            onClick={handleRunBenchmark}
            disabled={loading}
            className="gradient-btn"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Play size={16} />
            <span>{loading ? "Benchmarking Pipeline..." : "Execute Benchmark Suite"}</span>
          </button>
        </div>
      </div>

      {benchmark ? (
        <>
          {/* Top Level Benchmark Scorecards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Mean Pipeline Latency</span>
                <Clock size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "monospace" }}>
                {benchmark.latency_stats_sec.mean}s
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Min: {benchmark.latency_stats_sec.min}s | Max: {benchmark.latency_stats_sec.max}s
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>System Throughput</span>
                <Zap size={18} color="var(--accent-emerald)" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-emerald)", fontFamily: "monospace" }}>
                {benchmark.throughput_cases_per_min}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Scans processed / minute
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Mean Dice Score</span>
                <Target size={18} color="var(--accent-blue)" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "monospace" }}>
                {(benchmark.segmentation_accuracy.mean_dice * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Across {benchmark.num_cases_evaluated} benchmark cases
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Mean Boundary Error</span>
                <Activity size={18} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-amber)", fontFamily: "monospace" }}>
                {benchmark.segmentation_accuracy.mean_hd95_mm} mm
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                95% Hausdorff distance
              </div>
            </div>
          </div>

          {/* Granular Stage Latency Breakdown Grid */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={18} color="var(--accent-cyan)" />
              Granular Pipeline Stage Latency Breakdown (Mean CPU Execution)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1rem" }}>
              {[
                { name: "1. Ingestion", val: benchmark.stage_latency_breakdown_sec.ingestion_mean_sec, color: "var(--accent-blue)" },
                { name: "2. Resample (1mm)", val: benchmark.stage_latency_breakdown_sec.preprocessing_mean_sec, color: "var(--accent-cyan)" },
                { name: "3. 3D U-Net", val: benchmark.stage_latency_breakdown_sec.segmentation_mean_sec, color: "var(--accent-emerald)" },
                { name: "4. Evaluation", val: benchmark.stage_latency_breakdown_sec.evaluation_mean_sec, color: "var(--accent-amber)" },
                { name: "5. Marching Cubes", val: benchmark.stage_latency_breakdown_sec.reconstruction_mean_sec, color: "var(--accent-rose)" },
                { name: "6. AI Report", val: benchmark.stage_latency_breakdown_sec.report_mean_sec, color: "var(--accent-indigo)" },
              ].map((stage, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{stage.name}</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: stage.color, fontFamily: "monospace", marginTop: "0.25rem" }}>
                    {stage.val}s
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Per-Case Table */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileCheck size={18} color="var(--accent-cyan)" />
              Individual Benchmark Case Results
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Case ID</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Dimensions</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Total Latency</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Dice (DSC)</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Volume</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>3D Mesh Triangles</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.case_details.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--accent-cyan)", fontFamily: "monospace" }}>{c.case_id}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>{c.raw_shape.join("x")}</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{c.timings_sec.total_latency_sec}s</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--accent-emerald)", fontFamily: "monospace" }}>{(c.metrics.dice_coefficient * 100).toFixed(1)}%</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>{c.metrics.volume_cm3} cm³</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>{c.metrics.num_faces.toLocaleString()}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>{c.diagnosis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Click &ldquo;Execute Benchmark Suite&rdquo; above to run automated multi-case pipeline benchmarking.</p>
        </div>
      )}
    </div>
  );
}
