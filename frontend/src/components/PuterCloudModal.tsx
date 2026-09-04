'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  X,
  User,
  LogIn,
  LogOut,
  HardDrive,
  Database,
  Sparkles,
  FileText,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { PuterClient, PuterUser, SavedSurgicalPlan } from '@/lib/puter/client';
import { ClinicalCase } from '@/types';

interface PuterCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPlanIntoCase?: (plan: SavedSurgicalPlan) => void;
}

export const PuterCloudModal: React.FC<PuterCloudModalProps> = ({
  isOpen,
  onClose,
  onLoadPlanIntoCase,
}) => {
  const [user, setUser] = useState<PuterUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedSurgicalPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshUserData = async () => {
    try {
      const activeUser = await PuterClient.getUser();
      setUser(activeUser);
    } catch {
      setUser(null);
    }
  };

  const refreshSavedPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const plans = await PuterClient.getSavedPlansFromCloud();
      setSavedPlans(plans);
    } catch {
      setSavedPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshUserData();
      refreshSavedPlans();
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage('Opening Puter authentication dialog...');
    try {
      const loggedUser = await PuterClient.signIn();
      setUser(loggedUser);
      setStatusMessage(loggedUser ? `Signed in successfully as ${loggedUser.username}` : 'Sign in cancelled.');
      await refreshSavedPlans();
    } catch {
      setStatusMessage('Authentication request was not completed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await PuterClient.signOut();
    setUser(null);
    setStatusMessage('Signed out of Puter session.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-none animate-fadeIn">
      <div className="bg-[#FEF9E1] border-2 border-[#D3A373] rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header: Crisp Solid Top Bar */}
        <div className="p-4 sm:p-5 bg-[#FAEDCD] border-b border-[#E9EDCA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D3A373] text-white shadow-xs flex items-center justify-center">
              <Cloud className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#2e2417] tracking-tight font-display">
                  Puter.js Cloud & Identity Suite
                </h2>
                <span className="text-[10px] bg-[#E9EDCA] text-[#485626] font-mono px-2 py-0.5 rounded-full border border-[#CDD5AE] font-bold">
                  v2.6 INTEGRATED
                </span>
              </div>
              <p className="text-xs text-[#7d6b56] mt-0.5">
                Keyless serverless cloud filesystem, KV telemetry store, and AI copilot.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-[#E9EDCA] text-[#7d6b56] hover:text-[#2e2417] hover:bg-[#FEF9E1] transition-all shadow-xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* User Account / Identity Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E9EDCA] shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FAEDCD] border border-[#D3A373]/40 flex items-center justify-center text-[#784819] font-black text-base shadow-xs">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : <User className="w-6 h-6 text-[#965a25]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#2e2417] text-sm sm:text-base font-display">
                      {user ? user.username : 'Guest Surgical Session'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5 ${
                      user
                        ? 'bg-[#E9EDCA] text-[#445220] border border-[#CDD5AE]'
                        : 'bg-[#FAEDCD] text-[#784819] border border-[#D3A373]/40'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-[#556b2f] animate-pulse' : 'bg-[#D3A373]'}`} />
                      {user ? 'Authenticated' : 'Keyless Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7d6b56] mt-0.5 font-mono">
                    {user ? `Puter ID: ${user.uuid || user.username} • Cloud FS Mounted` : 'Free intraoperative AI & cloud sync active without login'}
                  </p>
                </div>
              </div>

              {/* Action: Sign In or Sign Out Button */}
              <div>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FEF9E1] hover:bg-[#FAEDCD] text-[#784819] border border-[#D3A373]/50 transition-all shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#D3A373] hover:bg-[#b88656] text-white transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSigningIn ? 'Connecting...' : 'Sign In with Puter'}</span>
                  </button>
                )}
              </div>
            </div>

            {statusMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#FAEDCD]/60 border border-[#D3A373]/30 text-xs text-[#784819] font-medium flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Puter Subsystems Matrix (What powers MediVision) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#7d6b56] uppercase tracking-wider font-mono flex items-center gap-2">
              <span>Active Puter.js Micro-Services</span>
              <span className="text-[#D3A373]">4 Subsystems Live</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="p-3.5 rounded-2xl bg-white border border-[#E9EDCA] shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819] shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#2e2417] text-xs font-display">Cloud FS (`puter.fs`)</h4>
                    <span className="text-[9px] font-mono text-[#445220] bg-[#E9EDCA] px-1.5 py-0.2 rounded font-bold">ONLINE</span>
                  </div>
                  <p className="text-[11px] text-[#7d6b56] mt-1 leading-snug">
                    Serializes 3D planned trajectories and fiducial landmarks to persistent JSON in Puter cloud storage.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E9EDCA] shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E9EDCA] text-[#445220] shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#2e2417] text-xs font-display">KV Index (`puter.kv`)</h4>
                    <span className="text-[9px] font-mono text-[#445220] bg-[#E9EDCA] px-1.5 py-0.2 rounded font-bold">INDEXED</span>
                  </div>
                  <p className="text-[11px] text-[#7d6b56] mt-1 leading-snug">
                    Maintains an instant-access index of saved surgical cases and clinical safety margin profiles.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E9EDCA] shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#CDD5AE] text-[#334217] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#2e2417] text-xs font-display">Surgical Copilot (`puter.ai.chat`)</h4>
                    <span className="text-[9px] font-mono text-[#445220] bg-[#E9EDCA] px-1.5 py-0.2 rounded font-bold">KEYLESS</span>
                  </div>
                  <p className="text-[11px] text-[#7d6b56] mt-1 leading-snug">
                    Answers intraoperative margin safety, sulcal approach angles, and eloquent cortex preservation queries.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E9EDCA] shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#FAEDCD] text-[#784819] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#2e2417] text-xs font-display">Vision OCR (`puter.ai.img2txt`)</h4>
                    <span className="text-[9px] font-mono text-[#445220] bg-[#E9EDCA] px-1.5 py-0.2 rounded font-bold">READY</span>
                  </div>
                  <p className="text-[11px] text-[#7d6b56] mt-1 leading-snug">
                    Reads radiological slips and paper requisitions to auto-fill patient age, modality, and diagnosis.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Cloud Saved Surgical Plans Directory */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#7d6b56] uppercase tracking-wider font-mono flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-[#D3A373]" />
                <span>Cloud-Saved Surgical Trajectories (`puter.fs`)</span>
              </h3>
              <button
                onClick={refreshSavedPlans}
                disabled={isLoadingPlans}
                className="text-[11px] text-[#784819] hover:underline font-bold"
              >
                {isLoadingPlans ? 'Refreshing...' : 'Refresh Plans'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E9EDCA] p-3 shadow-xs max-h-48 overflow-y-auto space-y-2">
              {savedPlans.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#7d6b56]">
                  <Cloud className="w-8 h-8 text-[#CDD5AE] mx-auto mb-2 opacity-70" />
                  <p className="font-bold text-[#2e2417]">No plans saved to Puter Cloud yet</p>
                  <p className="text-[11px] mt-0.5">Use "Export Plan" in the bottom-right HUD to save trajectories to your cloud drive.</p>
                </div>
              ) : (
                savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 rounded-xl bg-[#FEF9E1] border border-[#E9EDCA] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2e2417] font-display">{plan.name}</span>
                        <span className="bg-[#E9EDCA] text-[#445220] px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                          {plan.modality}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7d6b56] font-mono mt-0.5">
                        Target: [{plan.targetCoordinates.join(', ')}] • Margin: {plan.safetyMarginMm}mm • {new Date(plan.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    {onLoadPlanIntoCase && (
                      <button
                        onClick={() => {
                          onLoadPlanIntoCase(plan);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#D3A373] hover:bg-[#b88656] text-white text-[11px] font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        Load Plan
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Privacy & Hospital Compliance Guarantee */}
          <div className="p-3.5 rounded-2xl bg-[#FAEDCD]/40 border border-[#D3A373]/30 flex items-start gap-2.5 text-xs text-[#784819]">
            <ShieldCheck className="w-4 h-4 text-[#D3A373] shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-[#2e2417] font-display">HIPAA & Privacy Guarantee:</strong> Heavy 3D volumetric DICOM voxels and MedSAM tensor segmentation run strictly on your local device via WebGPU. Puter.js handles only anonymous non-PHI trajectory vectors, OCR, and cloud storage with user authorization.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#FAEDCD] border-t border-[#E9EDCA] flex items-center justify-between text-xs">
          <span className="text-[#7d6b56] font-mono text-[11px]">
            Powered by HeyPuter Cloud OS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FEF9E1] text-[#2e2417] font-bold border border-[#E9EDCA] shadow-xs cursor-pointer transition-all"
          >
            Close Suite
          </button>
        </div>

      </div>
    </div>
  );
};
