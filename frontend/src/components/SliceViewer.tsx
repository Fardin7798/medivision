"use client";
import React, { useState, useEffect } from "react";
import { getSliceImageUrl } from "@/lib/api";
import { Sliders, Eye } from "lucide-react";

interface SliceViewerProps {
  fileId: string;
  shape?: number[];
}

export default function SliceViewer({ fileId, shape = [64, 64, 64] }: SliceViewerProps) {
  const [axis, setAxis] = useState<"axial" | "coronal" | "sagittal">("axial");
  const [index, setIndex] = useState<number>(32);

  const maxIndex = axis === "axial" ? (shape[0] || 64) - 1 : axis === "coronal" ? (shape[1] || 64) - 1 : (shape[2] || 64) - 1;

  useEffect(() => {
    setIndex(Math.floor(maxIndex / 2));
  }, [axis, maxIndex]);

  const imageUrl = getSliceImageUrl(fileId, axis, index);

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Multi-Planar Slice Viewer (MPR)</h3>
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
        maxHeight: "380px",
        background: "#000000",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--border-color)",
      }}>
        {fileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${axis} slice ${index}`}
            style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
          />
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No scan loaded</p>
        )}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          background: "rgba(0,0,0,0.7)",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "0.75rem",
          color: "var(--accent-cyan)",
          fontFamily: "monospace",
        }}>
          {axis.toUpperCase()}: {index} / {maxIndex}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Sliders size={16} color="var(--text-muted)" />
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={index}
          onChange={(e) => setIndex(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace", minWidth: "40px" }}>
          {index}
        </span>
      </div>
    </div>
  );
}
