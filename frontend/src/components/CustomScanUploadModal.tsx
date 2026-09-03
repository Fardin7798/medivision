'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, X, AlertCircle, Sparkles, HardDrive } from 'lucide-react';
import { PatientCase } from '../types';

interface CustomScanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomCase: (customCase: PatientCase) => void;
}

export const CustomScanUploadModal: React.FC<CustomScanUploadModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomCase
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientName, setPatientName] = useState('Custom Patient Anonymous');
  const [modality, setModality] = useState<'MRI' | 'CT' | 'MRA'>('MRI');
  const [category, setCategory] = useState('Custom Surgical Planning');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessScan = () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    setTimeout(() => {
      const fileUrl = URL.createObjectURL(selectedFile);
      const customCase: PatientCase = {
        id: `custom-case-${Date.now()}`,
        name: patientName || selectedFile.name.replace(/\.[^/.]+$/, ''),
        modality: `${modality} (Custom Upload)`,
        category: category || 'Custom Surgery',
        patientAge: 45,
        gender: 'Not Specified',
        description: `Custom medical volume imported from local file: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`,
        volumeUrl: fileUrl,
        targetPosition: { x: 15.0, y: 10.0, z: 25.0 },
        entryPosition: { x: 50.0, y: -20.0, z: 60.0 },
        safetyMarginMm: 5.0,
        anatomicalStructures: [
          { id: 'custom-organ', name: 'Segmented Parenchyma', color: '#818cf8', opacity: 0.4, visible: true, type: 'organ' },
          { id: 'custom-target', name: 'Primary Target Lesion', color: '#ef4444', opacity: 0.95, visible: true, type: 'target' },
          { id: 'custom-risk', name: 'Vascular Critical Zone', color: '#f59e0b', opacity: 0.8, visible: true, type: 'critical' }
        ],
        fiducials: [
          { name: 'Fiducial 1', fixed: [0, 50, 0], moving: [0, 51, -1] },
          { name: 'Fiducial 2', fixed: [-50, 0, 0], moving: [-49, 0, 0] },
          { name: 'Fiducial 3', fixed: [50, 0, 0], moving: [51, -1, 0] }
        ]
      };

      onLoadCustomCase(customCase);
      setIsProcessing(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl text-slate-100 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Import Custom Medical Scan</h2>
              <p className="text-[11px] text-slate-400">Supported: NIfTI (.nii, .nii.gz), DICOM (.dcm), GLTF (.glb)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-900/30'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-950/20'
                : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".nii,.nii.gz,.dcm,.glb,.gltf"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <>
                <FileCheck className="w-8 h-8 text-emerald-400 animate-bounce" />
                <span className="font-bold text-slate-100 text-xs">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Slicing
                </span>
              </>
            ) : (
              <>
                <HardDrive className="w-8 h-8 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  Drag & Drop Medical Volume or <strong className="text-cyan-400 underline">Browse Local Files</strong>
                </span>
                <span className="text-[10px] text-slate-400">Zero cloud upload — parsed 100% locally in browser memory</span>
              </>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Patient / Scan Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Modality</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="MRI">MRI (Magnetic Resonance)</option>
                <option value="CT">CT (Computed Tomography)</option>
                <option value="MRA">MRA (MR Angiography)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessScan}
            disabled={!selectedFile || isProcessing}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              !selectedFile || isProcessing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30'
            }`}
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting 3D Voxel Array...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Load Scan into Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
