'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PatientCase, Point3D } from '../types';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const probeMeshRef = useRef<THREE.Group | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const secondaryTrajectoryLineRef = useRef<THREE.Line | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Three.js Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(130, 100, 160);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 2. Surgical Theater Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    directionalLight1.position.set(100, 150, 100);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    directionalLight2.position.set(-100, -50, -100);
    scene.add(directionalLight2);

    const rimLight = new THREE.PointLight(0x06b6d4, 2.0, 300);
    rimLight.position.set(0, 80, 0);
    scene.add(rimLight);

    // 3. Grid & Reference Floor
    const grid = new THREE.GridHelper(180, 20, 0x334155, 0x1e293b);
    grid.position.y = -45;
    scene.add(grid);

    // 4. Photorealistic Anatomical Organ Meshes Group
    const organGroup = new THREE.Group();
    activeCase.anatomicalStructures.forEach((structure) => {
      if (!structure.visible) return;

      let geom: THREE.BufferGeometry;
      let mat: THREE.Material;

      if (structure.id === 'tumor' || structure.id === 'target' || structure.id === 'aneurysm') {
        // Target Focal Core (Pulsing Glowing Sphere)
        geom = new THREE.SphereGeometry(structure.id === 'aneurysm' ? 5.5 : 8.5, 32, 32);
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(structure.color),
          emissive: new THREE.Color(structure.color),
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.1
        });
      } else if (structure.id === 'cortex' || structure.id === 'liver') {
        // Main Parenchymal Organ (Realistic Layered Organic Contours)
        geom = new THREE.IcosahedronGeometry(structure.id === 'liver' ? 44 : 36, 4);
        mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(structure.color),
          transparent: true,
          opacity: structure.opacity,
          roughness: 0.3,
          transmission: 0.4,
          thickness: 1.5,
          wireframe: false
        });
      } else if (structure.id === 'vertebrae') {
        // Spinal Bone Column Structure
        geom = new THREE.CylinderGeometry(18, 22, 40, 16);
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(structure.color),
          roughness: 0.6,
          metalness: 0.1
        });
      } else if (structure.id === 'vessels' || structure.id === 'portal-vein' || structure.id === 'circle-of-willis') {
        // High-Precision Vascular Tree Torus & Branches
        geom = new THREE.TorusGeometry(20, 3.2, 16, 60);
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(structure.color),
          roughness: 0.3,
          metalness: 0.4
        });
      } else {
        // Generic Critical Ventricles / Deep Brain Structures
        geom = new THREE.SphereGeometry(18, 24, 24);
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(structure.color),
          transparent: true,
          opacity: structure.opacity,
          roughness: 0.4
        });
      }

      const mesh = new THREE.Mesh(geom, mat);
      organGroup.add(mesh);
    });
    scene.add(organGroup);

    // 5. Safety Margin Boundary Sphere (Wireframe HUD Boundary)
    const marginRadius = (activeCase.id === 'case-avm-vascular' ? 5.5 : 8.5) + activeCase.safetyMarginMm;
    const marginGeom = new THREE.SphereGeometry(marginRadius, 20, 20);
    const marginMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const marginMesh = new THREE.Mesh(marginGeom, marginMat);
    scene.add(marginMesh);

    // 6. High-Precision Surgical Probe & Stylus Group with Laser Tip
    const probeGroup = new THREE.Group();
    
    // Stainless Steel Probe Shaft
    const shaftGeom = new THREE.CylinderGeometry(1.2, 1.2, 45, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });
    const shaftMesh = new THREE.Mesh(shaftGeom, shaftMat);
    shaftMesh.position.y = 22.5;
    probeGroup.add(shaftMesh);

    // Depth Scale Rings (Millimeter Marker Bands)
    for (let d = 5; d <= 40; d += 10) {
      const ringGeom = new THREE.TorusGeometry(1.4, 0.2, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = d;
      probeGroup.add(ringMesh);
    }

    // Laser Tip Pointer
    const tipGeom = new THREE.ConeGeometry(1.4, 6, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8
    });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    tipMesh.rotation.x = Math.PI;
    tipMesh.position.y = -3;
    probeGroup.add(tipMesh);

    probeMeshRef.current = probeGroup;
    scene.add(probeGroup);

    // 7. Primary Laser Trajectory Beam Line
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 3,
      gapSize: 2,
      linewidth: 2
    });
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(activeCase.entryPosition.x, activeCase.entryPosition.y, activeCase.entryPosition.z),
      new THREE.Vector3(activeCase.targetPosition.x, activeCase.targetPosition.y, activeCase.targetPosition.z)
    ]);
    const trajectoryLine = new THREE.Line(lineGeom, lineMat);
    trajectoryLine.computeLineDistances();
    trajectoryLineRef.current = trajectoryLine;
    scene.add(trajectoryLine);

    // 8. Secondary / Bilateral Trajectory Beam (If active)
    if (isDualTrajectoryActive && activeCase.secondaryTargetPosition && activeCase.secondaryEntryPosition) {
      const secLineMat = new THREE.LineDashedMaterial({
        color: 0xa855f7,
        dashSize: 3,
        gapSize: 2,
        linewidth: 2
      });
      const secLineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(activeCase.secondaryEntryPosition.x, activeCase.secondaryEntryPosition.y, activeCase.secondaryEntryPosition.z),
        new THREE.Vector3(activeCase.secondaryTargetPosition.x, activeCase.secondaryTargetPosition.y, activeCase.secondaryTargetPosition.z)
      ]);
      const secTrajectoryLine = new THREE.Line(secLineGeom, secLineMat);
      secTrajectoryLine.computeLineDistances();
      secondaryTrajectoryLineRef.current = secTrajectoryLine;
      scene.add(secTrajectoryLine);
    }

    // 9. Interactive Mouse Orbit Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const rotSpeed = 0.006;
      organGroup.rotation.y += deltaX * rotSpeed;
      organGroup.rotation.x += deltaY * rotSpeed;
      marginMesh.rotation.y += deltaX * rotSpeed;
      marginMesh.rotation.x += deltaY * rotSpeed;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(70, Math.min(280, camera.position.z + e.deltaY * 0.15));
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 10. Animation Loop (60 FPS Smooth Render)
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      marginMesh.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight || 450;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeCase, isDualTrajectoryActive]);

  // Update Probe Position in Real-Time
  useEffect(() => {
    if (probeMeshRef.current) {
      probeMeshRef.current.position.set(pointerPosition.x, pointerPosition.y, pointerPosition.z);
    }
  }, [pointerPosition]);

  return (
    <div className="relative w-full h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* 3D Scene HUD Overlays */}
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>Interactive 3D Anatomical Scene & Trajectory</span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-800/60 px-2 py-0.5 rounded font-bold">
          Target Focal Core
        </span>
        {isDualTrajectoryActive && (
          <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded font-bold">
            Dual Trajectory Active
          </span>
        )}
        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-bold">
          Surgical Probe Stylus
        </span>
      </div>

      <div className="absolute bottom-3 left-3 text-[10px] text-slate-400 bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800/80">
        Left-drag: Orbit | Scroll: Zoom
      </div>
    </div>
  );
};
