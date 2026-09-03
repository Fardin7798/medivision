"use client";
import React, { useState, useEffect } from "react";
import { Box, Download, CheckCircle2, Play, Sparkles, Layers, Activity } from "lucide-react";
import Viewport3D from "@/components/Viewport3D";
import { generateSyntheticSample, preprocessScan } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

interface MeshResult {
  mesh_id: string;
  num_vertices: number;
  num_faces: number;
  surface_area_cm2: number;
  stl_filename: string;
  obj_filename: string;
  stl_download_url: string;
}

export default function ReconstructPage() {
  const [prepId, setPrepId] = useState<string>("");
  const [maskId, setMaskId] = useState<string>("");
  const [meshResult, setMeshResult] = useState<MeshResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconLoading, setReconLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const sample = await generateSyntheticSample();
        const prep = await preprocessScan(sample.file_id);
        setPrepId(prep.preprocessed_file_id);
        
        // Trigger segmentation
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

  const handleGenerateMesh = async () => {
    if (!maskId) return;
    setReconLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reconstruct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mask_id: maskId }),
      });
      if (!res.ok) throw new Error("Reconstruction failed");
      const data = await res.json();
      setMeshResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setReconLoading(false);
    }
  };

  const handleDownloadSTL = () => {
    if (!meshResult) return;
    window.open(`http://localhost:8000${meshResult.stl_download_url}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Box color="var(--accent-cyan)" />
            3D Marching Cubes Surface Reconstruction & STL Export
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Extract high-fidelity polygonal anatomical surface geometries from volumetric segmentation masks with sub-voxel vertex interpolation.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleGenerateMesh}
            disabled={reconLoading || !maskId}
            className="gradient-btn"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              cursor: reconLoading ? "not-allowed" : "pointer",
              opacity: reconLoading ? 0.7 : 1,
            }}
          >
            <Play size={16} />
            <span>{reconLoading ? "Extracting Mesh..." : "Generate 3D Surface"}</span>
          </button>

          {meshResult && (
            <button
              onClick={handleDownloadSTL}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "var(--accent-emerald)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              <span>Download STL (3D Printing)</span>
            </button>
          )}
        </div>
      </div>

      {/* Geometry Stats Cards */}
      {meshResult && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Vertex Count</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {meshResult.num_vertices.toLocaleString()} vertices
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Sub-voxel interpolated</div>
          </div>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Triangle Faces</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
              {meshResult.num_faces.toLocaleString()} triangles
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Watertight manifold mesh</div>
          </div>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Organ Surface Area</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
              {meshResult.surface_area_cm2} cm²
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Calculated from triangle normal integration</div>
          </div>
        </div>
      )}

      {/* 3D WebGL Mesh Viewport */}
      <Viewport3D title={meshResult ? `3D Left Atrium (${meshResult.num_faces.toLocaleString()} Facets)` : "3D Surface Mesh Viewer"} />
    </div>
  );
}
