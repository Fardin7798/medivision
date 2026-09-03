"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRESET_CASES = void 0;
exports.PRESET_CASES = [
    {
        id: 'case-cranial-glioma',
        name: 'Cranial Glioma Resection',
        modality: 'MRI T1-CE / T2-FLAIR',
        category: 'Neurosurgery',
        patientAge: 48,
        gender: 'Female',
        description: 'Left temporal-parietal high-grade glioma near eloquent speech and motor pathways. Requires sub-millimeter surgical margin monitoring during resection.',
        volumeUrl: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
        targetPosition: { x: 24.5, y: 12.0, z: 38.2 },
        entryPosition: { x: 62.0, y: -20.0, z: 70.0 },
        safetyMarginMm: 5.0,
        anatomicalStructures: [
            { id: 'cortex', name: 'Cerebral Cortex', color: '#818cf8', opacity: 0.25, visible: true, type: 'organ' },
            { id: 'ventricles', name: 'Ventricular System', color: '#38bdf8', opacity: 0.8, visible: true, type: 'organ' },
            { id: 'tumor', name: 'Glioma Core Target', color: '#ef4444', opacity: 0.95, visible: true, type: 'target' },
            { id: 'vessels', name: 'Middle Cerebral Artery (MCA)', color: '#f43f5e', opacity: 0.9, visible: true, type: 'vessel' }
        ],
        fiducials: [
            { name: 'Nasion (Bridge of Nose)', fixed: [0, 85, -20], moving: [1.8, 83.5, -19.2] },
            { name: 'Left Tragus (Ear Canal)', fixed: [-75, -15, -30], moving: [-74.2, -15.8, -28.9] },
            { name: 'Right Tragus (Ear Canal)', fixed: [75, -15, -30], moving: [75.9, -14.3, -30.8] }
        ]
    },
    {
        id: 'case-hepatic-resection',
        name: 'Hepatic Segmentectomy (Segment VI)',
        modality: 'Tri-phase Contrast CT',
        category: 'Abdominal / Hepatobiliary',
        patientAge: 61,
        gender: 'Male',
        description: 'Focal hepatocellular lesion adjacent to the right branch of the portal vein and right hepatic vein. High risk of major vessel injury.',
        volumeUrl: 'https://niivue.github.io/niivue-demo-images/visiblehuman.nii.gz',
        targetPosition: { x: -22.0, y: 30.0, z: -15.0 },
        entryPosition: { x: -75.0, y: 40.0, z: 20.0 },
        safetyMarginMm: 10.0,
        anatomicalStructures: [
            { id: 'liver', name: 'Liver Parenchyma', color: '#d97706', opacity: 0.25, visible: true, type: 'organ' },
            { id: 'portal-vein', name: 'Portal Venous Branch', color: '#3b82f6', opacity: 0.9, visible: true, type: 'vessel' },
            { id: 'hepatic-artery', name: 'Hepatic Artery Tree', color: '#ef4444', opacity: 0.85, visible: true, type: 'vessel' },
            { id: 'tumor', name: 'Hepatic Lesion', color: '#e11d48', opacity: 0.95, visible: true, type: 'target' }
        ],
        fiducials: [
            { name: 'Xiphoid Process', fixed: [0, 40, 10], moving: [-0.8, 40.9, 9.2] },
            { name: 'Right Costal Margin', fixed: [80, -20, -5], moving: [80.7, -19.1, -5.8] },
            { name: 'Umbilicus', fixed: [0, -60, 20], moving: [0.9, -59.2, 20.7] }
        ]
    },
    {
        id: 'case-lumbar-spine',
        name: 'Lumbar Spine Pedicle Screw Trajectory',
        modality: 'Helical Spine CT',
        category: 'Spine & Orthopedics',
        patientAge: 54,
        gender: 'Male',
        description: 'L4-L5 degenerative spondylolisthesis. Trajectory planning for bilateral pedicle screw placement avoiding nerve roots and thecal sac.',
        volumeUrl: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz',
        targetPosition: { x: 14.0, y: -42.0, z: -28.0 },
        entryPosition: { x: 35.0, y: -68.0, z: -12.0 },
        safetyMarginMm: 3.0,
        anatomicalStructures: [
            { id: 'vertebrae', name: 'L4/L5 Vertebrae Body', color: '#f1f5f9', opacity: 0.85, visible: true, type: 'bone' },
            { id: 'thecal-sac', name: 'Thecal Sac (Spinal Cord)', color: '#fbbf24', opacity: 0.75, visible: true, type: 'organ' },
            { id: 'target', name: 'Pedicle Canal Target', color: '#10b981', opacity: 0.95, visible: true, type: 'target' }
        ],
        fiducials: [
            { name: 'L4 Spinous Process', fixed: [0, -45, -10], moving: [0.1, -44.2, -10.7] },
            { name: 'Left Posterior Superior Iliac Spine', fixed: [-45, -80, -25], moving: [-44.3, -79.1, -24.2] },
            { name: 'Right Posterior Superior Iliac Spine', fixed: [45, -80, -25], moving: [45.8, -80.9, -25.7] }
        ]
    }
];
