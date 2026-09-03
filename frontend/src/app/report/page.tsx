"use client";
import React, { useState, useEffect } from "react";
import { 
  FileText, 
  AlertTriangle, 
  Download, 
  Printer, 
  CheckCircle2, 
  User, 
  Activity, 
  Heart, 
  Calendar,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { generateSyntheticSample, preprocessScan } from "@/lib/api";

interface ReportData {
  report_id: string;
  generated_at: string;
  disclaimer: string;
  patient: {
    patient_id: string;
    patient_name: string;
    modality: string;
    exam_type: string;
  };
  technical_parameters: {
    spatial_resolution_mm: number[];
    grid_dimensions: number[];
    resampling_target: string;
    ai_architecture: string;
    registration_engine: string;
  };
  quantitative_findings: {
    left_atrium_volume_cm3: number;
    left_atrium_surface_area_cm2: number;
    sphericity_index: number;
    normal_reference_range_cm3: string;
    segmentation_confidence_dice: number;
    boundary_error_hd95_mm: number;
  };
  clinical_impression: {
    classification: string;
    severity_level: string;
    description: string;
    summary_statement: string;
  };
  recommendations: string[];
}

export default function ReportPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("Anonymous Research Subject");
  const [patientId, setPatientId] = useState("MED-2026-9810");

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const sample = await generateSyntheticSample();
        const prep = await preprocessScan(sample.file_id);
        
        const res = await fetch("http://localhost:8000/api/report/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scan_id: sample.file_id,
            patient_name: patientName,
            patient_id: patientId,
          }),
        });
        const data = await res.json();
        setReport(data.report);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [patientName, patientId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    window.open(`http://localhost:8000/api/report/markdown?report_id=${report.report_id}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText color="var(--accent-cyan)" />
            Clinical AI Diagnostic Radiologist Report
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Automated anatomical biomarker synthesis, Left Atrial Enlargement (LAE) grading, and radiologist impression.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleDownloadMarkdown}
            disabled={!report}
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
            <Download size={16} />
            <span>Download Markdown</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!report}
            className="gradient-btn"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {report ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Prominent Medical Safety Banner */}
          <div style={{
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            padding: "1rem 1.5rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
          }}>
            <AlertTriangle size={24} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--accent-rose)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Mandatory Medical Safety Notice
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {report.disclaimer}
              </p>
            </div>
          </div>

          {/* Patient Demographics & Report Meta */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Subject Name</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                  {report.patient.patient_name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Patient ID</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                  {report.patient.patient_id}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Imaging Modality</div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                  {report.patient.modality}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Generated Timestamp</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {report.generated_at}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Assessment Banner */}
          <div className="glass-panel" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-emerald)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Clinical Diagnostic Assessment
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
              {report.clinical_impression.classification}
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
              {report.clinical_impression.description}
            </p>
          </div>

          {/* Quantitative Biomarkers Scorecard */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Left Atrial Volume</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {report.quantitative_findings.left_atrium_volume_cm3} cm³
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Ref: {report.quantitative_findings.normal_reference_range_cm3}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Anatomical Surface Area</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {report.quantitative_findings.left_atrium_surface_area_cm2} cm²
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Triangle normal integration
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Sphericity Index</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-amber)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {report.quantitative_findings.sphericity_index}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Ideal Sphere = 1.00
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>AI Segmentation Confidence</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-emerald)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {report.quantitative_findings.segmentation_confidence_dice}%
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Dice similarity metric
              </div>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ClipboardList size={18} color="var(--accent-cyan)" />
              Clinical Recommendations & Follow-Up Plan
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {report.recommendations.map((rec, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "0.875rem" }}>
                  <CheckCircle2 size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: "3px" }} />
                  <span style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Synthesizing clinical findings...</p>
        </div>
      )}
    </div>
  );
}
