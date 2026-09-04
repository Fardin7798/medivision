'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ClinicalCase, Vector3D } from '@/types';
import { Grid, RotateCcw, Eye, Loader2 } from 'lucide-react';

interface ThreeDSceneProps {
  activeCase: ClinicalCase;
  pointerPosition: Vector3D;
  isDualTrajectoryActive: boolean;
}

// Unified Anatomical Coordinate Mapping (DICOM RAS -> 3D World)
// RAS (Right-Anterior-Superior) -> Three.js (X: Right, Y: Superior, Z: Anterior)
const SCALE_X = 0.22;
const SCALE_Y = 0.22; // Superior-Inferior scale
const SCALE_Z = 0.22; // Anterior-Posterior scale
const Y_MIDLINE_OFFSET = 36.0; // Aligns DICOM Z center with cranial vault center

const toWorldVector = (pos: Vector3D): THREE.Vector3 => {
  return new THREE.Vector3(
    pos.x * SCALE_X,
    (pos.z - Y_MIDLINE_OFFSET) * SCALE_Y,
    pos.y * SCALE_Z
  );
};

export const ThreeDScene: React.FC<ThreeDSceneProps> = ({
  activeCase,
  pointerPosition,
  isDualTrajectoryActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [modelType, setModelType] = useState<'brain' | 'skull' | 'dual'>('brain');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Dynamic Scene Objects
  const probeRef = useRef<THREE.Group | null>(null);
  const secondaryProbeRef = useRef<THREE.Group | null>(null);
  const targetMeshRef = useRef<THREE.Mesh | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const secondaryLineRef = useRef<THREE.Line | null>(null);
  const loadedModelsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Helper: Safely dispose 3D object hierarchies
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

    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    sceneRef.current = scene;

    // Perspective Camera (Surgical 3/4 viewpoint)
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(38, 22, 75);
    cameraRef.current = camera;

    // WebGL Renderer with High Precision Anti-Aliasing
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;

    // Clear previous canvas
    while (currentMount.firstChild) {
      currentMount.removeChild(currentMount.firstChild);
    }
    currentMount.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 250;
    controls.minDistance = 15;
    controls.target.set(0, 0, 0); // Focus exactly at cranial anatomical center
    controlsRef.current = controls;

    // High-Tech Surgical Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    keyLight.position.set(60, 80, 60);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 2.6);
    rimLight.position.set(-60, -20, -60);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.9);
    fillLight.position.set(0, 80, -40);
    scene.add(fillLight);

    const bottomBounce = new THREE.DirectionalLight(0x0369a1, 1.3);
    bottomBounce.position.set(0, -60, 0);
    scene.add(bottomBounce);

    // Spatial Reference Grid
    const gridHelper = new THREE.GridHelper(90, 18, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -22;
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Master Group for 3D Anatomical Meshes
    const modelsGroup = new THREE.Group();
    loadedModelsGroupRef.current = modelsGroup;
    scene.add(modelsGroup);

    setModelLoading(true);
    const gltfLoader = new GLTFLoader();

    const BRAIN_CYAN = 0x38bdf8;
    const SKULL_BONE = 0xe2e8f0;

    // 1. Build Calibrated Full Bilateral Brain
    const buildBilateralBrain = (rawGltfScene: THREE.Group): THREE.Group => {
      const brainGroup = new THREE.Group();

      // Extract geometry from loaded scene
      let extractedGeo: THREE.BufferGeometry | null = null;
      rawGltfScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !extractedGeo) {
          extractedGeo = (child as THREE.Mesh).geometry.clone();
        }
      });

      const sourceGeometry: THREE.BufferGeometry = extractedGeo || new THREE.SphereGeometry(12, 32, 32);

      // Brain scaling & orientation
      const targetBrainHeight = 22.0;
      sourceGeometry.computeBoundingBox();
      const bBox = sourceGeometry.boundingBox || new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
      const rawHeight = bBox.max.y - bBox.min.y || 1;
      const scale = targetBrainHeight / rawHeight;

      const brainMaterialLeft = new THREE.MeshStandardMaterial({
        color: BRAIN_CYAN,
        roughness: 0.35,
        metalness: 0.15,
        wireframe: isWireframe,
        side: THREE.FrontSide,
        transparent: false,
        opacity: 1.0,
      });

      const brainMaterialRight = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.35,
        metalness: 0.15,
        wireframe: isWireframe,
        side: THREE.FrontSide,
        transparent: false,
        opacity: 1.0,
      });

      // Left Hemisphere
      const leftMesh = new THREE.Mesh(sourceGeometry, brainMaterialLeft);
      leftMesh.rotation.y = Math.PI / 2;
      leftMesh.scale.set(scale, scale, scale);
      leftMesh.position.set(-5.5, -targetBrainHeight / 2 + 1.0, 0.5);
      brainGroup.add(leftMesh);

      // Right Hemisphere (Symmetrical Reflection)
      const rightGeom = sourceGeometry.clone();
      const rightMesh = new THREE.Mesh(rightGeom, brainMaterialRight);
      rightMesh.rotation.y = -Math.PI / 2;
      rightMesh.scale.set(scale, scale, scale);
      rightMesh.position.set(5.5, -targetBrainHeight / 2 + 1.0, 0.5);
      brainGroup.add(rightMesh);

      // Cerebellum & Brainstem
      const cerebellumMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.4,
        metalness: 0.15,
        wireframe: isWireframe,
        side: THREE.FrontSide,
      });
      const cerebellumGeo = new THREE.SphereGeometry(5.0, 24, 24);
      const cerebellumL = new THREE.Mesh(cerebellumGeo, cerebellumMat);
      cerebellumL.position.set(-3.6, -7.5, -6.5);
      cerebellumL.scale.set(0.9, 0.75, 0.95);
      brainGroup.add(cerebellumL);

      const cerebellumR = new THREE.Mesh(cerebellumGeo, cerebellumMat);
      cerebellumR.position.set(3.6, -7.5, -6.5);
      cerebellumR.scale.set(0.9, 0.75, 0.95);
      brainGroup.add(cerebellumR);

      const brainstemMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.45,
        metalness: 0.1,
        side: THREE.FrontSide,
      });
      const brainstemGeo = new THREE.CylinderGeometry(1.8, 1.4, 8.5, 20);
      const brainstem = new THREE.Mesh(brainstemGeo, brainstemMat);
      brainstem.position.set(0, -10.5, -2.5);
      brainGroup.add(brainstem);

      // Brain sits centered inside cranial cavity (Y = 0)
      brainGroup.position.set(0, 0, 0);
      return brainGroup;
    };

    // 2. Build Calibrated Single Skull (NO Double Rendering)
    const buildCalibratedSkull = (
      rawSkullScene: THREE.Group,
      isDual: boolean
    ): THREE.Group => {
      const skullGroup = new THREE.Group();

      let extractedSkullGeo: THREE.BufferGeometry | null = null;
      rawSkullScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !extractedSkullGeo) {
          extractedSkullGeo = (child as THREE.Mesh).geometry.clone();
        }
      });

      const skullGeo: THREE.BufferGeometry = extractedSkullGeo || new THREE.SphereGeometry(16, 32, 32);

      skullGeo.computeBoundingBox();
      const bBox = skullGeo.boundingBox || new THREE.Box3(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
      const totalHeight = bBox.max.y - bBox.min.y || 1;
      const targetSkullHeight = 44.0;
      const scale = targetSkullHeight / totalHeight;

      // In Skull Mesh mode: Solid, single FrontSide surface
      // In Dual mode: Translucent single FrontSide surface (no inner double ghosting)
      const skullMat = new THREE.MeshStandardMaterial({
        color: SKULL_BONE,
        roughness: 0.55,
        metalness: 0.2,
        wireframe: isWireframe,
        side: THREE.FrontSide, // FrontSide ONLY prevents double skull inner ghosting
        transparent: isDual,
        opacity: isDual ? 0.32 : 0.92,
        depthWrite: !isDual,
      });

      const skullMesh = new THREE.Mesh(skullGeo, skullMat);
      skullMesh.scale.set(scale, scale, scale);

      // Align cranial vault center with Y = 0 (Brain Center)
      skullMesh.position.set(0, -22.5, -1.0);
      skullGroup.add(skullMesh);

      return skullGroup;
    };

    // Load Appropriate Model Mode
    if (modelType === 'dual') {
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) setModelLoading(false);
      };

      gltfLoader.load(
        '/models/brain.glb',
        (gltf) => {
          const brain = buildBilateralBrain(gltf.scene);
          modelsGroup.add(brain);
          checkDone();
        },
        undefined,
        () => checkDone()
      );

      gltfLoader.load(
        '/models/skull.glb',
        (gltf) => {
          const skull = buildCalibratedSkull(gltf.scene, true);
          modelsGroup.add(skull);
          checkDone();
        },
        undefined,
        () => checkDone()
      );
    } else if (modelType === 'brain') {
      gltfLoader.load(
        '/models/brain.glb',
        (gltf) => {
          const brain = buildBilateralBrain(gltf.scene);
          modelsGroup.add(brain);
          setModelLoading(false);
        },
        undefined,
        () => setModelLoading(false)
      );
    } else {
      // Skull Only Mode
      gltfLoader.load(
        '/models/skull.glb',
        (gltf) => {
          const skull = buildCalibratedSkull(gltf.scene, false);
          modelsGroup.add(skull);
          setModelLoading(false);
        },
        undefined,
        () => setModelLoading(false)
      );
    }

    // Unified 3D Target Tumor
    const targetWorldPos = toWorldVector(activeCase.targetPosition);

    const targetGeo = new THREE.SphereGeometry(3.2, 24, 24);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.2,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.copy(targetWorldPos);
    targetMesh.renderOrder = 999;
    targetMeshRef.current = targetMesh;
    scene.add(targetMesh);

    // Safety Margin Halo
    const haloRadius = 3.2 + activeCase.safetyMarginMm * SCALE_X;
    const haloGeo = new THREE.SphereGeometry(haloRadius, 20, 20);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.copy(targetWorldPos);
    haloMesh.renderOrder = 998;
    scene.add(haloMesh);

    // Primary Surgical Probe Tool
    const probeGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 16);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.85,
      roughness: 0.2,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 10;
    probeGroup.add(handle);

    const tipGeo = new THREE.ConeGeometry(0.8, 6.0, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = -3.0;
    tip.rotation.x = Math.PI;
    probeGroup.add(tip);

    const probeInitialWorldPos = toWorldVector(pointerPosition);
    probeGroup.position.copy(probeInitialWorldPos);
    probeRef.current = probeGroup;
    scene.add(probeGroup);

    // Primary Trajectory Laser Beam
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.8,
      gapSize: 1.0,
      linewidth: 2,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([probeInitialWorldPos, targetWorldPos]);
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    trajectoryLine.computeLineDistances();
    trajectoryLineRef.current = trajectoryLine;
    scene.add(trajectoryLine);

    // Secondary Trajectory Probe
    const secProbeGroup = probeGroup.clone();
    secProbeGroup.visible = isDualTrajectoryActive;
    secondaryProbeRef.current = secProbeGroup;
    scene.add(secProbeGroup);

    const secLineMat = new THREE.LineDashedMaterial({
      color: 0xa855f7,
      dashSize: 1.8,
      gapSize: 1.0,
      linewidth: 2,
    });
    const secInitialWorldPos = new THREE.Vector3(-probeInitialWorldPos.x, probeInitialWorldPos.y, probeInitialWorldPos.z);
    const secLineGeo = new THREE.BufferGeometry().setFromPoints([secInitialWorldPos, targetWorldPos]);
    const secTrajectoryLine = new THREE.Line(secLineGeo, secLineMat);
    secTrajectoryLine.computeLineDistances();
    secTrajectoryLine.visible = isDualTrajectoryActive;
    secondaryLineRef.current = secTrajectoryLine;
    scene.add(secTrajectoryLine);

    // Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      const pulse = 1 + Math.sin(Date.now() * 0.0035) * 0.06;
      targetMesh.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };
    animate();

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

  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  useEffect(() => {
    if (probeRef.current && targetMeshRef.current && trajectoryLineRef.current) {
      const probeWorldPos = toWorldVector(pointerPosition);
      probeRef.current.position.copy(probeWorldPos);
      probeRef.current.lookAt(targetMeshRef.current.position);
      probeRef.current.rotateX(Math.PI / 2);

      const positions = trajectoryLineRef.current.geometry.attributes.position;
      positions.setXYZ(0, probeWorldPos.x, probeWorldPos.y, probeWorldPos.z);
      positions.setXYZ(
        1,
        targetMeshRef.current.position.x,
        targetMeshRef.current.position.y,
        targetMeshRef.current.position.z
      );
      positions.needsUpdate = true;
      trajectoryLineRef.current.computeLineDistances();
    }

    if (secondaryProbeRef.current && secondaryLineRef.current && targetMeshRef.current) {
      secondaryProbeRef.current.visible = isDualTrajectoryActive;
      secondaryLineRef.current.visible = isDualTrajectoryActive;

      if (isDualTrajectoryActive) {
        const secWorldPos = toWorldVector({
          ...pointerPosition,
          x: -pointerPosition.x
        });
        secondaryProbeRef.current.position.copy(secWorldPos);
        secondaryProbeRef.current.lookAt(targetMeshRef.current.position);
        secondaryProbeRef.current.rotateX(Math.PI / 2);

        const secPositions = secondaryLineRef.current.geometry.attributes.position;
        secPositions.setXYZ(0, secWorldPos.x, secWorldPos.y, secWorldPos.z);
        secPositions.setXYZ(
          1,
          targetMeshRef.current.position.x,
          targetMeshRef.current.position.y,
          targetMeshRef.current.position.z
        );
        secPositions.needsUpdate = true;
        secondaryLineRef.current.computeLineDistances();
      }
    }
  }, [pointerPosition, isDualTrajectoryActive]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(38, 22, 75);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative aspect-[16/10] w-full solid-panel rounded-3xl overflow-hidden shadow-sm border border-[#E9EDCA]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Solid Model Loading Banner */}
      {modelLoading && (
        <div className="absolute inset-0 bg-[#0f172a]/80 flex items-center justify-center gap-2.5 text-[#e0f2fe] text-xs font-bold z-20 font-display">
          <Loader2 className="w-5 h-5 animate-spin text-[#38bdf8]" />
          <span>Calibrating 3D Anatomical Alignment...</span>
        </div>
      )}

      {/* Top Controls: Solid Floating Toolbar (No Glassmorphism) */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-[#2e2417] flex items-center gap-2 shadow-xs border border-[#E9EDCA] font-display">
            <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
            <span>3D Anatomical Suite</span>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl text-[11px] font-bold border border-[#E9EDCA] shadow-xs">
            <button
              onClick={() => setModelType('brain')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'brain'
                  ? 'bg-[#0284c7] text-white shadow-xs font-black'
                  : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
              }`}
            >
              🧠 Brain Mesh
            </button>
            <button
              onClick={() => setModelType('skull')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'skull'
                  ? 'bg-[#0284c7] text-white shadow-xs font-black'
                  : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
              }`}
            >
              💀 Skull Mesh
            </button>
            <button
              onClick={() => setModelType('dual')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'dual'
                  ? 'bg-[#38bdf8] text-[#0f172a] shadow-xs font-black'
                  : 'text-[#5c4a38] hover:text-[#2e2417] hover:bg-[#FAEDCD]'
              }`}
              title="Calibrated Craniotomy View"
            >
              ✨ Skull + Brain
            </button>
          </div>
        </div>

        {/* Camera & Scene Toolbar Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              showGrid
                ? 'bg-[#FAEDCD] border-[#D3A373] text-[#784819]'
                : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:text-[#2e2417]'
            }`}
            title="Toggle Spatial Reference Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              isWireframe
                ? 'bg-[#E9EDCA] border-[#CDD5AE] text-[#3e4c1f]'
                : 'bg-white border-[#E9EDCA] text-[#5c4a38] hover:text-[#2e2417]'
            }`}
            title="Toggle Mesh Wireframe Mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-white border border-[#E9EDCA] text-[#5c4a38] hover:text-[#2e2417] shadow-xs transition-all"
            title="Reset Camera Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Corner Interaction Guide */}
      <div className="absolute bottom-3 left-3 text-[10px] text-[#2e2417] font-mono bg-white px-3 py-1.5 rounded-xl border border-[#E9EDCA] shadow-xs pointer-events-none flex items-center gap-3 font-semibold">
        <span>🖱️ Orbit: Drag</span>
        <span>•</span>
        <span>Pan: Right-Drag</span>
        <span>•</span>
        <span>Zoom: Scroll</span>
      </div>

      {/* Bottom Right Legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
        <div className="bg-white px-2.5 py-1 rounded-lg border border-[#ef4444] text-[10px] text-[#dc2626] font-bold flex items-center gap-1.5 shadow-xs font-display">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
          <span>Tumor Target</span>
        </div>
        <div className="bg-white px-2.5 py-1 rounded-lg border border-[#38bdf8] text-[10px] text-[#0284c7] font-bold flex items-center gap-1.5 shadow-xs font-display">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
          <span>{activeCase.safetyMarginMm}mm Margin</span>
        </div>
      </div>
    </div>
  );
};
