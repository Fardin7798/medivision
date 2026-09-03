"use client";
import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  CheckCircle2, 
  Activity, 
  Target, 
  Ruler, 
  PieChart, 
  Percent,
  Play,
  FileCheck
} from "lucide-react";
import { generateSyntheticSample, preprocessScan } from "@/lib/api";

interface MetricsData {
  dice_coefficient: number;
  iou_jaccard: number;
  precision: number;
  recall_sensitivity: number;
  specificity: number;
  volumetric_similarity: number;
  hausdorff_distance_95_mm: number;
  average_surface_distance_mm: number;
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    false_negative: number;
    true_negative: number;
  };
  pred_volume_cm3: number;
  gt_volume_cm3: number;
  volume_difference_cm3: number;
}

export default function EvaluatePage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [prepId, setPrepId] = useState<string>("");
  const [maskId, setMaskId] = useState<string>("");

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const sample = await generateSyntheticSample();
        const prep = await preprocessScan(sample.file_id);
        setPrepId(prep.preprocessed_file_id);
        
        // Trigger segmentation
        const segRes = await fetch("http://localhost:8000/api/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: prep.preprocessed_file_id }),
        });
        const segData = await segRes.json();
        setMaskId(segData.mask_id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRunEvaluation = async () => {
    if (!maskId) return;
    setEvalLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pred_mask_id: maskId }),
      });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 color="var(--accent-cyan)" />
            Quantitative Clinical Evaluation & Validation Suite
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Benchmark segmentation predictions against ground truth masks across overlap, surface boundary, and volume metrics.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evalLoading || !maskId}
          className="gradient-btn"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            cursor: evalLoading ? "not-allowed" : "pointer",
            opacity: evalLoading ? 0.7 : 1,
          }}
        >
          <Play size={16} />
          <span>{evalLoading ? "Calculating Metrics..." : "Run Clinical Evaluation"}</span>
        </button>
      </div>

      {/* Main Scorecards */}
      {metrics ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
            {[
              { label: "Dice Similarity (DSC)", val: `${(metrics.dice_coefficient * 100).toFixed(1)}%`, desc: "Overlap Index (Target > 70%)", icon: Target, color: "var(--accent-cyan)" },
              { label: "IoU (Jaccard Index)", val: `${(metrics.iou_jaccard * 100).toFixed(1)}%`, desc: "Intersection over Union", icon: Percent, color: "var(--accent-blue)" },
              { label: "95% Hausdorff Distance", val: `${metrics.hausdorff_distance_95_mm} mm`, desc: "Max boundary contour error", icon: Ruler, color: "var(--accent-amber)" },
              { label: "Avg Surface Distance", val: `${metrics.average_surface_distance_mm} mm`, desc: "Mean boundary separation", icon: Activity, color: "var(--accent-emerald)" },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-panel" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{card.label}</span>
                    <Icon size={18} color={card.color} />
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {card.val}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{card.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Secondary Detailed Metrics & Confusion Matrix */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
            {/* Detailed Accuracy Table */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileCheck size={18} color="var(--accent-cyan)" />
                Classification & Volumetric Metrics
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { name: "Precision (Positive Predictive Value)", val: `${(metrics.precision * 100).toFixed(2)}%` },
                  { name: "Recall / Sensitivity", val: `${(metrics.recall_sensitivity * 100).toFixed(2)}%` },
                  { name: "Specificity (True Negative Rate)", val: `${(metrics.specificity * 100).toFixed(2)}%` },
                  { name: "Volumetric Similarity Index", val: `${(metrics.volumetric_similarity * 100).toFixed(2)}%` },
                  { name: "Predicted Organ Volume", val: `${metrics.pred_volume_cm3} cm³` },
                  { name: "Ground Truth Organ Volume", val: `${metrics.gt_volume_cm3} cm³` },
                  { name: "Absolute Volume Difference", val: `${metrics.volume_difference_cm3} cm³` },
                ].map((row, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    fontSize: "0.875rem",
                  }}>
                    <span style={{ color: "var(--text-secondary)" }}>{row.name}</span>
                    <span style={{ fontWeight: 600, fontFamily: "monospace", color: "var(--text-primary)" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voxel Confusion Matrix Card */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <PieChart size={18} color="var(--accent-indigo)" />
                Voxel-Wise Confusion Matrix
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 600 }}>True Positives (TP)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                    {metrics.confusion_matrix.true_positive.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-rose)", fontWeight: 600 }}>False Positives (FP)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                    {metrics.confusion_matrix.false_positive.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 600 }}>False Negatives (FN)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                    {metrics.confusion_matrix.false_negative.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 600 }}>True Negatives (TN)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                    {metrics.confusion_matrix.true_negative.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Activity size={36} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>No Evaluation Calculated Yet</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "500px" }}>
            Click &ldquo;Run Clinical Evaluation&rdquo; above to compute Dice Similarity, Jaccard IoU, Hausdorff 95, and voxel confusion statistics against reference ground truth.
          </p>
        </div>
      )}
    </div>
  );
}
