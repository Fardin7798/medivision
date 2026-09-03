"""3D Mesh Reconstruction and Cloud 3D Digital Twin API endpoints."""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse, HTMLResponse
from backend.app.services.reconstruct_service import (
    reconstruct_mask_file,
    get_cloud_3d_catalog,
    get_cloud_3d_model,
    generate_cloud_embed_html,
)
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["3D Digital Twin & Reconstruction"])

OUTPUT_DIR = Path("./outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/3d/catalog")
def get_catalog():
    """Retrieve full catalog of Cloud-Deployed 3D Anatomical Digital Twin models."""
    catalog = get_cloud_3d_catalog()
    return {
        "status": "success",
        "total_models": len(catalog),
        "catalog": catalog,
    }


@router.get("/3d/model/{organ_id}")
def get_model_details(organ_id: str):
    """Retrieve metadata and embed snippet for a specific Cloud 3D model."""
    model = get_cloud_3d_model(organ_id)
    html_embed = generate_cloud_embed_html(organ_id)
    return {
        "status": "success",
        "model": model,
        "html_embed": html_embed,
    }


@router.get("/3d/embed/{organ_id}", response_class=HTMLResponse)
def get_embed_iframe(organ_id: str):
    """Render direct HTML iframe for client embedding."""
    return generate_cloud_embed_html(organ_id)


@router.post("/reconstruct")
def reconstruct_surface(payload: dict = Body(...)):
    """Convert binary segmentation mask into surgical-grade smoothed 3D surface mesh."""
    mask_id = payload.get("mask_id")
    if not mask_id or mask_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid mask_id required.")

    mask_path = FILE_REGISTRY[mask_id]["path"]
    mesh_prefix = f"mesh_{mask_id}"

    try:
        mesh_meta = reconstruct_mask_file(mask_path, output_dir=OUTPUT_DIR, file_prefix=mesh_prefix)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"3D Reconstruction failure: {exc}")

    return {
        "status": "success",
        "mesh_id": str(mesh_prefix),
        "mask_id": str(mask_id),
        "num_vertices": int(mesh_meta["num_vertices"]),
        "num_faces": int(mesh_meta["num_faces"]),
        "surface_area_cm2": float(mesh_meta["surface_area_cm2"]),
        "stl_filename": str(mesh_meta["stl_file"]),
        "obj_filename": str(mesh_meta["obj_file"]),
        "stl_download_url": f"/api/mesh/{mesh_meta['stl_file']}",
        "obj_download_url": f"/api/mesh/{mesh_meta['obj_file']}",
    }


@router.get("/mesh/{filename}")
def download_mesh_file(filename: str):
    """Download reconstructed 3D mesh (STL or OBJ format)."""
    file_path = OUTPUT_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Mesh file not found.")

    media_type = "model/stl" if filename.endswith(".stl") else "model/obj"
    return FileResponse(path=str(file_path), filename=filename, media_type=media_type)
