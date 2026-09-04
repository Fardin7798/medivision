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

export const ThreeDScene: React.FC<ThreeDSceneProps> = ({
  activeCase,
  pointerPosition,
  isDualTrajectoryActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [modelType, setModelType] = useState<'brain' | 'skull'>('brain');

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
  const loadedModelRef = useRef<THREE.Group | null>(null);

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
    scene.background = new THREE.Color('#192116');
    sceneRef.current = scene;

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 45, 120);
    cameraRef.current = camera;

    // WebGL Renderer with High Precision Anti-Aliasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 250;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // Lighting (Warm Studio Rig using Sage & Caramel)
    const ambientLight = new THREE.AmbientLight(0xFEF9E1, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xD3A373, 2.2);
    keyLight.position.set(40, 80, 50);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xCDD5AE, 1.8);
    fillLight.position.set(-40, -40, -50);
    scene.add(fillLight);

    const topWhiteLight = new THREE.DirectionalLight(0xFAEDCD, 1.5);
    topWhiteLight.position.set(0, 100, 0);
    scene.add(topWhiteLight);

    // Spatial Reference Grid
    const gridHelper = new THREE.GridHelper(100, 20, 0xD3A373, 0x3d4b30);
    gridHelper.position.y = -25;
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Load High-Precision 3D GLTF Model (with Procedural Fallback)
    setModelLoading(true);
    const gltfLoader = new GLTFLoader();
    const modelUrl = modelType === 'brain' ? '/models/brain.glb' : '/models/skull.glb';

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(18, 18, 18);
        model.position.set(0, 0, 0);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: modelType === 'brain' ? 0xD3A373 : 0xE9EDCA,
              roughness: 0.4,
              metalness: 0.15,
              wireframe: isWireframe,
              transparent: true,
              opacity: 0.88,
            });
          }
        });

        loadedModelRef.current = model;
        scene.add(model);
        setModelLoading(false);
      },
      undefined,
      () => {
        // High-Quality Procedural Brain/Organ Fallback Mesh
        const group = new THREE.Group();
        const mainGeo = modelType === 'brain'
          ? new THREE.SphereGeometry(16, 32, 32)
          : new THREE.CylinderGeometry(14, 12, 24, 32);
        
        const mainMat = new THREE.MeshStandardMaterial({
          color: modelType === 'brain' ? 0xD3A373 : 0xE9EDCA,
          roughness: 0.4,
          metalness: 0.2,
          wireframe: isWireframe,
          transparent: true,
          opacity: 0.75,
        });

        const mainMesh = new THREE.Mesh(mainGeo, mainMat);
        group.add(mainMesh);

        // Add anatomical hemispheres / ventricles
        const leftHemi = new THREE.Mesh(
          new THREE.SphereGeometry(14, 24, 24),
          new THREE.MeshStandardMaterial({
            color: 0xCDD5AE,
            roughness: 0.4,
            transparent: true,
            opacity: 0.65,
            wireframe: isWireframe,
          })
        );
        leftHemi.position.set(-6, 0, 0);
        group.add(leftHemi);

        const rightHemi = new THREE.Mesh(
          new THREE.SphereGeometry(14, 24, 24),
          new THREE.MeshStandardMaterial({
            color: 0xFAEDCD,
            roughness: 0.4,
            transparent: true,
            opacity: 0.65,
            wireframe: isWireframe,
          })
        );
        rightHemi.position.set(6, 0, 0);
        group.add(rightHemi);

        loadedModelRef.current = group;
        scene.add(group);
        setModelLoading(false);
      }
    );

    // Target Tumor Core Mesh (Caramel/Terracotta Glowing Sphere)
    const targetGeo = new THREE.SphereGeometry(4.5, 32, 32);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      emissive: 0x9a3412,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.set(
      activeCase.targetPosition.x * 0.3,
      activeCase.targetPosition.y * 0.3,
      activeCase.targetPosition.z * 0.3
    );
    targetMeshRef.current = targetMesh;
    scene.add(targetMesh);

    // Safety Margin Halo (Pulsing Sage/Olive Wireframe Ring)
    const haloGeo = new THREE.SphereGeometry(
      (4.5 + activeCase.safetyMarginMm * 0.3),
      24,
      24
    );
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xCDD5AE,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    targetMesh.add(haloMesh);

    // Primary Surgical Probe Model (Titanium Caramel Needle with Optical Trackers)
    const probeGroup = new THREE.Group();
    const needleGeo = new THREE.CylinderGeometry(0.5, 0.1, 35, 16);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0xD3A373,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xbe8e5e,
      emissiveIntensity: 0.3,
    });
    const needleMesh = new THREE.Mesh(needleGeo, needleMat);
    needleMesh.position.y = 17.5;
    probeGroup.add(needleMesh);

    // Optical Tracking Marker Spheres (Reflective Sage beacons)
    for (let i = 0; i < 3; i++) {
      const markerGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const markerMat = new THREE.MeshStandardMaterial({
        color: 0xCDD5AE,
        emissive: 0x8a995e,
        emissiveIntensity: 0.6,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(i === 0 ? 3 : -3, 30 + i * 4, 0);
      probeGroup.add(markerMesh);
    }

    probeRef.current = probeGroup;
    scene.add(probeGroup);

    // Secondary Dual Trajectory Probe
    const secProbeGroup = probeGroup.clone();
    secProbeGroup.visible = isDualTrajectoryActive;
    secondaryProbeRef.current = secProbeGroup;
    scene.add(secProbeGroup);

    // Planned Trajectory Laser Line (Caramel dashed)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xD3A373,
      dashSize: 2,
      gapSize: 1,
      linewidth: 3,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      probeGroup.position,
      targetMesh.position
    ]);
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    trajectoryLineRef.current = trajectoryLine;
    scene.add(trajectoryLine);

    // Secondary Trajectory Line (Sage dashed)
    const secLineMat = new THREE.LineDashedMaterial({
      color: 0xCDD5AE,
      dashSize: 2,
      gapSize: 1,
      linewidth: 3,
    });
    const secLineGeo = new THREE.BufferGeometry().setFromPoints([
      secProbeGroup.position,
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
    <div className="relative aspect-[16/10] w-full glass-panel rounded-3xl overflow-hidden shadow-md border border-[#E9EDCA]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Indicator */}
      {modelLoading && (
        <div className="absolute inset-0 bg-[#2e2417]/70 backdrop-blur-sm flex items-center justify-center gap-2.5 text-[#FAEDCD] text-xs font-bold z-20">
          <Loader2 className="w-5 h-5 animate-spin text-[#D3A373]" />
          <span>Loading High-Resolution 3D GLTF Mesh...</span>
        </div>
      )}

      {/* Top HUD Controls & Model Switcher */}
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
                modelType === 'brain' ? 'bg-[#D3A373] text-white shadow-xs' : 'text-[#5c4a38] hover:text-[#2e2417]'
              }`}
            >
              Brain Mesh
            </button>
            <button
              onClick={() => setModelType('skull')}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'skull' ? 'bg-[#D3A373] text-white shadow-xs' : 'text-[#5c4a38] hover:text-[#2e2417]'
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
        <span>🖱️ Orbit</span>
        <span>•</span>
        <span>Pan</span>
        <span>•</span>
        <span>Zoom</span>
      </div>

      {/* Bottom Right Legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
        <div className="bg-[#FEF9E1]/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#D3A373] text-[10px] text-[#8c5a2b] font-bold flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#D3A373] animate-pulse" />
          <span>Tumor Core Target</span>
        </div>
        <div className="bg-[#FEF9E1]/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#CDD5AE] text-[10px] text-[#4d5d28] font-bold flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#CDD5AE]" />
          <span>{activeCase.safetyMarginMm}mm Margin Halo</span>
        </div>
      </div>
    </div>
  );
};
