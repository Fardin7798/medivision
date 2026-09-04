'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PatientCase, Point3D } from '../types';
import { Loader2, Sparkles } from 'lucide-react';

interface ThreeDSceneProps {
  activeCase: PatientCase;
  pointerPosition: Point3D;
  isDualTrajectoryActive?: boolean;
}

export const ThreeDScene: React.FC<ThreeDSceneProps> = ({
  activeCase,
  pointerPosition,
  isDualTrajectoryActive = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelType, setModelType] = useState<'brain' | 'skull'>('brain');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const probeRef = useRef<THREE.Group | null>(null);
  const secondaryProbeRef = useRef<THREE.Group | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const secondaryLineRef = useRef<THREE.Line | null>(null);
  const targetMeshRef = useRef<THREE.Mesh | null>(null);
  const marginMeshRef = useRef<THREE.Mesh | null>(null);
  const loadedModelGroupRef = useRef<THREE.Group | null>(null);

  // Helper for recursive GPU VRAM cleanup (Prevents Memory Leaks)
  const disposeHierarchy = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 45, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 300;
    controls.minDistance = 20;

    // 2. Realistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(50, 80, 60);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc084fc, 1.8);
    fillLight.position.set(-50, -30, -50);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 3, 150);
    rimLight.position.set(0, 50, -40);
    scene.add(rimLight);

    // 3. Coordinate Reference Grid
    const gridHelper = new THREE.GridHelper(160, 32, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = -35;
    scene.add(gridHelper);

    // 4. Load Real Photorealistic Anatomical Model via GLTFLoader
    const modelGroup = new THREE.Group();
    loadedModelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    setModelLoading(true);
    const loader = new GLTFLoader();
    const modelPath = modelType === 'skull' ? '/models/skull.glb' : '/models/brain.glb';

    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;

        // Auto-center and normalize model scale
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 65 / (maxDim || 1);

        root.position.x = -center.x * targetScale;
        root.position.y = -center.y * targetScale;
        root.position.z = -center.z * targetScale;
        root.scale.set(targetScale, targetScale, targetScale);

        // Normalize materials to modern Physical PBR (Prevents KHR Specular console warnings)
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: modelType === 'skull' ? 0xf8fafc : 0x60a5fa,
              roughness: 0.35,
              metalness: 0.1,
              transmission: 0.45,
              thickness: 1.2,
              transparent: true,
              opacity: 0.65,
              wireframe: false
            });
          }
        });

        // Clean up previous meshes from VRAM before adding new
        disposeHierarchy(modelGroup);
        modelGroup.clear();
        modelGroup.add(root);
        setModelLoading(false);
      },
      undefined,
      (err) => {
        console.warn('GLTF loader note:', err);
        setModelLoading(false);
      }
    );

    // 5. Target Lesion Focal Core Mesh (Red Glowing Target)
    const targetGeo = new THREE.SphereGeometry(4, 32, 32);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.set(
      activeCase.targetPosition.x * 0.3,
      activeCase.targetPosition.y * 0.3,
      activeCase.targetPosition.z * 0.3
    );
    scene.add(targetMesh);
    targetMeshRef.current = targetMesh;

    // 6. Safety Margin Wireframe Boundary (5.0 mm margin)
    const marginGeo = new THREE.SphereGeometry(activeCase.safetyMarginMm * 1.5, 20, 20);
    const marginMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const marginMesh = new THREE.Mesh(marginGeo, marginMat);
    marginMesh.position.copy(targetMesh.position);
    scene.add(marginMesh);
    marginMeshRef.current = marginMesh;

    // 7. Surgical Probe Stylus Needle (Metallic Stylus + Depth Marker Bands)
    const probeGroup = new THREE.Group();
    
    // Needle shaft
    const shaftGeo = new THREE.CylinderGeometry(0.8, 0.8, 38, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 19;
    probeGroup.add(shaft);

    // Millimeter Depth Rings
    for (let r = 5; r <= 35; r += 7) {
      const ringGeo = new THREE.TorusGeometry(1.0, 0.15, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = r;
      probeGroup.add(ring);
    }

    // Laser tip
    const tipGeo = new THREE.ConeGeometry(1.0, 4, 16);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI;
    tip.position.y = -2;
    probeGroup.add(tip);

    scene.add(probeGroup);
    probeRef.current = probeGroup;

    // 8. Secondary Trajectory Probe (for Bilateral / Dual mode)
    const secProbeGroup = probeGroup.clone();
    secProbeGroup.visible = false;
    scene.add(secProbeGroup);
    secondaryProbeRef.current = secProbeGroup;

    // 9. Trajectory Laser Beams (Cyan Dashed Lines)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x22d3ee,
      dashSize: 3,
      gapSize: 2,
      linewidth: 2
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(pointerPosition.x * 0.3, pointerPosition.y * 0.3, pointerPosition.z * 0.3),
      targetMesh.position
    ]);
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    trajectoryLine.computeLineDistances();
    scene.add(trajectoryLine);
    trajectoryLineRef.current = trajectoryLine;

    const secLineMat = new THREE.LineDashedMaterial({
      color: 0xa855f7,
      dashSize: 3,
      gapSize: 2
    });
    const secLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-pointerPosition.x * 0.3, pointerPosition.y * 0.3, pointerPosition.z * 0.3),
      new THREE.Vector3(-targetMesh.position.x, targetMesh.position.y, targetMesh.position.z)
    ]);
    const secLine = new THREE.Line(secLineGeo, secLineMat);
    secLine.computeLineDistances();
    secLine.visible = false;
    scene.add(secLine);
    secondaryLineRef.current = secLine;

    // 10. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Subtle pulse on target tumor core
      if (targetMeshRef.current) {
        const t = performance.now() * 0.003;
        targetMeshRef.current.scale.setScalar(1 + Math.sin(t) * 0.06);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 11. Responsive Resize
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      disposeHierarchy(scene);
      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [activeCase, modelType]);

  // Update Dynamic Probe Coordinates & Trajectory Lines
  useEffect(() => {
    if (probeRef.current && targetMeshRef.current && trajectoryLineRef.current) {
      const probePos = new THREE.Vector3(
        pointerPosition.x * 0.3,
        pointerPosition.y * 0.3,
        pointerPosition.z * 0.3
      );
      probeRef.current.position.copy(probePos);

      // Point needle towards target
      probeRef.current.lookAt(targetMeshRef.current.position);
      probeRef.current.rotateX(Math.PI / 2);

      // Update trajectory laser line
      const positions = trajectoryLineRef.current.geometry.attributes.position;
      positions.setXYZ(0, probePos.x, probePos.y, probePos.z);
      positions.setXYZ(1, targetMeshRef.current.position.x, targetMeshRef.current.position.y, targetMeshRef.current.position.z);
      positions.needsUpdate = true;
      trajectoryLineRef.current.computeLineDistances();
    }

    if (secondaryProbeRef.current && secondaryLineRef.current && targetMeshRef.current) {
      secondaryProbeRef.current.visible = isDualTrajectoryActive;
      secondaryLineRef.current.visible = isDualTrajectoryActive;

      if (isDualTrajectoryActive) {
        const secPos = new THREE.Vector3(
          -pointerPosition.x * 0.3,
          pointerPosition.y * 0.3,
          pointerPosition.z * 0.3
        );
        secondaryProbeRef.current.position.copy(secPos);
        secondaryProbeRef.current.lookAt(
          new THREE.Vector3(-targetMeshRef.current.position.x, targetMeshRef.current.position.y, targetMeshRef.current.position.z)
        );
        secondaryProbeRef.current.rotateX(Math.PI / 2);
      }
    }
  }, [pointerPosition, isDualTrajectoryActive]);

  return (
    <div className="relative aspect-[16/10] w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Indicator */}
      {modelLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading Photorealistic 3D Mesh (GLTF)...</span>
        </div>
      )}

      {/* Top HUD Badges & Model Type Switcher */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive 3D Anatomical Scene</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-[10px] font-bold">
            <button
              onClick={() => setModelType('brain')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                modelType === 'brain' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Real Brain GLB
            </button>
            <button
              onClick={() => setModelType('skull')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                modelType === 'skull' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Real Skull GLB
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-red-950/90 text-red-300 border border-red-800/80 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Target Focal Core
          </span>
          <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded text-[10px] font-bold">
            Tracked Stylus Probe
          </span>
        </div>
      </div>

      {/* Bottom Orbit Navigation Instructions */}
      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-lg text-[10px] text-slate-400">
        Left-drag: 360° Orbit | Right-drag: Pan | Scroll: Zoom | Click Model Switcher to toggle Brain/Skull
      </div>
    </div>
  );
};
