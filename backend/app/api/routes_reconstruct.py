"""3D Mesh Reconstruction and Export API endpoints."""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
from backend.app.services.reconstruct_service import reconstruct_mask_file
from backend.app.api.routes_data import FILE_REGISTRY

router = APIRouter(prefix="/api", tags=["3D Reconstruction"])

OUTPUT_DIR = Path("./outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/reconstruct")
def reconstruct_surface(payload: dict = Body(...)):
    """Convert binary segmentation mask into 3D polygonal surface mesh (Marching Cubes)."""
    mask_id = payload.get("mask_id")
    if not mask_id or mask_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="Valid mask_id required.")

    mask_path = FILE_REGISTRY[mask_id]["path"]
    mesh_prefix = f"mesh_{mask_id}"

    mesh_meta = reconstruct_mask_file(mask_path, output_dir=OUTPUT_DIR, file_prefix=mesh_prefix)

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
