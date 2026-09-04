'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClinicalCase, NavigationTelemetry, Vector3D } from '@/types';
import { opticalTracker } from '@/lib/hardware/opticalTracker';
import { PuterClient } from '@/lib/puter/client';
import {
  Crosshair,
  Layers,
  Radio,
  RotateCcw,
  Play,
  FileDown,
  Compass,
  Volume2,
  VolumeX,
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
  const [simulationStep, setSimulationStep] = useState(0);
  const [isOpticalTrackingActive, setIsOpticalTrackingActive] = useState(true);
  const [isAudioGuidance, setIsAudioGuidance] = useState(false);
  const [opticalStatus, setOpticalStatus] = useState({
    rmsErrorMm: 0.12,
    quality: 0.99,
    frequencyHz: 60,
  });

  const lastAlertTimeRef = useRef<number>(0);
  const lastZoneRef = useRef<'safe' | 'warning' | 'critical'>('safe');

  // Optical Tracker 60Hz Stream Subscription
  useEffect(() => {
    if (!isOpticalTrackingActive) return;

    opticalTracker.setTarget(activeCase.targetPosition);
    const unsubscribe = opticalTracker.subscribe((frame) => {
      setOpticalStatus({
        rmsErrorMm: frame.rmsErrorMm,
        quality: frame.quality,
        frequencyHz: frame.frequencyHz,
      });
    });

    return () => unsubscribe();
  }, [isOpticalTrackingActive, activeCase]);

  // Hands-Free Audio Guidance Alerts (Debounced with Cooldown)
  useEffect(() => {
    if (!isAudioGuidance) return;

    const now = Date.now();
    const dist = telemetry.distanceMm;
    const margin = activeCase.safetyMarginMm;

    let currentZone: 'safe' | 'warning' | 'critical' = 'safe';
    if (dist <= margin) {
      currentZone = 'critical';
    } else if (dist <= margin * 2.5) {
      currentZone = 'warning';
    }

    if (currentZone !== lastZoneRef.current || (now - lastAlertTimeRef.current > 7000 && currentZone !== 'safe')) {
      lastZoneRef.current = currentZone;
      lastAlertTimeRef.current = now;

      if (currentZone === 'critical') {
        PuterClient.speakAlert(`Warning! Safety margin reached. Distance is ${dist.toFixed(1)} millimeters.`);
      } else if (currentZone === 'warning') {
        PuterClient.speakAlert(`Approaching boundary corridor. Distance is ${dist.toFixed(1)} millimeters.`);
      }
    }
  }, [telemetry.distanceMm, isAudioGuidance, activeCase.safetyMarginMm]);

  // Automated Trajectory Insertion Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimulationStep((prev) => {
        const nextStep = prev + 0.02;
        if (nextStep >= 1.0) {
          setIsSimulating(false);
          return 0;
        }

        const currentX =
          activeCase.entryPosition.x +
          (activeCase.targetPosition.x - activeCase.entryPosition.x) * nextStep;
        const currentY =
          activeCase.entryPosition.y +
          (activeCase.targetPosition.y - activeCase.entryPosition.y) * nextStep;
        const currentZ =
          activeCase.entryPosition.z +
          (activeCase.targetPosition.z - activeCase.entryPosition.z) * nextStep;

        onPointerMove({ x: currentX, y: currentY, z: currentZ });
        return nextStep;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulating, activeCase, onPointerMove]);

  const handleToggleSimulation = () => {
    if (!isSimulating) {
      setSimulationStep(0);
      onPointerMove(activeCase.entryPosition);
    }
    setIsSimulating(!isSimulating);
  };

  const handleResetPosition = () => {
    setIsSimulating(false);
    setSimulationStep(0);
    onPointerMove(activeCase.entryPosition);
  };

  // Trajectory Angle Offset & Deviation calculation
  const azimuthAngle = telemetry.trajectory.azimuthDeg;
  const elevationAngle = telemetry.trajectory.elevationDeg;
  const radarCrossX = 50 + Math.sin((azimuthAngle * Math.PI) / 180) * Math.min(38, telemetry.distanceMm * 0.6);
  const radarCrossY = 50 - Math.cos((elevationAngle * Math.PI) / 180) * Math.min(38, telemetry.distanceMm * 0.6);

  const isCritical = telemetry.marginStatus === 'CRITICAL' || telemetry.marginStatus === 'BREACHED';
  const isApproaching = telemetry.marginStatus === 'APPROACHING';

  return (
    <div className="solid-panel rounded-3xl p-4 shadow-sm flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Header with Case Modality Badge & Audio Guidance Toggle */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819] border border-[#D3A373]/40">
            <Compass className="w-4 h-4 text-[#D3A373]" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#2e2417] font-display">
              Surgical Guidance Cockpit
            </h2>
            <p className="text-[10px] text-[#6d5d4b]">
              Sub-millimeter Optical Trajectory HUD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = !isAudioGuidance;
              setIsAudioGuidance(next);
              if (next) PuterClient.speakAlert('Hands-free audio guidance activated');
            }}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              isAudioGuidance
                ? 'bg-[#CDD5AE] text-[#2c3814] border-[#9ba96a] shadow-xs'
                : 'bg-white text-[#7d6b56] border-[#E9EDCA] hover:bg-[#FAEDCD]'
            }`}
            title={isAudioGuidance ? 'Audio Guidance Active' : 'Enable Audio Guidance'}
          >
            {isAudioGuidance ? <Volume2 className="w-3.5 h-3.5 text-[#2c3814]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] bg-[#E9EDCA] text-[#445220] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-bold">
            {activeCase.modality}
          </span>
        </div>
      </div>

      {/* 21st.dev Circular Target Radar Scope */}
      <div className="bg-[#111827] rounded-2xl p-3 border border-[#E9EDCA] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
        <div className="w-full flex justify-between items-center text-[10px] font-mono text-[#94a3b8] mb-1">
          <span className="flex items-center gap-1.5 text-[#38bdf8] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
            TARGET ALIGNMENT RADAR
          </span>
          <span className="text-[#a3e635]">TRE: &lt;{opticalStatus.rmsErrorMm.toFixed(2)}mm</span>
        </div>

        {/* SVG Radar Scope Canvas */}
        <div className="relative w-40 h-40 flex items-center justify-center my-1">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Concentric Rings */}
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="1" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="50" cy="50" r="16" fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx="50" cy="50" r="5" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />

            {/* Radar Crosshairs */}
            <line x1="50" y1="5" x2="50" y2="95" stroke="#334155" strokeWidth="0.75" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="#334155" strokeWidth="0.75" />

            {/* Rotating Radar Sweep Beam */}
            <line
              x1="50"
              y1="50"
              x2="90"
              y2="50"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="2"
              className="origin-center animate-radar-sweep"
            />

            {/* Dynamic Probe Tip Crosshair Point */}
            <circle
              cx={radarCrossX}
              cy={radarCrossY}
              r="4"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <line
              x1={radarCrossX - 6}
              y1={radarCrossY}
              x2={radarCrossX + 6}
              y2={radarCrossY}
              stroke="#ef4444"
              strokeWidth="1"
            />
            <line
              x1={radarCrossX}
              y1={radarCrossY - 6}
              x2={radarCrossX}
              y2={radarCrossY + 6}
              stroke="#ef4444"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Real-time Distance Metric Tag */}
        <div className="w-full flex justify-between items-center text-[11px] font-mono text-[#e2e8f0] pt-1 border-t border-[#1e293b]">
          <span className="text-[#94a3b8]">Dist to Focal Core:</span>
          <span className="text-[#38bdf8] font-black text-sm tracking-wide">
            {telemetry.distanceMm.toFixed(1)} mm
          </span>
        </div>
      </div>

      {/* Target Margin Status Bar */}
      <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-[#E9EDCA] shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-[#382e21] font-display">
          <span>Target Corridor Distance</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
              isCritical
                ? 'bg-[#fee2e2] text-[#991b1b] border border-[#f87171]'
                : isApproaching
                ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                : 'bg-[#E9EDCA] text-[#38461b] border border-[#CDD5AE]'
            }`}
          >
            {isCritical
              ? 'Critical Margin'
              : isApproaching
              ? 'Approaching Margin'
              : 'Safe Corridor'}
          </span>
        </div>

        <div className="w-full bg-[#E9EDCA]/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-[#E9EDCA]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCritical
                ? 'bg-[#ef4444]'
                : isApproaching
                ? 'bg-[#f59e0b]'
                : 'bg-[#54682b]'
            }`}
            style={{ width: `${Math.min(100, (telemetry.distanceMm / 80) * 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#7d6b56] font-mono">
          <span>0 mm (Target)</span>
          <span className="text-[#D3A373] font-bold">{activeCase.safetyMarginMm} mm Margin</span>
          <span>60+ mm</span>
        </div>
      </div>

      {/* Numerical Spatial Telemetry Coordinates */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-3 rounded-2xl border border-[#E9EDCA] shadow-xs">
          <div className="text-[#7d6b56] text-[10px] mb-1.5 font-bold flex items-center gap-1.5 font-display">
            <span className="w-2 h-2 rounded-full bg-[#D3A373]" />
            Pointer Tip (RAS mm)
          </div>
          <div className="font-mono space-y-1 text-xs text-[#2e2417]">
            <div className="flex justify-between"><span>X:</span> <strong className="text-[#784819]">{telemetry.pointerPosition.x.toFixed(1)}</strong></div>
            <div className="flex justify-between"><span>Y:</span> <strong className="text-[#784819]">{telemetry.pointerPosition.y.toFixed(1)}</strong></div>
            <div className="flex justify-between"><span>Z:</span> <strong className="text-[#784819]">{telemetry.pointerPosition.z.toFixed(1)}</strong></div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E9EDCA] shadow-xs">
          <div className="text-[#7d6b56] text-[10px] mb-1.5 font-bold flex items-center gap-1.5 font-display">
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
      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#FAEDCD]/40 p-3 rounded-2xl border border-[#E9EDCA]">
        <div>
          <div className="text-[10px] text-[#7d6b56] font-semibold font-display">Insertion Depth</div>
          <div className="font-mono font-bold text-[#2e2417] mt-0.5 text-xs">
            {telemetry.trajectory.totalDepthMm.toFixed(1)} <span className="text-[10px] text-[#7d6b56]">mm</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#7d6b56] font-semibold font-display">Azimuth (α)</div>
          <div className="font-mono font-bold text-[#D3A373] mt-0.5 text-xs">
            {telemetry.trajectory.azimuthDeg.toFixed(1)}°
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#7d6b56] font-semibold font-display">Elevation (β)</div>
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
          <span className="font-display">Dual Trajectory</span>
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
          <span className="font-display">Optical Tracker (60Hz)</span>
        </button>
      </div>

      {/* Optical Tracker Active Status Readout */}
      {isOpticalTrackingActive && (
        <div className="bg-[#E9EDCA] border border-[#CDD5AE] rounded-xl p-2.5 text-[11px] font-mono flex items-center justify-between text-[#38461b]">
          <span>NDI Polaris: 60 FPS</span>
          <span>RMS: &lt;{opticalStatus.rmsErrorMm.toFixed(2)} mm</span>
          <span className="text-[#4e6024] font-bold">Q: {(opticalStatus.quality * 100).toFixed(1)}%</span>
        </div>
      )}

      {/* Interactive Manual Probe Sliders */}
      <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-[#E9EDCA] shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-[#382e21] font-display">
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
          className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
            isSimulating
              ? 'bg-[#CDD5AE] hover:bg-[#b8c292] text-[#2c3814]'
              : 'bg-[#D3A373] hover:bg-[#be8e5e] text-white'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span className="font-display">{isSimulating ? 'Pause Navigation' : 'Simulate Trajectory'}</span>
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
