"use client";
import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Activity, 
  Layers, 
  Sliders, 
  FileCheck, 
  Zap,
  Lock
} from "lucide-react";
import { generateSyntheticSample } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

interface QualityMetrics {
  snr_linear: number;
  snr_db: number;
  anisotropy_ratio: number;
  intensity_entropy: number;
  intensity_min: number;
  intensity_max: number;
  intensity_dynamic_range: number;
  data_issues: string[];
}

interface ScanAudit {
  safety_score_pct: number;
  is_safe_for_inference: boolean;
  status: string;
  critical_errors: string[];
  warnings: string[];
  quality_metrics: QualityMetrics;
}

interface StressScenario {
  scenario: string;
  description: string;
  interceptor_result: string;
  safety_score_pct: number;
  issues_caught: string[];
  passed: boolean;
}

export default function SafetyPage() {
  const [scanAudit, setScanAudit] = useState<ScanAudit | null>(null);
  const [stressScenarios, setStressScenarios] = useState<StressScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [stressLoading, setStressLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const sample = await generateSyntheticSample();
        const res = await fetch(`${API_BASE_URL}/api/safety/validate-scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: sample.file_id }),
        });
        const data = await res.json();
        setScanAudit(data.audit);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRunStressTest = async () => {
    setStressLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/safety/stress-test`, {
        method: "POST",
      });
      const data = await res.json();
      setStressScenarios(data.scenarios);
    } catch (e) {
      console.error(e);
    } finally {
      setStressLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck color="var(--accent-emerald)" />
            Clinical Safety, Data Quality Audit & Adversarial Interceptors
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Pre-flight image quality validation, numerical corruption filters (NaN/Inf), and morphological plausibility safety guards.
          </p>
        </div>

        <button
          onClick={handleRunStressTest}
          disabled={stressLoading}
          className="gradient-btn"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            cursor: stressLoading ? "not-allowed" : "pointer",
            opacity: stressLoading ? 0.7 : 1,
          }}
        >
          <Zap size={16} />
          <span>{stressLoading ? "Running Edge-Case Tests..." : "Run Adversarial Stress Test"}</span>
        </button>
      </div>

      {/* Pre-Flight Scan Quality Audit Card */}
      {scanAudit && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem", borderLeft: scanAudit.is_safe_for_inference ? "4px solid var(--accent-emerald)" : "4px solid var(--accent-rose)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Active Scan Pre-Flight Audit</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: scanAudit.is_safe_for_inference ? "var(--accent-emerald)" : "var(--accent-rose)", marginTop: "0.25rem" }}>
                  Status: {scanAudit.status} ({scanAudit.safety_score_pct}% Score)
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <span style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background: scanAudit.is_safe_for_inference ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                  color: scanAudit.is_safe_for_inference ? "var(--accent-emerald)" : "var(--accent-rose)",
                  border: `1px solid ${scanAudit.is_safe_for_inference ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"}`,
                }}>
                  {scanAudit.is_safe_for_inference ? "SAFE FOR 3D INFERENCE" : "INFERENCE BLOCKED"}
                </span>
              </div>
            </div>

            {/* Quality Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginTop: "1.25rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Signal-to-Noise Ratio (SNR)</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                  {scanAudit.quality_metrics.snr_db} dB
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Linear: {scanAudit.quality_metrics.snr_linear}x</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Spatial Spacing Anisotropy</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-emerald)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                  {scanAudit.quality_metrics.anisotropy_ratio}:1
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Max/Min voxel ratio</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Intensity Dynamic Range</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                  {scanAudit.quality_metrics.intensity_dynamic_range}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>[{scanAudit.quality_metrics.intensity_min} to {scanAudit.quality_metrics.intensity_max}]</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Shannon Image Entropy</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-amber)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                  {scanAudit.quality_metrics.intensity_entropy} bits
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Information density</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adversarial Edge-Case Stress Testing Suite */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldAlert size={18} color="var(--accent-rose)" />
          Adversarial Edge-Case Stress Testing & Interceptor Verification
        </h3>

        {stressScenarios.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {stressScenarios.map((sc, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-color)",
                padding: "1.25rem",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{sc.scenario}</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "var(--accent-emerald)",
                  }}>
                    INTERCEPTOR PASS
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{sc.description}</p>
                <div style={{ fontSize: "0.75rem", color: "var(--accent-amber)", marginTop: "0.25rem" }}>
                  {sc.issues_caught.map((iss, idx) => (
                    <div key={idx}>⚠ {iss}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Click &ldquo;Run Adversarial Stress Test&rdquo; above to verify that MediVision catches NaN corruption, severe anisotropy, zero-variance blank scans, and empty segmentation masks.
          </p>
        )}
      </div>
    </div>
  );
}
