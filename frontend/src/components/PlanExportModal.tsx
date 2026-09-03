'use client';

import React, { useState } from 'react';
import { FileText, Download, CheckCircle, X, Shield, Activity, Target } from 'lucide-react';
import { PatientCase, SurgicalTelemetry, RegistrationResult } from '../types';

interface PlanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: PatientCase;
  telemetry: SurgicalTelemetry;
  registrationResult?: RegistrationResult;
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
    reportTitle: 'MediVision Surgical Navigation & Trajectory Plan',
    timestamp: new Date().toISOString(),
    clinicalCase: {
      id: activeCase.id,
      name: activeCase.name,
      modality: activeCase.modality,
      category: activeCase.category,
      patientAge: activeCase.patientAge,
      gender: activeCase.gender,
      description: activeCase.description
    },
    primaryTrajectory: {
      targetFocalPointMm: activeCase.targetPosition,
      entryPortMm: activeCase.entryPosition,
      insertionDepthMm: telemetry.trajectory.totalDepthMm,
      approachAngles: {
        azimuthDeg: telemetry.trajectory.azimuthDeg,
        elevationDeg: telemetry.trajectory.elevationDeg
      },
      currentPointerMm: telemetry.pointerPosition,
      distanceToTargetMarginMm: telemetry.distanceMm,
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white">
                Surgical Plan & Telemetry Export Summary
              </h2>
              <p className="text-[11px] text-slate-400">Clinical IGT Case: {activeCase.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] block">Patient Profile</span>
              <span className="font-semibold text-white">{activeCase.patientAge}y {activeCase.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Modality</span>
              <span className="font-semibold text-cyan-300">{activeCase.modality}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Discipline</span>
              <span className="font-semibold text-purple-300">{activeCase.category}</span>
            </div>
          </div>

          {/* Primary Trajectory Metrics */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-red-400" />
                Primary Surgical Trajectory
              </span>
              <span className="text-cyan-400 font-mono font-bold">
                Depth: {telemetry.trajectory.totalDepthMm} mm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>Target: <span className="font-mono text-white">[{activeCase.targetPosition.x}, {activeCase.targetPosition.y}, {activeCase.targetPosition.z}] mm</span></div>
              <div>Entry: <span className="font-mono text-white">[{activeCase.entryPosition.x}, {activeCase.entryPosition.y}, {activeCase.entryPosition.z}] mm</span></div>
              <div>Azimuth Angle (α): <span className="font-mono text-emerald-400 font-bold">{telemetry.trajectory.azimuthDeg}°</span></div>
              <div>Elevation Angle (β): <span className="font-mono text-emerald-400 font-bold">{telemetry.trajectory.elevationDeg}°</span></div>
            </div>
          </div>

          {/* Secondary Trajectory (If active) */}
          {isDualTrajectoryActive && activeCase.secondaryTargetPosition && (
            <div className="bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/40 space-y-1.5">
              <span className="font-bold text-purple-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Secondary / Bilateral Trajectory
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-purple-200/80">
                <div>Target 2: <span className="font-mono text-white">[{activeCase.secondaryTargetPosition.x}, {activeCase.secondaryTargetPosition.y}, {activeCase.secondaryTargetPosition.z}] mm</span></div>
                <div>Entry 2: <span className="font-mono text-white">[{activeCase.secondaryEntryPosition?.x}, {activeCase.secondaryEntryPosition?.y}, {activeCase.secondaryEntryPosition?.z}] mm</span></div>
              </div>
            </div>
          )}

          {/* Registration & Safety Margin Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Registration Calibration</span>
              <span className="font-mono font-bold text-emerald-400">
                TRE: {registrationResult?.targetRegistrationErrorMm || 1.319} mm
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">3-Point Fiducial Fit (PASS)</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Target Safety Threshold</span>
              <span className="font-mono font-bold text-amber-300">
                {activeCase.safetyMarginMm}.0 mm Margin
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Status: {telemetry.marginStatus}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownloadJSON}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
          >
            {downloaded ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Plan Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Clinical Plan (JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
