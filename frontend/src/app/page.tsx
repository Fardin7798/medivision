'use client';
import { SavedSurgicalPlan } from '@/lib/puter/client';

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
import { MPRControlPanel } from '@/components/MPRControlPanel';
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
  GitCommit,
  Activity,
  Cpu,
  Shield,
  Zap,
  CheckCircle2
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

  const handleLoadPlanFromPuter = (plan: SavedSurgicalPlan) => {
    const loadedCase: ClinicalCase = {
      id: plan.caseId || ('cloud_' + plan.id),
      name: plan.name,
      patientAge: plan.patientAge,
      gender: plan.gender,
      modality: (plan.modality || 'MRI T1-CE / T2-FLAIR') as any,
      category: 'Cranial Lesion (Cloud Sync)',
      description: activeCase.description || 'Synchronized stereotactic plan from Puter Cloud',
      volumeUrl: activeCase.volumeUrl,
      fiducials: activeCase.fiducials || [],
      safetyMarginMm: plan.safetyMarginMm,
      targetPosition: {
        x: plan.targetCoordinates[0],
        y: plan.targetCoordinates[1],
        z: plan.targetCoordinates[2],
      },
      entryPosition: {
        x: plan.entryPort[0],
        y: plan.entryPort[1],
        z: plan.entryPort[2],
      },
      anatomicalStructures: activeCase.anatomicalStructures,
    };
    handleCaseChange(loadedCase);
  };

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
    <div className="min-h-screen flex flex-col bg-[#FEF9E1] text-[#2e2417] selection:bg-[#D3A373] selection:text-white font-sans">
      {/* Top Clinical Navbar */}
      <Navbar
        activeCase={activeCase}
        onCaseChange={handleCaseChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRegistration={() => setIsRegistrationOpen(true)}
        onOpenUploadModal={() => setIsUploadScanOpen(true)}
        onLoadPlanIntoCase={handleLoadPlanFromPuter}
      />

      {/* Main Multi-Column Surgical Cockpit Layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3.5 sm:p-5 flex flex-col gap-5">
        
        {/* Top Split Cockpit: Visualization + Telemetry */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          
          {/* Left/Center Column: 3D Visualization & Multi-Planar Slices */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            
            {/* 3D Viewport Controls & Engine Switcher */}
            <div className="solid-panel p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-[#E9EDCA] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D3A373] animate-pulse" />
                <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#382e21] font-display">
                  3D Interactive Surgical Suite
                </h2>
              </div>

              <div className="flex gap-1 text-xs">
                <button
                  onClick={() => setViewportMode('navigation')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    viewportMode === 'navigation'
                      ? 'bg-[#D3A373] text-white shadow-xs font-black'
                      : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span className="font-display">Surgical Trajectory (Three.js)</span>
                </button>

                <button
                  onClick={() => setViewportMode('atlas')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    viewportMode === 'atlas'
                      ? 'bg-[#CDD5AE] text-[#334217] shadow-xs font-black'
                      : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#54682b]" />
                  <span className="font-display">3D Anatomy Atlas (Ready-Made 4K)</span>
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
            <div className="solid-panel p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-[#E9EDCA] shadow-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D3A373]" />
                <span className="text-xs font-extrabold text-[#382e21] font-display">Reconstruction Engine:</span>
              </div>
              
              <div className="flex gap-1 text-xs">
                <button
                  onClick={() => setMprSubView('orthogonal')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                    mprSubView === 'orthogonal'
                      ? 'bg-[#D3A373] text-white shadow-xs font-black'
                      : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                  }`}
                >
                  <span className="font-display">Orthogonal 3-Plane (MPR)</span>
                </button>
                
                <button
                  onClick={() => setMprSubView('cmpr')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    mprSubView === 'cmpr'
                      ? 'bg-[#CDD5AE] text-[#334217] shadow-xs font-black'
                      : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span className="font-display">Curved Centerline (CMPR)</span>
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

          {/* Right Column: Surgical Guidance HUD, MPR Control, AI Segmentation, & Organ Visibility */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            
            {/* Quick Context Sub-Tabs */}
            <div className="solid-panel p-1 rounded-2xl border border-[#E9EDCA] text-xs font-bold grid grid-cols-4 gap-1 shadow-xs">
              <button
                onClick={() => setActiveTab('navigation')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center ${
                  activeTab === 'navigation'
                    ? 'bg-[#D3A373] text-white shadow-xs font-black'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-display">Nav</span>
              </button>
              
              <button
                onClick={() => setActiveTab('mpr')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center ${
                  activeTab === 'mpr'
                    ? 'bg-[#D3A373] text-white shadow-xs font-black'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-display">MPR</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center ${
                  activeTab === 'ai'
                    ? 'bg-[#CDD5AE] text-[#334217] shadow-xs font-black'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-display">AI</span>
              </button>
              
              <button
                onClick={() => setActiveTab('layers')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all text-center ${
                  activeTab === 'layers'
                    ? 'bg-[#E9EDCA] text-[#425020] shadow-xs font-black'
                    : 'text-[#6d5d4b] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
                }`}
              >
                <Box className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-display">3D Layers</span>
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

            {activeTab === 'mpr' && (
              <MPRControlPanel
                activeCase={activeCase}
                pointerPosition={pointerPosition}
                telemetry={telemetry}
                onPointerMove={setPointerPosition}
                mprSubView={mprSubView}
                onSubViewChange={setMprSubView}
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
            <div className="solid-panel rounded-2xl p-3.5 text-xs text-[#5c4a38] flex items-center justify-between border border-[#E9EDCA] shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#758a43]" />
                <span className="font-display">Dual Solver Registration: <strong className="text-[#2e2417]">Kabsch + Horn's (TRE &lt; 1.5mm)</strong></span>
              </div>
              <button
                onClick={() => setIsExportPlanOpen(true)}
                className="text-[#D3A373] hover:text-[#ba8551] font-bold flex items-center gap-1 font-display"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Summary</span>
              </button>
            </div>
          </div>

        </div>

        {/* 21st.dev Style Clinical Capabilities Bento Grid Section */}
        <section className="pt-2">
          <div className="flex items-center justify-between mb-3 border-b border-[#E9EDCA] pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D3A373]" />
              <h3 className="font-display font-extrabold text-sm text-[#2e2417] uppercase tracking-wider">
                Clinical Engineering Specifications & Hardware Pipeline
              </h3>
            </div>
            <span className="text-[10px] bg-[#FAEDCD] text-[#784819] font-mono px-2.5 py-0.5 rounded-full border border-[#D3A373]/40 font-bold">
              CE Mark & IEC 60601-2-77 Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Bento Card 1: Optical Tracking */}
            <div className="solid-card p-4 flex flex-col justify-between gap-3 bg-white">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819]">
                  <Crosshair className="w-4 h-4 text-[#D3A373]" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#E9EDCA] text-[#425020] px-2 py-0.5 rounded">
                  60 FPS / &lt;0.35mm
                </span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2e2417] mb-1">
                  Sub-millimeter Optical Tracking
                </h4>
                <p className="text-[#6d5d4b] text-[11px] leading-relaxed">
                  Real-time 60Hz NDI Polaris optical tracking with continuous FRE/TRE computation and margin boundary alert alarms.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#54682b] font-semibold border-t border-[#E9EDCA] pt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Latency Local Hardware Stream</span>
              </div>
            </div>

            {/* Bento Card 2: WebGPU AI */}
            <div className="solid-card p-4 flex flex-col justify-between gap-3 bg-white">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[#E9EDCA] text-[#425020]">
                  <Cpu className="w-4 h-4 text-[#54682b]" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#FAEDCD] text-[#784819] px-2 py-0.5 rounded">
                  Zero-Server ONNX
                </span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2e2417] mb-1">
                  In-Browser WebGPU AI Engine
                </h4>
                <p className="text-[#6d5d4b] text-[11px] leading-relaxed">
                  3D UNet and SwinUNETR neural segmentation running directly on client GPU shaders with 100% HIPAA data privacy.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#54682b] font-semibold border-t border-[#E9EDCA] pt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>12ms Tensor Execution Time</span>
              </div>
            </div>

            {/* Bento Card 3: Dual Solver Registration */}
            <div className="solid-card p-4 flex flex-col justify-between gap-3 bg-white">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819]">
                  <Shield className="w-4 h-4 text-[#D3A373]" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#E9EDCA] text-[#425020] px-2 py-0.5 rounded">
                  Kabsch + Horn
                </span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2e2417] mb-1">
                  Dual-Solver OR Registration
                </h4>
                <p className="text-[#6d5d4b] text-[11px] leading-relaxed">
                  Closed-form quaternion and SVD point-based rigid registration ensuring Target Registration Error (TRE) &lt; 1.2mm.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#54682b] font-semibold border-t border-[#E9EDCA] pt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Deterministic Transformation Matrix</span>
              </div>
            </div>

            {/* Bento Card 4: Multi-Planar CMPR */}
            <div className="solid-card p-4 flex flex-col justify-between gap-3 bg-white">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-[#E9EDCA] text-[#425020]">
                  <Layers className="w-4 h-4 text-[#54682b]" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#FAEDCD] text-[#784819] px-2 py-0.5 rounded">
                  2D/3D Synced
                </span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2e2417] mb-1">
                  Curved & Orthogonal DICOM
                </h4>
                <p className="text-[#6d5d4b] text-[11px] leading-relaxed">
                  Catmull-Rom spline longitudinal reformation with dynamic Hounsfield unit (HU) windowing and crosshair projection.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#54682b] font-semibold border-t border-[#E9EDCA] pt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sub-millimeter Coordinate Slicing</span>
              </div>
            </div>
          </div>
        </section>

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
