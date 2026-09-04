'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PatientCase, SurgicalTelemetry, Point3D } from '../types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Radio,
  RotateCcw,
  Volume2,
  VolumeX,
  FileDown,
  Play
} from 'lucide-react';
import { OpticalTrackerStream } from '../lib/hardware/opticalTracker';

interface NavigationTelemetryHUDProps {
  activeCase: PatientCase;
  telemetry: SurgicalTelemetry;
  onPointerMove: (pos: Point3D) => void;
  isDualTrajectoryActive: boolean;
  onToggleDualTrajectory: () => void;
  onOpenExportModal?: () => void;
}

export const NavigationTelemetryHUD: React.FC<NavigationTelemetryHUDProps> = ({
  activeCase,
  telemetry,
  onPointerMove,
  isDualTrajectoryActive,
  onToggleDualTrajectory,
  onOpenExportModal
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isOpticalTrackingActive, setIsOpticalTrackingActive] = useState<boolean>(false);
  const [opticalStatus, setOpticalStatus] = useState({ rmsErrorMm: 0.12, quality: 0.994 });

  // Web Audio Proximity Alert Oscillator Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const opticalTrackerRef = useRef<OpticalTrackerStream | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.setValueAtTime(0.0, audioCtxRef.current.currentTime);
        gainNode.connect(audioCtxRef.current.destination);
        gainRef.current = gainNode;
      }
    } catch {
      // AudioContext not allowed before user gesture
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Web Audio Proximity Feedback
  useEffect(() => {
    if (isAudioMuted || !audioCtxRef.current || !gainRef.current) return;

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    const ctx = audioCtxRef.current;
    const gain = gainRef.current;

    if (telemetry.marginStatus === 'CRITICAL') {
      if (!oscRef.current) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(gain);
        osc.start();
        oscRef.current = osc;
      } else {
        oscRef.current.frequency.setValueAtTime(880, ctx.currentTime);
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
    } else if (telemetry.marginStatus === 'APPROACHING') {
      if (!oscRef.current) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.connect(gain);
        osc.start();
        oscRef.current = osc;
      } else {
        oscRef.current.frequency.setValueAtTime(520, ctx.currentTime);
      }
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
    } else {
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
    }
  }, [telemetry.marginStatus, isAudioMuted]);

  // Simulation Animation Loop
  useEffect(() => {
    if (!isSimulating) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.015;
      if (progress > 1.0) progress = 0.0;

      const newPos: Point3D = {
        x: activeCase.entryPosition.x + (activeCase.targetPosition.x - activeCase.entryPosition.x) * progress,
        y: activeCase.entryPosition.y + (activeCase.targetPosition.y - activeCase.entryPosition.y) * progress,
        z: activeCase.entryPosition.z + (activeCase.targetPosition.z - activeCase.entryPosition.z) * progress
      };
      onPointerMove(newPos);
    }, 30);

    return () => clearInterval(interval);
  }, [isSimulating, activeCase, onPointerMove]);

  // Optical Tracking Stream Integration
  useEffect(() => {
    if (isOpticalTrackingActive) {
      const tracker = new OpticalTrackerStream(activeCase.entryPosition, activeCase.targetPosition);
      opticalTrackerRef.current = tracker;

      tracker.start((frame) => {
        onPointerMove(frame.position);
        setOpticalStatus({
          rmsErrorMm: 0.12,
          quality: frame.qualityIndex
        });
      });

      return () => {
        tracker.stop();
        opticalTrackerRef.current = null;
      };
    } else {
      if (opticalTrackerRef.current) {
        opticalTrackerRef.current.stop();
        opticalTrackerRef.current = null;
      }
    }
  }, [isOpticalTrackingActive, activeCase, onPointerMove]);

  const handleResetPosition = () => {
    setIsSimulating(false);
    setIsOpticalTrackingActive(false);
    onPointerMove({ ...activeCase.entryPosition });
  };

  const handleToggleSimulation = () => {
    setIsOpticalTrackingActive(false);
    setIsSimulating(!isSimulating);
  };

  const statusConfig = {
    SAFE: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800',
      icon: CheckCircle2,
      label: 'SAFE CORRIDOR',
      pulse: false
    },
    APPROACHING: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-800',
      icon: AlertTriangle,
      label: 'APPROACHING MARGIN',
      pulse: true
    },
    CRITICAL: {
      color: 'text-red-400',
      bgColor: 'bg-red-950/60 border-red-600 shadow-lg shadow-red-900/40',
      icon: AlertTriangle,
      label: 'CRITICAL BOUNDARY (<5mm)',
      pulse: true
    }
  };

  const currentStatus = statusConfig[telemetry.marginStatus] || statusConfig.SAFE;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 text-slate-100 flex flex-col gap-4 shadow-2xl relative overflow-hidden">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="font-bold text-sm tracking-wide">SURGICAL TELEMETRY HUD</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isAudioMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
            }`}
            title={isAudioMuted ? 'Unmute Proximity Alerts' : 'Mute Proximity Alerts'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <div className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
            REAL-TIME 60Hz
          </div>
        </div>
      </div>

      {/* Safety Status Banner */}
      <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentStatus.bgColor}`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${currentStatus.color} ${currentStatus.pulse ? 'animate-bounce' : ''}`} />
          <span className={`text-xs font-bold tracking-wider ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Target Distance</div>
          <div className={`font-mono text-sm font-black ${currentStatus.color}`}>
            {telemetry.distanceMm.toFixed(1)} <span className="text-[10px]">mm</span>
          </div>
        </div>
      </div>

      {/* Target Proximity Distance Gauge */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Tip-to-Target Distance</span>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-base font-bold ${currentStatus.color}`}>
              {telemetry.distanceMm.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">mm</span>
          </div>
        </div>

        {/* Dynamic Color Progress Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              telemetry.marginStatus === 'CRITICAL'
                ? 'bg-red-500 shadow-md shadow-red-500/50'
                : telemetry.marginStatus === 'APPROACHING'
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (telemetry.distanceMm / 60) * 100))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 mm (Target Core)</span>
          <span className="text-red-400 font-bold">{activeCase.safetyMarginMm} mm Margin</span>
          <span>60+ mm</span>
        </div>
      </div>

      {/* Spatial Coordinates 2-Column Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-1 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Pointer Tip (RAS mm)
          </div>
          <div className="font-mono space-y-0.5 text-[11px] text-slate-200">
            <div>X: <strong className="text-cyan-300">{telemetry.pointerPosition.x.toFixed(1)}</strong></div>
            <div>Y: <strong className="text-cyan-300">{telemetry.pointerPosition.y.toFixed(1)}</strong></div>
            <div>Z: <strong className="text-cyan-300">{telemetry.pointerPosition.z.toFixed(1)}</strong></div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-1 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Target Focal Point
          </div>
          <div className="font-mono space-y-0.5 text-[11px] text-slate-200">
            <div>X: <strong className="text-emerald-300">{telemetry.targetPosition.x.toFixed(1)}</strong></div>
            <div>Y: <strong className="text-emerald-300">{telemetry.targetPosition.y.toFixed(1)}</strong></div>
            <div>Z: <strong className="text-emerald-300">{telemetry.targetPosition.z.toFixed(1)}</strong></div>
          </div>
        </div>
      </div>

      {/* Trajectory Insertion Angles */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
        <div>
          <div className="text-[10px] text-slate-400">Insertion Depth</div>
          <div className="font-mono font-bold text-slate-200 mt-0.5">
            {telemetry.trajectory.totalDepthMm.toFixed(1)} <span className="text-[10px] text-slate-400">mm</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Azimuth Angle (α)</div>
          <div className="font-mono font-bold text-cyan-400 mt-0.5">
            {telemetry.trajectory.azimuthDeg.toFixed(1)}°
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Elevation (β)</div>
          <div className="font-mono font-bold text-blue-400 mt-0.5">
            {telemetry.trajectory.elevationDeg.toFixed(1)}°
          </div>
        </div>
      </div>

      {/* Dual Trajectory & 60Hz Optical Tracking Toggles */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={onToggleDualTrajectory}
          className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
            isDualTrajectoryActive
              ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-900/40'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Dual Trajectory</span>
        </button>

        <button
          onClick={() => setIsOpticalTrackingActive(!isOpticalTrackingActive)}
          className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
            isOpticalTrackingActive
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-900/40'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isOpticalTrackingActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
          <span>Optical Tracker (60Hz)</span>
        </button>
      </div>

      {/* Optical Tracker Active Status Readout */}
      {isOpticalTrackingActive && (
        <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-2.5 text-[11px] font-mono flex items-center justify-between text-cyan-300 animate-fadeIn">
          <span>NDI Polaris Stream: 60 FPS</span>
          <span>RMS: &lt;{opticalStatus.rmsErrorMm.toFixed(2)} mm</span>
          <span className="text-emerald-400 font-bold">Q: {(opticalStatus.quality * 100).toFixed(1)}%</span>
        </div>
      )}

      {/* Interactive Manual Probe Sliders */}
      <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
          <span>PROBE OR STYLUS SLIDER (MM)</span>
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
            >
              <FileDown className="w-3 h-3" />
              <span>Export Plan</span>
            </button>
          )}
        </div>

        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="flex items-center gap-2 text-xs font-mono">
            <span className="w-3 uppercase font-bold text-slate-400">{axis}</span>
            <input
              type="range"
              min="-100"
              max="100"
              step="0.5"
              value={telemetry.pointerPosition[axis]}
              onChange={(e) =>
                onPointerMove({
                  ...telemetry.pointerPosition,
                  [axis]: parseFloat(e.target.value)
                })
              }
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="w-12 text-right text-slate-300">
              {telemetry.pointerPosition[axis].toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Trajectory Simulation & Reset Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleToggleSimulation}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isSimulating
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Pause Trajectory' : 'Simulate Trajectory'}</span>
        </button>

        <button
          onClick={handleResetPosition}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          title="Reset to planned skull entry point"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
