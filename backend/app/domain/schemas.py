"""Domain entities and Pydantic schemas for MediVision Clean Architecture."""
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field


# --- Ingestion & MPR Models ---
class WindowLevelPreset(BaseModel):
    name: str
    window_width: float
    window_center: float
    description: str


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
    snr_db: Optional[float] = None
    quality_grade: Optional[str] = "Grade A"


class VoxelProbeRequest(BaseModel):
    file_id: str
    z: int
    y: int
    x: int


class VoxelProbeResponse(BaseModel):
    file_id: str
    voxel_coords: List[int]
    intensity_value: float
    hounsfield_unit: Optional[float] = None
    tissue_estimate: str


# --- Preprocessing Models ---
class PreprocessRequest(BaseModel):
    file_id: str
    target_spacing: List[float] = Field(default=[1.0, 1.0, 1.0])
    intensity_norm: str = Field(default="z_score")
    apply_histogram_eq: bool = Field(default=False)


class PreprocessResponse(BaseModel):
    status: str
    original_file_id: str
    preprocessed_file_id: str
    original_shape: List[int]
    new_shape: List[int]
    target_spacing: List[float]
    elapsed_seconds: float


# --- 3D AI Segmentation Models ---
class SegmentRequest(BaseModel):
    file_id: str
    engine: str = Field(default="totalsegmentator", description="Engine: 'totalsegmentator' or 'monai_unet'")
    target_structure: str = Field(default="heart", description="Organ to segment: 'heart', 'liver', 'brain', 'lungs', etc.")


class SegmentationResponse(BaseModel):
    status: str
    mask_id: str
    engine: str
    target_structure: str
    volume_cm3: float
    voxel_count: int
    lavi_risk_index: Optional[str] = None
    elapsed_seconds: float


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
    clinical_focus: str


class Cloud3DCatalogResponse(BaseModel):
    status: str
    total_models: int
    catalog: Dict[str, Any]


# --- Image Registration Models ---
class RegisterRequest(BaseModel):
    fixed_file_id: str
    moving_file_id: str
    transform_type: str = Field(default="Euler3D", description="Euler3D or Affine")
    metric: str = Field(default="MeanSquares", description="MeanSquares or MattesMutualInformation")


class RegisterResponse(BaseModel):
    status: str
    registered_file_id: str
    transform_type: str
    initial_metric: float
    final_metric: float
    elapsed_seconds: float


# --- Multi-Parametric Spectral Models ---
class SpectralExtractRequest(BaseModel):
    file_id: str


class SpectralExtractResponse(BaseModel):
    status: str
    file_id: str
    channels: List[str]
    tissue_viability_index: float
    perfusion_score: float


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


# --- Quality, Safety & Stress Models ---
class ScanValidateRequest(BaseModel):
    file_id: str


class StressTestRequest(BaseModel):
    file_id: str
    noise_levels: List[float] = [0.05, 0.1, 0.2]


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
