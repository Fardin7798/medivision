"use client";
import React, { useEffect, useState } from "react";
import { Activity, ShieldAlert, Cpu } from "lucide-react";
import { checkHealth, SystemHealth } from "@/lib/api";

export default function Header() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <header style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 2rem",
      borderBottom: "1px solid var(--border-color)",
      background: "rgba(10, 14, 23, 0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px var(--glow-cyan)",
        }}>
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Medi<span className="gradient-text">Vision</span>
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            3D Medical AI & Surgical Navigation System
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(244, 63, 94, 0.1)",
          border: "1px solid rgba(244, 63, 94, 0.25)",
          padding: "0.35rem 0.85rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          color: "var(--accent-rose)",
        }}>
          <ShieldAlert size={14} />
          <span>Research Prototype — Non-Clinical</span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--bg-surface)",
          padding: "0.35rem 0.85rem",
          borderRadius: "9999px",
          border: "1px solid var(--border-color)",
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
        }}>
          <Cpu size={14} color={health?.status === "healthy" ? "var(--accent-emerald)" : "var(--accent-amber)"} />
          <span>{health ? `${health.device} | v${health.version}` : "Backend Disconnected"}</span>
        </div>
      </div>
    </header>
  );
}
