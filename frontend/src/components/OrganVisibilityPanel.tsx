'use client';

import React from 'react';
import { Box, Eye, EyeOff, Layers } from 'lucide-react';
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
    <div className="glass-panel rounded-3xl p-4 text-slate-100 shadow-2xl flex flex-col gap-3.5 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
              3D Anatomical Organ Layers
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Shader Alpha & Visibility</p>
          </div>
        </div>
        <span className="text-[10px] bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-full border border-blue-800/60 font-bold">
          {structures.filter((s) => s.visible).length}/{structures.length} Visible
        </span>
      </div>

      {/* Structures List */}
      <div className="flex flex-col gap-2.5">
        {structures.map((structure) => (
          <div
            key={structure.id}
            className={`p-3 rounded-2xl border transition-all ${
              structure.visible
                ? 'bg-slate-950/80 border-slate-800 shadow-md hover:border-slate-700'
                : 'bg-slate-950/40 border-slate-800/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-md"
                  style={{ backgroundColor: structure.color }}
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {structure.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    {structure.type || 'ORGAN'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onToggleVisibility(structure.id)}
                className={`p-2 rounded-xl transition-all border ${
                  structure.visible
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={structure.visible ? 'Hide structure' : 'Show structure'}
              >
                {structure.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Opacity Scrubber Slider */}
            {structure.visible && (
              <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center gap-2.5">
                <span className="text-[10px] text-slate-400 font-mono">Alpha:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={structure.opacity}
                  onChange={(e) => onOpacityChange(structure.id, parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] font-mono text-cyan-300 font-bold w-9 text-right">
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
