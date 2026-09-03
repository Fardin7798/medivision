"use client";
import React, { useState, useEffect } from "react";
import { 
  Crosshair, 
  CheckCircle2, 
  Play, 
  Layers, 
  RotateCw, 
  Move, 
  Sliders,
  Activity,
  GitCompare
} from "lucide-react";
import Viewport3D from "@/components/Viewport3D";

interface RegResult {
  status: string;
  registered_file_id: string;
  fixed_file_id: string;
  moving_file_id: string;
  transform_type: string;
  final_metric_value: number;
  optimizer_iterations: number;
  rotation_deg: { x: number; y: number; z: number };
  translation_mm: { x: number; y: number; z: number };
}

export default function RegisterPage() {
  const [fixedId, setFixedId] = useState("atlas_fixed_scan");
  const [movingId, setMovingId] = useState("patient_moving_scan");
  const [transformType, setTransformType] = useState<"rigid" | "affine">("rigid");
  const [regResult, setRegResult] = useState<RegResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [axis, setAxis] = useState<"axial" | "coronal" | "sagittal">("axial");
  const [index, setIndex] = useState(32);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("http://localhost:8000/api/dataset/registration-pair");
        const data = await res.json();
        setFixedId(data.fixed_file_id);
        setMovingId(data.moving_file_id);
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const handleRunRegistration = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixed_file_id: fixedId,
          moving_file_id: movingId,
          transform_type: transformType,
        }),
      });
      if (!res.ok) throw new Error("Registration failed");
      const data = await res.json();
      setRegResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const diffImageUrl = `http://localhost:8000/api/slice/registration-diff?fixed_file_id=${fixedId}&moving_file_id=${regResult ? regResult.registered_file_id : movingId}&axis=${axis}&index=${index}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Crosshair color="var(--accent-cyan)" />
            SimpleITK 3D Medical Image Registration
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Align moving patient imaging scans to canonical atlas reference volumes using multi-resolution Mattes Mutual Information gradient descent.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", background: "var(--bg-surface)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            {(["rigid", "affine"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTransformType(t)}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  border: "none",
                  background: transformType === t ? "var(--accent-cyan)" : "transparent",
                  color: transformType === t ? "#000000" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t} (6/12 DOF)
              </button>
            ))}
          </div>

          <button
            onClick={handleRunRegistration}
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
            <span>{loading ? "Aligning Volumes..." : "Run Registration"}</span>
          </button>
        </div>
      </div>

      {/* Convergence Scorecards */}
      {regResult && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Mutual Information</span>
              <Activity size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "monospace" }}>
              {regResult.final_metric_value.toFixed(4)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Converged in {regResult.optimizer_iterations} iterations
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Translation Shifts (mm)</span>
              <Move size={18} color="var(--accent-emerald)" />
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>
              X: {regResult.translation_mm.x} | Y: {regResult.translation_mm.y} | Z: {regResult.translation_mm.z}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              3D Physical displacement
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Rotation Angles (deg)</span>
              <RotateCw size={18} color="var(--accent-amber)" />
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>
              θx: {regResult.rotation_deg.x}° | θy: {regResult.rotation_deg.y}° | θz: {regResult.rotation_deg.z}°
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Euler angle rotation
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Status</span>
              <CheckCircle2 size={18} color="var(--accent-emerald)" />
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
              {regResult.status.toUpperCase()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Multi-resolution Gaussian pyramid
            </div>
          </div>
        </div>
      )}

      {/* Dual Visualizer: 2D Spatial Alignment Diff + 3D Viewport */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1.5rem" }}>
        {/* 2D Multi-Color Registration Diff Viewer */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GitCompare size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>2D Multi-Channel Registration Alignment</h3>
            </div>
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
          </div>

          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1/1",
            maxHeight: "360px",
            background: "#000000",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border-color)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={diffImageUrl}
              alt="Registration diff"
              style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
            />
            <div style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "rgba(0,0,0,0.8)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.7rem",
              display: "flex",
              gap: "0.75rem",
            }}>
              <span style={{ color: "#f87171" }}>■ Fixed Atlas</span>
              <span style={{ color: "#4ade80" }}>■ {regResult ? "Registered Moving" : "Unregistered Moving"}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Sliders size={16} color="var(--text-muted)" />
            <input
              type="range"
              min={0}
              max={63}
              value={index}
              onChange={(e) => setIndex(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace", minWidth: "40px" }}>
              Slice: {index}
            </span>
          </div>
        </div>

        {/* 3D WebGL Viewport */}
        <Viewport3D title="3D Registered Multi-Modal Surface Viewer" />
      </div>
    </div>
  );
}
