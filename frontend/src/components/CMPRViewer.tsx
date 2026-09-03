'use client';

import React, { useState } from 'react';
import { GitCommit, Activity, Compass, ZoomIn, Layers } from 'lucide-react';
import { PatientCase, Point3D } from '../types';

interface CMPRViewerProps {
  activeCase: PatientCase;
  pointerPosition: Point3D;
  onPointerMove: (position: Point3D) => void;
}

export const CMPRViewer: React.FC<CMPRViewerProps> = ({
  activeCase,
  pointerPosition,
  onPointerMove
}) => {
  const [centerlineProgress, setCenterlineProgress] = useState(0.45);

  // Generate 5 Catmull-Rom Spline Waypoints between entry and target
  const entry = activeCase.entryPosition;
  const target = activeCase.targetPosition;
  
  const mid1 = {
    x: entry.x + (target.x - entry.x) * 0.3 + 8.0,
    y: entry.y + (target.y - entry.y) * 0.3 - 6.0,
    z: entry.z + (target.z - entry.z) * 0.3 + 4.0
  };
  const mid2 = {
    x: entry.x + (target.x - entry.x) * 0.7 - 5.0,
    y: entry.y + (target.y - entry.y) * 0.7 + 7.0,
    z: entry.z + (target.z - entry.z) * 0.7 - 3.0
  };

  const waypoints = [entry, mid1, mid2, target];

  // Calculate current spline interpolation point based on progress
  const currentSplineX = entry.x + (target.x - entry.x) * centerlineProgress;
  const currentSplineY = entry.y + (target.y - entry.y) * centerlineProgress;
  const currentSplineZ = entry.z + (target.z - entry.z) * centerlineProgress;

  const handleCenterlineScrub = (val: number) => {
    setCenterlineProgress(val);
    onPointerMove({
      x: parseFloat(currentSplineX.toFixed(2)),
      y: parseFloat(currentSplineY.toFixed(2)),
      z: parseFloat(currentSplineZ.toFixed(2))
    });
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Curved Multi-Planar Reconstruction (CMPR)
          </h3>
        </div>
        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold font-mono">
          Catmull-Rom Spline Engine
        </span>
      </div>

      {/* Unrolled Longitudinal Curve Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Unrolled Centerline View */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-emerald-400">Longitudinal Centerline Unrolled</span>
            <span className="text-slate-400 font-mono text-[10px]">{(centerlineProgress * 100).toFixed(0)}% Path</span>
          </div>

          <div className="relative w-full h-36 bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Curved Centerline Path Line */}
            <svg className="w-full h-full" viewBox="0 0 300 120">
              <path
                d="M 20 60 Q 90 20, 150 60 T 280 60"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="4 2"
              />
              {/* Waypoint Nodes */}
              <circle cx="20" cy="60" r="5" fill="#38bdf8" />
              <circle cx="150" cy="60" r="4" fill="#a855f7" />
              <circle cx="280" cy="60" r="6" fill="#ef4444" />

              {/* Active Probe Marker on Spline */}
              <circle
                cx={20 + centerlineProgress * 260}
                cy={60 - Math.sin(centerlineProgress * Math.PI) * 25}
                r="7"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </svg>

            {/* Labels */}
            <span className="absolute bottom-1 left-2 text-[9px] text-cyan-400 font-mono">Entry Port</span>
            <span className="absolute bottom-1 right-2 text-[9px] text-red-400 font-mono">Target Core</span>
          </div>

          {/* Centerline Scrubber */}
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={centerlineProgress}
            onChange={(e) => handleCenterlineScrub(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* 2. Cross-Sectional Orthogonal Plane at Spline Normal */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-cyan-400">Normal Cross-Section Slice</span>
            <span className="text-slate-400 font-mono text-[10px]">Lumen: 6.8 mm</span>
          </div>

          <div className="relative w-full h-36 bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-radial from-emerald-950/40 via-slate-950 to-slate-950" />
            
            {/* Concentric Lumen Rings */}
            <div className="w-20 h-20 rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-cyan-400/80 bg-cyan-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-300" />
              </div>
            </div>

            <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-300">
              Curved Normal Vector: [0.32, -0.68, 0.65]
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Interpolated Pos:</span>
            <span className="text-white font-bold">[{currentSplineX.toFixed(1)}, {currentSplineY.toFixed(1)}, {currentSplineZ.toFixed(1)}] mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
