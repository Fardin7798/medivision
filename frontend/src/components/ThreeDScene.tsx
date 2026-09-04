'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PatientCase, Point3D } from '../types';
import { Loader2, Sparkles, RotateCcw, Grid, Eye, ShieldAlert, Maximize2 } from 'lucide-react';

interface ThreeDSceneProps {
  activeCase: PatientCase;
  pointerPosition: Point3D;
  isDualTrajectoryActive: boolean;
}

export const ThreeDScene: React.FC<ThreeDSceneProps> = ({
  activeCase,
  pointerPosition,
  isDualTrajectoryActive
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelType, setModelType] = useState<'brain' | 'skull'>('brain');
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);

  // References to dynamic 3D elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const probeRef = useRef<THREE.Mesh | null>(null);
  const secondaryProbeRef = useRef<THREE.Mesh | null>(null);
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

    // 1. Initialize Scene, Camera & High-Performance Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 45, 120);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 300;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // 2. Realistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    keyLight.position.set(50, 80, 60);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc084fc, 2.0);
    fillLight.position.set(-50, -30, -50);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 3.5, 160);
    rimLight.position.set(0, 50, -40);
    scene.add(rimLight);

    // 3. Coordinate Reference Grid
    const gridHelper = new THREE.GridHelper(160, 32, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = -35;
    gridHelperRef.current = gridHelper;
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
              color: modelType === 'skull' ? 0xf8fafc : 0x38bdf8,
              roughness: 0.3,
              metalness: 0.15,
              transmission: 0.5,
              thickness: 1.4,
              transparent: true,
              opacity: 0.7,
              wireframe: isWireframe
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

    // 5. Target Pathology Focal Sphere (Tumor Core)
    const targetGeo = new THREE.SphereGeometry(4.5, 32, 32);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.set(
      activeCase.targetPosition.x * 0.3,
      activeCase.targetPosition.y * 0.3,
      activeCase.targetPosition.z * 0.3
    );
    targetMeshRef.current = targetMesh;
    scene.add(targetMesh);

    // 6. Safety Margin Transparent Boundary Sphere (5mm halo)
    const marginGeo = new THREE.SphereGeometry(activeCase.safetyMarginMm * 1.6, 24, 24);
    const marginMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const marginMesh = new THREE.Mesh(marginGeo, marginMat);
    marginMesh.position.copy(targetMesh.position);
    marginMeshRef.current = marginMesh;
    scene.add(marginMesh);

    // 7. Tracked Surgical Probe Needle (Cone + Cylinder)
    const probeGroup = new THREE.Group();
    const probeGeo = new THREE.CylinderGeometry(0.6, 0.6, 24, 16);
    const probeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4
    });
    const probeCylinder = new THREE.Mesh(probeGeo, probeMat);
    probeCylinder.position.y = 12;
    probeGroup.add(probeCylinder);

    const tipGeo = new THREE.ConeGeometry(0.8, 4, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8
    });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.y = -2;
    tipMesh.rotation.x = Math.PI;
    probeGroup.add(tipMesh);

    probeGroup.position.set(
      pointerPosition.x * 0.3,
      pointerPosition.y * 0.3,
      pointerPosition.z * 0.3
    );
    probeRef.current = probeGroup as unknown as THREE.Mesh;
    scene.add(probeGroup);

    // 8. Secondary Trajectory Probe (Dual Trajectory Mode)
    const secProbeGroup = probeGroup.clone();
    secProbeGroup.visible = isDualTrajectoryActive;
    secondaryProbeRef.current = secProbeGroup as unknown as THREE.Mesh;
    scene.add(secProbeGroup);

    // 9. Laser Trajectory Line
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 2,
      gapSize: 1,
      linewidth: 2
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      probeGroup.position,
      targetMesh.position
    ]);
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    trajectoryLine.computeLineDistances();
    trajectoryLineRef.current = trajectoryLine;
    scene.add(trajectoryLine);

    // 10. Secondary Laser Trajectory Line
    const secLineMat = new THREE.LineDashedMaterial({
      color: 0xa855f7,
      dashSize: 2,
      gapSize: 1,
      linewidth: 2
    });
    const secLineGeo = new THREE.BufferGeometry().setFromPoints([
      probeGroup.position,
      targetMesh.position
    ]);
    const secTrajectoryLine = new THREE.Line(secLineGeo, secLineMat);
    secTrajectoryLine.visible = isDualTrajectoryActive;
    secondaryLineRef.current = secTrajectoryLine;
    scene.add(secTrajectoryLine);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Pulsate target tumor core
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.06;
      targetMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
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
  }, [activeCase, modelType, isWireframe]);

  // Toggle Grid
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

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

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 45, 120);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative aspect-[16/10] w-full glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Indicator */}
      {modelLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center gap-2.5 text-cyan-400 text-xs font-bold z-20">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading High-Resolution 3D GLTF Mesh...</span>
        </div>
      )}

      {/* Top HUD Controls & Model Switcher */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="glass-panel-subtle px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 shadow-lg border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>3D Surgical Workspace</span>
          </div>

          <div className="flex items-center gap-1 glass-panel-subtle p-1 rounded-xl text-[11px] font-bold border border-slate-800">
            <button
              onClick={() => setModelType('brain')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'brain' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Brain Mesh
            </button>
            <button
              onClick={() => setModelType('skull')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'skull' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Skull Mesh
            </button>
          </div>
        </div>

        {/* Camera & Scene Toolbar Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              showGrid
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'glass-panel-subtle border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Spatial Reference Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              isWireframe
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                : 'glass-panel-subtle border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Mesh Wireframe Mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl glass-panel-subtle border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Reset Camera Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Corner Interaction Guide */}
      <div className="absolute bottom-3 left-3 text-[10px] text-slate-400 font-mono glass-panel-subtle px-3 py-1.5 rounded-xl border border-slate-800/80 pointer-events-none flex items-center gap-3">
        <span>🖱️ Left-drag: 360° Orbit</span>
        <span>•</span>
        <span>Right-drag: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
      </div>

      {/* Bottom Right Legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
        <div className="glass-panel-subtle px-2.5 py-1 rounded-lg border border-red-500/40 text-[10px] text-red-400 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Tumor Core Target</span>
        </div>
        <div className="glass-panel-subtle px-2.5 py-1 rounded-lg border border-amber-500/40 text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{activeCase.safetyMarginMm}mm Margin Halo</span>
        </div>
      </div>
    </div>
  );
};
