'use client';

import React, { useState } from 'react';
import { Activity, Shield, Crosshair, Sparkles, Box, Upload, ChevronDown, Layers } from 'lucide-react';
import { PatientCase } from '../types';
import { PRESET_CASES } from '../data/presetCases';

interface NavbarProps {
  activeCase: PatientCase;
  onCaseChange: (patientCase: PatientCase) => void;
  activeTab: 'navigation' | 'mpr' | 'ai' | 'layers';
  onTabChange: (tab: 'navigation' | 'mpr' | 'ai' | 'layers') => void;
  onOpenRegistration: () => void;
  onOpenUploadModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCase,
  onCaseChange,
  activeTab,
  onTabChange,
  onOpenRegistration,
  onOpenUploadModal
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">MediVision</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 font-mono px-1.5 py-0.5 rounded border border-cyan-800/80 font-bold">
                CLOUD IGT V1.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              3D Medical AI & Surgical Navigation Simulation
            </p>
          </div>
        </div>

        {/* Center Workspace Mode Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => onTabChange('navigation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'navigation'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </button>

          <button
            onClick={() => onTabChange('mpr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'mpr'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MPR & CMPR</span>
          </button>

          <button
            onClick={() => onTabChange('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI (WebGPU)</span>
          </button>

          <button
            onClick={() => onTabChange('layers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'layers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Layers</span>
          </button>
        </nav>

        {/* Right Action Tools: Custom Scan Upload, Active Case Dropdown, OR Calibration */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Custom Scan Upload Trigger */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Scan</span>
          </button>

          {/* Active Case Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm whitespace-nowrap"
            >
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-mono">ACTIVE CASE</span>
                <span className="font-bold text-white text-xs max-w-[120px] sm:max-w-[160px] truncate block">
                  {activeCase.name}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  Select Clinical Scenario
                </div>
                {PRESET_CASES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onCaseChange(preset);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex flex-col gap-0.5 ${
                      activeCase.id === preset.id ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                    }`}
                  >
                    <span className="text-xs font-bold text-white">{preset.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{preset.modality}</span>
                      <span>•</span>
                      <span>Margin: {preset.safetyMarginMm}mm</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* OR Calibration Modal Trigger */}
          <button
            onClick={onOpenRegistration}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">OR Calibration</span>
          </button>
        </div>
      </div>
    </header>
  );
};
