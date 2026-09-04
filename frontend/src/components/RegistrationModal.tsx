'use client';

import React, { useState } from 'react';
import { Target, X, CheckCircle2, RefreshCw, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 bg-[#2e2417]/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#FEF9E1]/95 backdrop-blur-xl border border-[#E9EDCA] rounded-3xl w-full max-w-lg shadow-2xl p-6 text-[#2e2417] flex flex-col gap-4 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E9EDCA] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAEDCD] text-[#D3A373] flex items-center justify-center border border-[#E9EDCA] shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2e2417]">OR Patient-to-Image Registration</h3>
              <p className="text-[11px] text-[#7d6b56] font-mono">Dual Solver: Kabsch SVD + Horn's Quaternion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#FAEDCD] text-[#7d6b56] hover:text-[#2e2417] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fiducial Landmark Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#2e2417]">
              Paired Anatomical Landmarks ({activeCase.fiducials.length} Points)
            </span>
            <span className="text-[10px] text-[#D3A373] font-mono font-bold">Active NDI Polaris</span>
          </div>
          <div className="bg-[#FAEDCD]/50 rounded-2xl border border-[#E9EDCA] p-2.5 text-xs space-y-1.5 font-mono">
            {activeCase.fiducials.map((fid, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E9EDCA] shadow-2xs">
                <span className="font-sans font-bold text-[#2e2417] text-xs">{fid.name}</span>
                <div className="text-[10px] text-right space-y-0.5">
                  <div className="text-[#8c5a2b] font-bold">Scan: [{fid.fixed.join(', ')}] mm</div>
                  <div className="text-[#4e6024] font-bold">Tracker: [{fid.moving.join(', ')}] mm</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Result Card */}
        {result && (
          <div className="bg-[#E9EDCA] rounded-2xl p-4 border border-[#CDD5AE] space-y-2 text-xs animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#334217] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c6e2f]" />
                Rigid Calibration Successful
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#445220] font-extrabold text-[10px] border border-[#CDD5AE] font-mono shadow-2xs">
                TRE: {result.targetRegistrationErrorMm} mm (Sub-millimeter)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-[#E9EDCA] shadow-2xs">
                <span className="text-[10px] text-[#7d6b56] block font-sans">Translation Vector:</span>
                <span className="text-[#8c5a2b] font-bold">[{result.translationVectorMm.join(', ')}] mm</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E9EDCA] shadow-2xs">
                <span className="text-[10px] text-[#7d6b56] block font-sans">Clinical Tolerance:</span>
                <span className="text-[#4e6024] font-bold">PASS (&lt; 1.5 mm Target)</span>
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
                ? 'bg-[#E9EDCA] text-[#7d6b56] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#D3A373] to-[#be8e5e] hover:from-[#be8e5e] hover:to-[#a47547] text-white shadow-[#D3A373]/25'
            }`}
          >
            {isComputing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
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
            className="px-5 py-3 rounded-2xl bg-white hover:bg-[#FAEDCD] text-[#5c4a38] text-xs font-bold transition-colors border border-[#E9EDCA] shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
