"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Upload, 
  Layers, 
  BrainCircuit, 
  Box, 
  Crosshair, 
  BarChart3, 
  Download,
  LayoutDashboard
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "01. Upload & Inspect", icon: Upload },
  { href: "/preprocess", label: "02. Preprocess", icon: Layers },
  { href: "/segment", label: "03. 3D Segmentation", icon: BrainCircuit },
  { href: "/reconstruct", label: "04. 3D Mesh (STL)", icon: Box },
  { href: "/register", label: "05. Registration", icon: Crosshair },
  { href: "/evaluate", label: "06. Evaluation", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "260px",
      minHeight: "calc(100vh - 73px)",
      background: "rgba(15, 23, 42, 0.5)",
      borderRight: "1px solid var(--border-color)",
      padding: "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    }}>
      <div style={{ padding: "0 0.5rem 0.75rem 0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Pipeline Stages
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
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              background: isActive ? "rgba(6, 182, 212, 0.15)" : "transparent",
              border: isActive ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={18} color={isActive ? "var(--accent-cyan)" : "var(--text-muted)"} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
