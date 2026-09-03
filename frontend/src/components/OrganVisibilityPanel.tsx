'use client';

import React from 'react';
import { Box, Eye, EyeOff } from 'lucide-react';
import { AnatomicalStructure } from '../types';

interface OrganVisibilityPanelProps {
  structures: AnatomicalStructure[];
  onToggleVisibility: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
}

export const OrganVisibilityPanel: React.FC<OrganVisibilityPanelProps> = ({
  structures,
  onToggleVisibility,
  onOpacityChange
}) => {
  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            3D Anatomical Organ Layers
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          {structures.filter((s) => s.visible).length}/{structures.length} Active
        </span>
      </div>

      {/* Structures List */}
      <div className="flex flex-col gap-2.5">
        {structures.map((structure) => (
          <div
            key={structure.id}
            className={`p-2.5 rounded-xl border transition-all ${
              structure.visible
                ? 'bg-slate-950/70 border-slate-800/80 shadow-sm'
                : 'bg-slate-950/30 border-slate-800/40 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: structure.color }}
                />
                <span className="text-xs font-semibold text-slate-200">
                  {structure.name}
                </span>
              </div>

              <button
                onClick={() => onToggleVisibility(structure.id)}
                className={`p-1 rounded-lg transition-colors ${
                  structure.visible
                    ? 'text-cyan-400 hover:bg-cyan-950/60'
                    : 'text-slate-500 hover:bg-slate-800'
                }`}
              >
                {structure.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Opacity Scrubber */}
            {structure.visible && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={structure.opacity}
                  onChange={(e) => onOpacityChange(structure.id, parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                  {(structure.opacity * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
