"use client";
import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Sparkles, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Eye, 
  Activity,
  Zap
} from "lucide-react";
import { generateSyntheticSample, preprocessScan } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

const CHANNELS = [
  { index: 0, name: "Channel 0: Raw MRI Intensity", desc: "Normalized voxel intensity baseline", colormap: "Grayscale", badge: "Baseline" },
  { index: 1, name: "Channel 1: 3D Sobel Gradient", desc: "Spatial boundary & edge magnitude", colormap: "Inferno", badge: "Edge Feature" },
  { index: 2, name: "Channel 2: 3D Laplacian", desc: "Curvature, ridges & anatomical contours", colormap: "Magma", badge: "Curvature" },
  { index: 3, name: "Channel 3: 3D Gabor Texture", desc: "Myocardial spatial frequency response", colormap: "Viridis", badge: "Texture" },
];

export default function MultichannelPage() {
  const [fileId, setFileId] = useState("sample_heart_prep");
  const [extracted, setExtracted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [axis, setAxis] = useState<"axial" | "coronal" | "sagittal">("axial");
  const [index, setIndex] = useState(32);

  useEffect(() => {
    async function init() {
      try {
        const sample = await generateSyntheticSample();
        const prep = await preprocessScan(sample.file_id);
        setFileId(prep.preprocessed_file_id);
        setExtracted(true);
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/spectral/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });
      if (!res.ok) throw new Error("Spectral extraction failed");
      setExtracted(true);
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
            <Layers color="var(--accent-cyan)" />
            Multichannel & Derived Spectral Feature Experiment
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Extract physics-grounded spatial gradients, Laplacian second derivatives, and Gabor texture features to evaluate multi-spectral U-Net performance.
          </p>
        </div>

        <button
          onClick={handleExtract}
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
          <Zap size={16} />
          <span>{loading ? "Computing Filters..." : "Extract 4 Spectral Channels"}</span>
        </button>
      </div>

      {/* Synchronized Slice Controller */}
      <div className="glass-panel" style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["axial", "coronal", "sagittal"] as const).map((ax) => (
            <button
              key={ax}
              onClick={() => setAxis(ax)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "capitalize",
                border: axis === ax ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                background: axis === ax ? "rgba(6, 182, 212, 0.2)" : "var(--bg-surface)",
                color: axis === ax ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              {ax}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 0.6 }}>
          <Sliders size={16} color="var(--text-muted)" />
          <input
            type="range"
            min={0}
            max={63}
            value={index}
            onChange={(e) => setIndex(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace", minWidth: "60px" }}>
            Slice: {index}
          </span>
        </div>
      </div>

      {/* 4-Channel Visual Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
        {CHANNELS.map((ch) => {
          const channelUrl = `${API_BASE_URL}/api/slice/channel?file_id=${fileId}&channel=${ch.index}&axis=${axis}&index=${index}`;
          return (
            <div key={ch.index} className="glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{ch.name}</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ch.desc}</p>
                </div>
                <span style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  background: "rgba(6, 182, 212, 0.15)",
                  color: "var(--accent-cyan)",
                  fontWeight: 600,
                }}>
                  {ch.badge}
                </span>
              </div>

              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1/1",
                background: "#000000",
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {extracted ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={channelUrl}
                    alt={ch.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
                  />
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Extraction pending</p>
                )}
                <div style={{
                  position: "absolute",
                  bottom: "6px",
                  left: "6px",
                  background: "rgba(0,0,0,0.75)",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "0.65rem",
                  color: "var(--accent-cyan)",
                  fontFamily: "monospace",
                }}>
                  {ch.colormap}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
