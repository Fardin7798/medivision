'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ClinicalCase, Vector3D } from '@/types';
import { Layers, Crosshair, Sun, ZoomIn } from 'lucide-react';

interface MPRViewportsProps {
  activeCase: ClinicalCase;
  crosshairPosition: Vector3D;
  onCrosshairMove: (pos: Vector3D) => void;
}

export const MPRViewports: React.FC<MPRViewportsProps> = ({
  activeCase,
  crosshairPosition,
  onCrosshairMove,
}) => {
  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);

  const [windowPreset, setWindowPreset] = useState<'BRAIN' | 'BONE' | 'SOFT' | 'LUNG'>('BRAIN');
  const [zoomLevel] = useState<number>(1.0);

  // High-fidelity Procedural 2D DICOM Slice Renderer
  const drawAnatomicalSlice = (
    canvas: HTMLCanvasElement,
    plane: 'axial' | 'coronal' | 'sagittal',
    crossX: number,
    crossY: number,
    slicePos: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Base background for DICOM image (soft dark forest tone)
    ctx.fillStyle = '#161c13';
    ctx.fillRect(0, 0, w, h);

    // Anatomical tissue brightness based on HU preset
    let organHue = '#33412f';
    let boneHue = '#CDD5AE';
    let tumorHue = '#c2410c';

    if (windowPreset === 'BONE') {
      boneHue = '#FEF9E1';
      organHue = '#242e20';
    } else if (windowPreset === 'SOFT') {
      organHue = '#54684b';
      boneHue = '#E9EDCA';
    } else if (windowPreset === 'LUNG') {
      organHue = '#3b4836';
      boneHue = '#CDD5AE';
    }

    // Organ Parenchyma Cross-Section
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoomLevel, zoomLevel);

    // Realistic Anatomical Ellipse Profile
    ctx.beginPath();
    if (plane === 'axial') {
      ctx.ellipse(0, 0, 85, 98, 0, 0, 2 * Math.PI);
    } else if (plane === 'coronal') {
      ctx.ellipse(0, 0, 88, 75, 0, 0, 2 * Math.PI);
    } else {
      ctx.ellipse(0, 0, 95, 78, 0, 0, 2 * Math.PI);
    }
    ctx.fillStyle = organHue;
    ctx.fill();

    // Cortical Bone Calvarium Perimeter Ring
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = boneHue;
    ctx.stroke();

    // Internal Cerebral Ventricles / Organ Cavities
    ctx.beginPath();
    ctx.ellipse(-18, -5, 12, 28, Math.PI / 12, 0, 2 * Math.PI);
    ctx.ellipse(18, -5, 12, 28, -Math.PI / 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#10160d';
    ctx.fill();

    // Dynamic Tumor Target Core & Safety Margin Calculation based on Axis
    let targetSlicePos = activeCase.targetPosition.z;
    let targetPosX = (activeCase.targetPosition.x / 100) * 45;
    let targetPosY = (activeCase.targetPosition.y / 100) * 45;

    if (plane === 'coronal') {
      targetSlicePos = activeCase.targetPosition.y;
      targetPosX = (activeCase.targetPosition.x / 100) * 45;
      targetPosY = -(activeCase.targetPosition.z / 100) * 45;
    } else if (plane === 'sagittal') {
      targetSlicePos = activeCase.targetPosition.x;
      targetPosX = (activeCase.targetPosition.y / 100) * 45;
      targetPosY = -(activeCase.targetPosition.z / 100) * 45;
    }

    const tumorSliceDist = Math.abs(slicePos - targetSlicePos);

    if (tumorSliceDist < 35) {
      const tumorRadius = Math.max(3, 14 - tumorSliceDist * 0.35);
      ctx.beginPath();
      ctx.arc(targetPosX, targetPosY, tumorRadius, 0, 2 * Math.PI);
      ctx.fillStyle = tumorHue;
      ctx.shadowColor = '#D3A373';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Safety Margin Ring (Sage dashed)
      ctx.beginPath();
      ctx.arc(targetPosX, targetPosY, tumorRadius + (activeCase.safetyMarginMm * 1.5), 0, 2 * Math.PI);
      ctx.strokeStyle = '#CDD5AE';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // Dynamic Laser Crosshair Overlay
    ctx.strokeStyle = plane === 'axial' ? '#D3A373' : plane === 'coronal' ? '#CDD5AE' : '#E9EDCA';
    ctx.lineWidth = 1.3;
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
  };

  useEffect(() => {
    const axialCanvas = axialCanvasRef.current;
    if (axialCanvas) {
      const w = axialCanvas.width;
      const h = axialCanvas.height;
      const crossX = ((crosshairPosition.x + 100) / 200) * w;
      const crossY = ((crosshairPosition.y + 100) / 200) * h;
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
    <div className="solid-panel rounded-3xl p-4 shadow-sm flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Top Controls: Modality & Window/Level Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#D3A373]" />
          <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#2e2417] font-display">
            Multi-Planar Reconstruction (2D MPR)
          </h2>
          <span className="text-[10px] bg-[#E9EDCA] text-[#445220] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-semibold">
            {activeCase.modality}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-[#FAEDCD] p-1 rounded-xl border border-[#E9EDCA]">
            <Sun className="w-3.5 h-3.5 text-[#D3A373] ml-1" />
            <span className="text-[10px] text-[#6d5d4b] font-medium font-display">Preset:</span>
            {(['BRAIN', 'BONE', 'SOFT', 'LUNG'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setWindowPreset(preset)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  windowPreset === preset
                    ? 'bg-[#D3A373] text-white shadow-xs'
                    : 'text-[#5c4a38] hover:text-[#2e2417]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#FAEDCD] px-2.5 py-1 rounded-xl border border-[#E9EDCA] text-[10px] text-[#2e2417] font-mono font-semibold">
            <ZoomIn className="w-3 h-3 text-[#D3A373]" />
            <span>{(zoomLevel * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 3-Quadrant Synchronized Orthogonal Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Axial (Transverse) Viewport */}
        <div className="bg-white border border-[#E9EDCA] rounded-2xl p-2.5 flex flex-col gap-2 shadow-xs hover:border-[#D3A373] transition-colors group">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-[#8c5a2b] flex items-center gap-1.5 font-display">
              <Crosshair className="w-3.5 h-3.5" /> Axial (Transverse)
            </span>
            <span className="font-mono text-[10px] text-[#2e2417] bg-[#E9EDCA] px-1.5 py-0.5 rounded border border-[#CDD5AE] font-semibold">
              Z: {crosshairPosition.z.toFixed(0)} mm
            </span>
          </div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#E9EDCA] bg-[#161c13] cursor-crosshair shadow-inner">
            <canvas
              ref={axialCanvasRef}
              width={260}
              height={260}
              onClick={(e) => handleCanvasClick(e, 'axial')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-[#7d6b56] font-mono">
            <span>Slice: {Math.round((crosshairPosition.z + 100) / 2)} / 100</span>
            <span className="text-[#8c5a2b] font-bold">HU: {windowPreset === 'BONE' ? '+850' : '+38'}</span>
          </div>
        </div>

        {/* 2. Coronal (Frontal) Viewport */}
        <div className="bg-white border border-[#E9EDCA] rounded-2xl p-2.5 flex flex-col gap-2 shadow-xs hover:border-[#CDD5AE] transition-colors group">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-[#445220] flex items-center gap-1.5 font-display">
              <Crosshair className="w-3.5 h-3.5" /> Coronal (Frontal)
            </span>
            <span className="font-mono text-[10px] text-[#2e2417] bg-[#E9EDCA] px-1.5 py-0.5 rounded border border-[#CDD5AE] font-semibold">
              Y: {crosshairPosition.y.toFixed(0)} mm
            </span>
          </div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#E9EDCA] bg-[#161c13] cursor-crosshair shadow-inner">
            <canvas
              ref={coronalCanvasRef}
              width={260}
              height={260}
              onClick={(e) => handleCanvasClick(e, 'coronal')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-[#7d6b56] font-mono">
            <span>Slice: {Math.round((crosshairPosition.y + 100) / 2)} / 100</span>
            <span className="text-[#445220] font-bold">HU: {windowPreset === 'BONE' ? '+920' : '+42'}</span>
          </div>
        </div>

        {/* 3. Sagittal (Lateral) Viewport */}
        <div className="bg-white border border-[#E9EDCA] rounded-2xl p-2.5 flex flex-col gap-2 shadow-xs hover:border-[#D3A373] transition-colors group">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-[#784819] flex items-center gap-1.5 font-display">
              <Crosshair className="w-3.5 h-3.5" /> Sagittal (Lateral)
            </span>
            <span className="font-mono text-[10px] text-[#2e2417] bg-[#E9EDCA] px-1.5 py-0.5 rounded border border-[#CDD5AE] font-semibold">
              X: {crosshairPosition.x.toFixed(0)} mm
            </span>
          </div>
          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#E9EDCA] bg-[#161c13] cursor-crosshair shadow-inner">
            <canvas
              ref={sagittalCanvasRef}
              width={260}
              height={260}
              onClick={(e) => handleCanvasClick(e, 'sagittal')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-[#7d6b56] font-mono">
            <span>Slice: {Math.round((crosshairPosition.x + 100) / 2)} / 100</span>
            <span className="text-[#784819] font-bold">HU: {windowPreset === 'BONE' ? '+780' : '+35'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
