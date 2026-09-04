'use client';

import React, { useState } from 'react';
import { ClinicalCase, Vector3D } from '@/types';
import {
  Sparkles,
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Brain,
  Eye,
  Sliders
} from 'lucide-react';

interface AISegmentationPanelProps {
  activeCase: ClinicalCase;
  pointerPosition: Vector3D;
}

export const AISegmentationPanel: React.FC<AISegmentationPanelProps> = ({
  activeCase,
}) => {
  const [isInferring, setIsInferring] = useState(false);
  const [activeModel, setActiveModel] = useState<'unet-brain' | 'swin-unetr' | 'sam-med3d'>('unet-brain');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);

  const handleRunInference = () => {
    setIsInferring(true);
    setTimeout(() => {
      setIsInferring(false);
    }, 1200);
  };

  return (
    <div className="solid-panel rounded-3xl p-4 shadow-sm flex flex-col gap-3.5 border border-[#E9EDCA]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#E9EDCA] text-[#425020] border border-[#CDD5AE]">
            <Sparkles className="w-4 h-4 text-[#54682b]" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-[#2e2417] font-display">
              WebGPU AI Segmentation
            </h2>
            <p className="text-[10px] text-[#6d5d4b]">
              Zero-Server ONNX WebGPU Runtime
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-[#E9EDCA] text-[#3e4c1f] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-bold flex items-center gap-1">
          <Cpu className="w-3 h-3 text-[#54682b]" />
          WebGPU Active
        </span>
      </div>

      {/* Model Selection Tabs */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[#6d5d4b] uppercase font-mono">
          AI Architecture
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveModel('unet-brain')}
            className={`py-2 px-1.5 rounded-xl border transition-all text-center ${
              activeModel === 'unet-brain'
                ? 'bg-[#CDD5AE] border-[#9ba96a] text-[#2c3814] shadow-xs'
                : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:bg-[#FAEDCD]'
            }`}
          >
            <span className="block text-[11px] font-display">UNet 3D</span>
            <span className="text-[9px] font-mono opacity-80">98.2% Dice</span>
          </button>

          <button
            onClick={() => setActiveModel('swin-unetr')}
            className={`py-2 px-1.5 rounded-xl border transition-all text-center ${
              activeModel === 'swin-unetr'
                ? 'bg-[#CDD5AE] border-[#9ba96a] text-[#2c3814] shadow-xs'
                : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:bg-[#FAEDCD]'
            }`}
          >
            <span className="block text-[11px] font-display">SwinUNETR</span>
            <span className="text-[9px] font-mono opacity-80">Transformer</span>
          </button>

          <button
            onClick={() => setActiveModel('sam-med3d')}
            className={`py-2 px-1.5 rounded-xl border transition-all text-center ${
              activeModel === 'sam-med3d'
                ? 'bg-[#CDD5AE] border-[#9ba96a] text-[#2c3814] shadow-xs'
                : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:bg-[#FAEDCD]'
            }`}
          >
            <span className="block text-[11px] font-display">MedSAM 3D</span>
            <span className="text-[9px] font-mono opacity-80">Zero-Shot</span>
          </button>
        </div>
      </div>

      {/* Real-time Inference Trigger */}
      <button
        onClick={handleRunInference}
        disabled={isInferring}
        className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
          isInferring
            ? 'bg-[#E9EDCA] text-[#425020]'
            : 'bg-[#CDD5AE] hover:bg-[#bec899] text-[#2c3814]'
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isInferring ? 'animate-spin' : ''}`} />
        <span className="font-display">{isInferring ? 'Computing WebGPU Tensors (12ms)...' : 'Run Live WebGPU Inference'}</span>
      </button>

      {/* Confidence Threshold Slider */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-[#E9EDCA] shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-[#382e21] font-display">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#D3A373]" />
            Confidence Cutoff
          </span>
          <span className="font-mono text-[11px] text-[#2e2417] font-semibold">
            {(confidenceThreshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="0.99"
          step="0.01"
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
          className="w-full cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#CDD5AE]"
        />
      </div>

      {/* Segmented Anatomical Structures Breakdown */}
      <div className="space-y-2 bg-[#FAEDCD]/40 p-3 rounded-2xl border border-[#E9EDCA]">
        <div className="flex justify-between items-center text-xs font-bold text-[#382e21] font-display">
          <span className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-[#54682b]" />
            Segmented Classes ({activeCase.anatomicalStructures.length})
          </span>
          <span className="text-[10px] text-[#7d6b56] font-mono">Volumetric (cm³)</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {activeCase.anatomicalStructures.map((structure, idx) => (
            <div
              key={structure.id}
              className="bg-white p-2 rounded-xl border border-[#E9EDCA] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: structure.color }}
                />
                <span className="font-bold text-[#2e2417] text-xs font-display">
                  {structure.name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#6d5d4b]">
                <span className="text-[#2e2417] font-semibold">{(12.4 + idx * 8.2).toFixed(1)} cm³</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#54682b]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
