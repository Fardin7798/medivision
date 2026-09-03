"""Domain entities and Pydantic schemas for MediVision Clean Architecture."""
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field


# --- Ingestion & MPR Models ---
class ScanMetadataSchema(BaseModel):
    file_name: str
    shape: List[int]
    spacing: List[float]
    affine: List[List[float]]
    min_intensity: float
    max_intensity: float
    mean_intensity: float
    std_intensity: float
    data_type: str


class VoxelProbeRequest(BaseModel):
    file_id: str
    z: int
    y: int
    x: int


# --- Preprocessing Models ---
class PreprocessRequest(BaseModel):
    file_id: str
    target_spacing: List[float] = Field(default=[1.0, 1.0, 1.0])
    intensity_norm: str = Field(default="z_score")


# --- 3D AI Segmentation Models ---
class SegmentRequest(BaseModel):
    file_id: str
    engine: str = Field(default="totalsegmentator", description="Engine: 'totalsegmentator' or 'monai_unet'")
    target_structure: str = Field(default="heart", description="Organ to segment: 'heart', 'liver', etc.")


class SegmentationResponse(BaseModel):
    status: str
    mask_id: str
    engine: str
    target_structure: str
    volume_cm3: float
    voxel_count: int


# --- Cloud 3D Digital Twin Models ---
class Cloud3DModelMetadata(BaseModel):
    id: str
    name: str
    category: str
    description: str
    source_url: str
    embed_url: str
    provider: str
    features: List[str]
    clinical_landmarks: List[str]


class Cloud3DCatalogResponse(BaseModel):
    status: str
    total_models: int
    catalog: Dict[str, Cloud3DModelMetadata]


# --- Image Registration Models ---
class RegisterRequest(BaseModel):
    fixed_file_id: str
    moving_file_id: str
    transform_type: str = Field(default="Euler3D", description="Euler3D or Affine")


class RegisterResponse(BaseModel):
    status: str
    registered_file_id: str
    transform_type: str
    initial_metric: float
    final_metric: float
    elapsed_seconds: float


# --- Quantitative Metrics Models ---
class EvaluateRequest(BaseModel):
    pred_mask_id: str
    gt_mask_id: Optional[str] = None


class ClinicalMetricsSchema(BaseModel):
    dice_coefficient: float
    iou_jaccard: float
    precision: float
    recall_sensitivity: float
    specificity: float
    volumetric_similarity: float
    hausdorff_distance_95_mm: float
    hd95_mm: float
    average_surface_distance_mm: float
    asd_mm: float
    pred_volume_cm3: float
    gt_volume_cm3: float
    volume_difference_cm3: float


# --- Diagnostic Report Models ---
class ReportGenerateRequest(BaseModel):
    scan_meta: Dict[str, Any]
    seg_meta: Dict[str, Any]
    eval_metrics: Optional[Dict[str, Any]] = None
    patient_id: str = "PATIENT_ANON_01"
    clinical_indication: str = "3D Diagnostic Volumetric Evaluation"


class DiagnosticReportSchema(BaseModel):
    report_id: str
    timestamp: str
    patient_id: str
    clinical_indication: str
    summary: str
    detailed_findings: List[str]
    quantitative_summary: Dict[str, Any]
    recommendations: List[str]
    disclaimer: str


# --- Cloud Sync Models ---
class SupabaseSyncPayload(BaseModel):
    patient_id: str
    scan_id: str
    volume_cm3: float
    voxel_count: int
    dice_coefficient: float
    shape: List[int]
    spacing: List[float]
    filename: Optional[str] = "unnamed_scan.nii.gz"
    patient_name: Optional[str] = "Anonymous Research Subject"
    iou_jaccard: Optional[float] = None
    hd95_mm: Optional[float] = None
    asd_mm: Optional[float] = None
    snr_db: Optional[float] = None
