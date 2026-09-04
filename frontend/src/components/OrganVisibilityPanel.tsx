'use client';

import React from 'react';
import { AnatomicalStructure } from '@/types';
import { Eye, EyeOff, Layers2, Sliders } from 'lucide-react';

interface OrganVisibilityPanelProps {
  structures: AnatomicalStructure[];
  onToggleVisibility: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
}

export const OrganVisibilityPanel: React.FC<OrganVisibilityPanelProps> = ({
  structures,
  onToggleVisibility,
  onOpacityChange,
}) => {
  return (
    <div className="solid-panel rounded-3xl p-4 shadow-sm flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#E9EDCA] text-[#425020] border border-[#CDD5AE]">
            <Layers2 className="w-4 h-4 text-[#54682b]" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#2e2417] font-display">
              3D Anatomical Layer Stack
            </h2>
            <p className="text-[10px] text-[#6d5d4b]">
              Dynamic Mesh Opacity & Surface Toggles
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-[#FAEDCD] text-[#784819] font-mono px-2.5 py-0.5 rounded-full border border-[#D3A373]/40 font-bold">
          {structures.filter((s) => s.visible).length} / {structures.length} Active
        </span>
      </div>

      {/* Layer List with Controls */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {structures.map((structure) => (
          <div
            key={structure.id}
            className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
              structure.visible
                ? 'bg-white border-[#E9EDCA] shadow-xs'
                : 'bg-[#FAEDCD]/30 border-[#E9EDCA] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full border border-white/50 shadow-xs"
                  style={{ backgroundColor: structure.color }}
                />
                <span className="text-xs font-bold text-[#2e2417] font-display">
                  {structure.name}
                </span>
              </div>

              <button
                onClick={() => onToggleVisibility(structure.id)}
                className={`p-1.5 rounded-xl border transition-all ${
                  structure.visible
                    ? 'bg-[#CDD5AE] text-[#2c3814] border-[#9ba96a]'
                    : 'bg-white text-[#7d6b56] border-[#E9EDCA] hover:bg-[#FAEDCD]'
                }`}
                title={structure.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {structure.visible ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Opacity Slider */}
            {structure.visible && (
              <div className="flex items-center gap-2 text-xs font-mono pt-1 border-t border-[#E9EDCA]/60">
                <Sliders className="w-3 h-3 text-[#7d6b56]" />
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={structure.opacity}
                  onChange={(e) =>
                    onOpacityChange(structure.id, parseFloat(e.target.value))
                  }
                  className="flex-1 cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#D3A373]"
                />
                <span className="w-10 text-right text-[10px] text-[#2e2417] font-semibold">
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
