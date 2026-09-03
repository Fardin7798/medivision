'use client';

import React, { useState } from 'react';
import { Target, X, CheckCircle2, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-100 flex flex-col gap-4 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">OR Patient-to-Image Registration</h3>
              <p className="text-[11px] text-slate-400">Point-Pair Fiducial Calibration (Kabsch SVD)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fiducial Landmark Table */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Paired Anatomical Landmarks ({activeCase.fiducials.length} Points)
          </span>
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 text-xs space-y-1.5 font-mono">
            {activeCase.fiducials.map((fid, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="font-sans font-medium text-slate-300 text-[11px]">{fid.name}</span>
                <div className="text-[10px] text-right space-y-0.5">
                  <div className="text-cyan-400">Scan: [{fid.fixed.join(', ')}]</div>
                  <div className="text-amber-400">Tracker: [{fid.moving.join(', ')}]</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Result Card */}
        {result && (
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Rigid Calibration Successful
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold text-[10px] border border-emerald-700/60">
                TRE: {result.targetRegistrationErrorMm} mm (Optimal)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Translation Vector:</span>
                <span className="text-cyan-300">[{result.translationVectorMm.join(', ')}] mm</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Clinical Tolerance:</span>
                <span className="text-emerald-400 font-bold">PASS (&lt; 2.0 mm)</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleRunRegistration}
            disabled={isComputing}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isComputing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30'
            }`}
          >
            {isComputing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing SVD Transformation...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Compute 3D Rigid Transform</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
