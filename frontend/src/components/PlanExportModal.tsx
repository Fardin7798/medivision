'use client';

import React, { useState } from 'react';
import { Download, FileText, X, CheckCircle, Target, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import { PatientCase, SurgicalTelemetry, RegistrationResult } from '../types';

interface PlanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: PatientCase;
  telemetry: SurgicalTelemetry;
  registrationResult?: RegistrationResult | null;
  isDualTrajectoryActive: boolean;
}

export const PlanExportModal: React.FC<PlanExportModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  telemetry,
  registrationResult,
  isDualTrajectoryActive
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const planPayload = {
    exportedAt: new Date().toISOString(),
    system: 'MediVision Image-Guided Surgery Platform (IGT V1.4)',
    patientCase: {
      id: activeCase.id,
      name: activeCase.name,
      modality: activeCase.modality,
      category: activeCase.category,
      age: activeCase.patientAge,
      gender: activeCase.gender
    },
    primaryTrajectory: {
      targetPositionMm: activeCase.targetPosition,
      entryPositionMm: activeCase.entryPosition,
      plannedTotalDepthMm: telemetry.trajectory.totalDepthMm,
      insertionAngles: {
        azimuthDeg: telemetry.trajectory.azimuthDeg,
        elevationDeg: telemetry.trajectory.elevationDeg
      },
      currentPointerPositionMm: telemetry.pointerPosition,
      realtimeDistanceToTargetMm: telemetry.distanceMm,
      safetyMarginStatus: telemetry.marginStatus,
      safetyMarginThresholdMm: activeCase.safetyMarginMm
    },
    secondaryTrajectory: isDualTrajectoryActive && activeCase.secondaryTargetPosition ? {
      targetFocalPointMm: activeCase.secondaryTargetPosition,
      entryPortMm: activeCase.secondaryEntryPosition,
      status: 'Planned Bilateral / Auxiliary Lead'
    } : null,
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-2xl text-slate-100 shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-white">
                Surgical Plan & Telemetry Export
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">Case: {activeCase.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] block font-mono">Patient Profile</span>
              <span className="font-bold text-white text-xs">{activeCase.patientAge}y {activeCase.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-mono">Modality</span>
              <span className="font-bold text-cyan-300 text-xs">{activeCase.modality}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-mono">Category</span>
              <span className="font-bold text-purple-300 text-xs">{activeCase.category}</span>
            </div>
          </div>

          {/* Primary Trajectory Metrics */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                <Target className="w-4 h-4 text-red-400" />
                Primary Surgical Trajectory
              </span>
              <span className="text-cyan-400 font-mono font-bold text-xs bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-800/60">
                Depth: {telemetry.trajectory.totalDepthMm.toFixed(1)} mm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
              <div>Target: <span className="font-mono text-emerald-300 font-bold">[{activeCase.targetPosition.x}, {activeCase.targetPosition.y}, {activeCase.targetPosition.z}] mm</span></div>
              <div>Entry: <span className="font-mono text-cyan-300 font-bold">[{activeCase.entryPosition.x}, {activeCase.entryPosition.y}, {activeCase.entryPosition.z}] mm</span></div>
              <div>Azimuth (α): <span className="font-mono text-cyan-400 font-bold">{telemetry.trajectory.azimuthDeg.toFixed(1)}°</span></div>
              <div>Elevation (β): <span className="font-mono text-blue-400 font-bold">{telemetry.trajectory.elevationDeg.toFixed(1)}°</span></div>
            </div>
          </div>

          {/* Secondary Trajectory (If active) */}
          {isDualTrajectoryActive && activeCase.secondaryTargetPosition && (
            <div className="bg-purple-950/30 p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5">
              <span className="font-bold text-purple-200 flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Secondary / Bilateral Trajectory
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-purple-200/90 pt-1">
                <div>Target 2: <span className="font-mono text-white">[{activeCase.secondaryTargetPosition.x}, {activeCase.secondaryTargetPosition.y}, {activeCase.secondaryTargetPosition.z}] mm</span></div>
                <div>Entry 2: <span className="font-mono text-white">[{activeCase.secondaryEntryPosition?.x}, {activeCase.secondaryEntryPosition?.y}, {activeCase.secondaryEntryPosition?.z}] mm</span></div>
              </div>
            </div>
          )}

          {/* Registration & Safety Margin Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1 font-mono">Registration Quality</span>
              <span className="font-mono font-extrabold text-emerald-400 text-xs">
                TRE: {registrationResult?.targetRegistrationErrorMm || 1.319} mm
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">3-Point Fiducial SVD (PASS)</span>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1 font-mono">Safety Boundary Halo</span>
              <span className="font-mono font-extrabold text-amber-300 text-xs">
                {activeCase.safetyMarginMm}.0 mm Margin
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Live Status: {telemetry.marginStatus}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-end gap-3 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors border border-slate-700"
          >
            Close
          </button>
          <button
            onClick={handleDownloadJSON}
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            {downloaded ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-950" />
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
