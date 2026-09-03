"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  Compass,
  Crosshair,
  Box,
  BarChart3,
  Layers,
  FileText,
  Gauge,
  ShieldCheck,
  Cloud,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/segment", label: "3D Segmentation", icon: BrainCircuit },
  { href: "/navigate", label: "Tri-Planar Navigation", icon: Compass },
  { href: "/register", label: "Image Registration", icon: Crosshair },
  { href: "/reconstruct", label: "3D Mesh & STL", icon: Box },
  { href: "/evaluate", label: "Clinical Evaluation", icon: BarChart3 },
  { href: "/multichannel", label: "Multichannel Features", icon: Layers },
  { href: "/report", label: "Radiologist Report", icon: FileText },
  { href: "/benchmark", label: "Benchmark Suite", icon: Gauge },
  { href: "/safety", label: "Safety & QA Audit", icon: ShieldCheck },
  { href: "/cloud", label: "Cloud Database", icon: Cloud },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "260px",
      minHeight: "calc(100vh - 64px)",
      background: "rgba(10, 14, 23, 0.75)",
      backdropFilter: "blur(16px)",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "1.25rem 1rem",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "0.25rem 0.75rem",
          marginBottom: "0.25rem",
        }}>
          Pipeline Workflows
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                background: isActive ? "linear-gradient(90deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)" : "transparent",
                border: isActive ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} color={isActive ? "var(--accent-cyan)" : "var(--text-muted)"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safety Notice Footer */}
      <div style={{
        padding: "0.85rem",
        background: "rgba(244, 63, 94, 0.08)",
        border: "1px solid rgba(244, 63, 94, 0.25)",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <ShieldCheck size={14} color="var(--accent-rose)" />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-rose)", textTransform: "uppercase" }}>
            Research Only
          </span>
        </div>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
          Not for clinical diagnostics or real patient surgery.
        </p>
      </div>
    </aside>
  );
}
