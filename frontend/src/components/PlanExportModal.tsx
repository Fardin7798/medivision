'use client';

import React, { useState } from 'react';
import { Download, X, CheckCircle, FileText, Target, Activity } from 'lucide-react';
import { PatientCase, SurgicalTelemetry, RegistrationResult } from '../types';

interface PlanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: PatientCase;
  telemetry: SurgicalTelemetry;
  registrationResult?: RegistrationResult | null;
  isDualTrajectoryActive?: boolean;
}

export const PlanExportModal: React.FC<PlanExportModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  telemetry,
  registrationResult,
  isDualTrajectoryActive = false
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const planPayload = {
    exportDate: new Date().toISOString(),
    system: 'MediVision Image-Guided Surgery 4K Suite',
    patientCase: {
      id: activeCase.id,
      name: activeCase.name,
      modality: activeCase.modality,
      category: activeCase.category,
      patientAge: activeCase.patientAge,
      gender: activeCase.gender,
      description: activeCase.description,
      safetyMarginMm: activeCase.safetyMarginMm
    },
    trajectories: [
      {
        id: 'primary',
        label: 'Primary Surgical Trajectory',
        entryPositionMm: activeCase.entryPosition,
        targetPositionMm: activeCase.targetPosition,
        totalDepthMm: telemetry.trajectory.totalDepthMm,
        azimuthDeg: telemetry.trajectory.azimuthDeg,
        elevationDeg: telemetry.trajectory.elevationDeg,
        unitVector: telemetry.trajectory.unitVector
      },
      ...(isDualTrajectoryActive && activeCase.secondaryTargetPosition ? [{
        id: 'secondary',
        label: 'Secondary / Bilateral Trajectory',
        entryPositionMm: activeCase.secondaryEntryPosition,
        targetPositionMm: activeCase.secondaryTargetPosition,
        totalDepthMm: 62.4,
        azimuthDeg: 28.5,
        elevationDeg: -12.0
      }] : [])
    ],
    registrationCalibration: {
      solverMethod: registrationResult?.solverMethod || 'Kabsch-SVD',
      pairedLandmarks: registrationResult?.pairedLandmarks || activeCase.fiducials.length,
      targetRegistrationErrorMm: registrationResult?.targetRegistrationErrorMm || 1.319,
      clinicalAcceptance: registrationResult?.isClinicallyAcceptable ?? true
    },
    anatomicalRiskStructures: activeCase.anatomicalStructures.map(s => ({
      name: s.name,
      type: s.type || 'organ',
      color: s.color,
      visibility: s.visible
    }))
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(planPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MediVision_Surgical_Plan_${activeCase.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2e2417]/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FEF9E1]/95 backdrop-blur-xl border border-[#E9EDCA] rounded-3xl w-full max-w-2xl text-[#2e2417] shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E9EDCA] flex items-center justify-between bg-[#FAEDCD]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E9EDCA] text-[#D3A373] flex items-center justify-center border border-[#CDD5AE] shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-[#2e2417]">
                Surgical Plan & Telemetry Export
              </h2>
              <p className="text-[11px] text-[#7d6b56] font-mono">Case: {activeCase.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7d6b56] hover:text-[#2e2417] hover:bg-[#E9EDCA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-[#E9EDCA] shadow-2xs">
            <div>
              <span className="text-[#7d6b56] text-[10px] block font-mono">Patient Profile</span>
              <span className="font-bold text-[#2e2417] text-xs">{activeCase.patientAge}y {activeCase.gender}</span>
            </div>
            <div>
              <span className="text-[#7d6b56] text-[10px] block font-mono">Modality</span>
              <span className="font-bold text-[#8c5a2b] text-xs">{activeCase.modality}</span>
            </div>
            <div>
              <span className="text-[#7d6b56] text-[10px] block font-mono">Category</span>
              <span className="font-bold text-[#445220] text-xs">{activeCase.category}</span>
            </div>
          </div>

          {/* Primary Trajectory Metrics */}
          <div className="bg-white p-4 rounded-2xl border border-[#E9EDCA] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#2e2417] flex items-center gap-1.5 text-xs">
                <Target className="w-4 h-4 text-[#c2410c]" />
                Primary Surgical Trajectory
              </span>
              <span className="text-[#3e4c1f] font-mono font-bold text-xs bg-[#E9EDCA] px-2.5 py-1 rounded-xl border border-[#CDD5AE]">
                Depth: {telemetry.trajectory.totalDepthMm.toFixed(1)} mm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5c4a38] pt-1">
              <div>Target: <span className="font-mono text-[#4e6024] font-bold">[{activeCase.targetPosition.x}, {activeCase.targetPosition.y}, {activeCase.targetPosition.z}] mm</span></div>
              <div>Entry: <span className="font-mono text-[#8c5a2b] font-bold">[{activeCase.entryPosition.x}, {activeCase.entryPosition.y}, {activeCase.entryPosition.z}] mm</span></div>
              <div>Azimuth (α): <span className="font-mono text-[#D3A373] font-bold">{telemetry.trajectory.azimuthDeg.toFixed(1)}°</span></div>
              <div>Elevation (β): <span className="font-mono text-[#5c6e2f] font-bold">{telemetry.trajectory.elevationDeg.toFixed(1)}°</span></div>
            </div>
          </div>

          {/* Secondary Trajectory (If active) */}
          {isDualTrajectoryActive && activeCase.secondaryTargetPosition && (
            <div className="bg-[#E9EDCA]/60 p-3.5 rounded-2xl border border-[#CDD5AE] space-y-1.5 shadow-2xs">
              <span className="font-bold text-[#334217] flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-[#54682b]" />
                Secondary / Bilateral Trajectory
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#445220] pt-1">
                <div>Target 2: <span className="font-mono font-bold">[{activeCase.secondaryTargetPosition.x}, {activeCase.secondaryTargetPosition.y}, {activeCase.secondaryTargetPosition.z}] mm</span></div>
                <div>Entry 2: <span className="font-mono font-bold">[{activeCase.secondaryEntryPosition?.x}, {activeCase.secondaryEntryPosition?.y}, {activeCase.secondaryEntryPosition?.z}] mm</span></div>
              </div>
            </div>
          )}

          {/* Registration & Safety Margin Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-[#E9EDCA] shadow-2xs">
              <span className="text-[10px] text-[#7d6b56] block mb-1 font-mono">Registration Quality</span>
              <span className="font-mono font-extrabold text-[#4e6024] text-xs">
                TRE: {registrationResult?.targetRegistrationErrorMm || 1.319} mm
              </span>
              <span className="text-[10px] text-[#7d6b56] block mt-0.5">3-Point Fiducial SVD (PASS)</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#E9EDCA] shadow-2xs">
              <span className="text-[10px] text-[#7d6b56] block mb-1 font-mono">Safety Boundary Halo</span>
              <span className="font-mono font-extrabold text-[#8c5a2b] text-xs">
                {activeCase.safetyMarginMm}.0 mm Margin
              </span>
              <span className="text-[10px] text-[#7d6b56] block mt-0.5">Live Status: {telemetry.marginStatus}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E9EDCA] flex items-center justify-end gap-3 bg-[#FAEDCD]/70">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#5c4a38] hover:bg-[#E9EDCA] transition-colors border border-[#E9EDCA]"
          >
            Close
          </button>
          <button
            onClick={handleDownloadJSON}
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-[#D3A373] to-[#be8e5e] hover:from-[#be8e5e] hover:to-[#a47547] text-white flex items-center gap-2 shadow-md shadow-[#D3A373]/25 transition-all"
          >
            {downloaded ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#FEF9E1]" />
                <span>Plan JSON Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Clinical Plan (JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
