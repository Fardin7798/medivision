"""Supabase Cloud Database & Storage Client Service for MediVision."""
import os
from typing import Dict, List, Optional, Any
from supabase import create_client, Client

# No hardcoded fallback secrets: credentials must come from the environment
# (see .env.example). Without them, the client stays offline and every
# service function below degrades gracefully to {"status": "offline_skipped"}.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

_client: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    """Get or initialize singleton Supabase client."""
    global _client
    if _client is None and SUPABASE_URL and SUPABASE_KEY:
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"[MediVision Supabase] Connection error: {e}")
            return None
    return _client

def is_connected() -> bool:
    """Return True only if a real Supabase client was actually initialized."""
    return get_supabase() is not None

def record_patient(patient_id: str, patient_name: str = "Anonymous Subject", modality: str = "Cardiac 3D MRI") -> Dict[str, Any]:
    """Insert or update patient record in Supabase."""
    sb = get_supabase()
    if not sb:
        return {"status": "offline_skipped"}
    data = {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "modality": modality,
    }
    res = sb.table("medivision_patients").upsert(data, on_conflict="patient_id").execute()
    return {"status": "synced", "data": res.data}

def record_scan(patient_id: str, scan_id: str, filename: str, dimensions: list, spacing_mm: list, snr_db: float) -> Dict[str, Any]:
    """Insert scan metadata into Supabase."""
    sb = get_supabase()
    if not sb:
        return {"status": "offline_skipped"}
    data = {
        "patient_id": patient_id,
        "scan_id": scan_id,
        "filename": filename,
        "dimensions": dimensions,
        "spacing_mm": spacing_mm,
        "snr_db": snr_db,
    }
    res = sb.table("medivision_scans").upsert(data, on_conflict="scan_id").execute()
    return {"status": "synced", "data": res.data}

def record_segmentation(scan_id: str, mask_id: str, volume_cm3: float, voxel_count: int) -> Dict[str, Any]:
    """Insert segmentation mask results into Supabase."""
    sb = get_supabase()
    if not sb:
        return {"status": "offline_skipped"}
    data = {
        "scan_id": scan_id,
        "mask_id": mask_id,
        "volume_cm3": volume_cm3,
        "voxel_count": voxel_count,
    }
    res = sb.table("medivision_segmentations").upsert(data, on_conflict="mask_id").execute()
    return {"status": "synced", "data": res.data}

def record_evaluation(mask_id: str, dice: float, iou: float, hd95: float, asd: float) -> Dict[str, Any]:
    """Insert evaluation metrics into Supabase."""
    sb = get_supabase()
    if not sb:
        return {"status": "offline_skipped"}
    data = {
        "mask_id": mask_id,
        "dice_coefficient": dice,
        "iou_jaccard": iou,
        "hd95_mm": hd95,
        "asd_mm": asd,
    }
    res = sb.table("medivision_evaluations").insert(data).execute()
    return {"status": "synced", "data": res.data}

def get_clinical_history() -> List[Dict[str, Any]]:
    """Retrieve recent patient scan and segmentation history from Supabase."""
    sb = get_supabase()
    if not sb:
        return []
    res = sb.table("medivision_patients").select("*, medivision_scans(*, medivision_segmentations(*))").order("created_at", desc=True).limit(10).execute()
    return res.data or []
