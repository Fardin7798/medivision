'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ClinicalCase, Vector3D } from '@/types';
import { Grid, RotateCcw, Eye, Loader2, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface ThreeDSceneProps {
  activeCase: ClinicalCase;
  pointerPosition: Vector3D;
  isDualTrajectoryActive: boolean;
}

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

    // Initialize Three.js Scene with Warm Dark Forest Studio Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#161c13');
    sceneRef.current = scene;

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 35, 95);
    cameraRef.current = camera;

    // WebGL Renderer with High Precision Anti-Aliasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // Clear previous children
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
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Studio Lighting Rig (Sage & Amber Clinical Palette)
    const ambientLight = new THREE.AmbientLight(0xFEF9E1, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xD3A373, 2.6);
    keyLight.position.set(50, 80, 60);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xCDD5AE, 2.0);
    rimLight.position.set(-50, -30, -50);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xFAEDCD, 1.6);
    fillLight.position.set(0, 80, -40);
    scene.add(fillLight);

    const bottomBounce = new THREE.DirectionalLight(0x9fae72, 1.0);
    bottomBounce.position.set(0, -60, 0);
    scene.add(bottomBounce);

    // Spatial Reference Grid
    const gridHelper = new THREE.GridHelper(90, 18, 0xD3A373, 0x2e3827);
    gridHelper.position.y = -26;
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Master Group for 3D Anatomical Meshes
    const modelsGroup = new THREE.Group();
    loadedModelsGroupRef.current = modelsGroup;
    scene.add(modelsGroup);

    // 3D GLTF Mesh Loader & Normalizer Function
    setModelLoading(true);
    const gltfLoader = new GLTFLoader();

    // Helper: Normalize, Center, and Auto-Scale any 3D GLTF Model
    const normalizeAndStyleModel = (
      model: THREE.Group,
      type: 'brain' | 'skull',
      targetDimension: number,
      opacity: number = 0.92,
      wire: boolean = false
    ) => {
      // 1. Compute original bounding box
      const initialBox = new THREE.Box3().setFromObject(model);
      const initialSize = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;

      // 2. Scale proportionally to target size
      const scaleFactor = targetDimension / maxDim;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // 3. Center geometry at exact world origin (0, 0, 0)
      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= scaledCenter.x;
      model.position.y -= scaledCenter.y;
      model.position.z -= scaledCenter.z;

      // 4. Apply high-fidelity Double-Sided materials
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.geometry) {
            mesh.geometry.computeVertexNormals();
          }

          mesh.material = new THREE.MeshStandardMaterial({
            color: type === 'brain' ? 0xD3A373 : 0xE9EDCA,
            roughness: type === 'brain' ? 0.45 : 0.65,
            metalness: type === 'brain' ? 0.1 : 0.15,
            wireframe: wire,
            side: THREE.DoubleSide,
            transparent: opacity < 1.0,
            opacity: opacity,
            depthWrite: opacity >= 0.85,
          });
        }
      });

      return model;
    };

    // Helper: Build high-quality Procedural Fallback Mesh
    const buildProceduralFallback = (type: 'brain' | 'skull') => {
      const group = new THREE.Group();
      if (type === 'brain') {
        // High-poly Cerebrum Hemispheres with realistic gyri contours
        const leftHemi = new THREE.Mesh(
          new THREE.SphereGeometry(15, 36, 36),
          new THREE.MeshStandardMaterial({
            color: 0xD3A373,
            roughness: 0.45,
            metalness: 0.1,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.92,
          })
        );
        leftHemi.position.set(-6.5, 0, 0);
        leftHemi.scale.set(1.0, 1.15, 1.25);
        group.add(leftHemi);

        const rightHemi = new THREE.Mesh(
          new THREE.SphereGeometry(15, 36, 36),
          new THREE.MeshStandardMaterial({
            color: 0xc49261,
            roughness: 0.45,
            metalness: 0.1,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.92,
          })
        );
        rightHemi.position.set(6.5, 0, 0);
        rightHemi.scale.set(1.0, 1.15, 1.25);
        group.add(rightHemi);

        // Cerebellum
        const cerebellum = new THREE.Mesh(
          new THREE.SphereGeometry(9, 28, 28),
          new THREE.MeshStandardMaterial({
            color: 0xCDD5AE,
            roughness: 0.5,
            metalness: 0.1,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
          })
        );
        cerebellum.position.set(0, -10, -11);
        cerebellum.scale.set(1.4, 0.9, 1.0);
        group.add(cerebellum);

        // Brainstem
        const brainstem = new THREE.Mesh(
          new THREE.CylinderGeometry(3.5, 2.5, 14, 24),
          new THREE.MeshStandardMaterial({
            color: 0xFAEDCD,
            roughness: 0.5,
            side: THREE.DoubleSide,
          })
        );
        brainstem.position.set(0, -14, -4);
        group.add(brainstem);
      } else {
        // High-poly Anatomical Cranial Vault (Calvarium) & Facial Skeleton
        const cranium = new THREE.Mesh(
          new THREE.SphereGeometry(18, 40, 40),
          new THREE.MeshStandardMaterial({
            color: 0xE9EDCA,
            roughness: 0.65,
            metalness: 0.12,
            side: THREE.DoubleSide,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.9,
          })
        );
        cranium.scale.set(1.05, 1.2, 1.3);
        cranium.position.set(0, 3, 0);
        group.add(cranium);

        // Facial Bone & Orbit Cavities
        const leftOrbit = new THREE.Mesh(
          new THREE.TorusGeometry(3.8, 1.2, 16, 24),
          new THREE.MeshStandardMaterial({ color: 0xCDD5AE, roughness: 0.6 })
        );
        leftOrbit.position.set(-6, -2, 18);
        group.add(leftOrbit);

        const rightOrbit = new THREE.Mesh(
          new THREE.TorusGeometry(3.8, 1.2, 16, 24),
          new THREE.MeshStandardMaterial({ color: 0xCDD5AE, roughness: 0.6 })
        );
        rightOrbit.position.set(6, -2, 18);
        group.add(rightOrbit);
      }
      return group;
    };

    if (modelType === 'dual') {
      // Combined Dual View: Semi-transparent Skull + Solid Internal Brain
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) setModelLoading(false);
      };

      gltfLoader.load(
        '/models/brain.glb',
        (gltf) => {
          const brain = normalizeAndStyleModel(gltf.scene, 'brain', 34, 0.95, isWireframe);
          modelsGroup.add(brain);
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
          const skull = normalizeAndStyleModel(gltf.scene, 'skull', 44, 0.38, isWireframe);
          modelsGroup.add(skull);
          checkDone();
        },
        undefined,
        () => {
          const fallbackSkull = buildProceduralFallback('skull');
          fallbackSkull.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
              m.transparent = true;
              m.opacity = 0.35;
            }
          });
          modelsGroup.add(fallbackSkull);
          checkDone();
        }
      );
    } else {
      // Single Model Load: Brain or Skull
      const modelUrl = modelType === 'brain' ? '/models/brain.glb' : '/models/skull.glb';
      const targetDim = modelType === 'brain' ? 38 : 42;

      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const model = normalizeAndStyleModel(gltf.scene, modelType, targetDim, 0.92, isWireframe);
          modelsGroup.add(model);
          setModelLoading(false);
        },
        undefined,
        () => {
          const fallback = buildProceduralFallback(modelType);
          modelsGroup.add(fallback);
          setModelLoading(false);
        }
      );
    }

    // Target Tumor Focal Point (Glowing Amber Core with Sage Margin Ring)
    const targetPos = new THREE.Vector3(
      activeCase.targetPosition.x * 0.22,
      activeCase.targetPosition.y * 0.22,
      activeCase.targetPosition.z * 0.22
    );

    const targetGeo = new THREE.SphereGeometry(3.5, 24, 24);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.2,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.copy(targetPos);
    targetMeshRef.current = targetMesh;
    scene.add(targetMesh);

    // Safety Margin Halo (Pulsing Sage Wireframe Shell)
    const haloGeo = new THREE.SphereGeometry(3.5 + activeCase.safetyMarginMm * 0.35, 20, 20);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xCDD5AE,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.copy(targetPos);
    scene.add(haloMesh);

    // Primary Surgical Probe Tool (High-Precision Titanium Stylus)
    const probeGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(1.0, 1.0, 24, 16);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xD3A373,
      metalness: 0.85,
      roughness: 0.25,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 12;
    probeGroup.add(handle);

    const tipGeo = new THREE.ConeGeometry(1.0, 7, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xFEF9E1,
      metalness: 0.95,
      roughness: 0.1,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = -3.5;
    tip.rotation.x = Math.PI;
    probeGroup.add(tip);

    const probeInitialPos = new THREE.Vector3(
      pointerPosition.x * 0.22,
      pointerPosition.y * 0.22,
      pointerPosition.z * 0.22
    );
    probeGroup.position.copy(probeInitialPos);
    probeRef.current = probeGroup;
    scene.add(probeGroup);

    // Primary Trajectory Laser Beam (Amber)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xD3A373,
      dashSize: 2,
      gapSize: 1.2,
      linewidth: 2,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([probeInitialPos, targetPos]);
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    trajectoryLine.computeLineDistances();
    trajectoryLineRef.current = trajectoryLine;
    scene.add(trajectoryLine);

    // Secondary Trajectory Probe (Dual Corridor Mode)
    const secProbeGroup = probeGroup.clone();
    secProbeGroup.visible = isDualTrajectoryActive;
    secondaryProbeRef.current = secProbeGroup;
    scene.add(secProbeGroup);

    const secLineMat = new THREE.LineDashedMaterial({
      color: 0xCDD5AE,
      dashSize: 1.8,
      gapSize: 1.2,
      linewidth: 2,
    });
    const secLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-probeInitialPos.x, probeInitialPos.y, probeInitialPos.z),
      targetPos,
    ]);
    const secTrajectoryLine = new THREE.Line(secLineGeo, secLineMat);
    secTrajectoryLine.computeLineDistances();
    secTrajectoryLine.visible = isDualTrajectoryActive;
    secondaryLineRef.current = secTrajectoryLine;
    scene.add(secTrajectoryLine);

    // Smooth 60 FPS Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Pulsate target tumor core gently
      const pulse = 1 + Math.sin(Date.now() * 0.0035) * 0.06;
      targetMesh.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };
    animate();

    // Responsive Canvas Resize
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

  // Toggle Spatial Grid
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Real-time Probe Coordinate & Laser Trajectory Update
  useEffect(() => {
    if (probeRef.current && targetMeshRef.current && trajectoryLineRef.current) {
      const probePos = new THREE.Vector3(
        pointerPosition.x * 0.22,
        pointerPosition.y * 0.22,
        pointerPosition.z * 0.22
      );
      probeRef.current.position.copy(probePos);

      // Point needle towards target
      probeRef.current.lookAt(targetMeshRef.current.position);
      probeRef.current.rotateX(Math.PI / 2);

      // Update trajectory laser line
      const positions = trajectoryLineRef.current.geometry.attributes.position;
      positions.setXYZ(0, probePos.x, probePos.y, probePos.z);
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
        const secPos = new THREE.Vector3(
          -pointerPosition.x * 0.22,
          pointerPosition.y * 0.22,
          pointerPosition.z * 0.22
        );
        secondaryProbeRef.current.position.copy(secPos);
        secondaryProbeRef.current.lookAt(
          new THREE.Vector3(
            -targetMeshRef.current.position.x,
            targetMeshRef.current.position.y,
            targetMeshRef.current.position.z
          )
        );
        secondaryProbeRef.current.rotateX(Math.PI / 2);
      }
    }
  }, [pointerPosition, isDualTrajectoryActive]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 35, 95);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative aspect-[16/10] w-full glass-panel rounded-3xl overflow-hidden shadow-md border border-[#E9EDCA]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Spinner */}
      {modelLoading && (
        <div className="absolute inset-0 bg-[#161c13]/70 backdrop-blur-sm flex items-center justify-center gap-2.5 text-[#FAEDCD] text-xs font-bold z-20">
          <Loader2 className="w-5 h-5 animate-spin text-[#D3A373]" />
          <span>Normalizing & Rendering High-Precision 3D GLTF Mesh...</span>
        </div>
      )}

      {/* Top HUD Controls & 3D Model View Mode Switcher */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#FEF9E1]/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-[#2e2417] flex items-center gap-2 shadow-md border border-[#E9EDCA]">
            <span className="w-2 h-2 rounded-full bg-[#CDD5AE] animate-pulse" />
            <span>3D Surgical Workspace</span>
          </div>

          <div className="flex items-center gap-1 bg-[#FEF9E1]/95 backdrop-blur-md p-1 rounded-xl text-[11px] font-bold border border-[#E9EDCA] shadow-xs">
            <button
              onClick={() => setModelType('brain')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'brain'
                  ? 'bg-[#D3A373] text-white shadow-xs font-black'
                  : 'text-[#5c4a38] hover:text-[#2e2417]'
              }`}
            >
              🧠 Brain Mesh
            </button>
            <button
              onClick={() => setModelType('skull')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'skull'
                  ? 'bg-[#D3A373] text-white shadow-xs font-black'
                  : 'text-[#5c4a38] hover:text-[#2e2417]'
              }`}
            >
              💀 Skull Mesh
            </button>
            <button
              onClick={() => setModelType('dual')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'dual'
                  ? 'bg-[#CDD5AE] text-[#334217] shadow-xs font-black'
                  : 'text-[#5c4a38] hover:text-[#2e2417]'
              }`}
              title="Craniotomy View: Transparent Skull with Internal Brain Cortex"
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
                : 'bg-[#FEF9E1]/95 backdrop-blur-md border-[#E9EDCA] text-[#5c4a38] hover:text-[#2e2417]'
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
                : 'bg-[#FEF9E1]/95 backdrop-blur-md border-[#E9EDCA] text-[#5c4a38] hover:text-[#2e2417]'
            }`}
            title="Toggle Mesh Wireframe Mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-[#FEF9E1]/95 backdrop-blur-md border border-[#E9EDCA] text-[#5c4a38] hover:text-[#2e2417] shadow-xs transition-all"
            title="Reset Camera Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Corner Interaction Guide */}
      <div className="absolute bottom-3 left-3 text-[10px] text-[#2e2417] font-mono bg-[#FEF9E1]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E9EDCA] shadow-sm pointer-events-none flex items-center gap-3 font-semibold">
        <span>🖱️ Orbit: Left Click + Drag</span>
        <span>•</span>
        <span>Pan: Right Click + Drag</span>
        <span>•</span>
        <span>Zoom: Scroll</span>
      </div>

      {/* Bottom Right Legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
        <div className="bg-[#FEF9E1]/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#D3A373] text-[10px] text-[#8c5a2b] font-bold flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#D3A373] animate-pulse" />
          <span>Tumor Target</span>
        </div>
        <div className="bg-[#FEF9E1]/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#CDD5AE] text-[10px] text-[#4d5d28] font-bold flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#CDD5AE]" />
          <span>{activeCase.safetyMarginMm}mm Margin Halo</span>
        </div>
      </div>
    </div>
  );
};
