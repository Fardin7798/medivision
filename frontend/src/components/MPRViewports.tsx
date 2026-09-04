'use client';

import React, { useRef, useEffect, useState } from 'react';
import { PatientCase, Point3D } from '../types';
import { Eye, Layers, Sun, ZoomIn, Crosshair } from 'lucide-react';

interface MPRViewportsProps {
  activeCase: PatientCase;
  crosshairPosition: Point3D;
  onCrosshairMove: (pos: Point3D) => void;
}

export const MPRViewports: React.FC<MPRViewportsProps> = ({
  activeCase,
  crosshairPosition,
  onCrosshairMove
}) => {
  const [windowPreset, setWindowPreset] = useState<'BRAIN' | 'BONE' | 'SOFT' | 'LUNG'>('BRAIN');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  
  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render high-density anatomical cross-sections for Axial, Coronal, Sagittal
  useEffect(() => {
    const drawAnatomicalSlice = (
      canvas: HTMLCanvasElement | null,
      plane: 'axial' | 'coronal' | 'sagittal',
      crossX: number,
      crossY: number,
      slicePos: number
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Background density
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, w, h);

      // Window/Level contrast curves
      const isBone = windowPreset === 'BONE';
      const isLung = windowPreset === 'LUNG';
      const contrastMultiplier = isBone ? 1.5 : windowPreset === 'SOFT' ? 1.2 : 1.0;

      // Scale factor
      const scale = (w / 240) * zoomLevel;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Draw Patient Specific Anatomical Structures based on Case Category
      if (activeCase.category === 'Neurosurgery' || activeCase.id.includes('glioma') || activeCase.id.includes('dbs') || activeCase.id.includes('avm')) {
        // --- BRAIN & CRANIAL ANATOMY ---
        // A. Skull Calvarium Bone Ring
        ctx.beginPath();
        if (plane === 'axial') {
          ctx.ellipse(0, -5, 88 * scale, 102 * scale, 0, 0, Math.PI * 2);
        } else if (plane === 'coronal') {
          ctx.ellipse(0, -8, 86 * scale, 94 * scale, 0, 0, Math.PI * 2);
        } else {
          ctx.ellipse(5, -8, 100 * scale, 92 * scale, 0, 0, Math.PI * 2);
        }
        ctx.lineWidth = 6 * scale;
        ctx.strokeStyle = isBone ? '#ffffff' : '#475569';
        ctx.stroke();

        // B. Brain Parenchyma (Cerebral Hemispheres)
        ctx.beginPath();
        if (plane === 'axial') {
          ctx.ellipse(0, -5, 82 * scale, 96 * scale, 0, 0, Math.PI * 2);
        } else if (plane === 'coronal') {
          ctx.ellipse(0, -8, 80 * scale, 88 * scale, 0, 0, Math.PI * 2);
        } else {
          ctx.ellipse(5, -8, 94 * scale, 86 * scale, 0, 0, Math.PI * 2);
        }
        const brainGrad = ctx.createRadialGradient(0, 0, 10 * scale, 0, 0, 90 * scale);
        brainGrad.addColorStop(0, `rgba(148, 163, 184, ${0.45 * contrastMultiplier})`);
        brainGrad.addColorStop(0.7, `rgba(100, 116, 139, ${0.35 * contrastMultiplier})`);
        brainGrad.addColorStop(1, `rgba(30, 41, 59, ${0.6 * contrastMultiplier})`);
        ctx.fillStyle = brainGrad;
        ctx.fill();

        // C. Interhemispheric Falx Cerebri Fissure
        ctx.beginPath();
        if (plane === 'axial' || plane === 'coronal') {
          ctx.moveTo(0, -85 * scale);
          ctx.lineTo(0, 75 * scale);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.lineWidth = 2 * scale;
          ctx.stroke();

          // D. Lateral Ventricles (CSF - Dark)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          // Left Ventricle Butterfly
          ctx.beginPath();
          ctx.ellipse(-14 * scale, -10 * scale, 7 * scale, 24 * scale, -0.15, 0, Math.PI * 2);
          ctx.fill();
          // Right Ventricle Butterfly
          ctx.beginPath();
          ctx.ellipse(14 * scale, -10 * scale, 7 * scale, 24 * scale, 0.15, 0, Math.PI * 2);
          ctx.fill();
        }

        // E. Cortical Sulci & Gyri Convolutions
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
        ctx.lineWidth = 1.2 * scale;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const r1 = 60 * scale;
          const r2 = 78 * scale;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
          ctx.lineTo(Math.cos(angle + 0.1) * r2, Math.sin(angle + 0.1) * r2);
          ctx.stroke();
        }

      } else if (activeCase.category === 'Spine' || activeCase.id.includes('spine')) {
        // --- LUMBAR SPINE ANATOMY ---
        // Vertebral Body
        ctx.beginPath();
        ctx.ellipse(0, -15 * scale, 55 * scale, 40 * scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = isBone ? 'rgba(241, 245, 249, 0.8)' : 'rgba(148, 163, 184, 0.5)';
        ctx.fill();
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = isBone ? '#ffffff' : '#64748b';
        ctx.stroke();

        // Spinal Canal (Foramen)
        ctx.beginPath();
        ctx.ellipse(0, 20 * scale, 22 * scale, 18 * scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fill();

        // Spinous Process & Pedicles
        ctx.beginPath();
        ctx.moveTo(-35 * scale, 5 * scale);
        ctx.lineTo(-45 * scale, 35 * scale);
        ctx.lineTo(0, 70 * scale);
        ctx.lineTo(45 * scale, 35 * scale);
        ctx.lineTo(35 * scale, 5 * scale);
        ctx.strokeStyle = isBone ? '#ffffff' : '#64748b';
        ctx.lineWidth = 3 * scale;
        ctx.stroke();

      } else {
        // --- ABDOMINAL / HEPATIC LIVER ANATOMY ---
        // Liver Contour
        ctx.beginPath();
        ctx.ellipse(15 * scale, 0, 85 * scale, 70 * scale, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
        ctx.fill();
        ctx.lineWidth = 2.5 * scale;
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
        ctx.stroke();

        // Inferior Vena Cava & Portal Vein
        ctx.beginPath();
        ctx.arc(-20 * scale, -10 * scale, 12 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.7)';
        ctx.fill();
      }

      // 2. Render Target Lesion / Focal Core with Contrast Enhancement
      const targetPos = activeCase.targetPosition;
      let targetX = 0;
      let targetY = 0;

      if (plane === 'axial') {
        targetX = (targetPos.x / 100) * 80 * scale;
        targetY = -(targetPos.y / 100) * 80 * scale;
      } else if (plane === 'coronal') {
        targetX = (targetPos.x / 100) * 80 * scale;
        targetY = -(targetPos.z / 100) * 80 * scale;
      } else {
        targetX = (targetPos.y / 100) * 80 * scale;
        targetY = -(targetPos.z / 100) * 80 * scale;
      }

      // Lesion Edema Halo
      ctx.beginPath();
      ctx.arc(targetX, targetY, (activeCase.safetyMarginMm + 6) * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.setLineDash([]);

      // Dense Lesion Core
      ctx.beginPath();
      ctx.arc(targetX, targetY, 6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      ctx.restore();

      // 3. Draw Synchronized Surgical Crosshairs
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(0, crossY);
      ctx.lineTo(w, crossY);
      ctx.stroke();

      // Vertical crosshair line
      ctx.beginPath();
      ctx.moveTo(crossX, 0);
      ctx.lineTo(crossX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshair center reticle circle
      ctx.beginPath();
      ctx.arc(crossX, crossY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Orientation Labels
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      if (plane === 'axial') {
        ctx.fillText('A', w / 2 - 4, 14);
        ctx.fillText('P', w / 2 - 4, h - 6);
        ctx.fillText('R', 6, h / 2 + 3);
        ctx.fillText('L', w - 14, h / 2 + 3);
      } else if (plane === 'coronal') {
        ctx.fillText('S', w / 2 - 4, 14);
        ctx.fillText('I', w / 2 - 4, h - 6);
        ctx.fillText('R', 6, h / 2 + 3);
        ctx.fillText('L', w - 14, h / 2 + 3);
      } else {
        ctx.fillText('S', w / 2 - 4, 14);
        ctx.fillText('I', w / 2 - 4, h - 6);
        ctx.fillText('A', 6, h / 2 + 3);
        ctx.fillText('P', w - 14, h / 2 + 3);
      }
    };

    // Calculate canvas crosshair pixel positions
    const axialCanvas = axialCanvasRef.current;
    if (axialCanvas) {
      const w = axialCanvas.width;
      const h = axialCanvas.height;
      const crossX = ((crosshairPosition.x + 100) / 200) * w;
      const crossY = ((100 - crosshairPosition.y) / 200) * h;
      drawAnatomicalSlice(axialCanvas, 'axial', crossX, crossY, crosshairPosition.z);
    }

    const coronalCanvas = coronalCanvasRef.current;
    if (coronalCanvas) {
      const w = coronalCanvas.width;
      const h = coronalCanvas.height;
      const crossX = ((crosshairPosition.x + 100) / 200) * w;
      const crossY = ((100 - crosshairPosition.z) / 200) * h;
      drawAnatomicalSlice(coronalCanvas, 'coronal', crossX, crossY, crosshairPosition.y);
    }

    const sagittalCanvas = sagittalCanvasRef.current;
    if (sagittalCanvas) {
      const w = sagittalCanvas.width;
      const h = sagittalCanvas.height;
      const crossX = ((crosshairPosition.y + 100) / 200) * w;
      const crossY = ((100 - crosshairPosition.z) / 200) * h;
      drawAnatomicalSlice(sagittalCanvas, 'sagittal', crossX, crossY, crosshairPosition.x);
    }
  }, [activeCase, crosshairPosition, windowPreset, zoomLevel]);

  // Click & drag interaction with boundary safety clamping
  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement>,
    plane: 'axial' | 'coronal' | 'sagittal'
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Safety boundary clamping [-95, 95]
    const rawX = (clickX / w) * 200 - 100;
    const rawY = 100 - (clickY / h) * 200;
    const normX = Math.max(-95, Math.min(95, rawX));
    const normY = Math.max(-95, Math.min(95, rawY));

    if (plane === 'axial') {
      onCrosshairMove({ ...crosshairPosition, x: normX, y: normY });
    } else if (plane === 'coronal') {
      onCrosshairMove({ ...crosshairPosition, x: normX, z: normY });
    } else {
      onCrosshairMove({ ...crosshairPosition, y: normX, z: normY });
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3.5">
      {/* Top Controls: Modality & Window/Level Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200">
            Multi-Planar Reconstruction (MPR)
          </h2>
          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
            {activeCase.modality}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <Sun className="w-3.5 h-3.5 text-amber-400 ml-1" />
            <span className="text-[10px] text-slate-400 font-medium">W/L:</span>
            {(['BRAIN', 'BONE', 'SOFT', 'LUNG'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setWindowPreset(preset)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  windowPreset === preset
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-300">
            <ZoomIn className="w-3 h-3 text-cyan-400" />
            <span>{(zoomLevel * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 3-Quadrant Synchronized Orthogonal Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Axial (Transverse) Viewport */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> Axial (Transverse)
            </span>
            <span className="font-mono text-[10px] text-slate-400">Z: {crosshairPosition.z.toFixed(0)} mm</span>
          </div>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/80 bg-black cursor-crosshair">
            <canvas
              ref={axialCanvasRef}
              width={260}
              height={260}
              onClick={(e) => handleCanvasClick(e, 'axial')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-mono">
            <span>Slice: {Math.round((crosshairPosition.z + 100) / 2)} / 100</span>
            <span className="text-cyan-400">HU: {windowPreset === 'BONE' ? '+850' : '+38'}</span>
          </div>
        </div>

        {/* 2. Coronal (Frontal) Viewport */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> Coronal (Frontal)
            </span>
            <span className="font-mono text-[10px] text-slate-400">Y: {crosshairPosition.y.toFixed(0)} mm</span>
          </div>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/80 bg-black cursor-crosshair">
            <canvas
              ref={coronalCanvasRef}
              width={260}
              height={260}
              onClick={(e) => handleCanvasClick(e, 'coronal')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-mono">
            <span>Slice: {Math.round((crosshairPosition.y + 100) / 2)} / 100</span>
            <span className="text-emerald-400">HU: {windowPreset === 'BONE' ? '+920' : '+42'}</span>
          </div>
        </div>

        {/* 3. Sagittal (Lateral) Viewport */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-purple-400 flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> Sagittal (Lateral)
            </span>
            <span className="font-mono text-[10px] text-slate-400">X: {crosshairPosition.x.toFixed(0)} mm</span>
          </div>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/80 bg-black cursor-crosshair">
            <canvas
              ref={sagittalCanvasRef}
              width={260}
              height={260}
              onClick={(e) => handleCanvasClick(e, 'sagittal')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-mono">
            <span>Slice: {Math.round((crosshairPosition.x + 100) / 2)} / 100</span>
            <span className="text-purple-400">HU: {windowPreset === 'BONE' ? '+780' : '+35'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
