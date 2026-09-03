"use client";
import React, { useState, useEffect } from "react";
import { BrainCircuit, Play, CheckCircle2, Activity, BarChart2, Layers } from "lucide-react";
import SliceViewer from "@/components/SliceViewer";
import Viewport3D from "@/components/Viewport3D";
import { generateSyntheticSample, preprocessScan, getSliceImageUrl } from "@/lib/api";

export default function SegmentPage() {
  const [fileId, setFileId] = useState<string>("");
  const [prepId, setPrepId] = useState<string>("");
  const [maskId, setMaskId] = useState<string>("");
  const [volumeCm3, setVolumeCm3] = useState<number | null>(null);
  const [voxels, setVoxels] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [segLoading, setSegLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const sample = await generateSyntheticSample();
        setFileId(sample.file_id);
        const prep = await preprocessScan(sample.file_id);
        setPrepId(prep.preprocessed_file_id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRunSegmentation = async () => {
    if (!prepId) return;
    setSegLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: prepId }),
      });
      if (!res.ok) throw new Error("Segmentation failed");
      const data = await res.json();
      setMaskId(data.mask_id);
      setVolumeCm3(data.volume_cm3);
      setVoxels(data.voxels_segmented);
    } catch (e) {
      console.error(e);
    } finally {
      setSegLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BrainCircuit color="var(--accent-cyan)" />
            3D Deep Learning Segmentation (MONAI U-Net)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Sliding-window volumetric inference with Gaussian patch weighting for Left Atrium anatomical boundary extraction.
          </p>
        </div>

        <button
          onClick={handleRunSegmentation}
          disabled={segLoading || !prepId}
          className="gradient-btn"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            cursor: segLoading ? "not-allowed" : "pointer",
            opacity: segLoading ? 0.7 : 1,
          }}
        >
          <Play size={16} />
          <span>{segLoading ? "Segmenting 3D Volume..." : "Run 3D Segmentation"}</span>
        </button>
      </div>

      {/* Results Banner */}
      {maskId && (
        <div className="glass-panel" style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.15) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CheckCircle2 color="var(--accent-emerald)" size={24} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                3D Volumetric Segmentation Generated Successfully
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Mask ID: <code style={{ color: "var(--accent-cyan)" }}>{maskId}</code>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "2rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Voxel Count</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {voxels?.toLocaleString()} voxels
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Anatomical Volume</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                {volumeCm3} cm³
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Visualizer: MPR Slice with Overlay + 3D Viewport */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <SliceViewer fileId={prepId || "sample_heart"} />
        <Viewport3D title="Predicted 3D Organ Mesh Surface" />
      </div>
    </div>
  );
}
