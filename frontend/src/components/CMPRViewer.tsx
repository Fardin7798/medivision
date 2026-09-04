'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ClinicalCase, Vector3D } from '@/types';
import { GitCommit, ZoomIn, Compass } from 'lucide-react';

interface CMPRViewerProps {
  activeCase: ClinicalCase;
  pointerPosition: Vector3D;
  onPointerMove: (pos: Vector3D) => void;
}

export const CMPRViewer: React.FC<CMPRViewerProps> = ({
  activeCase,
  pointerPosition,
  onPointerMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sliceStep, setSliceStep] = useState(0.5);

  // High-Precision Curved Multi-Planar Reformation (CMPR) Slice Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark surgical background
    ctx.fillStyle = '#161c13';
    ctx.fillRect(0, 0, w, h);

    // Anatomical tissue parenchyma along curved centerline
    ctx.save();
    ctx.translate(w / 2, h / 2);

    // Curved Spline Anatomical Corridor
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.42, h * 0.36, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#263321';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#CDD5AE';
    ctx.stroke();

    // Internal Vasculature & Critical Structures
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -h * 0.1);
    ctx.bezierCurveTo(-w * 0.1, -h * 0.25, w * 0.1, h * 0.25, w * 0.35, h * 0.1);
    ctx.strokeStyle = '#D3A373';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Target Tumor Focal Center
    const targetScreenX = (activeCase.targetPosition.x / 100) * (w * 0.35);
    const targetScreenY = (activeCase.targetPosition.y / 100) * (h * 0.3);

    ctx.beginPath();
    ctx.arc(targetScreenX, targetScreenY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#D3A373';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Safety Margin Ring
    ctx.beginPath();
    ctx.arc(targetScreenX, targetScreenY, 14 + activeCase.safetyMarginMm * 2, 0, 2 * Math.PI);
    ctx.strokeStyle = '#CDD5AE';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Crosshair Position
    const crossX = (pointerPosition.x / 100) * (w * 0.35);
    const crossY = (pointerPosition.y / 100) * (h * 0.3);

    ctx.restore();

    // Crosshair Laser Overlay
    ctx.strokeStyle = '#D3A373';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    const canvasCrossX = w / 2 + crossX;
    const canvasCrossY = h / 2 + crossY;

    ctx.beginPath();
    ctx.moveTo(0, canvasCrossY);
    ctx.lineTo(w, canvasCrossY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvasCrossX, 0);
    ctx.lineTo(canvasCrossX, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeCase, pointerPosition, sliceStep]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const normX = ((clickX - w / 2) / (w * 0.35)) * 100;
    const normY = ((clickY - h / 2) / (h * 0.3)) * 100;

    onPointerMove({
      ...pointerPosition,
      x: Math.max(-95, Math.min(95, normX)),
      y: Math.max(-95, Math.min(95, normY)),
    });
  };

  return (
    <div className="solid-panel rounded-3xl p-4 shadow-sm flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#CDD5AE]" />
          <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#2e2417] font-display">
            Curved Planar Reformation (CMPR)
          </h2>
          <span className="text-[10px] bg-[#E9EDCA] text-[#445220] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-semibold">
            Spline Tracked
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#FAEDCD] px-3 py-1 rounded-xl border border-[#E9EDCA] text-[10px] font-semibold text-[#2e2417]">
            <Compass className="w-3.5 h-3.5 text-[#D3A373]" />
            <span>Spline Normal: 90.0°</span>
          </div>
        </div>
      </div>

      {/* Main CMPR Longitudinal Reformation Canvas */}
      <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-[#E9EDCA] bg-[#161c13] cursor-crosshair shadow-inner">
        <canvas
          ref={canvasRef}
          width={800}
          height={340}
          onClick={handleCanvasClick}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Centerline Resection Step Slider */}
      <div className="flex items-center justify-between gap-3 text-xs bg-[#FAEDCD]/40 p-2.5 rounded-2xl border border-[#E9EDCA] font-mono">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-3.5 h-3.5 text-[#D3A373]" />
          <span className="text-[11px] font-bold text-[#5c4a38] font-display">Resection Step:</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={sliceStep}
          onChange={(e) => setSliceStep(parseFloat(e.target.value))}
          className="flex-1 cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#D3A373]"
        />
        <span className="text-[11px] font-bold text-[#2e2417]">
          {(sliceStep * 100).toFixed(0)}% Depth
        </span>
      </div>
    </div>
  );
};
