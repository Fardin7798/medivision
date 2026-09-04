'use client';

import React, { useState } from 'react';
import { Activity, Shield, Crosshair, Sparkles, Box, Upload, ChevronDown, Layers, Radio, Stethoscope, CheckCircle2 } from 'lucide-react';
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
    <header className="glass-panel sticky top-0 z-50 px-4 py-2.5 border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Brand Identity & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 text-base">
                MediVision
              </span>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-700/60 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OR 4K PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:flex items-center gap-1.5">
              <span>Image-Guided Surgery & 3D WebGPU AI</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400/90 font-mono text-[10px]">60 FPS Optical Stream</span>
            </p>
          </div>
        </div>

        {/* Center: Workspace Primary Tab Navigation */}
        <nav className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800/90 text-xs font-semibold overflow-x-auto shadow-inner">
          <button
            onClick={() => onTabChange('navigation')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'navigation'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </button>

          <button
            onClick={() => onTabChange('mpr')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'mpr'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MPR & CMPR</span>
          </button>

          <button
            onClick={() => onTabChange('ai')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI (WebGPU)</span>
          </button>

          <button
            onClick={() => onTabChange('layers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'layers'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Layers</span>
          </button>
        </nav>

        {/* Right: Actions, Case Dropdown, and Calibration */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Custom Scan Import */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 hover:border-cyan-500 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Scan</span>
          </button>

          {/* Clinical Case Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-sm whitespace-nowrap"
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              <div className="text-left">
                <span className="text-[9px] text-slate-400 block font-mono uppercase tracking-wider">
                  CASE SCENARIO
                </span>
                <span className="font-bold text-white text-xs max-w-[130px] sm:max-w-[180px] truncate block">
                  {activeCase.name}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Preset Clinical Scenarios</span>
                  <span className="text-cyan-400 font-mono">5 Cases</span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1 mt-1">
                  {PRESET_CASES.map((preset) => {
                    const isSelected = activeCase.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onCaseChange(preset);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {preset.name}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {preset.modality.split('/')[0]}
                          </span>
                          <span>•</span>
                          <span className="text-amber-400">Margin: {preset.safetyMarginMm}mm</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* OR Calibration Modal Trigger */}
          <button
            onClick={onOpenRegistration}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-400 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">OR Calibration</span>
          </button>
        </div>

      </div>
    </header>
  );
};
