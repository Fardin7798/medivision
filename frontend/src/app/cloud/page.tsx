"use client";
import { API_BASE_URL } from "@/lib/api";
import { generateSyntheticSample, preprocessScan } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { 
  Database, 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  UploadCloud, 
  User, 
  AlertTriangle,
} from "lucide-react";

interface PatientRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  modality: string;
  created_at: string;
  medivision_scans?: {
    id: string;
    scan_id: string;
    filename: string;
    dimensions: number[];
    spacing_mm: number[];
    snr_db: number;
    medivision_segmentations?: {
      id: string;
      mask_id: string;
      volume_cm3: number;
      voxel_count: number;
    }[];
  }[];
}

export default function CloudPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchCloudRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cloud/history`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.history || []);
        setConnected(!!data.connected);
      } else {
        setConnected(false);
      }
    } catch (e) {
      console.error(e);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudRecords();
  }, []);

  const handleSyncCurrent = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      // Run the REAL pipeline so we sync actual computed numbers — never
      // fabricated placeholders. See CONTEXT.md "Rules for MediVision".
      const sample = await generateSyntheticSample();
      const prep = await preprocessScan(sample.file_id);

      const segRes = await fetch(`${API_BASE_URL}/api/segment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: prep.preprocessed_file_id }),
      });
      if (!segRes.ok) throw new Error("Segmentation failed");
      const segData = await segRes.json();

      const evalRes = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pred_mask_id: segData.mask_id }),
      });
      if (!evalRes.ok) throw new Error("Evaluation failed");
      const evalData = await evalRes.json();
      const m = evalData.metrics;

      const res = await fetch(`${API_BASE_URL}/api/cloud/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: `MED-AUTO-${Date.now()}`,
          patient_name: "Research Subject (Live Session)",
          scan_id: prep.preprocessed_file_id,
          filename: sample.filename,
          shape: prep.preprocessed_shape,
          spacing: prep.target_spacing,
          volume_cm3: segData.volume_cm3,
          voxel_count: segData.voxels_segmented,
          dice_coefficient: m.dice_coefficient,
          iou_jaccard: m.iou_jaccard,
          hd95_mm: m.hd95_mm,
          asd_mm: m.asd_mm,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Sync failed");
      }
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
      await fetchCloudRecords();
    } catch (e) {
      console.error(e);
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cloud color="var(--accent-cyan)" />
            Supabase Cloud Database & Storage Integration
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Enterprise PostgreSQL persistence for patient imaging demographics, 3D segmentation records, and clinical evaluations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={fetchCloudRecords}
            disabled={loading}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSyncCurrent}
            disabled={syncing}
            className="gradient-btn"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              cursor: syncing ? "not-allowed" : "pointer",
            }}
          >
            <UploadCloud size={16} />
            <span>{syncing ? "Running pipeline & syncing..." : "Run & Sync New Session"}</span>
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div style={{
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          padding: "0.75rem 1.25rem",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--accent-emerald)",
          fontSize: "0.875rem",
        }}>
          <CheckCircle2 size={18} />
          <span>Synced real segmentation & evaluation results from a freshly-run pipeline session to Supabase Cloud.</span>
        </div>
      )}

      {syncError && (
        <div style={{
          background: "rgba(244, 63, 94, 0.12)",
          border: "1px solid rgba(244, 63, 94, 0.4)",
          padding: "0.75rem 1.25rem",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--accent-rose)",
          fontSize: "0.875rem",
        }}>
          <AlertTriangle size={18} />
          <span>{syncError}</span>
        </div>
      )}

      {/* Cloud Connection Status (derived from real /api/cloud/history response) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Supabase Connection</span>
            <Database size={18} color={connected ? "var(--accent-emerald)" : "var(--accent-rose)"} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: connected ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
            {connected === null ? "CHECKING..." : connected ? "CONNECTED" : "NOT CONFIGURED"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {connected
              ? "Live client verified against SUPABASE_URL / SUPABASE_KEY"
              : "Set SUPABASE_URL and SUPABASE_KEY in backend .env to enable"}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Patients in Database</span>
            <User size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "monospace" }}>
            {patients.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Persisted subject records
          </div>
        </div>
      </div>

      {/* Cloud Records History Table */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Database size={18} color="var(--accent-cyan)" />
          Live Supabase PostgreSQL Clinical History
        </h3>

        {patients.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Patient ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Subject Name</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Modality</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Scan ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Volume (cm³)</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => {
                  const scan = p.medivision_scans && p.medivision_scans[0];
                  const seg = scan && scan.medivision_segmentations && scan.medivision_segmentations[0];
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--accent-cyan)", fontFamily: "monospace" }}>{p.patient_id}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-primary)" }}>{p.patient_name}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>{p.modality}</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace", color: "var(--text-muted)" }}>{scan ? scan.scan_id : "N/A"}</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "var(--accent-emerald)", fontFamily: "monospace" }}>
                        {seg ? `${seg.volume_cm3} cm³` : "N/A"}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No clinical records in Supabase yet. Click &ldquo;Run & Sync New Session&rdquo; to persist.</p>
        )}
      </div>
    </div>
  );
}
