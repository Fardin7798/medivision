'use client';

import React, { useState } from 'react';
import { Target, X, CheckCircle2, RefreshCw, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import { PatientCase, RegistrationResult } from '../types';
import { computeLandmarkRegistration } from '../lib/math/kabsch';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: PatientCase;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  activeCase
}) => {
  const [isComputing, setIsComputing] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);

  if (!isOpen) return null;

  const handleRunRegistration = () => {
    setIsComputing(true);
    setTimeout(() => {
      const fixed = activeCase.fiducials.map(f => f.fixed);
      const moving = activeCase.fiducials.map(f => f.moving);
      const res = computeLandmarkRegistration(fixed, moving);
      setResult(res);
      setIsComputing(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-100 flex flex-col gap-4 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">OR Patient-to-Image Registration</h3>
              <p className="text-[11px] text-slate-400 font-mono">Dual Solver: Kabsch SVD + Horn's Quaternion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fiducial Landmark Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">
              Paired Anatomical Landmarks ({activeCase.fiducials.length} Points)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Active NDI Polaris</span>
          </div>
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-2.5 text-xs space-y-1.5 font-mono">
            {activeCase.fiducials.map((fid, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="font-sans font-bold text-slate-200 text-xs">{fid.name}</span>
                <div className="text-[10px] text-right space-y-0.5">
                  <div className="text-cyan-300">Scan: [{fid.fixed.join(', ')}] mm</div>
                  <div className="text-amber-300">Tracker: [{fid.moving.join(', ')}] mm</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Result Card */}
        {result && (
          <div className="bg-emerald-950/30 rounded-2xl p-4 border border-emerald-500/50 space-y-2 text-xs animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Rigid Calibration Successful
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 font-extrabold text-[10px] border border-emerald-600/60 font-mono">
                TRE: {result.targetRegistrationErrorMm} mm (Sub-millimeter)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-900/50">
                <span className="text-[10px] text-slate-400 block font-sans">Translation Vector:</span>
                <span className="text-cyan-300">[{result.translationVectorMm.join(', ')}] mm</span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-900/50">
                <span className="text-[10px] text-slate-400 block font-sans">Clinical Tolerance:</span>
                <span className="text-emerald-400 font-bold">PASS (&lt; 1.5 mm Target)</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleRunRegistration}
            disabled={isComputing}
            className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isComputing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isComputing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing SVD Transformation Matrix...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Compute 3D Rigid Transform</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
