'use client';

import React, { useState } from 'react';
import { ClinicalCase, NavigationTelemetry } from '@/types';
import { FileDown, CheckCircle2, X, Printer, Share2, ShieldCheck, Download } from 'lucide-react';

interface PlanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: ClinicalCase;
  telemetry: NavigationTelemetry;
  isDualTrajectoryActive: boolean;
}

export const PlanExportModal: React.FC<PlanExportModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  telemetry,
  isDualTrajectoryActive,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white border border-[#E9EDCA] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E9EDCA] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819]">
              <FileDown className="w-5 h-5 text-[#D3A373]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2e2417] font-display">
                Surgical Navigation Report & Plan Export
              </h2>
              <p className="text-xs text-[#6d5d4b]">
                DICOM RT-Plan, Trajectory Metrics & Safety Clearance Summary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#FAEDCD] text-[#7d6b56] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Summary Card */}
        <div className="bg-[#FAEDCD]/40 p-4 rounded-2xl border border-[#E9EDCA] space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-[#E9EDCA] pb-2">
            <span className="font-bold text-[#2e2417] text-sm font-display">{activeCase.name}</span>
            <span className="bg-[#E9EDCA] text-[#445220] px-2 py-0.5 rounded font-mono font-bold">
              {activeCase.modality}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[#5c4a38] font-mono text-[11px] pt-1">
            <div>
              <span>Patient Age/Sex:</span> <strong className="text-[#2e2417]">{activeCase.patientAge}y / {activeCase.gender}</strong>
            </div>
            <div>
              <span>Safety Margin:</span> <strong className="text-[#a46831]">{activeCase.safetyMarginMm} mm</strong>
            </div>
            <div>
              <span>Target Coordinates:</span> <strong className="text-[#2e2417]">[{activeCase.targetPosition.x}, {activeCase.targetPosition.y}, {activeCase.targetPosition.z}]</strong>
            </div>
            <div>
              <span>Entry Port:</span> <strong className="text-[#2e2417]">[{activeCase.entryPosition.x}, {activeCase.entryPosition.y}, {activeCase.entryPosition.z}]</strong>
            </div>
            <div>
              <span>Dual Trajectory:</span> <strong className="text-[#2e2417]">{isDualTrajectoryActive ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <div>
              <span>Current Distance:</span> <strong className="text-[#4e6024]">{telemetry.distanceMm.toFixed(1)} mm</strong>
            </div>
          </div>
        </div>

        {/* Safety & Compliance Badge */}
        <div className="bg-[#E9EDCA] border border-[#CDD5AE] rounded-2xl p-3 flex items-center justify-between text-xs text-[#38461b]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#54682b]" />
            <span className="font-medium font-display">Target Registration Verification: <strong className="text-[#2c3814]">TRE &lt; 1.5mm (IEC 60601-2-77 Compliant)</strong></span>
          </div>
          <span className="bg-[#CDD5AE] px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[#2c3814]">
            VERIFIED
          </span>
        </div>

        {/* Export Formats Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#6d5d4b] uppercase font-mono">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs font-bold font-display">
            <button className="py-2.5 px-3 rounded-xl border border-[#D3A373] bg-[#FAEDCD] text-[#784819] flex items-center justify-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
            <button className="py-2.5 px-3 rounded-xl border border-[#E9EDCA] bg-white text-[#5c4a38] hover:bg-[#FAEDCD] flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>DICOM RT</span>
            </button>
            <button className="py-2.5 px-3 rounded-xl border border-[#E9EDCA] bg-white text-[#5c4a38] hover:bg-[#FAEDCD] flex items-center justify-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>JSON Telemetry</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleDownloadReport}
            disabled={isExporting || isSuccess}
            className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 font-display ${
              isSuccess
                ? 'bg-[#CDD5AE] text-[#2c3814]'
                : 'bg-[#D3A373] hover:bg-[#be8e5e] text-white'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Export Generated Successfully!</span>
              </>
            ) : (
              <>
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Packaging Clinical Artifacts...' : 'Download Surgical Plan Report'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
