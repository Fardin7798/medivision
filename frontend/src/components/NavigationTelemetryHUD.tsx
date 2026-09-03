'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Play, 
  Pause, 
  RotateCcw, 
  Navigation, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  Layers,
  FileDown,
  Radio,
  Sliders
} from 'lucide-react';
import { SurgicalTelemetry, PatientCase, Point3D } from '../types';
import { OpticalTrackerStream, OpticalTrackerFrame } from '../lib/hardware/opticalTracker';

interface NavigationTelemetryHUDProps {
  telemetry: SurgicalTelemetry;
  activeCase: PatientCase;
  onPointerMove: (newPosition: Point3D) => void;
  isDualTrajectoryActive: boolean;
  onToggleDualTrajectory: () => void;
  onOpenExportModal: () => void;
}

export const NavigationTelemetryHUD: React.FC<NavigationTelemetryHUDProps> = ({
  telemetry,
  activeCase,
  onPointerMove,
  isDualTrajectoryActive,
  onToggleDualTrajectory,
  onOpenExportModal
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isOpticalTrackingActive, setIsOpticalTrackingActive] = useState(false);
  const [trackerQuality, setTrackerQuality] = useState(0.994);
  const trackerStreamRef = useRef<OpticalTrackerStream | null>(null);

  // Optical Hardware Tracking Stream Loop (60Hz 6-DoF Stream)
  useEffect(() => {
    if (isOpticalTrackingActive) {
      setIsSimulating(false);
      const tracker = new OpticalTrackerStream(activeCase.entryPosition, activeCase.targetPosition);
      trackerStreamRef.current = tracker;

      tracker.start((frame: OpticalTrackerFrame) => {
        onPointerMove(frame.position);
        setTrackerQuality(frame.qualityIndex);
      });

      return () => {
        tracker.stop();
      };
    } else {
      if (trackerStreamRef.current) {
        trackerStreamRef.current.stop();
        trackerStreamRef.current = null;
      }
    }
  }, [isOpticalTrackingActive, activeCase, onPointerMove]);

  // Automated Trajectory Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    let progress = 0;

    if (isSimulating && !isOpticalTrackingActive) {
      const step = () => {
        progress += 0.008;
        if (progress > 1.0) {
          progress = 1.0;
          setIsSimulating(false);
        }

        const entry = activeCase.entryPosition;
        const target = activeCase.targetPosition;

        const currentX = entry.x + (target.x - entry.x) * progress;
        const currentY = entry.y + (target.y - entry.y) * progress;
        const currentZ = entry.z + (target.z - entry.z) * progress;

        onPointerMove({
          x: parseFloat(currentX.toFixed(2)),
          y: parseFloat(currentY.toFixed(2)),
          z: parseFloat(currentZ.toFixed(2))
        });

        if (progress < 1.0) {
          animationFrameId = requestAnimationFrame(step);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isSimulating, isOpticalTrackingActive, activeCase, onPointerMove]);

  const handleResetToEntry = () => {
    setIsSimulating(false);
    setIsOpticalTrackingActive(false);
    onPointerMove(activeCase.entryPosition);
  };

  const { distanceMm, marginStatus, trajectory, pointerPosition, targetPosition } = telemetry;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Surgical Telemetry & Guidance
          </h3>
        </div>

        {/* Dynamic Margin Alert Badge */}
        {marginStatus === 'SAFE' && (
          <span className="flex items-center gap-1.5 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SAFE ZONE ({`>${(activeCase.safetyMarginMm * 2.5).toFixed(0)}mm`})
          </span>
        )}
        {marginStatus === 'APPROACHING' && (
          <span className="flex items-center gap-1.5 text-[11px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            APPROACHING MARGIN
          </span>
        )}
        {marginStatus === 'CRITICAL' && (
          <span className="flex items-center gap-1.5 text-[11px] bg-red-950/90 text-red-300 border border-red-700 px-2.5 py-0.5 rounded-full font-bold animate-bounce shadow-lg shadow-red-900/40">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            CRITICAL MARGIN BREACH ({`<=${activeCase.safetyMarginMm}mm`})
          </span>
        )}
      </div>

      {/* Main Distance Gauge */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Distance to Target Margin</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-mono font-black ${
              marginStatus === 'CRITICAL' ? 'text-red-400' :
              marginStatus === 'APPROACHING' ? 'text-amber-400' : 'text-slate-100'
            }`}>
              {distanceMm.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">mm</span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-150 ${
              marginStatus === 'CRITICAL' ? 'bg-red-500 shadow-md shadow-red-500' :
              marginStatus === 'APPROACHING' ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (1 - distanceMm / 80) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>0 mm (Target Core)</span>
          <span className="text-red-400 font-bold">{activeCase.safetyMarginMm} mm Margin</span>
          <span>80+ mm</span>
        </div>
      </div>

      {/* Optical Hardware Tracker Feed Badge */}
      {isOpticalTrackingActive && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-200 font-bold">NDI Polaris Optical Stream (60 Hz)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            Quality: {(trackerQuality * 100).toFixed(1)}% (RMS &lt; 0.15mm)
          </span>
        </div>
      )}

      {/* Coordinates & Angles Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Pointer Tip (RAS mm)
          </span>
          <div className="font-mono text-[11px] text-slate-200">
            <div>X: <span className="text-cyan-300 font-semibold">{pointerPosition.x.toFixed(1)}</span></div>
            <div>Y: <span className="text-cyan-300 font-semibold">{pointerPosition.y.toFixed(1)}</span></div>
            <div>Z: <span className="text-cyan-300 font-semibold">{pointerPosition.z.toFixed(1)}</span></div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Navigation className="w-3 h-3 text-emerald-400" />
            Target Focal Point
          </span>
          <div className="font-mono text-[11px] text-slate-200">
            <div>X: <span className="text-emerald-300 font-semibold">{targetPosition.x.toFixed(1)}</span></div>
            <div>Y: <span className="text-emerald-300 font-semibold">{targetPosition.y.toFixed(1)}</span></div>
            <div>Z: <span className="text-emerald-300 font-semibold">{targetPosition.z.toFixed(1)}</span></div>
          </div>
        </div>
      </div>

      {/* Trajectory Insertion Angles */}
      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 grid grid-cols-3 gap-1 text-center font-mono">
        <div>
          <span className="text-[9px] text-slate-400 block font-sans">Total Insertion Depth:</span>
          <span className="text-[11px] font-bold text-slate-200">{trajectory.totalDepthMm.toFixed(1)} <span className="text-[9px] font-normal">mm</span></span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-sans">Trajectory Angle (α):</span>
          <span className="text-[11px] font-bold text-cyan-300">{trajectory.azimuthDeg.toFixed(1)}°</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-sans">Elevation Angle (β):</span>
          <span className="text-[9px] font-bold text-cyan-300">{trajectory.elevationDeg.toFixed(1)}°</span>
        </div>
      </div>

      {/* Mode Controls: Dual Trajectory & Optical Tracker Stream */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
        <button
          onClick={onToggleDualTrajectory}
          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all border ${
            isDualTrajectoryActive
              ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-900/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>{isDualTrajectoryActive ? 'Dual: ON' : 'Dual Trajectory'}</span>
        </button>

        <button
          onClick={() => setIsOpticalTrackingActive(!isOpticalTrackingActive)}
          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all border ${
            isOpticalTrackingActive
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-900/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isOpticalTrackingActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{isOpticalTrackingActive ? 'NDI Tracker: ON' : 'Optical Tracker (60Hz)'}</span>
        </button>
      </div>

      {/* Manual Probe Axis Scrubbers */}
      <div className="flex flex-col gap-1.5 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Simulated OR Probe Position (mm)
          </span>
          <button
            onClick={onOpenExportModal}
            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            <FileDown className="w-3 h-3" />
            <span>Export Plan</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-[10px] w-3">X</span>
          <input
            type="range"
            min="-100"
            max="100"
            step="0.5"
            value={pointerPosition.x}
            onChange={(e) => onPointerMove({ ...pointerPosition, x: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[10px] text-slate-400 w-8 text-right">{pointerPosition.x.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-[10px] w-3">Y</span>
          <input
            type="range"
            min="-100"
            max="100"
            step="0.5"
            value={pointerPosition.y}
            onChange={(e) => onPointerMove({ ...pointerPosition, y: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[10px] text-slate-400 w-8 text-right">{pointerPosition.y.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-[10px] w-3">Z</span>
          <input
            type="range"
            min="-100"
            max="100"
            step="0.5"
            value={pointerPosition.z}
            onChange={(e) => onPointerMove({ ...pointerPosition, z: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[10px] text-slate-400 w-8 text-right">{pointerPosition.z.toFixed(1)}</span>
        </div>
      </div>

      {/* Trajectory Simulation Trigger */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          disabled={isOpticalTrackingActive}
          className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isOpticalTrackingActive
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isSimulating
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-600/30'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Navigation</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Trajectory</span>
            </>
          )}
        </button>

        <button
          onClick={handleResetToEntry}
          title="Reset to Entry Port"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
