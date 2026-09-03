"use client";
import React, { useState, useEffect } from "react";
import { 
  Navigation, 
  Layers, 
  Sliders, 
  Crosshair, 
  Eye, 
  Activity, 
  Compass,
  Maximize2,
  Sparkles
} from "lucide-react";
import Viewport3D from "@/components/Viewport3D";
import { generateSyntheticSample, preprocessScan } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

interface ProbeInfo {
  voxel_indices: { z: number; y: number; x: number };
  physical_coords_mm: { x: number; y: number; z: number };
  intensity: number;
  segmentation_label: number;
  structure: string;
}

export default function NavigatePage() {
  const [fileId, setFileId] = useState("sample_heart_prep");
  const [maskId, setMaskId] = useState<string | null>(null);
  const [z, setZ] = useState(32);
  const [y, setY] = useState(32);
  const [x, setX] = useState(32);
  const [overlay, setOverlay] = useState(true);
  const [probe, setProbe] = useState<ProbeInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const sample = await generateSyntheticSample();
        const prep = await preprocessScan(sample.file_id);
        setFileId(prep.preprocessed_file_id);

        // Fetch segmentation mask
        const segRes = await fetch(`${API_BASE_URL}/api/segment`, {
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

  // Update anatomical probe on coordinate shift
  useEffect(() => {
    async function updateProbe() {
      try {
        const maskParam = maskId ? `&mask_id=${maskId}` : "";
        const res = await fetch(`${API_BASE_URL}/api/probe?file_id=${fileId}${maskParam}&z=${z}&y=${y}&x=${x}`);
        if (res.ok) {
          const data = await res.json();
          setProbe(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    updateProbe();
  }, [fileId, maskId, z, y, x]);

  const getSliceUrl = (axis: "axial" | "coronal" | "sagittal", idx: number) => {
    if (overlay && maskId) {
      return `${API_BASE_URL}/api/slice/overlay?file_id=${fileId}&mask_id=${maskId}&axis=${axis}&index=${idx}`;
    }
    return `${API_BASE_URL}/api/slice?file_id=${fileId}&axis=${axis}&index=${idx}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Compass color="var(--accent-cyan)" />
            Tri-Planar Synchronized Multi-Planar Navigation Hub
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Simulated surgical trajectory planner with synchronized Axial, Coronal, Sagittal slicing and real-time physical coordinate probing.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => setOverlay(!overlay)}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: overlay ? "rgba(6, 182, 212, 0.2)" : "var(--bg-surface)",
              border: overlay ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
              color: overlay ? "var(--accent-cyan)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <Eye size={16} />
            <span>{overlay ? "Segmentation Overlay: ON" : "Segmentation Overlay: OFF"}</span>
          </button>
        </div>
      </div>

      {/* Real-time Anatomical Probe HUD */}
      {probe && (
        <div className="glass-panel" style={{ padding: "1rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Voxel Coordinates (Z, Y, X)</span>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "2px" }}>
              [{probe.voxel_indices.z}, {probe.voxel_indices.y}, {probe.voxel_indices.x}]
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Physical Coordinates (mm)</span>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "monospace", marginTop: "2px" }}>
              X: {probe.physical_coords_mm.x} | Y: {probe.physical_coords_mm.y} | Z: {probe.physical_coords_mm.z}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Voxel MRI Intensity</span>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-emerald)", fontFamily: "monospace", marginTop: "2px" }}>
              {probe.intensity} HU/Norm
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Identified Structure</span>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: probe.segmentation_label > 0 ? "var(--accent-cyan)" : "var(--text-secondary)", marginTop: "2px" }}>
              {probe.structure}
            </div>
          </div>
        </div>
      )}

      {/* 2x2 Tri-Planar + 3D Viewport Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Panel 1: Axial (Z-axis) */}
        <div className="glass-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f87171" }}>■ AXIAL (Transverse Z-Plane)</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>Slice Z={z}/63</span>
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxHeight: "320px", background: "#000", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getSliceUrl("axial", z)} alt="Axial slice" style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }} />
            {/* Crosshair indicator */}
            <div style={{ position: "absolute", left: `${(x / 63) * 100}%`, top: 0, bottom: 0, width: "1px", background: "rgba(248, 113, 113, 0.6)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: `${(y / 63) * 100}%`, left: 0, right: 0, height: "1px", background: "rgba(248, 113, 113, 0.6)", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input type="range" min={0} max={63} value={z} onChange={(e) => setZ(parseInt(e.target.value))} style={{ flex: 1, accentColor: "#f87171", cursor: "pointer" }} />
          </div>
        </div>

        {/* Panel 2: Coronal (Y-axis) */}
        <div className="glass-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4ade80" }}>■ CORONAL (Frontal Y-Plane)</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>Slice Y={y}/63</span>
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxHeight: "320px", background: "#000", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getSliceUrl("coronal", y)} alt="Coronal slice" style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }} />
            <div style={{ position: "absolute", left: `${(x / 63) * 100}%`, top: 0, bottom: 0, width: "1px", background: "rgba(74, 222, 128, 0.6)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: `${(z / 63) * 100}%`, left: 0, right: 0, height: "1px", background: "rgba(74, 222, 128, 0.6)", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input type="range" min={0} max={63} value={y} onChange={(e) => setY(parseInt(e.target.value))} style={{ flex: 1, accentColor: "#4ade80", cursor: "pointer" }} />
          </div>
        </div>

        {/* Panel 3: Sagittal (X-axis) */}
        <div className="glass-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60a5fa" }}>■ SAGITTAL (Lateral X-Plane)</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>Slice X={x}/63</span>
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxHeight: "320px", background: "#000", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getSliceUrl("sagittal", x)} alt="Sagittal slice" style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }} />
            <div style={{ position: "absolute", left: `${(y / 63) * 100}%`, top: 0, bottom: 0, width: "1px", background: "rgba(96, 165, 250, 0.6)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: `${(z / 63) * 100}%`, left: 0, right: 0, height: "1px", background: "rgba(96, 165, 250, 0.6)", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input type="range" min={0} max={63} value={x} onChange={(e) => setX(parseInt(e.target.value))} style={{ flex: 1, accentColor: "#60a5fa", cursor: "pointer" }} />
          </div>
        </div>

        {/* Panel 4: 3D Anatomical Organ Model */}
        <Viewport3D title="3D Synchronized Anatomical Orientation Model" />
      </div>
    </div>
  );
}
