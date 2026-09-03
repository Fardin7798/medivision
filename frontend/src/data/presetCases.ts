import { PatientCase } from '../types';

export const PRESET_CASES: PatientCase[] = [
  {
    id: 'case-cranial-glioma',
    name: 'Cranial Glioma Resection',
    modality: 'MRI T1-CE / T2-FLAIR',
    category: 'Neurosurgery',
    patientAge: 48,
    gender: 'Female',
    description: 'Left temporal-parietal high-grade glioma near eloquent motor cortex. Requires continuous margin distance monitoring during simulated resection.',
    volumeUrl: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
    targetPosition: { x: 24.5, y: 12.0, z: 38.2 },
    entryPosition: { x: 58.0, y: -18.0, z: 65.0 },
    secondaryTargetPosition: { x: 28.0, y: 16.0, z: 34.0 },
    secondaryEntryPosition: { x: 62.0, y: -10.0, z: 60.0 },
    safetyMarginMm: 5.0,
    anatomicalStructures: [
      { id: 'cortex', name: 'Cerebral Cortex', color: '#818cf8', opacity: 0.35, visible: true, type: 'organ' },
      { id: 'ventricles', name: 'Lateral Ventricles', color: '#38bdf8', opacity: 0.7, visible: true, type: 'critical' },
      { id: 'tumor', name: 'Glioma Core Target', color: '#ef4444', opacity: 0.95, visible: true, type: 'target' },
      { id: 'vessels', name: 'Middle Cerebral Artery', color: '#f43f5e', opacity: 0.85, visible: true, type: 'critical' }
    ],
    fiducials: [
      { name: 'Nasion', fixed: [0, 85, -20], moving: [2, 83, -19] },
      { name: 'Left Tragus', fixed: [-75, -15, -30], moving: [-74, -16, -28] },
      { name: 'Right Tragus', fixed: [75, -15, -30], moving: [76, -14, -31] }
    ]
  },
  {
    id: 'case-hepatic-resection',
    name: 'Hepatic Segmentectomy (Segment VI/VII)',
    modality: 'Tri-phase Contrast CT',
    category: 'Abdominal / Hepatobiliary',
    patientAge: 61,
    gender: 'Male',
    description: 'Focal hepatocellular lesion adjacent to the right branch of the portal vein and right hepatic vein.',
    volumeUrl: 'https://niivue.github.io/niivue-demo-images/CT_Abdo.nii.gz',
    targetPosition: { x: -18.0, y: 25.0, z: -12.0 },
    entryPosition: { x: -70.0, y: 35.0, z: 15.0 },
    secondaryTargetPosition: { x: -22.0, y: 28.0, z: -8.0 },
    secondaryEntryPosition: { x: -75.0, y: 40.0, z: 20.0 },
    safetyMarginMm: 10.0,
    anatomicalStructures: [
      { id: 'liver', name: 'Liver Parenchyma', color: '#d97706', opacity: 0.35, visible: true, type: 'organ' },
      { id: 'portal-vein', name: 'Portal Venous System', color: '#3b82f6', opacity: 0.9, visible: true, type: 'critical' },
      { id: 'hepatic-artery', name: 'Hepatic Artery', color: '#ef4444', opacity: 0.85, visible: true, type: 'critical' },
      { id: 'tumor', name: 'Hepatic Lesion', color: '#e11d48', opacity: 0.95, visible: true, type: 'target' }
    ],
    fiducials: [
      { name: 'Xiphoid Process', fixed: [0, 40, 10], moving: [-1, 41, 9] },
      { name: 'Right Costal Margin', fixed: [80, -20, -5], moving: [81, -19, -6] },
      { name: 'Umbilicus', fixed: [0, -60, 20], moving: [1, -59, 21] }
    ]
  },
  {
    id: 'case-lumbar-spine',
    name: 'Lumbar Spine Pedicle Screw Trajectory',
    modality: 'Helical Spine CT',
    category: 'Spine & Orthopedics',
    patientAge: 54,
    gender: 'Male',
    description: 'L4-L5 degenerative spondylolisthesis. Trajectory planning for bilateral pedicle screw placement avoiding nerve roots.',
    volumeUrl: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
    targetPosition: { x: 12.0, y: -45.0, z: -30.0 },
    entryPosition: { x: 30.0, y: -65.0, z: -15.0 },
    secondaryTargetPosition: { x: -12.0, y: -45.0, z: -30.0 },
    secondaryEntryPosition: { x: -30.0, y: -65.0, z: -15.0 },
    safetyMarginMm: 3.0,
    anatomicalStructures: [
      { id: 'vertebrae', name: 'L4/L5 Vertebrae', color: '#e2e8f0', opacity: 0.8, visible: true, type: 'organ' },
      { id: 'spinal-cord', name: 'Thecal Sac / Canal', color: '#fbbf24', opacity: 0.75, visible: true, type: 'critical' },
      { id: 'target', name: 'Pedicle Canal Target', color: '#10b981', opacity: 0.95, visible: true, type: 'target' }
    ],
    fiducials: [
      { name: 'L4 Spinous Process', fixed: [0, -45, -10], moving: [0, -44, -11] },
      { name: 'Left Posterior Superior Iliac Spine', fixed: [-45, -80, -25], moving: [-44, -79, -24] },
      { name: 'Right Posterior Superior Iliac Spine', fixed: [45, -80, -25], moving: [46, -81, -26] }
    ]
  },
  {
    id: 'case-dbs-electrode',
    name: 'Deep Brain Stimulation (STN Lead Navigation)',
    modality: 'Stereotactic Head CT / MRI',
    category: 'Functional Neurosurgery',
    patientAge: 59,
    gender: 'Male',
    description: 'Bilateral Subthalamic Nucleus (STN) electrode trajectory for advanced Parkinsonian tremor control.',
    volumeUrl: 'https://niivue.github.io/niivue-demo-images/CT_Electrodes.nii.gz',
    targetPosition: { x: -11.5, y: -13.0, z: -4.0 },
    entryPosition: { x: -32.0, y: 28.0, z: 62.0 },
    secondaryTargetPosition: { x: 11.5, y: -13.0, z: -4.0 },
    secondaryEntryPosition: { x: 32.0, y: 28.0, z: 62.0 },
    safetyMarginMm: 2.0,
    anatomicalStructures: [
      { id: 'cortex', name: 'Frontal Cortex', color: '#93c5fd', opacity: 0.3, visible: true, type: 'organ' },
      { id: 'thalamus', name: 'Subthalamic Nucleus Target', color: '#10b981', opacity: 0.95, visible: true, type: 'target' },
      { id: 'internal-capsule', name: 'Internal Capsule (Risk Zone)', color: '#ef4444', opacity: 0.75, visible: true, type: 'critical' },
      { id: 'electrodes', name: 'Implanted DBS Lead', color: '#f59e0b', opacity: 0.9, visible: true, type: 'vessel' }
    ],
    fiducials: [
      { name: 'Anterior Commissure (AC)', fixed: [0, 0, 0], moving: [0, 1, -1] },
      { name: 'Posterior Commissure (PC)', fixed: [0, -25, 0], moving: [0, -24, 0] },
      { name: 'Mid-Sagittal Point', fixed: [0, 45, 30], moving: [1, 44, 30] }
    ]
  },
  {
    id: 'case-avm-vascular',
    name: 'Cerebral AVM / Aneurysm Vascular Clipping',
    modality: '3D MR Angiography (MRA)',
    category: 'Cerebrovascular Surgery',
    patientAge: 42,
    gender: 'Female',
    description: 'Pterional keyhole approach for middle cerebral artery bifurcation aneurysm clipping with vessel tree guidance.',
    volumeUrl: 'https://niivue.github.io/niivue-demo-images/chris_MRA.nii.gz',
    targetPosition: { x: 22.0, y: 15.0, z: 8.0 },
    entryPosition: { x: 55.0, y: 35.0, z: 25.0 },
    secondaryTargetPosition: { x: 20.0, y: 18.0, z: 12.0 },
    secondaryEntryPosition: { x: 58.0, y: 32.0, z: 28.0 },
    safetyMarginMm: 3.5,
    anatomicalStructures: [
      { id: 'skull', name: 'Pterional Craniotomy Window', color: '#f1f5f9', opacity: 0.4, visible: true, type: 'organ' },
      { id: 'circle-of-willis', name: 'Arterial Vasculature', color: '#f43f5e', opacity: 0.9, visible: true, type: 'critical' },
      { id: 'aneurysm', name: 'Aneurysm Neck Target', color: '#dc2626', opacity: 0.95, visible: true, type: 'target' },
      { id: 'optic-nerve', name: 'Optic Apparatus', color: '#fbbf24', opacity: 0.8, visible: true, type: 'critical' }
    ],
    fiducials: [
      { name: 'Frontal Zygomatic Suture', fixed: [45, 35, 10], moving: [46, 34, 11] },
      { name: 'External Auditory Canal', fixed: [65, -10, -15], moving: [64, -11, -14] },
      { name: 'Glabella', fixed: [0, 75, 15], moving: [0, 74, 16] }
    ]
  }
];
