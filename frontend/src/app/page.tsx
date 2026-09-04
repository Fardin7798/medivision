'use client';

import React, { useState } from 'react';
import { PRESET_CASES } from '@/data/presetCases';
import { ClinicalCase, NavigationTelemetry, Vector3D } from '@/types';
import { computeTelemetry } from '@/lib/math/navigation';
import { Navbar } from '@/components/Navbar';
import { ThreeDScene } from '@/components/ThreeDScene';
import { AnatomyAtlasViewer } from '@/components/AnatomyAtlasViewer';
import { MPRViewports } from '@/components/MPRViewports';
import { CMPRViewer } from '@/components/CMPRViewer';
import { NavigationTelemetryHUD } from '@/components/NavigationTelemetryHUD';
import { AISegmentationPanel } from '@/components/AISegmentationPanel';
import { OrganVisibilityPanel } from '@/components/OrganVisibilityPanel';
import { RegistrationModal } from '@/components/RegistrationModal';
import { PlanExportModal } from '@/components/PlanExportModal';
import { CustomScanUploadModal } from '@/components/CustomScanUploadModal';
import {
  Sparkles,
  Layers,
  Crosshair,
  Box,
  ShieldCheck,
  FileDown,
  GitCommit
} from 'lucide-react';

export default function Home() {
  const [activeCase, setActiveCase] = useState<ClinicalCase>(PRESET_CASES[0]);
  const [activeTab, setActiveTab] = useState<'navigation' | 'mpr' | 'ai' | 'layers'>('navigation');
  const [viewportMode, setViewportMode] = useState<'navigation' | 'atlas'>('navigation');
  const [mprSubView, setMprSubView] = useState<'orthogonal' | 'cmpr'>('orthogonal');
  const [isDualTrajectoryActive, setIsDualTrajectoryActive] = useState(false);

  // Modals state
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isExportPlanOpen, setIsExportPlanOpen] = useState(false);
  const [isUploadScanOpen, setIsUploadScanOpen] = useState(false);

  // Dynamic Navigation Pointer State
  const [pointerPosition, setPointerPosition] = useState<Vector3D>(
    activeCase.entryPosition
  );

  // Live Telemetry
  const telemetry: NavigationTelemetry = computeTelemetry(
    pointerPosition,
    activeCase.targetPosition,
    activeCase.entryPosition,
    activeCase.safetyMarginMm
  );

  const handleCaseChange = (newCase: ClinicalCase) => {
    setActiveCase(newCase);
    setPointerPosition(newCase.entryPosition);
  };

  const handleToggleStructure = (id: string) => {
    setActiveCase((prev) => ({
      ...prev,
      anatomicalStructures: prev.anatomicalStructures.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      )
    }));
  };

  const handleOpacityChange = (id: string, opacity: number) => {
    setActiveCase((prev) => ({
      ...prev,
      anatomicalStructures: prev.anatomicalStructures.map((s) =>
        s.id === id ? { ...s, opacity } : s
      )
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FEF9E1] text-[#2e2417] selection:bg-[#D3A373] selection:text-white">
      {/* Top Clinical Navbar */}
      <Navbar
        activeCase={activeCase}
        onCaseChange={handleCaseChange}
        onOpenRegistration={() => setIsRegistrationOpen(true)}
        onOpenUploadModal={() => setIsUploadScanOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Clinical OR Grid Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Left/Center Column: 3D Studio & Multi-Planar Radiography Slices */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* Primary Viewport Mode Selector Bar */}
          <div className="glass-panel p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-[#E9EDCA]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CDD5AE] animate-pulse" />
              <span className="text-xs font-bold text-[#382e21]">Primary 3D Environment:</span>
            </div>

            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setViewportMode('navigation')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewportMode === 'navigation'
                    ? 'bg-[#D3A373] text-white shadow-md shadow-[#D3A373]/25'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Surgical Trajectory (Three.js)</span>
              </button>

              <button
                onClick={() => setViewportMode('atlas')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewportMode === 'atlas'
                    ? 'bg-[#CDD5AE] text-[#334217] shadow-md shadow-[#CDD5AE]/30'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#54682b]" />
                <span>3D Anatomy Atlas (Ready-Made 4K)</span>
              </button>
            </div>
          </div>

          {/* Primary 3D Viewport Render */}
          {viewportMode === 'navigation' ? (
            <ThreeDScene
              activeCase={activeCase}
              pointerPosition={pointerPosition}
              isDualTrajectoryActive={isDualTrajectoryActive}
            />
          ) : (
            <AnatomyAtlasViewer />
          )}

          {/* Viewport Sub-Switch (Orthogonal MPR vs Curved CMPR) */}
          <div className="glass-panel p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-[#E9EDCA]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D3A373]" />
              <span className="text-xs font-extrabold text-[#382e21]">Reconstruction Engine:</span>
            </div>
            
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setMprSubView('orthogonal')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  mprSubView === 'orthogonal'
                    ? 'bg-[#D3A373] text-white shadow-xs'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                Orthogonal 3-Plane (MPR)
              </button>
              
              <button
                onClick={() => setMprSubView('cmpr')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  mprSubView === 'cmpr'
                    ? 'bg-[#CDD5AE] text-[#334217] shadow-xs'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Curved Centerline (CMPR)</span>
              </button>
            </div>
          </div>

          {/* Viewport Render: Orthogonal vs CMPR */}
          {mprSubView === 'orthogonal' ? (
            <MPRViewports
              activeCase={activeCase}
              crosshairPosition={pointerPosition}
              onCrosshairMove={setPointerPosition}
            />
          ) : (
            <CMPRViewer
              activeCase={activeCase}
              pointerPosition={pointerPosition}
              onPointerMove={setPointerPosition}
            />
          )}
        </div>

        {/* Right Column: Surgical Guidance HUD, AI Segmentation, & Organ Visibility */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          {/* Quick Context Sub-Tabs */}
          <div className="glass-panel p-1.5 rounded-2xl border border-[#E9EDCA] text-xs font-bold flex shadow-xs">
            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'navigation'
                  ? 'bg-[#D3A373] text-white shadow-md shadow-[#D3A373]/25'
                  : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Navigation</span>
            </button>
            
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-[#CDD5AE] text-[#334217] shadow-md shadow-[#CDD5AE]/30'
                  : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI (WebGPU)</span>
            </button>
            
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'layers'
                  ? 'bg-[#E9EDCA] text-[#425020] shadow-md shadow-[#E9EDCA]/40'
                  : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Layers</span>
            </button>
          </div>

          {/* Tab Content Display */}
          {activeTab === 'navigation' && (
            <NavigationTelemetryHUD
              telemetry={telemetry}
              activeCase={activeCase}
              onPointerMove={setPointerPosition}
              isDualTrajectoryActive={isDualTrajectoryActive}
              onToggleDualTrajectory={() => setIsDualTrajectoryActive(!isDualTrajectoryActive)}
              onOpenExportModal={() => setIsExportPlanOpen(true)}
            />
          )}

          {activeTab === 'ai' && (
            <AISegmentationPanel activeCase={activeCase} pointerPosition={pointerPosition} />
          )}

          {activeTab === 'layers' && (
            <OrganVisibilityPanel
              structures={activeCase.anatomicalStructures}
              onToggleVisibility={handleToggleStructure}
              onOpacityChange={handleOpacityChange}
            />
          )}

          {/* System Safety Guarantee Summary Card */}
          <div className="glass-panel rounded-2xl p-3.5 text-xs text-[#5c4a38] flex items-center justify-between border border-[#E9EDCA]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#758a43]" />
              <span>Dual Solver Registration: <strong className="text-[#2e2417]">Kabsch + Horn's (TRE &lt; 1.5mm)</strong></span>
            </div>
            <button
              onClick={() => setIsExportPlanOpen(true)}
              className="text-[#D3A373] hover:text-[#ba8551] font-bold flex items-center gap-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
          </div>
        </div>

      </main>

      {/* Point-Based Landmark Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        activeCase={activeCase}
      />

      {/* Surgical Plan Export Modal */}
      <PlanExportModal
        isOpen={isExportPlanOpen}
        onClose={() => setIsExportPlanOpen(false)}
        activeCase={activeCase}
        telemetry={telemetry}
        isDualTrajectoryActive={isDualTrajectoryActive}
      />

      {/* Custom Medical Scan Upload Modal */}
      <CustomScanUploadModal
        isOpen={isUploadScanOpen}
        onClose={() => setIsUploadScanOpen(false)}
        onLoadCustomCase={handleCaseChange}
      />
    </div>
  );
}
