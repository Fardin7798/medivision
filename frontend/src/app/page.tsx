"use client";
import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  UploadCloud, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Activity
} from "lucide-react";
import Link from "next/link";
import SliceViewer from "@/components/SliceViewer";
import Viewport3D from "@/components/Viewport3D";
import { generateSyntheticSample, ImageMetadata, preprocessScan, PreprocessResult } from "@/lib/api";

export default function Dashboard() {
  const [sampleData, setSampleData] = useState<ImageMetadata | null>(null);
  const [prepResult, setPrepResult] = useState<PreprocessResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadSample = async () => {
    setLoading(true);
    try {
      const data = await generateSyntheticSample();
      setSampleData(data);
      const prep = await preprocessScan(data.file_id);
      setPrepResult(prep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLoadSample();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Hero Welcome Banner */}
      <div className="glass-panel" style={{
        padding: "2rem",
        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.3)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Medical Imaging AI Pipeline
            </span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Real-Time <span className="gradient-text">3D Volumetric Segmentation</span> & Navigation
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px" }}>
            End-to-end framework: Isotropic resampling, 3D U-Net anatomical segmentation, Marching Cubes surface mesh reconstruction, and SimpleITK registration.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          disabled={loading}
          className="gradient-btn"
          style={{
            padding: "0.85rem 1.75rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <Database size={18} />
          <span>{loading ? "Generating Scan..." : "Reload Sample MRI"}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
        {[
          { label: "Target Dataset", val: "MSD Task02_Heart", sub: "20 Train / 10 Test 3D MRI", icon: Database, color: "var(--accent-cyan)" },
          { label: "AI Model", val: "MONAI 3D U-Net", sub: "DiceCELoss + Sliding Window", icon: Cpu, color: "var(--accent-blue)" },
          { label: "3D Reconstruction", val: "Marching Cubes", sub: "Interactive WebGL & STL", icon: Activity, color: "var(--accent-emerald)" },
          { label: "Image Registration", val: "SimpleITK Rigid/Affine", sub: "Euler3D Transform", icon: Layers, color: "var(--accent-indigo)" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</span>
                <Icon size={20} color={stat.color} />
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                {stat.val}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Live Dual Visualizer: 2D MPR Slice Viewer + 3D WebGL Viewport */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <SliceViewer fileId={sampleData?.file_id || "sample_heart"} shape={sampleData?.shape || [64, 64, 64]} />
        <Viewport3D title="3D Heart Anatomical Mesh (WebGL)" />
      </div>

      {/* Preprocessing Pipeline Status */}
      {prepResult && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Preprocessing Verification Active</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", fontSize: "0.875rem" }}>
            <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ color: "var(--text-muted)", marginBottom: "0.25rem" }}>Original Input Shape</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace", color: "var(--text-primary)" }}>
                {prepResult.original_shape.join(" × ")} @ 1.25mm
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ color: "var(--text-muted)", marginBottom: "0.25rem" }}>Resampled Isotropic Shape</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace", color: "var(--accent-cyan)" }}>
                {prepResult.preprocessed_shape.join(" × ")} @ 1.00mm
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ color: "var(--text-muted)", marginBottom: "0.25rem" }}>Normalized Intensity Range</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace", color: "var(--accent-emerald)" }}>
                [{prepResult.min_val.toFixed(2)}, {prepResult.max_val.toFixed(2)}] (z-score)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
