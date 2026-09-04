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
    <div className="glass-panel rounded-3xl p-4 text-[#2e2417] shadow-md flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-[#D3A373]" />
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#2e2417]">
              3D Anatomical Organ Layers
            </h3>
            <p className="text-[10px] text-[#7d6b56] font-mono">Shader Alpha & Visibility</p>
          </div>
        </div>
        <span className="text-[10px] bg-[#E9EDCA] text-[#445220] px-2.5 py-1 rounded-full border border-[#CDD5AE] font-bold shadow-xs">
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
                ? 'bg-white border-[#E9EDCA] shadow-xs hover:border-[#D3A373]'
                : 'bg-[#FAEDCD]/40 border-[#E9EDCA]/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-[#E9EDCA] shadow-xs"
                  style={{ backgroundColor: structure.color }}
                />
                <div>
                  <span className="text-xs font-bold text-[#2e2417] block">
                    {structure.name}
                  </span>
                  <span className="text-[10px] text-[#7d6b56] font-mono uppercase font-semibold">
                    {structure.type || 'ORGAN'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onToggleVisibility(structure.id)}
                className={`p-2 rounded-xl transition-all border ${
                  structure.visible
                    ? 'bg-[#E9EDCA] border-[#CDD5AE] text-[#3e4c1f] shadow-xs'
                    : 'bg-[#FAEDCD] border-[#E9EDCA] text-[#7d6b56] hover:text-[#2e2417]'
                }`}
                title={structure.visible ? 'Hide structure' : 'Show structure'}
              >
                {structure.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Opacity Scrubber Slider */}
            {structure.visible && (
              <div className="mt-2.5 pt-2 border-t border-[#E9EDCA] flex items-center gap-2.5">
                <span className="text-[10px] text-[#7d6b56] font-mono">Alpha:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={structure.opacity}
                  onChange={(e) => onOpacityChange(structure.id, parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg"
                />
                <span className="text-[10px] font-mono text-[#D3A373] font-bold w-9 text-right">
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
