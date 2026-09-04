'use client';

import React, { useState } from 'react';
import { GitCommit } from 'lucide-react';
import { PatientCase, Point3D } from '../types';

interface CMPRViewerProps {
  activeCase: PatientCase;
  pointerPosition: Point3D;
  onPointerMove: (position: Point3D) => void;
}

export const CMPRViewer: React.FC<CMPRViewerProps> = ({
  activeCase,
  pointerPosition: _pointerPosition,
  onPointerMove
}) => {
  const [centerlineProgress, setCenterlineProgress] = useState(0.45);

  // Generate Spline Waypoints between entry and target
  const entry = activeCase.entryPosition;
  const target = activeCase.targetPosition;

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
    <div className="glass-panel border border-[#E9EDCA] rounded-3xl p-4 text-[#2e2417] shadow-md flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-2.5">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#54682b]" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-[#2e2417]">
            Curved Multi-Planar Reconstruction (CMPR)
          </h3>
        </div>
        <span className="text-[10px] bg-[#E9EDCA] text-[#445220] px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-semibold font-mono">
          Catmull-Rom Spline Engine
        </span>
      </div>

      {/* Unrolled Longitudinal Curve Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Unrolled Centerline View */}
        <div className="bg-[#FAEDCD]/60 rounded-2xl p-3 border border-[#E9EDCA] flex flex-col gap-2 shadow-xs">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-[#445220]">Longitudinal Centerline Unrolled</span>
            <span className="text-[#7d6b56] font-mono text-[10px] font-semibold">{(centerlineProgress * 100).toFixed(0)}% Path</span>
          </div>

          <div className="relative w-full h-36 bg-[#161c13] rounded-xl overflow-hidden border border-[#E9EDCA] flex items-center justify-center shadow-inner">
            {/* Curved Centerline Path Line */}
            <svg className="w-full h-full" viewBox="0 0 300 120">
              <path
                d="M 20 60 Q 90 20, 150 60 T 280 60"
                fill="none"
                stroke="#CDD5AE"
                strokeWidth="3"
                strokeDasharray="4 2"
              />
              {/* Waypoint Nodes */}
              <circle cx="20" cy="60" r="5" fill="#D3A373" />
              <circle cx="150" cy="60" r="4" fill="#E9EDCA" />
              <circle cx="280" cy="60" r="6" fill="#c2410c" />

              {/* Active Probe Marker on Spline */}
              <circle
                cx={20 + centerlineProgress * 260}
                cy={60 - Math.sin(centerlineProgress * Math.PI) * 25}
                r="7"
                fill="#D3A373"
                stroke="#FEF9E1"
                strokeWidth="2"
              />
            </svg>

            {/* Labels */}
            <span className="absolute bottom-1 left-2 text-[9px] text-[#D3A373] font-mono font-bold">Entry Port</span>
            <span className="absolute bottom-1 right-2 text-[9px] text-[#c2410c] font-mono font-bold">Target Core</span>
          </div>

          {/* Centerline Scrubber */}
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={centerlineProgress}
            onChange={(e) => handleCenterlineScrub(parseFloat(e.target.value))}
            className="w-full accent-[#D3A373] h-1.5 bg-[#E9EDCA] rounded-lg cursor-pointer"
          />
        </div>

        {/* 2. Cross-Sectional Orthogonal Plane at Spline Normal */}
        <div className="bg-[#FAEDCD]/60 rounded-2xl p-3 border border-[#E9EDCA] flex flex-col gap-2 shadow-xs">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-[#8c5a2b]">Normal Cross-Section Slice</span>
            <span className="text-[#7d6b56] font-mono text-[10px] font-semibold">Lumen: 6.8 mm</span>
          </div>

          <div className="relative w-full h-36 bg-[#161c13] rounded-xl overflow-hidden border border-[#E9EDCA] flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 bg-gradient-radial from-[#242e20] via-[#161c13] to-[#161c13]" />
            
            {/* Concentric Lumen Rings */}
            <div className="w-20 h-20 rounded-full border-2 border-[#CDD5AE] bg-[#CDD5AE]/20 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-[#D3A373] bg-[#D3A373]/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#FEF9E1]" />
              </div>
            </div>

            <div className="absolute top-2 left-2 text-[9px] font-mono text-[#CDD5AE] font-semibold">
              Curved Normal Vector: [0.32, -0.68, 0.65]
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-[#6d5d4b] font-mono pt-1">
            <span>Interpolated Pos:</span>
            <span className="text-[#2e2417] font-bold">[{currentSplineX.toFixed(1)}, {currentSplineY.toFixed(1)}, {currentSplineZ.toFixed(1)}] mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
