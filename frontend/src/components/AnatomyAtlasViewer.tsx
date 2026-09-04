'use client';

import React, { useState } from 'react';
import { Heart, Brain, Bone, Activity, Sparkles, ShieldCheck, Layers, Eye } from 'lucide-react';

interface AtlasModel {
  id: string;
  name: string;
  category: string;
  embedUrl: string;
  description: string;
  structures: string[];
}

const ATLAS_MODELS: AtlasModel[] = [
  {
    id: 'heart',
    name: '3D Animated Human Heart V2.0',
    category: 'Cardiovascular Anatomy',
    embedUrl: 'https://sketchfab.com/models/168b474fba564f688048212e99b4159d/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Hyper-realistic beating human heart with internal atria, ventricles, coronary vasculature, and mitral/aortic valves cross-section.',
    structures: ['Left & Right Ventricles', 'Aortic Arch', 'Coronary Arteries', 'Mitral Valve']
  },
  {
    id: 'brain',
    name: 'Sagittal Section of Head & Brain',
    category: 'Neuroanatomy',
    embedUrl: 'https://sketchfab.com/models/3aca242e2b4740b787d19c07ce8bbdb4/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Medial sagittal cross-section of the human head showing cerebral cortex hemispheres, corpus callosum, cerebellum, brainstem, and cranial fossae.',
    structures: ['Cerebral Cortex', 'Corpus Callosum', 'Cerebellum', 'Brainstem']
  },
  {
    id: 'liver',
    name: 'Human Liver & Gallbladder (UBC Anatomy)',
    category: 'Abdominal / Hepatobiliary',
    embedUrl: 'https://sketchfab.com/models/cfa337c34c11416ea003fd5135b1e880/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Anatomically accurate human liver with Couinaud segments, gallbladder, portal vein, hepatic artery, and biliary duct tree.',
    structures: ['Right & Left Hepatic Lobes', 'Gallbladder', 'Portal Triad', 'Inferior Vena Cava']
  },
  {
    id: 'spine',
    name: 'Vertebral Column & Intervertebral Discs',
    category: 'Spine & Orthopedics',
    embedUrl: 'https://sketchfab.com/models/48150e7d6bee47e797c11826b68ca7c9/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Complete human spinal column with cervical, thoracic, lumbar vertebrae, sacrum, and detailed intervertebral disc articulations.',
    structures: ['Cervical C1-C7', 'Thoracic T1-T12', 'Lumbar L1-L5', 'Intervertebral Discs']
  },
  {
    id: 'skull',
    name: 'Human Skull & Skeleton Anatomy',
    category: 'Craniofacial / Skeletal',
    embedUrl: 'https://sketchfab.com/models/136bfe25a2f44435b4319ab2788f701f/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Anatomically accurate cranial calvarium, facial bones, orbit, maxilla, mandible, and articulated thoracic cage skeleton.',
    structures: ['Cranial Calvarium', 'Orbital Cavity', 'Mandible', 'Thoracic Cage']
  },
  {
    id: 'lungs',
    name: 'Thoracic Heart & Respiratory Lungs Enbloc',
    category: 'Pulmonary / Thoracic',
    embedUrl: 'https://sketchfab.com/models/2b8f0656cff846eab3574789df440c33/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Enbloc thoracic visceral anatomy featuring bronchial tree branching, pulmonary lobes, pulmonary vasculature, and cardiac relations.',
    structures: ['Right & Left Lungs', 'Tracheobronchial Tree', 'Pulmonary Arteries', 'Mediastinum']
  }
];

export const AnatomyAtlasViewer: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<AtlasModel>(ATLAS_MODELS[0]);

  return (
    <div className="solid-panel border border-[#E9EDCA] rounded-3xl p-4 shadow-sm flex flex-col gap-4">
      {/* Header & Model Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9EDCA] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D3A373]" />
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#2e2417] font-display">
            3D Anatomy Atlas (Ready-Made 4K Cloud Models)
          </h2>
          <span className="text-[10px] bg-[#E9EDCA] text-[#485626] font-mono px-2.5 py-0.5 rounded-full border border-[#CDD5AE] font-semibold flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-[#5c6e2f]" />
            100% Medical Grade Models
          </span>
        </div>

        {/* Organ Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#FAEDCD] p-1 rounded-xl border border-[#E9EDCA] text-xs">
          {ATLAS_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                selectedModel.id === model.id
                  ? 'bg-[#D3A373] text-white shadow-xs'
                  : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FEF9E1]'
              }`}
            >
              {model.id === 'heart' && <Heart className="w-3.5 h-3.5 text-[#ef4444]" />}
              {model.id === 'brain' && <Brain className="w-3.5 h-3.5 text-[#0284c7]" />}
              {model.id === 'liver' && <Layers className="w-3.5 h-3.5 text-[#d97706]" />}
              {model.id === 'spine' && <Activity className="w-3.5 h-3.5 text-[#54682b]" />}
              {model.id === 'skull' && <Bone className="w-3.5 h-3.5 text-[#6b7280]" />}
              {model.id === 'lungs' && <Eye className="w-3.5 h-3.5 text-[#0284c7]" />}
              <span className="font-display">
                {model.id === 'heart' && 'Heart V2.0'}
                {model.id === 'brain' && 'Brain Sagittal'}
                {model.id === 'liver' && 'Liver & Gallbladder'}
                {model.id === 'spine' && 'Spine Column'}
                {model.id === 'skull' && 'Skull & Skeleton'}
                {model.id === 'lungs' && 'Lungs & Thorax'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Embedded Viewer Frame */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#E9EDCA] bg-[#161c13] shadow-inner">
        <iframe
          key={selectedModel.id}
          title={selectedModel.name}
          src={selectedModel.embedUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
      </div>

      {/* Model Metadata & Anatomical Key Structures */}
      <div className="bg-[#FAEDCD]/40 border border-[#E9EDCA] rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2e2417] text-sm font-display">{selectedModel.name}</span>
            <span className="text-[10px] bg-[#E9EDCA] text-[#445220] px-2 py-0.5 rounded font-mono font-semibold">
              {selectedModel.category}
            </span>
          </div>
          <p className="text-[#6d5d4b] text-[11px] max-w-2xl">{selectedModel.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {selectedModel.structures.map((st, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-[#E9EDCA] text-[#3e4c1f] px-2.5 py-1 rounded-lg border border-[#CDD5AE] font-mono font-semibold"
            >
              ✓ {st}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
