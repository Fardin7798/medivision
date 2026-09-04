'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PatientCase, Point3D } from '../types';
import { Layers, Sun, ZoomIn, Crosshair, Sliders } from 'lucide-react';

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
  const axialCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [windowPreset, setWindowPreset] = useState<'BRAIN' | 'BONE' | 'SOFT' | 'LUNG'>('BRAIN');
  const [zoomLevel] = useState<number>(1.0);

  // Render high-fidelity simulated anatomical cross-sections
  useEffect(() => {
    const drawAnatomicalSlice = (
      canvas: HTMLCanvasElement,
      plane: 'axial' | 'coronal' | 'sagittal',
      crossX: number,
      crossY: number,
      sliceCoordinate: number
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // 1. Clear with Deep Medical Monitor Black
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // 2. Anatomical Base Shape & Gradient
      const baseGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, w * 0.44);
      if (windowPreset === 'BONE') {
        baseGrad.addColorStop(0, '#1e293b');
        baseGrad.addColorStop(0.7, '#475569');
        baseGrad.addColorStop(0.92, '#f8fafc');
        baseGrad.addColorStop(1, '#020617');
      } else if (windowPreset === 'LUNG') {
        baseGrad.addColorStop(0, '#0f172a');
        baseGrad.addColorStop(0.6, '#1e293b');
        baseGrad.addColorStop(0.85, '#64748b');
        baseGrad.addColorStop(1, '#020617');
      } else {
        baseGrad.addColorStop(0, '#0f172a');
        baseGrad.addColorStop(0.55, '#334155');
        baseGrad.addColorStop(0.85, '#94a3b8');
        baseGrad.addColorStop(1, '#020617');
      }

      ctx.save();
      ctx.beginPath();
      if (plane === 'axial') {
        ctx.ellipse(cx, cy, w * 0.42, h * 0.45, 0, 0, Math.PI * 2);
      } else if (plane === 'coronal') {
        ctx.ellipse(cx, cy, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(cx, cy, w * 0.44, h * 0.40, 0, 0, Math.PI * 2);
      }
      ctx.fillStyle = baseGrad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = windowPreset === 'BONE' ? '#cbd5e1' : '#475569';
      ctx.stroke();
      ctx.restore();

      // 3. Internal Ventricles / Organ Contours
      ctx.save();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      if (plane === 'axial') {
        ctx.ellipse(cx - 15, cy - 5, 8, 20, 0.2, 0, Math.PI * 2);
        ctx.ellipse(cx + 15, cy - 5, 8, 20, -0.2, 0, Math.PI * 2);
      } else if (plane === 'coronal') {
        ctx.ellipse(cx - 14, cy - 10, 6, 22, 0.1, 0, Math.PI * 2);
        ctx.ellipse(cx + 14, cy - 10, 6, 22, -0.1, 0, Math.PI * 2);
      } else {
        ctx.ellipse(cx - 5, cy - 10, 15, 12, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // 4. Focal Pathology Lesion Target Overlay
      const targetScreenX = ((activeCase.targetPosition.x + 100) / 200) * w;
      const targetScreenY =
        plane === 'axial'
          ? ((100 - activeCase.targetPosition.y) / 200) * h
          : ((100 - activeCase.targetPosition.z) / 200) * h;

      const sliceDist =
        plane === 'axial'
          ? Math.abs(sliceCoordinate - activeCase.targetPosition.z)
          : plane === 'coronal'
          ? Math.abs(sliceCoordinate - activeCase.targetPosition.y)
          : Math.abs(sliceCoordinate - activeCase.targetPosition.x);

      if (sliceDist < 25) {
        const radius = Math.max(3, 14 * (1 - sliceDist / 25));
        const lesionGrad = ctx.createRadialGradient(
          targetScreenX,
          targetScreenY,
          1,
          targetScreenX,
          targetScreenY,
          radius
        );
        lesionGrad.addColorStop(0, '#ff4d4f');
        lesionGrad.addColorStop(0.7, '#d9363e');
        lesionGrad.addColorStop(1, 'rgba(217, 54, 62, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = lesionGrad;
        ctx.fill();

        // Safety Margin Contour
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, radius + activeCase.safetyMarginMm * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.restore();
      }

      // 5. High-Precision DICOM Crosshair Overlay
      ctx.save();
      ctx.strokeStyle = plane === 'axial' ? '#06b6d4' : plane === 'coronal' ? '#10b981' : '#a855f7';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Horizontal Line
      ctx.beginPath();
      ctx.moveTo(0, crossY);
      ctx.lineTo(w, crossY);
      ctx.stroke();

      // Vertical Line
      ctx.beginPath();
      ctx.moveTo(crossX, 0);
      ctx.lineTo(crossX, h);
      ctx.stroke();

      // Intersection Focus Ring
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(crossX, crossY, 6, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 6. Anatomical Orientation Cardinal Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      if (plane === 'axial') {
        ctx.fillText('A', cx - 4, 14);
        ctx.fillText('P', cx - 4, h - 6);
        ctx.fillText('R', 6, cy + 4);
        ctx.fillText('L', w - 12, cy + 4);
      } else if (plane === 'coronal') {
        ctx.fillText('S', cx - 4, 14);
        ctx.fillText('I', cx - 4, h - 6);
        ctx.fillText('R', 6, cy + 4);
        ctx.fillText('L', w - 12, cy + 4);
      } else {
        ctx.fillText('S', cx - 4, 14);
        ctx.fillText('I', cx - 4, h - 6);
        ctx.fillText('A', 6, cy + 4);
        ctx.fillText('P', w - 12, cy + 4);
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
    <div className="glass-panel rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 border border-slate-800">
      {/* Top Controls: Modality & Window/Level Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-200">
            Multi-Planar Reconstruction (2D MPR)
          </h2>
          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-800/60 font-semibold">
            {activeCase.modality}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <Sun className="w-3.5 h-3.5 text-amber-400 ml-1" />
            <span className="text-[10px] text-slate-400 font-medium">Preset:</span>
            {(['BRAIN', 'BONE', 'SOFT', 'LUNG'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setWindowPreset(preset)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  windowPreset === preset
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono">
            <ZoomIn className="w-3 h-3 text-cyan-400" />
            <span>{(zoomLevel * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 3-Quadrant Synchronized Orthogonal Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Axial (Transverse) Viewport */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col gap-2 shadow-inner hover:border-cyan-500/50 transition-colors group">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" /> Axial (Transverse)
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              Z: {crosshairPosition.z.toFixed(0)} mm
            </span>
          </div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-800/80 bg-black cursor-crosshair shadow-2xl">
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
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col gap-2 shadow-inner hover:border-emerald-500/50 transition-colors group">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" /> Coronal (Frontal)
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              Y: {crosshairPosition.y.toFixed(0)} mm
            </span>
          </div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-800/80 bg-black cursor-crosshair shadow-2xl">
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
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col gap-2 shadow-inner hover:border-purple-500/50 transition-colors group">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" /> Sagittal (Lateral)
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              X: {crosshairPosition.x.toFixed(0)} mm
            </span>
          </div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-800/80 bg-black cursor-crosshair shadow-2xl">
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
