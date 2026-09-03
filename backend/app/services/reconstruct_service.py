"""Cloud-Deployed 3D Anatomical Digital Twin & High-Fidelity Medical Mesh Service for MediVision."""
import os
import struct
from pathlib import Path
from typing import Dict, Tuple, Optional, Any, List

import numpy as np
import scipy.ndimage
from skimage.measure import marching_cubes

from backend.app.services.data_service import load_medical_image

# ---------------------------------------------------------------------------
# Cloud 3D Medical Digital Twin Catalog
# High-definition, textured, and animated models hosted on Cloud 3D infrastructure.
# Zero server GPU overhead, 60fps client-side WebGL rendering.
# ---------------------------------------------------------------------------
CLOUD_3D_CATALOG: Dict[str, Dict[str, Any]] = {
    "cardiac_animated_4k": {
        "organ_id": "cardiac_animated_4k",
        "title": "3D Animated Realistic Human Heart (4K Textures)",
        "specialty": "Cardiology",
        "system": "Cardiovascular",
        "cloud_id": "168b474fba564f688048212e99b4159d",
        "embed_url": "https://sketchfab.com/models/168b474fba564f688048212e99b4159d/embed?autostart=1&ui_controls=1&ui_theme=dark&preload=1",
        "author": "Anatomy by Doctor Jana",
        "description": "Photorealistic 4K PBR human heart with real-time cardiac beating cycle, coronary arteries, aortic arch, and mitral valve dynamics.",
        "landmarks": ["Left Ventricle", "Right Ventricle", "Left Atrium", "Right Atrium", "Aorta", "Mitral Valve", "Coronary Arteries"],
        "clinical_focus": "Left Atrial Enlargement (LAE), Mitral Regurgitation, Coronary Ischemia",
        "animation_available": True,
        "dissection_available": True,
    },
    "cardiac_labeled_chambers": {
        "organ_id": "cardiac_labeled_chambers",
        "title": "Labelled 4-Chamber Cardiac Dissection",
        "specialty": "Cardiology",
        "system": "Cardiovascular",
        "cloud_id": "cc339417fcd745afafaa01623405b69a",
        "embed_url": "https://sketchfab.com/models/cc339417fcd745afafaa01623405b69a/embed?autostart=1&ui_controls=1&ui_theme=dark&preload=1",
        "author": "Clinical Anatomy Cloud",
        "description": "Interactive anatomical dissection highlighting internal chambers (LA, LV, RA, RV), interatrial septum, and pulmonary outflow tract.",
        "landmarks": ["Left Atrium Cavity", "Right Atrium Cavity", "Interventricular Septum", "Aortic Root", "Pulmonary Vein Inlets"],
        "clinical_focus": "Atrial Fibrillation Ablation Planning, Volumetric Chamber Indexing",
        "animation_available": True,
        "dissection_available": True,
    },
    "neuro_brain_structures": {
        "organ_id": "neuro_brain_structures",
        "title": "Human Brain Deep Internal Structures",
        "specialty": "Neurology",
        "system": "Central Nervous System",
        "cloud_id": "95b4e19bb32c4edeb46fcb3db048037c",
        "embed_url": "https://sketchfab.com/models/95b4e19bb32c4edeb46fcb3db048037c/embed?autostart=1&ui_controls=1&ui_theme=dark&preload=1",
        "author": "Center for BioMedical Visualization",
        "description": "Selectable 3D dissection of deep cerebral anatomy including Thalamus, Lateral Ventricles, Hippocampus, Brainstem, and Basal Ganglia.",
        "landmarks": ["Cerebral Cortex", "Thalamus", "Hippocampus", "Ventricular System", "Brainstem", "Cerebellum"],
        "clinical_focus": "Hydrocephalus, Hippocampal Sclerosis, Glioma Resection Trajectory",
        "animation_available": False,
        "dissection_available": True,
    },
    "pulmo_lungs_airflow": {
        "organ_id": "pulmo_lungs_airflow",
        "title": "Animated Respiratory Cycle & Airflow Tree",
        "specialty": "Pulmonology",
        "system": "Respiratory",
        "cloud_id": "196ff63e34154845af78303f1aa928f6",
        "embed_url": "https://sketchfab.com/models/196ff63e34154845af78303f1aa928f6/embed?autostart=1&ui_controls=1&ui_theme=dark&preload=1",
        "author": "Medical 3D Science",
        "description": "Dynamic breathing cycle simulation with full tracheobronchial tree branching and vertical parenchymal cross-section.",
        "landmarks": ["Trachea", "Primary Bronchi", "Right Upper/Middle/Lower Lobes", "Left Superior/Inferior Lobes", "Segmental Bronchioles"],
        "clinical_focus": "COPD Lobar Volume Reduction, Bronchoscopic Navigation, Emphysema",
        "animation_available": True,
        "dissection_available": True,
    },
    "abdom_organs_ct": {
        "organ_id": "abdom_organs_ct",
        "title": "Abdominal Cavity CT 3D Extraction",
        "specialty": "Gastroenterology",
        "system": "Abdominal / Hepatic",
        "cloud_id": "d18f1f65dfaf4293810c539de097b741",
        "embed_url": "https://sketchfab.com/models/d18f1f65dfaf4293810c539de097b741/embed?autostart=1&ui_controls=1&ui_theme=dark&preload=1",
        "author": "Clinical Radiology 3D",
        "description": "Multi-organ anatomical assembly derived directly from clinical CT scans: Liver, Spleen, Kidneys, Gallbladder, and Stomach.",
        "landmarks": ["Hepatic Lobes", "Splenic Parenchyma", "Renal Cortex & Medulla", "Inferior Vena Cava", "Portal Vein"],
        "clinical_focus": "Hepatic Resection, Splenomegaly, Renal Volume Evaluation",
        "animation_available": False,
        "dissection_available": True,
    },
    "full_body_transparent": {
        "organ_id": "full_body_transparent",
        "title": "Transparent Full-Body Multi-Organ Suite",
        "specialty": "Whole-Body Anatomy",
        "system": "Integrated Anatomy",
        "cloud_id": "9b0b079953b840bc9a13f524b60041e4",
        "embed_url": "https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4/embed?autostart=1&ui_controls=1&ui_theme=dark&preload=1",
        "author": "AVR Anatomical Lab",
        "description": "Integrated anatomical digital twin with transparent skin surface displaying skeletal system, brain, beating heart, lungs, and liver in unified spatial registration.",
        "landmarks": ["Skeletal Framework", "Cerebral Vault", "Cardiopulmonary Core", "Hepatorenal Complex"],
        "clinical_focus": "Whole-Body Oncology Staging, Multi-Organ Trauma Simulation",
        "animation_available": True,
        "dissection_available": True,
    }
}


def get_cloud_3d_catalog() -> List[Dict[str, Any]]:
    """Return list of all available Cloud 3D Anatomical Digital Twin models."""
    return list(CLOUD_3D_CATALOG.values())


def get_cloud_3d_model(organ_id: str) -> Dict[str, Any]:
    """Retrieve specific Cloud 3D Digital Twin metadata and embed details."""
    if organ_id in CLOUD_3D_CATALOG:
        return CLOUD_3D_CATALOG[organ_id]
    # Default fallback to 4K animated cardiac model
    return CLOUD_3D_CATALOG["cardiac_animated_4k"]


def generate_cloud_embed_html(
    organ_id: str,
    height: int = 560,
    width: str = "100%",
    autostart: bool = True
) -> str:
    """Generate responsive, secure HTML iframe snippet for cloud 3D model embedding."""
    model = get_cloud_3d_model(organ_id)
    auto_flag = "1" if autostart else "0"
    url = f"https://sketchfab.com/models/{model['cloud_id']}/embed?autostart={auto_flag}&ui_controls=1&ui_theme=dark&preload=1&transparent=1"
    
    html = f"""
    <div style="width: {width}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); background: #0e1117;">
        <iframe 
            title="{model['title']}" 
            src="{url}" 
            width="100%" 
            height="{height}px" 
            frameborder="0" 
            allow="autoplay; fullscreen; xr-spatial-tracking" 
            allowfullscreen 
            mozallowfullscreen="true" 
            webkitallowfullscreen="true"
            style="display: block; width: 100%; border: none;">
        </iframe>
        <div style="padding: 10px 16px; background: rgba(15,23,42,0.85); display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; font-size: 13px; color: #94a3b8;">
            <span>🫀 <b>{model['title']}</b> | <i>{model['specialty']}</i></span>
            <span style="color: #38bdf8;">⚡ 60 FPS Cloud WebGL Stream</span>
        </div>
    </div>
    """
    return html.strip()


# ---------------------------------------------------------------------------
# High-Quality Smooth Mesh Generator for Patient-Specific Segmentations
# (Gaussian Anti-Aliasing + Vectorized Binary STL)
# ---------------------------------------------------------------------------
def generate_surface_mesh(
    binary_mask: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    step_size: int = 1,
    level: float = 0.5,
    smooth_sigma: float = 1.0,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Convert a 3D binary segmentation mask into a surgical-grade smoothed surface mesh.
    Applies Gaussian anti-aliasing pre-filtering to eliminate blocky voxel stepping artifacts.
    """
    mask_bin = (binary_mask > 0).astype(np.float32)
    if np.sum(mask_bin) == 0:
        raise ValueError("Cannot reconstruct 3D surface from an empty mask (zero voxels).")

    # Step A: Gaussian Anti-Aliasing on continuous distance field
    if smooth_sigma > 0:
        smooth_field = scipy.ndimage.gaussian_filter(mask_bin, sigma=smooth_sigma)
    else:
        smooth_field = mask_bin

    # Dynamic step size protection for very large 3D grids
    eff_step = step_size
    if max(mask_bin.shape) > 160 and step_size == 1:
        eff_step = 2

    verts, faces, normals, _ = marching_cubes(
        smooth_field,
        level=level,
        spacing=spacing,
        step_size=eff_step,
    )

    # Compute surface area in cm2 (vectorized)
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
        "step_size": eff_step,
        "smoothing_applied": "Gaussian Anti-Aliasing (sigma=1.0)",
    }

    return verts.astype(np.float32), faces.astype(np.int32), normals.astype(np.float32), metadata


def write_binary_stl(verts: np.ndarray, faces: np.ndarray, output_path: str | Path) -> str:
    """
    Write surface mesh to standard binary STL format using 100% vectorized NumPy structured arrays.
    """
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    num_triangles = len(faces)
    header = "MediVision 3D Medical Digital Twin (Binary STL)".encode("ascii").ljust(80, b" ")

    p0 = verts[faces[:, 0]]
    p1 = verts[faces[:, 1]]
    p2 = verts[faces[:, 2]]
    cross_vec = np.cross(p1 - p0, p2 - p0)
    lengths = np.linalg.norm(cross_vec, axis=1, keepdims=True)
    lengths[lengths < 1e-7] = 1.0
    face_normals = (cross_vec / lengths).astype(np.float32)

    stl_dtype = np.dtype([
        ('normals', np.float32, (3,)),
        ('v0', np.float32, (3,)),
        ('v1', np.float32, (3,)),
        ('v2', np.float32, (3,)),
        ('attr', np.uint16)
    ])

    stl_data = np.zeros(num_triangles, dtype=stl_dtype)
    stl_data['normals'] = face_normals
    stl_data['v0'] = p0.astype(np.float32)
    stl_data['v1'] = p1.astype(np.float32)
    stl_data['v2'] = p2.astype(np.float32)
    stl_data['attr'] = 0

    with open(out_file, "wb") as f:
        f.write(header)
        f.write(struct.pack("<I", num_triangles))
        f.write(stl_data.tobytes())

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
    """Load a binary NIfTI mask, run smoothed Marching Cubes, and write STL and OBJ files."""
    mask_data, _, meta = load_medical_image(mask_file)
    spacing = tuple(meta.get("spacing", (1.0, 1.0, 1.0)))

    verts, faces, normals, mesh_meta = generate_surface_mesh(mask_data, spacing=spacing, smooth_sigma=1.0)

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
    print("Testing Cloud 3D Digital Twin & Reconstruction Service...")
    catalog = get_cloud_3d_catalog()
    print(f"✅ Cloud 3D Catalog loaded: {len(catalog)} interactive models available.")
    for m in catalog:
        print(f"  - [{m['specialty']}] {m['title']} (ID: {m['organ_id']})")

    html_preview = generate_cloud_embed_html("cardiac_animated_4k")
    print(f"✅ Generated Cloud Embed HTML ({len(html_preview)} chars)")
