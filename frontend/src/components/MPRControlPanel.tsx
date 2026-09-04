'use client';

import React from 'react';
import { ClinicalCase, Vector3D, NavigationTelemetry } from '@/types';
import {
  Layers,
  Crosshair,
  GitCommit,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Target,
  Maximize2,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface MPRControlPanelProps {
  activeCase: ClinicalCase;
  pointerPosition: Vector3D;
  telemetry: NavigationTelemetry;
  onPointerMove: (pos: Vector3D) => void;
  mprSubView: 'orthogonal' | 'cmpr';
  onSubViewChange: (view: 'orthogonal' | 'cmpr') => void;
  onOpenExportModal?: () => void;
}

export const MPRControlPanel: React.FC<MPRControlPanelProps> = ({
  activeCase,
  pointerPosition,
  telemetry,
  onPointerMove,
  mprSubView,
  onSubViewChange,
  onOpenExportModal,
}) => {
  const isInsideMargin = telemetry.distanceMm <= activeCase.safetyMarginMm;
  const isAtTarget = telemetry.distanceMm < 2.0;

  const handleCenterOnTarget = () => {
    onPointerMove(activeCase.targetPosition);
  };

  const handleCenterOnEntry = () => {
    onPointerMove(activeCase.entryPosition);
  };

  return (
    <div className="glass-panel rounded-3xl p-4 shadow-md flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819] border border-[#D3A373]/40">
            <Layers className="w-4 h-4 text-[#D3A373]" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#2e2417]">
              MPR & CMPR Slicing Engine
            </h2>
            <p className="text-[10px] text-[#6d5d4b]">
              Sub-millimeter 3-Plane & Curved Resection
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-[#E9EDCA] text-[#445220] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-bold">
          {activeCase.modality}
        </span>
      </div>

      {/* Mode Switcher Banner */}
      <div className="grid grid-cols-2 gap-2 bg-[#FAEDCD] p-1.5 rounded-2xl border border-[#E9EDCA] text-xs font-bold">
        <button
          onClick={() => onSubViewChange('orthogonal')}
          className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mprSubView === 'orthogonal'
              ? 'bg-[#D3A373] text-white shadow-md shadow-[#D3A373]/25'
              : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Orthogonal (3D)</span>
        </button>

        <button
          onClick={() => onSubViewChange('cmpr')}
          className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mprSubView === 'cmpr'
              ? 'bg-[#CDD5AE] text-[#334217] shadow-md shadow-[#CDD5AE]/30'
              : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Curved (CMPR)</span>
        </button>
      </div>

      {/* Status & Safety Clearance Card */}
      <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
        isAtTarget
          ? 'bg-[#CDD5AE]/40 border-[#9fae72] text-[#2c3814]'
          : isInsideMargin
          ? 'bg-[#FAEDCD] border-[#D3A373] text-[#784819]'
          : 'bg-[#E9EDCA]/50 border-[#CDD5AE] text-[#3e4d1f]'
      }`}>
        <div className="flex items-center gap-2">
          {isInsideMargin ? (
            <AlertTriangle className="w-4 h-4 text-[#c2410c] animate-bounce" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#54682b]" />
          )}
          <div>
            <div className="font-bold">
              {isAtTarget
                ? 'Target Coincident (0.0 mm)'
                : isInsideMargin
                ? `Critical Safety Halo (< ${activeCase.safetyMarginMm} mm)`
                : 'Safe Surgical Corridor'}
            </div>
            <div className="text-[10px] text-[#6d5d4b] font-mono">
              Distance to Target: <strong className="text-[#2e2417]">{telemetry.distanceMm.toFixed(1)} mm</strong>
            </div>
          </div>
        </div>
        <button
          onClick={handleCenterOnTarget}
          className="text-[10px] bg-white hover:bg-[#FAEDCD] text-[#784819] px-2.5 py-1 rounded-lg border border-[#E9EDCA] font-bold shadow-xs transition-colors flex items-center gap-1"
        >
          <Target className="w-3 h-3 text-[#D3A373]" />
          <span>Snap Target</span>
        </button>
      </div>

      {/* Orthogonal Slice Coordinate Navigators */}
      <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-[#E9EDCA] shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-[#382e21]">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#D3A373]" />
            CROSSHAIR SLICE POSITION
          </span>
          <span className="text-[10px] text-[#6d5d4b] font-mono">RAS Space (mm)</span>
        </div>

        {/* X Slice - Sagittal */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[#784819] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D3A373]" />
              Sagittal (X-Plane)
            </span>
            <span className="text-[#2e2417] font-semibold">{pointerPosition.x.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min="-95"
            max="95"
            step="0.5"
            value={pointerPosition.x}
            onChange={(e) =>
              onPointerMove({ ...pointerPosition, x: parseFloat(e.target.value) })
            }
            className="w-full cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#D3A373]"
          />
        </div>

        {/* Y Slice - Coronal */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[#445220] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#CDD5AE]" />
              Coronal (Y-Plane)
            </span>
            <span className="text-[#2e2417] font-semibold">{pointerPosition.y.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min="-95"
            max="95"
            step="0.5"
            value={pointerPosition.y}
            onChange={(e) =>
              onPointerMove({ ...pointerPosition, y: parseFloat(e.target.value) })
            }
            className="w-full cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#CDD5AE]"
          />
        </div>

        {/* Z Slice - Axial */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[#8c5a2b] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E9EDCA] border border-[#CDD5AE]" />
              Axial (Z-Plane)
            </span>
            <span className="text-[#2e2417] font-semibold">{pointerPosition.z.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min="-95"
            max="95"
            step="0.5"
            value={pointerPosition.z}
            onChange={(e) =>
              onPointerMove({ ...pointerPosition, z: parseFloat(e.target.value) })
            }
            className="w-full cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#D3A373]"
          />
        </div>
      </div>

      {/* Centerline & Spline Resection Metrics (CMPR) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#FAEDCD]/50 p-3 rounded-2xl border border-[#E9EDCA] flex flex-col justify-between">
          <span className="text-[10px] text-[#6d5d4b] font-semibold">Centerline Length</span>
          <div className="font-mono font-bold text-[#2e2417] text-sm mt-0.5">
            {telemetry.trajectory.totalDepthMm.toFixed(1)} <span className="text-[10px] text-[#7d6b56]">mm</span>
          </div>
          <span className="text-[9px] text-[#54682b] font-mono font-bold mt-1">
            Catmull-Rom Spline
          </span>
        </div>

        <div className="bg-[#E9EDCA]/50 p-3 rounded-2xl border border-[#CDD5AE] flex flex-col justify-between">
          <span className="text-[10px] text-[#485724] font-semibold">Curvature Normal</span>
          <div className="font-mono font-bold text-[#334217] text-sm mt-0.5">
            {(telemetry.trajectory.azimuthDeg * 0.05).toFixed(2)} rad
          </div>
          <span className="text-[9px] text-[#8c5a2b] font-mono font-bold mt-1">
            Orthogonal Tangent
          </span>
        </div>
      </div>

      {/* Quick Quick-Action Toolbar */}
      <div className="flex gap-2">
        <button
          onClick={handleCenterOnEntry}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-[#FAEDCD] text-[#5c4a38] text-xs font-bold border border-[#E9EDCA] shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#D3A373]" />
          <span>Reset to Entry</span>
        </button>

        <button
          onClick={handleCenterOnTarget}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-[#CDD5AE] hover:bg-[#bec899] text-[#2c3814] text-xs font-bold border border-[#9ba96a] shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Target className="w-3.5 h-3.5 text-[#445220]" />
          <span>Align to Target</span>
        </button>
      </div>
    </div>
  );
};
