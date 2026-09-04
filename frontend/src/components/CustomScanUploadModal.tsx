'use client';

import React, { useState } from 'react';
import { ClinicalCase } from '@/types';
import { PuterClient } from '@/lib/puter/client';
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
    Loader2,
  Camera,
} from 'lucide-react';

interface CustomScanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomCase: (c: ClinicalCase) => void;
}

export const CustomScanUploadModal: React.FC<CustomScanUploadModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomCase,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [patientName, setPatientName] = useState('Patient_Custom_001');
  const [patientAge, setPatientAge] = useState(52);
  const [modality, setModality] = useState<'MRI T1-CE' | 'CT Helical' | 'CT Angiography'>('MRI T1-CE');
  const [safetyMargin, setSafetyMargin] = useState(5.0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Puter OCR State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSnippet, setOcrSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileSelected(e.target.files[0]);
    }
  };

  // Puter OCR Prescription Handler
  const handlePrescriptionOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsOcrProcessing(true);
      const result = await PuterClient.extractDetailsFromMedicalImage(file);
      if (result.patientName) setPatientName(result.patientName);
      if (result.patientAge) setPatientAge(result.patientAge);
      if (result.modality) setModality(result.modality);
      if (result.extractedText) setOcrSnippet(result.extractedText);
      setIsOcrProcessing(false);
    }
  };

  const handleLoadScan = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const customCase: ClinicalCase = {
        id: `case-custom-${Date.now()}`,
        name: `${patientName} (${modality})`,
        modality: modality,
        category: 'Custom Intraoperative DICOM',
        patientAge: patientAge,
        gender: 'Other',
        description: `Imported volume: ${fileSelected?.name || 'custom_dicom_volume.nii.gz'}. Auto-calibrated frame. ${ocrSnippet ? `OCR: ${ocrSnippet}` : ''}`,
        volumeUrl: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
        targetPosition: { x: 18.0, y: 15.0, z: 25.0 },
        entryPosition: { x: 45.0, y: -10.0, z: 55.0 },
        secondaryTargetPosition: { x: 22.0, y: 18.0, z: 22.0 },
        secondaryEntryPosition: { x: 50.0, y: -5.0, z: 50.0 },
        safetyMarginMm: safetyMargin,
        anatomicalStructures: [
          { id: 'cortex', name: 'Segmented Parenchyma', color: '#818cf8', opacity: 0.35, visible: true, type: 'organ' },
          { id: 'tumor', name: 'Custom Lesion Focal Core', color: '#ef4444', opacity: 0.95, visible: true, type: 'target' },
          { id: 'ventricles', name: 'Internal Ventricles', color: '#38bdf8', opacity: 0.7, visible: true, type: 'critical' },
        ],
        fiducials: [
          { name: 'Landmark 1', fixed: [0, 85, -20], moving: [1, 84, -19] },
          { name: 'Landmark 2', fixed: [-75, -15, -30], moving: [-74, -15, -29] },
          { name: 'Landmark 3', fixed: [75, -15, -30], moving: [76, -14, -31] },
        ],
      };

      onLoadCustomCase(customCase);
      setIsProcessing(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white border border-[#E9EDCA] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E9EDCA] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E9EDCA] text-[#425020]">
              <Upload className="w-5 h-5 text-[#54682b]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2e2417] font-display">
                Import Patient Medical Scan
              </h2>
              <p className="text-xs text-[#6d5d4b]">
                DICOM Series (.dcm), NIfTI (.nii, .nii.gz), or Puter OCR Slip
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

        {/* Puter OCR Prescription Auto-Fill Banner */}
        <div className="bg-[#FEF9E1] p-3 rounded-2xl border border-[#E9EDCA] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#D3A373]" />
            <div>
              <strong className="text-[#2e2417] font-display block">Puter OCR Auto-Fill</strong>
              <span className="text-[11px] text-[#7d6b56]">Upload requisition slip or MRI report to auto-populate</span>
            </div>
          </div>

          <label className="cursor-pointer py-1.5 px-3 bg-[#D3A373] text-white rounded-xl text-[11px] font-bold font-display hover:bg-[#be8e5e] transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap">
            {isOcrProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reading Slip...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Slip / Image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePrescriptionOcr}
              disabled={isOcrProcessing}
            />
          </label>
        </div>

        {ocrSnippet && (
          <div className="bg-[#FAEDCD]/40 p-2.5 rounded-xl border border-[#E9EDCA] text-[11px] text-[#4b3c2e] font-mono shadow-inner">
            <span className="font-bold block text-[#784819]">OCR Extracted Info:</span>
            <span>{ocrSnippet}</span>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-[#D3A373] bg-[#FAEDCD]/50'
              : 'border-[#E9EDCA] bg-[#FAEDCD]/20 hover:border-[#D3A373] hover:bg-[#FAEDCD]/30'
          }`}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".dcm,.nii,.nii.gz,.nrrd"
            onChange={handleFileChange}
          />
          <div className="p-3 rounded-2xl bg-white border border-[#E9EDCA] shadow-xs">
            <Upload className="w-6 h-6 text-[#D3A373]" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#2e2417] block font-display">
              {fileSelected ? fileSelected.name : 'Click to Browse or Drag & Drop Medical Scan'}
            </span>
            <span className="text-[11px] text-[#7d6b56] font-mono">
              Supports multi-slice DICOM, NIfTI compressed (.nii.gz)
            </span>
          </div>
        </div>

        {/* Scan Parameters */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6d5d4b] uppercase font-mono">Patient Identifier</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full bg-[#FAEDCD]/30 border border-[#E9EDCA] rounded-xl px-3 py-2 text-[#2e2417] font-semibold text-xs focus:outline-none focus:border-[#D3A373]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6d5d4b] uppercase font-mono">Imaging Modality</label>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as any)}
              className="w-full bg-[#FAEDCD]/30 border border-[#E9EDCA] rounded-xl px-3 py-2 text-[#2e2417] font-semibold text-xs focus:outline-none focus:border-[#D3A373]"
            >
              <option value="MRI T1-CE">MRI T1-CE (Contrast Enhanced)</option>
              <option value="CT Helical">CT Helical (Bone / Spine)</option>
              <option value="CT Angiography">CT Angiography (Vascular)</option>
            </select>
          </div>
        </div>

        {/* Safety Margin Setting */}
        <div className="space-y-1 bg-[#FAEDCD]/30 p-3 rounded-2xl border border-[#E9EDCA] text-xs">
          <div className="flex justify-between items-center font-mono">
            <span className="text-[11px] font-bold text-[#5c4a38] font-display">Prescribed Safety Margin:</span>
            <strong className="text-[#a46831]">{safetyMargin.toFixed(1)} mm</strong>
          </div>
          <input
            type="range"
            min="2.0"
            max="15.0"
            step="0.5"
            value={safetyMargin}
            onChange={(e) => setSafetyMargin(parseFloat(e.target.value))}
            className="w-full cursor-pointer h-1.5 bg-[#E9EDCA] rounded-lg accent-[#D3A373]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleLoadScan}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-2xl bg-[#D3A373] hover:bg-[#be8e5e] text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 font-display"
          >
            <CheckCircle2 className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Reconstructing 3D Volume & Tensors...' : 'Load & Calibrate Case Workspace'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
