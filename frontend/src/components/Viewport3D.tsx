"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Box, RotateCw, AlertTriangle } from "lucide-react";

interface Viewport3DProps {
  title?: string;
  /** Absolute URL to a real backend-generated STL mesh (e.g. meshResult.stl_download_url). */
  stlUrl?: string | null;
}

export default function Viewport3D({ title = "3D Anatomical Surface Mesh", stlUrl = null }: Viewport3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedReal, setLoadedReal] = useState(false);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    setLoadError(null);
    setLoadedReal(false);

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

    // Grid helper
    const grid = new THREE.GridHelper(6, 12, 0x334155, 0x1e293b);
    grid.position.y = -1.6;
    scene.add(grid);

    let mesh: THREE.Mesh | null = null;
    const disposables: Array<{ dispose: () => void }> = [];
    let cancelled = false;

    function frameMeshToCamera(m: THREE.Mesh) {
      // Center + uniformly scale any loaded geometry so it fits the viewport
      // regardless of the mesh's native units (mm from Marching Cubes output).
      const box = new THREE.Box3().setFromObject(m);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      m.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.2 / maxDim;
      m.scale.setScalar(scale);
    }

    function addPlaceholder() {
      // Fallback only: no real generated mesh is available yet for this view.
      const geometry = new THREE.SphereGeometry(1.2, 64, 64);
      geometry.scale(1.0, 1.3, 0.85);
      const material = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.45,
        metalness: 0.1,
        wireframe: true,
      });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      disposables.push(geometry, material);
      setLoadedReal(false);
    }

    if (stlUrl) {
      const loader = new STLLoader();
      loader.load(
        stlUrl,
        (geometry) => {
          if (cancelled) return;
          geometry.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.35,
            metalness: 0.15,
          });
          mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          frameMeshToCamera(mesh);
          disposables.push(geometry, material);
          setLoadedReal(true);
        },
        undefined,
        (err) => {
          if (cancelled) return;
          console.error("Failed to load STL mesh:", err);
          setLoadError("Could not load the generated mesh — showing placeholder.");
          addPlaceholder();
        }
      );
    } else {
      addPlaceholder();
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      if (mesh) {
        mesh.rotation.y += 0.008;
        mesh.rotation.x += 0.002;
      }
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
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [stlUrl]);

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

      {!loadedReal && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <AlertTriangle size={13} />
          <span>{loadError ?? "Placeholder shape — no generated mesh loaded for this view yet."}</span>
        </div>
      )}
    </div>
  );
}
