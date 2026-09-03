"""3D Surface Mesh Reconstruction & STL/OBJ Export Service for MediVision."""
import os
import struct
from pathlib import Path
from typing import Dict, Tuple, Optional, Any

import numpy as np
from skimage.measure import marching_cubes

from backend.app.services.data_service import load_medical_image


def generate_surface_mesh(
    binary_mask: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    step_size: int = 1,
    level: float = 0.5,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Convert a 3D binary segmentation mask into a polygonal surface mesh using Marching Cubes.
    """
    mask_bin = (binary_mask > 0).astype(np.uint8)
    if np.sum(mask_bin) == 0:
        raise ValueError("Cannot reconstruct 3D surface from an empty mask (zero voxels).")

    verts, faces, normals, _ = marching_cubes(
        mask_bin,
        level=level,
        spacing=spacing,
        step_size=step_size,
    )

    # Compute surface area in cm2
    v0 = verts[faces[:, 0]]
    v1 = verts[faces[:, 1]]
    v2 = verts[faces[:, 2]]
    cross_prod = np.cross(v1 - v0, v2 - v0)
    area_mm2 = 0.5 * np.sum(np.linalg.norm(cross_prod, axis=1))
    area_cm2 = round(float(area_mm2 * 0.01), 3)

    metadata = {
        "num_vertices": int(len(verts)),
        "num_faces": int(len(faces)),
        "surface_area_cm2": float(area_cm2),
        "spacing": [float(s) for s in spacing],
    }

    return verts.astype(np.float32), faces.astype(np.int32), normals.astype(np.float32), metadata


def write_binary_stl(verts: np.ndarray, faces: np.ndarray, output_path: str | Path) -> str:
    """Write surface mesh to standard binary STL file format."""
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    header = "MediVision 3D Medical Surface Mesh (Binary STL)".encode("ascii").ljust(80, b" ")

    num_triangles = len(faces)

    with open(out_file, "wb") as f:
        f.write(header)
        f.write(struct.pack("<I", num_triangles))

        for face in faces:
            p0, p1, p2 = verts[face[0]], verts[face[1]], verts[face[2]]
            normal = np.cross(p1 - p0, p2 - p0)
            norm_len = np.linalg.norm(normal)
            if norm_len > 1e-6:
                normal /= norm_len
            else:
                normal = np.array([0.0, 0.0, 0.0], dtype=np.float32)

            f.write(struct.pack("<3f", *normal))
            f.write(struct.pack("<3f", *p0))
            f.write(struct.pack("<3f", *p1))
            f.write(struct.pack("<3f", *p2))
            f.write(struct.pack("<H", 0))

    return str(out_file.resolve())


def write_wavefront_obj(verts: np.ndarray, faces: np.ndarray, normals: np.ndarray, output_path: str | Path) -> str:
    """Write surface mesh to Wavefront OBJ format for WebGL Three.js rendering."""
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    with open(out_file, "w", encoding="utf-8") as f:
        f.write("# MediVision Wavefront OBJ Export\n")
        center = np.mean(verts, axis=0)
        centered_verts = verts - center

        for v in centered_verts:
            f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        for vn in normals:
            f.write(f"vn {vn[0]:.4f} {vn[1]:.4f} {vn[2]:.4f}\n")
        for face in faces:
            f.write(f"f {face[0]+1}//{face[0]+1} {face[1]+1}//{face[1]+1} {face[2]+1}//{face[2]+1}\n")

    return str(out_file.resolve())


def reconstruct_mask_file(
    mask_file: str | Path,
    output_dir: str | Path = "./outputs",
    file_prefix: str = "reconstructed",
) -> Dict[str, Any]:
    """Load a binary NIfTI mask, run Marching Cubes, and write STL and OBJ files."""
    mask_data, _, meta = load_medical_image(mask_file)
    spacing = tuple(meta.get("spacing", (1.0, 1.0, 1.0)))

    verts, faces, normals, mesh_meta = generate_surface_mesh(mask_data, spacing=spacing)

    out_d = Path(output_dir)
    out_d.mkdir(parents=True, exist_ok=True)
    stl_path = out_d / f"{file_prefix}.stl"
    obj_path = out_d / f"{file_prefix}.obj"

    write_binary_stl(verts, faces, stl_path)
    write_wavefront_obj(verts, faces, normals, obj_path)

    mesh_meta["stl_file"] = str(stl_path.name)
    mesh_meta["obj_file"] = str(obj_path.name)
    mesh_meta["stl_path"] = str(stl_path.resolve())
    mesh_meta["obj_path"] = str(obj_path.resolve())
    return mesh_meta


if __name__ == "__main__":
    print("Testing 3D Marching Cubes Reconstruction Service...")
    test_mask = np.zeros((48, 48, 48), dtype=np.uint8)
    z, y, x = np.ogrid[:48, :48, :48]
    test_mask[((z-24)**2)/1.0 + ((y-24)**2)/1.2 + ((x-24)**2)/0.8 <= 12**2] = 1

    verts, faces, normals, meta = generate_surface_mesh(test_mask, spacing=(1.0, 1.0, 1.0))
    print(f"Mesh generated: {meta['num_vertices']} vertices, {meta['num_faces']} faces, Area = {meta['surface_area_cm2']} cm2")

    stl_p = write_binary_stl(verts, faces, "./outputs/test_heart.stl")
    obj_p = write_wavefront_obj(verts, faces, normals, "./outputs/test_heart.obj")
    print(f"Files exported: STL={stl_p}, OBJ={obj_p}")
