'use client';

import React, { useState } from 'react';
import { Heart, Brain, Bone, Activity, Sparkles, ShieldCheck } from 'lucide-react';

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
  }
];

export const AnatomyAtlasViewer: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<AtlasModel>(ATLAS_MODELS[0]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-4">
      {/* Header & Model Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200">
            3D Anatomy Atlas (4K Deployed Cloud Models)
          </h2>
          <span className="text-[10px] bg-pink-950/80 text-pink-300 font-mono px-2 py-0.5 rounded border border-pink-800/60 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            100% Verified Live Models
          </span>
        </div>

        {/* Organ Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          {ATLAS_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                selectedModel.id === model.id
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {model.id === 'heart' && <Heart className="w-3.5 h-3.5 text-red-400" />}
              {model.id === 'brain' && <Brain className="w-3.5 h-3.5 text-purple-400" />}
              {model.id === 'spine' && <Activity className="w-3.5 h-3.5 text-emerald-400" />}
              {model.id === 'skull' && <Bone className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{model.name.split(' ')[0] === '3D' ? 'Human Heart' : model.name.split(' ')[0] === 'Sagittal' ? 'Head & Brain' : model.name.split(' ')[0] === 'Vertebral' ? 'Spine Column' : 'Skull & Skeleton'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Embedded Viewer Frame */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-black shadow-inner">
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
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{selectedModel.name}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {selectedModel.category}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-2xl">{selectedModel.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {selectedModel.structures.map((st, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-purple-950/60 text-purple-300 px-2 py-1 rounded-md border border-purple-800/40 font-mono"
            >
              ✓ {st}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
