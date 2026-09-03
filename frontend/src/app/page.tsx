'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ThreeDScene } from '../components/ThreeDScene';
import { MPRViewports } from '../components/MPRViewports';
import { CMPRViewer } from '../components/CMPRViewer';
import { NavigationTelemetryHUD } from '../components/NavigationTelemetryHUD';
import { AISegmentationPanel } from '../components/AISegmentationPanel';
import { OrganVisibilityPanel } from '../components/OrganVisibilityPanel';
import { RegistrationModal } from '../components/RegistrationModal';
import { PlanExportModal } from '../components/PlanExportModal';
import { CustomScanUploadModal } from '../components/CustomScanUploadModal';
import { PRESET_CASES } from '../data/presetCases';
import { PatientCase, Point3D, SurgicalTelemetry } from '../types';
import { computeTelemetry } from '../lib/math/navigation';
import { Crosshair, Layers, Sparkles, Box, ShieldCheck, FileDown, GitCommit } from 'lucide-react';

export default function Home() {
  const [activeCase, setActiveCase] = useState<PatientCase>(PRESET_CASES[0]);
  const [activeTab, setActiveTab] = useState<'navigation' | 'mpr' | 'ai' | 'layers'>('navigation');
  const [pointerPosition, setPointerPosition] = useState<Point3D>(activeCase.entryPosition);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isExportPlanOpen, setIsExportPlanOpen] = useState(false);
  const [isUploadScanOpen, setIsUploadScanOpen] = useState(false);
  const [isDualTrajectoryActive, setIsDualTrajectoryActive] = useState(false);
  const [mprSubView, setMprSubView] = useState<'orthogonal' | 'cmpr'>('orthogonal');

  // Compute live surgical telemetry
  const telemetry: SurgicalTelemetry = computeTelemetry(
    pointerPosition,
    activeCase.targetPosition,
    activeCase.entryPosition,
    activeCase.safetyMarginMm
  );

  const handleCaseChange = (newCase: PatientCase) => {
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Clinical Navigation Bar */}
      <Navbar
        activeCase={activeCase}
        onCaseChange={handleCaseChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRegistration={() => setIsRegistrationOpen(true)}
        onOpenUploadModal={() => setIsUploadScanOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 p-4 max-w-[1920px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column: Interactive 3D Anatomy Scene & 4-Quadrant MPR / CMPR Viewports */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Primary 3D Viewport */}
          <ThreeDScene
            activeCase={activeCase}
            pointerPosition={pointerPosition}
            isDualTrajectoryActive={isDualTrajectoryActive}
          />

          {/* Viewport Sub-Switch (Orthogonal MPR vs Curved CMPR) */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Reconstruction Mode:</span>
            </div>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setMprSubView('orthogonal')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  mprSubView === 'orthogonal'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Orthogonal 3-Plane (MPR)
              </button>
              <button
                onClick={() => setMprSubView('cmpr')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  mprSubView === 'cmpr'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
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
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'navigation'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Navigation</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI (WebGPU)</span>
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'layers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
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
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dual Solver Registration: <strong className="text-slate-200">Kabsch + Horn's (TRE &lt; 1.5mm)</strong></span>
            </div>
            <button
              onClick={() => setIsExportPlanOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
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
