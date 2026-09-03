'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Layers, 
  Target, 
  Box, 
  Sparkles, 
  Crosshair, 
  ChevronDown, 
  Stethoscope,
  UploadCloud,
  GitCommit
} from 'lucide-react';
import { ActiveMode, PatientCase } from '../types';
import { PRESET_CASES } from '../data/presetCases';

interface NavbarProps {
  activeCase: PatientCase;
  onCaseChange: (patientCase: PatientCase) => void;
  activeTab: ActiveMode;
  onTabChange: (mode: ActiveMode) => void;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Stethoscope className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-white">MediVision</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
              Cloud IGT v1.3
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            3D Medical AI & Surgical Navigation Simulation
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 text-xs font-semibold">
        <button
          onClick={() => onTabChange('navigation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'navigation'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Navigation</span>
        </button>

        <button
          onClick={() => onTabChange('mpr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'mpr'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>MPR & CMPR</span>
        </button>

        <button
          onClick={() => onTabChange('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI (WebGPU/MedSAM)</span>
        </button>

        <button
          onClick={() => onTabChange('layers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'layers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Layers</span>
        </button>
      </div>

      {/* Case Selector, Import Scan & Calibration CTA */}
      <div className="flex items-center gap-2.5">
        {/* Import Custom Scan Button */}
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs px-3 py-2 rounded-xl font-bold transition-all shadow-md shadow-cyan-950/20"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Import Scan</span>
        </button>

        {/* Preset Clinical Cases Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs px-3 py-2 rounded-xl text-slate-200 font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-left">
              <span className="text-[9px] text-slate-500 uppercase block font-semibold">Active Case</span>
              <span className="font-bold text-white text-xs max-w-[140px] truncate block">{activeCase.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-fadeIn">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                Select Verified Patient Case
              </div>
              {PRESET_CASES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onCaseChange(preset);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-slate-800/80 transition-colors flex flex-col gap-0.5 border-b border-slate-800/40 last:border-0 ${
                    activeCase.id === preset.id ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">{preset.modality.split('/')[0]}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{preset.category} • {preset.patientAge}y {preset.gender}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OR Landmark Registration Calibration Button */}
        <button
          onClick={onOpenRegistration}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs px-3 py-2 rounded-xl font-bold transition-all shadow-md shadow-amber-950/20"
        >
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">OR Calibration</span>
        </button>
      </div>
    </header>
  );
};
