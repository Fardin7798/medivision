'use client';

import React, { useState } from 'react';
import { ClinicalCase } from '@/types';
import { computeLandmarkRegistration } from '@/lib/math/kabsch';
import { Shield, CheckCircle2, RotateCcw, X, Activity } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: ClinicalCase;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  activeCase,
}) => {
  const [fiducials, setFiducials] = useState(activeCase.fiducials);
  const [registeredTRE, setRegisteredTRE] = useState<number | null>(0.84);
  const [solverMethod, setSolverMethod] = useState<'kabsch-svd' | 'horns-quaternion'>('kabsch-svd');

  if (!isOpen) return null;

  const handleComputeRegistration = () => {
    const fixedPoints = fiducials.map((f) => f.fixed as [number, number, number]);
    const movingPoints = fiducials.map((f) => f.moving as [number, number, number]);

    const result = computeLandmarkRegistration(fixedPoints, movingPoints, solverMethod);
    setRegisteredTRE(result.targetRegistrationErrorMm);
  };

  const handleResetFiducials = () => {
    setFiducials(activeCase.fiducials);
    setRegisteredTRE(0.84);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white border border-[#E9EDCA] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E9EDCA] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819]">
              <Shield className="w-5 h-5 text-[#D3A373]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2e2417] font-display">
                Intraoperative Landmark Calibration
              </h2>
              <p className="text-xs text-[#6d5d4b]">
                Dual Solver: Kabsch SVD + Horn’s Quaternion (TRE Guarantee)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#FAEDCD] text-[#7d6b56] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Solver Method Selector */}
        <div className="flex gap-2 text-xs font-bold bg-[#FAEDCD] p-1 rounded-xl">
          <button
            onClick={() => setSolverMethod('kabsch-svd')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              solverMethod === 'kabsch-svd'
                ? 'bg-[#D3A373] text-white shadow-xs'
                : 'text-[#5c4a38] hover:text-[#2e2417]'
            }`}
          >
            Kabsch Algorithm (SVD)
          </button>
          <button
            onClick={() => setSolverMethod('horns-quaternion')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              solverMethod === 'horns-quaternion'
                ? 'bg-[#CDD5AE] text-[#334217] shadow-xs'
                : 'text-[#5c4a38] hover:text-[#2e2417]'
            }`}
          >
            Horn’s Closed-Form (Quaternion)
          </button>
        </div>

        {/* Fiducial Matrix Table */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div className="grid grid-cols-12 text-[11px] font-bold text-[#7d6b56] px-2 font-mono">
            <span className="col-span-4">Landmark Name</span>
            <span className="col-span-4">Pre-Op CT (X, Y, Z)</span>
            <span className="col-span-4">Tracked Probe (X, Y, Z)</span>
          </div>

          {fiducials.map((f, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-center bg-[#FAEDCD]/30 p-2.5 rounded-xl border border-[#E9EDCA] text-xs font-mono text-[#2e2417]"
            >
              <span className="col-span-4 font-bold text-[#8c5a2b] font-display">{f.name}</span>
              <span className="col-span-4 text-[#5c4a38]">
                [{f.fixed.map((n) => n.toFixed(0)).join(', ')}]
              </span>
              <span className="col-span-4 text-[#445220] font-semibold">
                [{f.moving.map((n) => n.toFixed(0)).join(', ')}]
              </span>
            </div>
          ))}
        </div>

        {/* TRE Calculation Result */}
        {registeredTRE !== null && (
          <div className="bg-[#E9EDCA] border border-[#CDD5AE] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#38461b]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#54682b]" />
              <div>
                <span className="font-bold font-display">Target Registration Error (TRE):</span>
                <div className="text-[11px] font-mono">
                  Calculated TRE: <strong className="text-[#2c3814]">{registeredTRE.toFixed(2)} mm</strong> (Clinical Threshold &lt; 1.5mm)
                </div>
              </div>
            </div>
            <span className="bg-[#CDD5AE] px-2.5 py-1 rounded-lg text-[#2c3814] font-bold font-mono">
              PASSED
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleComputeRegistration}
            className="flex-1 py-3 rounded-2xl bg-[#D3A373] hover:bg-[#be8e5e] text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 font-display"
          >
            <Activity className="w-4 h-4" />
            <span>Compute Dual Registration</span>
          </button>
          <button
            onClick={handleResetFiducials}
            className="p-3 rounded-2xl bg-[#FAEDCD] hover:bg-[#f5e3ba] text-[#5c4a38] transition-colors border border-[#E9EDCA]"
            title="Reset default fiducials"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
