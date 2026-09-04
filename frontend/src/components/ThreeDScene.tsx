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

// Global Anatomical Scale Factor (Converts clinical mm to 3D world units)
const ANATOMICAL_SCALE = 0.28;
const ANATOMICAL_Y_OFFSET = 20.0;

// Helper: Convert DICOM RAS coordinates to 3D Scene World Coordinates
const toWorldVector = (pos: Vector3D): THREE.Vector3 => {
  return new THREE.Vector3(
    pos.x * ANATOMICAL_SCALE,
    (pos.z - ANATOMICAL_Y_OFFSET) * ANATOMICAL_SCALE,
    pos.y * ANATOMICAL_SCALE
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

    // Initialize Three.js Scene with Deep Clinical Slate Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    sceneRef.current = scene;

    // Perspective Camera (3/4 anatomical viewpoint)
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(45, 30, 85);
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
    controls.target.set(0, 4, 0);
    controlsRef.current = controls;

    // High-Tech Surgical Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.7);
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

    // 3D GLTF Mesh Loader & Calibrator
    setModelLoading(true);
    const gltfLoader = new GLTFLoader();

    const BRAIN_COLOR = 0x38bdf8; // Vivid Medical Cyan Blue
    const SKULL_COLOR = 0xe2e8f0; // Platinum Bone Ivory

    // Create a complete bilateral Brain (Left + Right Hemispheres + Cerebellum + Brainstem)
    const createBilateralBrain = (
      rawGltfScene: THREE.Group,
      targetWidth: number = 26,
      opacity: number = 0.94,
      wire: boolean = false
    ): THREE.Group => {
      const fullBrainGroup = new THREE.Group();

      // Calibrate Left Hemisphere
      const leftHemi = rawGltfScene.clone();
      leftHemi.rotation.y = Math.PI / 2;

      // Compute bounding box
      const initialBox = new THREE.Box3().setFromObject(leftHemi);
      const initialSize = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
      const hemiScale = (targetWidth * 0.95) / maxDim;
      leftHemi.scale.set(hemiScale, hemiScale, hemiScale);

      const scaledBox = new THREE.Box3().setFromObject(leftHemi);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      // Center medial edge at X = 0 (shift left hemisphere to negative X)
      leftHemi.position.x -= (scaledCenter.x + (scaledBox.max.x - scaledCenter.x) * 0.45);
      leftHemi.position.y -= scaledCenter.y;
      leftHemi.position.z -= scaledCenter.z;

      // Apply Medical Cyan Shader
      leftHemi.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.geometry) mesh.geometry.computeVertexNormals();
          mesh.material = new THREE.MeshStandardMaterial({
            color: BRAIN_COLOR,
            roughness: 0.35,
            metalness: 0.15,
            wireframe: wire,
            side: THREE.DoubleSide,
            transparent: opacity < 1.0,
            opacity: opacity,
            depthWrite: opacity >= 0.8,
          });
        }
      });

      // Construct Mirrored Right Hemisphere
      const rightHemi = leftHemi.clone();
      rightHemi.scale.x = -leftHemi.scale.x;
      rightHemi.position.x = -leftHemi.position.x;
      rightHemi.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x0ea5e9, // Slightly differentiated right cortex tone
            roughness: 0.35,
            metalness: 0.15,
            wireframe: wire,
            side: THREE.DoubleSide,
            transparent: opacity < 1.0,
            opacity: opacity,
            depthWrite: opacity >= 0.8,
          });
        }
      });

      fullBrainGroup.add(leftHemi);
      fullBrainGroup.add(rightHemi);

      // Anatomical Cerebellum (Inferior Posterior)
      const cerebellumGeo = new THREE.SphereGeometry(6.2, 28, 28);
      const cerebellumMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.4,
        metalness: 0.15,
        wireframe: wire,
        side: THREE.DoubleSide,
        transparent: opacity < 1.0,
        opacity: opacity,
      });
      const cerebellumLeft = new THREE.Mesh(cerebellumGeo, cerebellumMat);
      cerebellumLeft.position.set(-3.8, -4.5, -7.5);
      cerebellumLeft.scale.set(0.9, 0.75, 0.95);
      fullBrainGroup.add(cerebellumLeft);

      const cerebellumRight = new THREE.Mesh(cerebellumGeo, cerebellumMat);
      cerebellumRight.position.set(3.8, -4.5, -7.5);
      cerebellumRight.scale.set(0.9, 0.75, 0.95);
      fullBrainGroup.add(cerebellumRight);

      // Anatomical Brainstem (Inferior Medial)
      const brainstemGeo = new THREE.CylinderGeometry(2.0, 1.5, 9.5, 20);
      const brainstemMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.45,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: opacity < 1.0,
        opacity: opacity,
      });
      const brainstem = new THREE.Mesh(brainstemGeo, brainstemMat);
      brainstem.position.set(0, -8.0, -2.5);
      fullBrainGroup.add(brainstem);

      // Align vertical height with the cranial vault
      fullBrainGroup.position.set(0, 5.0, 1.0);
      return fullBrainGroup;
    };

    // Calibrate Cranial Skull Mesh
    const calibrateSkull = (
      rawSkullScene: THREE.Group,
      targetDim: number = 46,
      opacity: number = 0.45,
      wire: boolean = false
    ): THREE.Group => {
      const skullGroup = new THREE.Group();
      const skullModel = rawSkullScene.clone();

      const initialBox = new THREE.Box3().setFromObject(skullModel);
      const initialSize = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;

      const scaleFactor = targetDim / maxDim;
      skullModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const scaledBox = new THREE.Box3().setFromObject(skullModel);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      // Center horizontally at X=0, Z=0; position cranial vault around Y=5.0
      skullModel.position.x -= scaledCenter.x;
      skullModel.position.y -= (scaledCenter.y - 2.5); // Align cranial cavity with brain
      skullModel.position.z -= scaledCenter.z;

      skullModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.geometry) mesh.geometry.computeVertexNormals();

          mesh.material = new THREE.MeshStandardMaterial({
            color: SKULL_COLOR,
            roughness: 0.55,
            metalness: 0.2,
            wireframe: wire,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: opacity,
            depthWrite: opacity > 0.85,
          });
        }
      });

      skullGroup.add(skullModel);
      return skullGroup;
    };

    // Procedural Fallback Builder (if GLBs fail to load)
    const buildProceduralFallback = (type: 'brain' | 'skull') => {
      const group = new THREE.Group();
      if (type === 'brain') {
        const leftHemi = new THREE.Mesh(
          new THREE.SphereGeometry(12, 36, 36),
          new THREE.MeshStandardMaterial({
            color: BRAIN_COLOR,
            roughness: 0.35,
            metalness: 0.15,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.94,
          })
        );
        leftHemi.position.set(-5.5, 5.0, 1.0);
        leftHemi.scale.set(0.9, 1.05, 1.25);
        group.add(leftHemi);

        const rightHemi = new THREE.Mesh(
          new THREE.SphereGeometry(12, 36, 36),
          new THREE.MeshStandardMaterial({
            color: 0x0ea5e9,
            roughness: 0.35,
            metalness: 0.15,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.94,
          })
        );
        rightHemi.position.set(5.5, 5.0, 1.0);
        rightHemi.scale.set(0.9, 1.05, 1.25);
        group.add(rightHemi);

        const cerebellum = new THREE.Mesh(
          new THREE.SphereGeometry(7.0, 28, 28),
          new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.4,
            metalness: 0.15,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
          })
        );
        cerebellum.position.set(0, -1.0, -7.0);
        cerebellum.scale.set(1.3, 0.85, 0.95);
        group.add(cerebellum);

        const brainstem = new THREE.Mesh(
          new THREE.CylinderGeometry(2.5, 1.8, 10, 24),
          new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            roughness: 0.4,
            side: THREE.DoubleSide,
          })
        );
        brainstem.position.set(0, -4.5, -2.5);
        group.add(brainstem);
      } else {
        const cranium = new THREE.Mesh(
          new THREE.SphereGeometry(17, 40, 40),
          new THREE.MeshStandardMaterial({
            color: SKULL_COLOR,
            roughness: 0.55,
            metalness: 0.2,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.45,
          })
        );
        cranium.scale.set(1.05, 1.2, 1.3);
        cranium.position.set(0, 4.0, 0);
        group.add(cranium);
      }
      return group;
    };

    if (modelType === 'dual') {
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) setModelLoading(false);
      };

      gltfLoader.load(
        '/models/brain.glb',
        (gltf) => {
          const bilateralBrain = createBilateralBrain(gltf.scene, 27, 0.94, isWireframe);
          modelsGroup.add(bilateralBrain);
          checkDone();
        },
        undefined,
        () => {
          const fallbackBrain = buildProceduralFallback('brain');
          modelsGroup.add(fallbackBrain);
          checkDone();
        }
      );

      gltfLoader.load(
        '/models/skull.glb',
        (gltf) => {
          // Translucent Bone Shell (0.28 opacity) for Craniotomy Dual Overlay
          const skull = calibrateSkull(gltf.scene, 46, 0.28, isWireframe);
          modelsGroup.add(skull);
          checkDone();
        },
        undefined,
        () => {
          const fallbackSkull = buildProceduralFallback('skull');
          modelsGroup.add(fallbackSkull);
          checkDone();
        }
      );
    } else if (modelType === 'brain') {
      gltfLoader.load(
        '/models/brain.glb',
        (gltf) => {
          const bilateralBrain = createBilateralBrain(gltf.scene, 28, 0.96, isWireframe);
          modelsGroup.add(bilateralBrain);
          setModelLoading(false);
        },
        undefined,
        () => {
          const fallback = buildProceduralFallback('brain');
          modelsGroup.add(fallback);
          setModelLoading(false);
        }
      );
    } else {
      // Skull Only Mode: Semi-translucent (0.50 opacity) so internal tumor & trajectory are visible
      gltfLoader.load(
        '/models/skull.glb',
        (gltf) => {
          const skull = calibrateSkull(gltf.scene, 46, 0.50, isWireframe);
          modelsGroup.add(skull);
          setModelLoading(false);
        },
        undefined,
        () => {
          const fallback = buildProceduralFallback('skull');
          modelsGroup.add(fallback);
          setModelLoading(false);
        }
      );
    }

    // Unified 3D Target Tumor
    const targetWorldPos = toWorldVector(activeCase.targetPosition);

    const targetGeo = new THREE.SphereGeometry(3.5, 24, 24);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.2,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.copy(targetWorldPos);
    targetMeshRef.current = targetMesh;
    scene.add(targetMesh);

    // Safety Margin Halo
    const haloRadius = 3.5 + activeCase.safetyMarginMm * ANATOMICAL_SCALE;
    const haloGeo = new THREE.SphereGeometry(haloRadius, 20, 20);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.copy(targetWorldPos);
    scene.add(haloMesh);

    // Primary Surgical Probe Tool
    const probeGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.9, 0.9, 22, 16);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.85,
      roughness: 0.2,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 11;
    probeGroup.add(handle);

    const tipGeo = new THREE.ConeGeometry(0.9, 6.5, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = -3.25;
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
      cameraRef.current.position.set(45, 30, 85);
      controlsRef.current.target.set(0, 4, 0);
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
          <span>Calibrating & Aligning 3D Anatomical Meshes...</span>
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
