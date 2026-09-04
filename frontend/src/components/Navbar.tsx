'use client';

import React, { useState } from 'react';
import { ClinicalCase } from '@/types';
import { PRESET_CASES } from '@/data/presetCases';
import {
  Activity,
  ChevronDown,
  Shield,
  Layers,
  Crosshair,
  Sparkles,
  Box,
  Upload,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

interface NavbarProps {
  activeCase: ClinicalCase;
  onCaseChange: (newCase: ClinicalCase) => void;
  onOpenRegistration: () => void;
  onOpenUploadModal: () => void;
  activeTab: 'navigation' | 'mpr' | 'ai' | 'layers';
  onTabChange: (tab: 'navigation' | 'mpr' | 'ai' | 'layers') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCase,
  onCaseChange,
  onOpenRegistration,
  onOpenUploadModal,
  activeTab,
  onTabChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FEF9E1]/90 backdrop-blur-xl border-b border-[#E9EDCA] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Brand & OR Suite Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#D3A373] to-[#c08d5b] shadow-md shadow-[#D3A373]/25 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-[#2e2417] text-base">
                MediVision
              </span>
              <span className="text-[10px] bg-[#E9EDCA] text-[#485626] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDD5AE] animate-pulse" />
                OR 4K PRO
              </span>
            </div>
            <p className="text-[11px] text-[#6d5d4b] hidden md:flex items-center gap-1.5">
              <span className="font-medium">Image-Guided Surgery & 3D WebGPU AI</span>
              <span className="text-[#CDD5AE]">•</span>
              <span className="text-[#8c5a2b] font-mono text-[10px] font-bold">60 FPS Optical Stream</span>
            </p>
          </div>
        </div>

        {/* Center: Workspace Primary Tab Navigation */}
        <nav className="flex items-center gap-1.5 bg-[#FAEDCD] p-1.5 rounded-2xl border border-[#E9EDCA] text-xs font-semibold overflow-x-auto shadow-inner">
          <button
            onClick={() => onTabChange('navigation')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'navigation'
                ? 'bg-[#D3A373] text-white shadow-md shadow-[#D3A373]/30'
                : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </button>

          <button
            onClick={() => onTabChange('mpr')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'mpr'
                ? 'bg-[#D3A373] text-white shadow-md shadow-[#D3A373]/30'
                : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MPR & CMPR</span>
          </button>

          <button
            onClick={() => onTabChange('ai')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'ai'
                ? 'bg-[#CDD5AE] text-[#334217] shadow-md shadow-[#CDD5AE]/40'
                : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI (WebGPU)</span>
          </button>

          <button
            onClick={() => onTabChange('layers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === 'layers'
                ? 'bg-[#D3A373] text-white shadow-md shadow-[#D3A373]/30'
                : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
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
            className="flex items-center gap-1.5 bg-[#E9EDCA] hover:bg-[#dce2b6] text-[#3e4c1f] border border-[#CDD5AE] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-[#54682b]" />
            <span>Import Scan</span>
          </button>

          {/* Clinical Case Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 bg-white hover:bg-[#FAEDCD]/50 text-[#2e2417] border border-[#E9EDCA] px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs whitespace-nowrap"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#D3A373]" />
              <div className="text-left">
                <span className="text-[9px] text-[#7d6b56] block font-mono uppercase tracking-wider font-semibold">
                  CASE SCENARIO
                </span>
                <span className="font-bold text-[#2e2417] text-xs max-w-[130px] sm:max-w-[180px] truncate block">
                  {activeCase.name}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#7d6b56] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-2xl border border-[#E9EDCA] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 text-[10px] font-bold text-[#7d6b56] border-b border-[#E9EDCA] uppercase tracking-wider flex items-center justify-between">
                  <span>Preset Clinical Scenarios</span>
                  <span className="text-[#D3A373] font-mono font-bold">5 Cases</span>
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
                            ? 'bg-[#FAEDCD] border border-[#D3A373] text-[#2e2417] font-medium'
                            : 'hover:bg-[#FEF9E1] text-[#5c4a38]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2e2417] truncate max-w-[200px]">
                            {preset.name}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D3A373]" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#7d6b56] font-mono">
                          <span className="bg-[#E9EDCA] px-1.5 py-0.5 rounded text-[#445220] font-semibold">
                            {preset.modality.split('/')[0]}
                          </span>
                          <span>•</span>
                          <span className="text-[#a46831] font-bold">Margin: {preset.safetyMarginMm}mm</span>
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
            className="flex items-center gap-1.5 bg-[#FAEDCD] hover:bg-[#f3e1b7] text-[#63431f] border border-[#D3A373]/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-[#D3A373]" />
            <span className="hidden sm:inline">OR Calibration</span>
          </button>
        </div>

      </div>
    </header>
  );
};
