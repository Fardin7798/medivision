'use client';

import React, { useState, useEffect } from 'react';
import { ClinicalCase, NavigationTelemetry, Vector3D } from '@/types';
import { opticalTracker, OpticalTrackerFrame } from '@/lib/hardware/opticalTracker';
import {
  Crosshair,
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Radio,
  FileDown
} from 'lucide-react';

interface NavigationTelemetryHUDProps {
  telemetry: NavigationTelemetry;
  activeCase: ClinicalCase;
  onPointerMove: (pos: Vector3D) => void;
  isDualTrajectoryActive: boolean;
  onToggleDualTrajectory: () => void;
  onOpenExportModal?: () => void;
}

export const NavigationTelemetryHUD: React.FC<NavigationTelemetryHUDProps> = ({
  telemetry,
  activeCase,
  onPointerMove,
  isDualTrajectoryActive,
  onToggleDualTrajectory,
  onOpenExportModal,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isOpticalTrackingActive, setIsOpticalTrackingActive] = useState(false);
  const [opticalStatus, setOpticalStatus] = useState<{
    isStreaming: boolean;
    model: string;
    baudRate: number;
    refreshRate: string;
    rmsErrorMm: number;
    quality: number;
    probePosition: Vector3D;
  }>(opticalTracker.getStatus());

  // Optical tracker hardware subscription
  useEffect(() => {
    if (!isOpticalTrackingActive) return;
    const unsub = opticalTracker.subscribe((frame: OpticalTrackerFrame) => {
      setOpticalStatus((prev) => ({
        ...prev,
        isStreaming: true,
        rmsErrorMm: frame.rmsErrorMm,
        quality: frame.quality,
        probePosition: frame.probePosition
      }));
      onPointerMove(frame.probePosition);
    });
    return () => unsub();
  }, [isOpticalTrackingActive, onPointerMove]);

  // Audio Proximity Oscillator Alert (Web Audio API)
  useEffect(() => {
    if (isSoundMuted) return;
    if (telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'APPROACHING' || telemetry.marginStatus === 'CRITICAL') {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = (telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'CRITICAL') ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(
          (telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'CRITICAL') ? 880 : 440,
          audioCtx.currentTime
        );
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch {
        // AudioContext may be restricted by browser policy
      }
    }
  }, [telemetry.marginStatus, isSoundMuted]);

  // Trajectory Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      onPointerMove({
        x: telemetry.pointerPosition.x + (activeCase.targetPosition.x - telemetry.pointerPosition.x) * 0.08,
        y: telemetry.pointerPosition.y + (activeCase.targetPosition.y - telemetry.pointerPosition.y) * 0.08,
        z: telemetry.pointerPosition.z + (activeCase.targetPosition.z - telemetry.pointerPosition.z) * 0.08,
      });

      if (telemetry.distanceMm < 1.0) {
        setIsSimulating(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, telemetry.pointerPosition, activeCase.targetPosition, telemetry.distanceMm, onPointerMove]);

  const handleToggleSimulation = () => {
    if (telemetry.distanceMm < 1.0) {
      onPointerMove(activeCase.entryPosition);
    }
    setIsSimulating(!isSimulating);
  };

  const handleResetPosition = () => {
    setIsSimulating(false);
    onPointerMove(activeCase.entryPosition);
  };

  return (
    <div className="glass-panel p-4 rounded-3xl flex flex-col gap-4 border border-[#E9EDCA]">
      
      {/* Header with Title & Audio Mute */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#CDD5AE] animate-pulse" />
          <h2 className="text-xs font-black tracking-wider uppercase text-[#2e2417]">
            Real-Time Guidance HUD
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className={`p-1.5 rounded-xl border transition-colors ${
              isSoundMuted
                ? 'bg-[#E9EDCA] border-[#CDD5AE] text-[#7d6b56]'
                : 'bg-[#FAEDCD] border-[#D3A373] text-[#8c5a2b]'
            }`}
            title={isSoundMuted ? 'Unmute alerts' : 'Mute audio alerts'}
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Primary Target Distance Readout Gauge */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EDCA] shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#7d6b56] tracking-wider">
              Distance to Focal Target
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-3xl font-black font-mono tracking-tight ${
                telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'CRITICAL'
                  ? 'text-[#c2410c] animate-pulse'
                  : telemetry.marginStatus === 'APPROACHING'
                  ? 'text-[#d97706]'
                  : 'text-[#2e2417]'
              }`}>
                {telemetry.distanceMm.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-[#7d6b56]">mm</span>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-xs ${
            telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'CRITICAL'
              ? 'bg-[#fed7aa] text-[#9a3412] border-[#f97316] animate-bounce'
              : telemetry.marginStatus === 'APPROACHING'
              ? 'bg-[#FAEDCD] text-[#854d0e] border-[#D3A373]'
              : 'bg-[#E9EDCA] text-[#3f4d1c] border-[#CDD5AE]'
          }`}>
            {(telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'CRITICAL') && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{telemetry.marginStatus}</span>
          </div>
        </div>

        {/* Dynamic Margin Progress Bar */}
        <div className="w-full bg-[#FAEDCD] rounded-full h-2.5 overflow-hidden border border-[#E9EDCA]">
          <div
            className={`h-full transition-all duration-300 ${
              telemetry.marginStatus === 'BREACHED' || telemetry.marginStatus === 'CRITICAL'
                ? 'bg-[#ea580c]'
                : telemetry.marginStatus === 'APPROACHING'
                ? 'bg-[#D3A373]'
                : 'bg-gradient-to-r from-[#D3A373] via-[#CDD5AE] to-[#a3b171]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (telemetry.distanceMm / 60) * 100))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#7d6b56] font-mono">
          <span>0 mm (Target Core)</span>
          <span className="text-[#c2410c] font-bold">{activeCase.safetyMarginMm} mm Margin</span>
          <span>60+ mm</span>
        </div>
      </div>

      {/* 3D Coordinates Grid (Pointer Tip vs Target Focal Point) */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="bg-white p-3 rounded-2xl border border-[#E9EDCA] shadow-xs">
          <div className="text-[#7d6b56] text-[10px] mb-1.5 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D3A373]" />
            Pointer Tip (RAS mm)
          </div>
          <div className="font-mono space-y-1 text-xs text-[#2e2417]">
            <div className="flex justify-between"><span>X:</span> <strong className="text-[#965a25]">{telemetry.pointerPosition.x.toFixed(1)}</strong></div>
            <div className="flex justify-between"><span>Y:</span> <strong className="text-[#965a25]">{telemetry.pointerPosition.y.toFixed(1)}</strong></div>
            <div className="flex justify-between"><span>Z:</span> <strong className="text-[#965a25]">{telemetry.pointerPosition.z.toFixed(1)}</strong></div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E9EDCA] shadow-xs">
          <div className="text-[#7d6b56] text-[10px] mb-1.5 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CDD5AE]" />
            Target Focal Point
          </div>
          <div className="font-mono space-y-1 text-xs text-[#2e2417]">
            <div className="flex justify-between"><span>X:</span> <strong className="text-[#4e6024]">{telemetry.targetPosition.x.toFixed(1)}</strong></div>
            <div className="flex justify-between"><span>Y:</span> <strong className="text-[#4e6024]">{telemetry.targetPosition.y.toFixed(1)}</strong></div>
            <div className="flex justify-between"><span>Z:</span> <strong className="text-[#4e6024]">{telemetry.targetPosition.z.toFixed(1)}</strong></div>
          </div>
        </div>
      </div>

      {/* Trajectory Angles & Insertion Depth */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#FAEDCD]/50 p-3 rounded-2xl border border-[#E9EDCA]">
        <div>
          <div className="text-[10px] text-[#7d6b56] font-semibold">Insertion Depth</div>
          <div className="font-mono font-bold text-[#2e2417] mt-0.5 text-xs">
            {telemetry.trajectory.totalDepthMm.toFixed(1)} <span className="text-[10px] text-[#7d6b56]">mm</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#7d6b56] font-semibold">Azimuth (α)</div>
          <div className="font-mono font-bold text-[#D3A373] mt-0.5 text-xs">
            {telemetry.trajectory.azimuthDeg.toFixed(1)}°
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#7d6b56] font-semibold">Elevation (β)</div>
          <div className="font-mono font-bold text-[#5c6e2f] mt-0.5 text-xs">
            {telemetry.trajectory.elevationDeg.toFixed(1)}°
          </div>
        </div>
      </div>

      {/* Dual Trajectory & Optical Tracking Toggles */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={onToggleDualTrajectory}
          className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
            isDualTrajectoryActive
              ? 'bg-[#CDD5AE] border-[#9ba96a] text-[#334217] shadow-xs'
              : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:border-[#D3A373] hover:bg-[#FAEDCD]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#54682b]" />
          <span>Dual Trajectory</span>
        </button>

        <button
          onClick={() => setIsOpticalTrackingActive(!isOpticalTrackingActive)}
          className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
            isOpticalTrackingActive
              ? 'bg-[#FAEDCD] border-[#D3A373] text-[#784819] shadow-xs'
              : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:border-[#D3A373] hover:bg-[#FAEDCD]'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isOpticalTrackingActive ? 'text-[#D3A373] animate-pulse' : 'text-[#7d6b56]'}`} />
          <span>Optical Tracker (60Hz)</span>
        </button>
      </div>

      {/* Optical Tracker Active Status Readout */}
      {isOpticalTrackingActive && (
        <div className="bg-[#E9EDCA] border border-[#CDD5AE] rounded-xl p-2.5 text-[11px] font-mono flex items-center justify-between text-[#38461b] animate-fadeIn">
          <span>NDI Polaris Stream: 60 FPS</span>
          <span>RMS: &lt;{opticalStatus.rmsErrorMm.toFixed(2)} mm</span>
          <span className="text-[#4e6024] font-bold">Q: {(opticalStatus.quality * 100).toFixed(1)}%</span>
        </div>
      )}

      {/* Interactive Manual Probe Sliders */}
      <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-[#E9EDCA] shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-[#382e21]">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#D3A373]" />
            MANUAL PROBE POSITION (MM)
          </span>
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="text-[#D3A373] hover:text-[#b47d48] flex items-center gap-1 text-[11px] font-semibold"
            >
              <FileDown className="w-3 h-3" />
              <span>Export Plan</span>
            </button>
          )}
        </div>

        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="flex items-center gap-2.5 text-xs font-mono">
            <span className="w-3 uppercase font-bold text-[#7d6b56]">{axis}</span>
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
              className="flex-1 cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg"
            />
            <span className="w-12 text-right text-[#2e2417] font-semibold">
              {telemetry.pointerPosition[axis].toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Trajectory Simulation & Reset Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleToggleSimulation}
          className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isSimulating
              ? 'bg-[#CDD5AE] hover:bg-[#b8c292] text-[#2c3814] shadow-[#CDD5AE]/30'
              : 'bg-gradient-to-r from-[#D3A373] to-[#be8e5e] hover:from-[#be8e5e] hover:to-[#a47547] text-white shadow-[#D3A373]/25'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isSimulating ? 'Pause Navigation' : 'Simulate Trajectory'}</span>
        </button>

        <button
          onClick={handleResetPosition}
          className="p-3 rounded-2xl bg-white hover:bg-[#FAEDCD] text-[#5c4a38] transition-colors border border-[#E9EDCA] shadow-xs"
          title="Reset probe to entry port"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
