'use client';

import React, { useState } from 'react';
import { PRESET_CASES } from '../data/presetCases';
import { PatientCase, Point3D, SurgicalTelemetry } from '../types';
import { Navbar } from '../components/Navbar';
import { ThreeDScene } from '../components/ThreeDScene';
import { AnatomyAtlasViewer } from '../components/AnatomyAtlasViewer';
import { MPRViewports } from '../components/MPRViewports';
import { CMPRViewer } from '../components/CMPRViewer';
import { NavigationTelemetryHUD } from '../components/NavigationTelemetryHUD';
import { AISegmentationPanel } from '../components/AISegmentationPanel';
import { OrganVisibilityPanel } from '../components/OrganVisibilityPanel';
import { RegistrationModal } from '../components/RegistrationModal';
import { PlanExportModal } from '../components/PlanExportModal';
import { CustomScanUploadModal } from '../components/CustomScanUploadModal';
import { Orbit, Sparkles, Layers, Crosshair, Box, GitCommit, ShieldCheck, FileDown, HeartPulse } from 'lucide-react';

export default function Home() {
  const [activeCase, setActiveCase] = useState<PatientCase>(PRESET_CASES[0]);
  const [activeTab, setActiveTab] = useState<'navigation' | 'mpr' | 'ai' | 'layers'>('navigation');
  const [viewportMode, setViewportMode] = useState<'navigation' | 'atlas'>('navigation');
  const [mprSubView, setMprSubView] = useState<'orthogonal' | 'cmpr'>('orthogonal');

  // Interactive surgical probe position (RAS coordinates in mm)
  const [pointerPosition, setPointerPosition] = useState<Point3D>({
    x: PRESET_CASES[0].entryPosition.x,
    y: PRESET_CASES[0].entryPosition.y,
    z: PRESET_CASES[0].entryPosition.z
  });

  const [isDualTrajectoryActive, setIsDualTrajectoryActive] = useState<boolean>(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(false);
  const [isExportPlanOpen, setIsExportPlanOpen] = useState<boolean>(false);
  const [isUploadScanOpen, setIsUploadScanOpen] = useState<boolean>(false);

  const handleCaseChange = (newCase: PatientCase) => {
    setActiveCase(newCase);
    setPointerPosition({ ...newCase.entryPosition });
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

  // Real-Time 3D Euclidean Distance & Trajectory Vector Math
  const dx = pointerPosition.x - activeCase.targetPosition.x;
  const dy = pointerPosition.y - activeCase.targetPosition.y;
  const dz = pointerPosition.z - activeCase.targetPosition.z;
  const distanceMm = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Safety Margin Status Calculation (< 5mm is Critical, < 15mm is Approaching)
  let marginStatus: 'SAFE' | 'APPROACHING' | 'CRITICAL' = 'SAFE';
  if (distanceMm < activeCase.safetyMarginMm) {
    marginStatus = 'CRITICAL';
  } else if (distanceMm < activeCase.safetyMarginMm + 10) {
    marginStatus = 'APPROACHING';
  }

  // Trajectory Angle Calculations (Azimuth α and Elevation β)
  const totalDepthMm = Math.sqrt(
    Math.pow(activeCase.entryPosition.x - activeCase.targetPosition.x, 2) +
    Math.pow(activeCase.entryPosition.y - activeCase.targetPosition.y, 2) +
    Math.pow(activeCase.entryPosition.z - activeCase.targetPosition.z, 2)
  );
  const azimuthDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const elevationDeg = (Math.asin(dz / (distanceMm || 1)) * 180) / Math.PI;

  const telemetry: SurgicalTelemetry = {
    distanceMm,
    marginStatus,
    safetyMarginThresholdMm: activeCase.safetyMarginMm,
    trajectory: {
      totalDepthMm,
      azimuthDeg,
      elevationDeg,
      unitVector: {
        x: dx / (distanceMm || 1),
        y: dy / (distanceMm || 1),
        z: dz / (distanceMm || 1)
      },
      entryPoint: activeCase.entryPosition
    },
    pointerPosition,
    targetPosition: activeCase.targetPosition
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Main Navigation Bar */}
      <Navbar
        activeCase={activeCase}
        onCaseChange={handleCaseChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRegistration={() => setIsRegistrationOpen(true)}
        onOpenUploadModal={() => setIsUploadScanOpen(true)}
      />

      {/* Main Clinical Operating Room Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
        
        {/* Left / Main Column: 3D Visualization & Multi-Planar Reconstruction */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* 3D Mode Switcher Bar */}
          <div className="glass-panel-subtle p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Orbit className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-extrabold text-slate-200">3D Workspace View:</span>
            </div>
            
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setViewportMode('navigation')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewportMode === 'navigation'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Surgical Trajectory (Three.js)</span>
              </button>

              <button
                onClick={() => setViewportMode('atlas')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewportMode === 'atlas'
                    ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-pink-600/30 glow-purple'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-300" />
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
          <div className="glass-panel-subtle p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-extrabold text-slate-200">Reconstruction Engine:</span>
            </div>
            
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setMprSubView('orthogonal')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  mprSubView === 'orthogonal'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Orthogonal 3-Plane (MPR)
              </button>
              
              <button
                onClick={() => setMprSubView('cmpr')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
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
          <div className="glass-panel-subtle p-1.5 rounded-2xl border border-slate-800/80 text-xs font-bold flex shadow-inner">
            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'navigation'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Navigation</span>
            </button>
            
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30 glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI (WebGPU)</span>
            </button>
            
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'layers'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
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
          <div className="glass-panel-subtle rounded-2xl p-3.5 text-xs text-slate-400 flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dual Solver Registration: <strong className="text-slate-200">Kabsch + Horn's (TRE &lt; 1.5mm)</strong></span>
            </div>
            <button
              onClick={() => setIsExportPlanOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
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
