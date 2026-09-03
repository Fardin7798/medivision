'use client';

import React, { useState } from 'react';
import { Layers, Crosshair, Eye, ZoomIn, SunMedium, Move } from 'lucide-react';
import { PatientCase, Point3D } from '../types';

interface MPRViewportsProps {
  activeCase: PatientCase;
  crosshairPosition: Point3D;
  onCrosshairMove: (position: Point3D) => void;
}

export const MPRViewports: React.FC<MPRViewportsProps> = ({
  activeCase,
  crosshairPosition,
  onCrosshairMove
}) => {
  const [windowPreset, setWindowPreset] = useState<'brain' | 'bone' | 'soft' | 'lung'>('brain');

  const handleSliderChange = (axis: 'x' | 'y' | 'z', value: number) => {
    onCrosshairMove({
      ...crosshairPosition,
      [axis]: value
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
      {/* MPR Header & Window Level Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Multi-Planar Reconstruction (MPR)
          </h2>
          <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono font-medium">
            {activeCase.modality}
          </span>
        </div>

        {/* Window/Level Preset Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[10px] flex items-center gap-1 mr-1">
            <SunMedium className="w-3 h-3 text-amber-400" /> W/L Preset:
          </span>
          {(['brain', 'bone', 'soft', 'lung'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setWindowPreset(preset)}
              className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold transition-colors ${
                windowPreset === preset
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Orthogonal Slices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Axial Slice (Transverse) */}
        <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800/80 flex flex-col gap-2 relative group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="text-cyan-400 font-bold">Axial (Transverse)</span>
            <span className="font-mono text-[10px] text-slate-400">Z: {crosshairPosition.z.toFixed(0)} mm</span>
          </div>
          <div className="relative w-full aspect-square bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Simulated Medical Volume Density Gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan-900/30 via-slate-950 to-slate-950" />
            
            {/* Orthogonal Laser Crosshair */}
            <div
              className="absolute w-full h-[1px] bg-cyan-400/80 pointer-events-none"
              style={{ top: `${Math.min(100, Math.max(0, (crosshairPosition.y + 100) / 2))}%` }}
            />
            <div
              className="absolute h-full w-[1px] bg-cyan-400/80 pointer-events-none"
              style={{ left: `${Math.min(100, Math.max(0, (crosshairPosition.x + 100) / 2))}%` }}
            />

            {/* Target Core Ring */}
            <div className="w-10 h-10 rounded-full border border-red-500/80 bg-red-500/20 animate-pulse flex items-center justify-center text-[9px] font-mono text-red-300 font-bold">
              Target
            </div>
          </div>
          {/* Slice Scrubber */}
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={crosshairPosition.z}
            onChange={(e) => handleSliderChange('z', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* 2. Coronal Slice (Frontal) */}
        <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800/80 flex flex-col gap-2 relative group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="text-purple-400 font-bold">Coronal (Frontal)</span>
            <span className="font-mono text-[10px] text-slate-400">Y: {crosshairPosition.y.toFixed(0)} mm</span>
          </div>
          <div className="relative w-full aspect-square bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-slate-950 to-slate-950" />
            
            <div
              className="absolute w-full h-[1px] bg-purple-400/80 pointer-events-none"
              style={{ top: `${Math.min(100, Math.max(0, (crosshairPosition.z + 100) / 2))}%` }}
            />
            <div
              className="absolute h-full w-[1px] bg-purple-400/80 pointer-events-none"
              style={{ left: `${Math.min(100, Math.max(0, (crosshairPosition.x + 100) / 2))}%` }}
            />

            <div className="w-8 h-8 rounded-full border border-red-500/80 bg-red-500/20 flex items-center justify-center text-[9px] font-mono text-red-300 font-bold">
              Target
            </div>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={crosshairPosition.y}
            onChange={(e) => handleSliderChange('y', parseFloat(e.target.value))}
            className="w-full accent-purple-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* 3. Sagittal Slice (Lateral) */}
        <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800/80 flex flex-col gap-2 relative group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="text-emerald-400 font-bold">Sagittal (Lateral)</span>
            <span className="font-mono text-[10px] text-slate-400">X: {crosshairPosition.x.toFixed(0)} mm</span>
          </div>
          <div className="relative w-full aspect-square bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-radial from-emerald-900/30 via-slate-950 to-slate-950" />
            
            <div
              className="absolute w-full h-[1px] bg-emerald-400/80 pointer-events-none"
              style={{ top: `${Math.min(100, Math.max(0, (crosshairPosition.z + 100) / 2))}%` }}
            />
            <div
              className="absolute h-full w-[1px] bg-emerald-400/80 pointer-events-none"
              style={{ left: `${Math.min(100, Math.max(0, (crosshairPosition.y + 100) / 2))}%` }}
            />

            <div className="w-8 h-8 rounded-full border border-red-500/80 bg-red-500/20 flex items-center justify-center text-[9px] font-mono text-red-300 font-bold">
              Target
            </div>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={crosshairPosition.x}
            onChange={(e) => handleSliderChange('x', parseFloat(e.target.value))}
            className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
