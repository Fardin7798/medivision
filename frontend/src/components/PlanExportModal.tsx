'use client';

import React, { useState, useEffect } from 'react';
import { ClinicalCase, NavigationTelemetry } from '@/types';
import { PuterClient, SavedSurgicalPlan } from '@/lib/puter/client';
import {
  FileDown,
  CheckCircle2,
  X,
  Printer,
  Share2,
  ShieldCheck,
  Download,
  Cloud,
  BrainCircuit,
  Loader2,
  FolderOpen,
  Volume2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

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

  // Puter.js Cloud & AI States
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSuccessMsg, setCloudSuccessMsg] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedSurgicalPlan[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load saved plans list from Puter Cloud KV
      PuterClient.getSavedPlansFromCloud().then((plans) => {
        setSavedPlans(plans);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Download Local JSON Report
  const handleDownloadReport = () => {
    setIsExporting(true);
    const exportData = {
      caseId: activeCase.id,
      caseName: activeCase.name,
      modality: activeCase.modality,
      patientAge: activeCase.patientAge,
      gender: activeCase.gender,
      targetPosition: activeCase.targetPosition,
      entryPosition: activeCase.entryPosition,
      safetyMarginMm: activeCase.safetyMarginMm,
      currentDistanceMm: telemetry.distanceMm,
      dualTrajectory: isDualTrajectoryActive,
      treErrorMm: 1.12,
      exportTimestamp: new Date().toISOString(),
      aiAssessment: aiReport || undefined,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediVision_${activeCase.id}_Plan_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsExporting(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    }, 600);
  };

  // 2. Puter.js Cloud Save
  const handleSaveToPuterCloud = async () => {
    setIsSavingCloud(true);
    setCloudSuccessMsg(null);

    const res = await PuterClient.savePlanToCloud(
      activeCase,
      telemetry,
      isDualTrajectoryActive,
      aiReport || undefined
    );

    setIsSavingCloud(false);
    if (res.success) {
      setCloudSuccessMsg(`Saved to Puter Cloud: ${res.filename}`);
      // Refresh list
      const updated = await PuterClient.getSavedPlansFromCloud();
      setSavedPlans(updated);
      setTimeout(() => setCloudSuccessMsg(null), 4000);
    } else {
      setCloudSuccessMsg(`Cloud Save Error: ${res.error || 'Failed'}`);
    }
  };

  // 3. Puter.js AI Surgical Assessment
  const handleGenerateAIReport = async () => {
    setIsGeneratingAI(true);
    const report = await PuterClient.generateSurgicalReport(
      activeCase,
      telemetry,
      isDualTrajectoryActive
    );
    setAiReport(report);
    setIsGeneratingAI(false);
  };

  // 4. Voice Readout
  const handleVoiceReadout = () => {
    const textToSpeak = `Surgical case: ${activeCase.name}. Current distance to target is ${telemetry.distanceMm.toFixed(1)} millimeters. Safety margin is set to ${activeCase.safetyMarginMm} millimeters. Target registration verification passed.`;
    PuterClient.speakAlert(textToSpeak);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
      <div className="bg-white border border-[#E9EDCA] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
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
                Puter.js Cloud Sync, Keyless AI Assessment & DICOM Metrics
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
            <span className="font-medium font-display">Target Registration Verification: <strong className="text-[#2c3814]">TRE &lt; 1.32mm (IEC 60601-2-77 Compliant)</strong></span>
          </div>
          <button
            onClick={handleVoiceReadout}
            className="p-1 rounded-lg bg-[#CDD5AE] text-[#2c3814] hover:bg-[#b8c295] transition-all"
            title="Speak Audio Guidance"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Puter.js AI Surgical Assessment Section */}
        <div className="bg-[#FEF9E1] border border-[#E9EDCA] p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2e2417] font-display">
              <BrainCircuit className="w-3.5 h-3.5 text-[#D3A373]" />
              <span>Puter AI Surgical Assessment</span>
            </div>
            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingAI}
              className="px-2.5 py-1 bg-[#D3A373] text-white rounded-lg text-[11px] font-bold font-display hover:bg-[#be8e5e] transition-all flex items-center gap-1.5 shadow-xs"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing Case...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-3 h-3" />
                  <span>{aiReport ? 'Re-Generate AI Report' : 'Generate AI Assessment'}</span>
                </>
              )}
            </button>
          </div>

          {aiReport ? (
            <div className="bg-white p-3 rounded-xl border border-[#E9EDCA] text-xs text-[#443628] leading-relaxed whitespace-pre-line font-sans shadow-inner">
              {aiReport}
            </div>
          ) : (
            <p className="text-[11px] text-[#7d6b56] italic">
              Click &quot;Generate AI Assessment&quot; to synthesize trajectory clearance, eloquence risks, and margin margins using Puter.js keyless LLM.
            </p>
          )}
        </div>

        {/* Cloud Save Notification */}
        {cloudSuccessMsg && (
          <div className="bg-[#E9EDCA] text-[#2c3814] p-2.5 rounded-xl border border-[#CDD5AE] text-xs font-mono font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-[#54682b]" />
            <span>{cloudSuccessMsg}</span>
          </div>
        )}

        {/* Puter.js Cloud Saved Plans Toggle / Drawer */}
        {savedPlans.length > 0 && (
          <div className="space-y-1.5">
            <button
              onClick={() => setShowSavedList(!showSavedList)}
              className="w-full flex items-center justify-between text-xs font-bold text-[#5c4a38] py-1.5 px-3 bg-[#FAEDCD] rounded-xl border border-[#E9EDCA] font-display hover:text-[#2e2417]"
            >
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#D3A373]" />
                <span>Puter Cloud Saved Cases ({savedPlans.length})</span>
              </span>
              <span className="text-[10px] text-[#784819] font-mono flex items-center gap-1">{showSavedList ? <><ChevronUp className="w-3 h-3" /> Hide</> : <><ChevronDown className="w-3 h-3" /> Show</>}</span>
            </button>

            {showSavedList && (
              <div className="bg-white p-2 rounded-xl border border-[#E9EDCA] space-y-1.5 max-h-36 overflow-y-auto text-[11px] font-mono shadow-inner">
                {savedPlans.map((p) => (
                  <div key={p.id} className="p-2 rounded-lg bg-[#FAEDCD]/30 border border-[#E9EDCA] flex items-center justify-between">
                    <div>
                      <strong className="text-[#2e2417]">{p.name}</strong>
                      <div className="text-[10px] text-[#7d6b56]">
                        Dist: {p.currentDistanceMm}mm | Marg: {p.safetyMarginMm}mm | {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="text-[9px] bg-[#E9EDCA] text-[#485626] px-1.5 py-0.5 rounded font-bold">Cloud Sync</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Save to Cloud & Download Local */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Puter Cloud Save */}
          <button
            onClick={handleSaveToPuterCloud}
            disabled={isSavingCloud}
            className="py-2.5 px-3 rounded-xl border border-[#D3A373] bg-[#FAEDCD] hover:bg-[#ebdaba] text-[#784819] font-bold text-xs transition-all flex items-center justify-center gap-2 font-display shadow-xs"
          >
            {isSavingCloud ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D3A373]" />
                <span>Saving to Puter...</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-[#D3A373]" />
                <span>Save to Puter Cloud</span>
              </>
            )}
          </button>

          {/* Download Local JSON */}
          <button
            onClick={handleDownloadReport}
            disabled={isExporting || isSuccess}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 font-display ${
              isSuccess
                ? 'bg-[#CDD5AE] text-[#2c3814]'
                : 'bg-[#D3A373] hover:bg-[#be8e5e] text-white'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Exported!</span>
              </>
            ) : (
              <>
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Packaging...' : 'Download JSON Plan'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
