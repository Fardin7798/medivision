'use client';

import React, { useState } from 'react';
import { Heart, Brain, Bone, Activity, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

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
    category: 'Cardiovascular',
    embedUrl: 'https://sketchfab.com/models/168b474fba564f688048212e99b4159d/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Hyper-realistic beating human heart with internal atria, ventricles, coronary vasculature, and mitral/aortic valves cross-section.',
    structures: ['Left & Right Ventricles', 'Aortic Arch', 'Coronary Arteries', 'Mitral Valve']
  },
  {
    id: 'brain',
    name: 'Detailed Human Brain & Lobes',
    category: 'Neuroanatomy',
    embedUrl: 'https://sketchfab.com/models/8409821814674720abfc1dbfcab271d5/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Cerebral cortex hemispheres, deep basal ganglia, cerebellum, brainstem, and cranial vascular supply.',
    structures: ['Frontal & Parietal Lobes', 'Cerebellum', 'Brainstem', 'Thalamic Core']
  },
  {
    id: 'skull',
    name: 'Human Skull & Cervical Spine',
    category: 'Skeletal / Craniofacial',
    embedUrl: 'https://sketchfab.com/models/7dd2f32f3c644efb9a6df7aa2286bbf5/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'High-density calvarium bone, orbital cavities, maxilla, mandible, and C1-C7 cervical vertebrae.',
    structures: ['Cranial Calvarium', 'Sphenoid Bone', 'Mandible', 'C1-C7 Vertebrae']
  },
  {
    id: 'liver',
    name: 'Human Liver & Portal Vasculature',
    category: 'Hepatobiliary',
    embedUrl: 'https://sketchfab.com/models/cfc5457ef4ce4aa19bc92f960f27c34b/embed?autostart=1&ui_controls=1&ui_infos=0&ui_watermark=0',
    description: 'Hepatic segments I-VIII, portal vein bifurcation, hepatic arteries, gallbladder, and biliary tree.',
    structures: ['Couinaud Segments I-VIII', 'Portal Vein', 'Gallbladder', 'Hepatic Veins']
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
            Zero-Server Load CDN
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
              {model.id === 'skull' && <Bone className="w-3.5 h-3.5 text-cyan-400" />}
              {model.id === 'liver' && <Activity className="w-3.5 h-3.5 text-amber-400" />}
              <span>{model.name.split(' ')[2] || model.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Embedded Viewer Frame */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-black shadow-inner">
        <iframe
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
