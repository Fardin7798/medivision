"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Box, RotateCw } from "lucide-react";

interface Viewport3DProps {
  title?: string;
}

export default function Viewport3D({ title = "3D Anatomical Surface Mesh" }: Viewport3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);

    const width = currentMount.clientWidth || 400;
    const height = currentMount.clientHeight || 380;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.8);
    dirLight2.position.set(-5, -5, -2);
    scene.add(dirLight2);

    // Anatomical Ellipsoid / Heart Geometry Simulation
    const geometry = new THREE.SphereGeometry(1.2, 64, 64);
    geometry.scale(1.0, 1.3, 0.85); // Left atrium shape approximation

    const material = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.35,
      metalness: 0.15,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Grid helper
    const grid = new THREE.GridHelper(6, 12, 0x334155, 0x1e293b);
    grid.position.y = -1.6;
    scene.add(grid);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      mesh.rotation.y += 0.008;
      mesh.rotation.x += 0.002;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Box size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{title}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
          <RotateCw size={14} />
          <span>WebGL 60 FPS</span>
        </div>
      </div>

      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "380px",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
      />
    </div>
  );
}
