// API Client for MediVision FastAPI Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  device: string;
  cuda: boolean;
  disclaimer: string;
}

export interface ImageMetadata {
  file_id: string;
  filename: string;
  shape: number[];
  spacing: number[];
  min_intensity: number;
  max_intensity: number;
  message?: string;
}

export interface PreprocessResult {
  preprocessed_file_id: string;
  original_shape: number[];
  preprocessed_shape: number[];
  target_spacing: number[];
  min_val: number;
  max_val: number;
}

export async function checkHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Backend connection failed");
  return res.json();
}

export async function generateSyntheticSample(): Promise<ImageMetadata> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/sample`);
  if (!res.ok) throw new Error("Failed to generate sample");
  return res.json();
}

export function getSliceImageUrl(fileId: string, axis: "axial" | "coronal" | "sagittal", index: number): string {
  return `${API_BASE_URL}/api/slice?file_id=${encodeURIComponent(fileId)}&axis=${axis}&index=${index}`;
}

export async function preprocessScan(fileId: string): Promise<PreprocessResult> {
  const res = await fetch(`${API_BASE_URL}/api/preprocess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  if (!res.ok) throw new Error("Preprocessing failed");
  return res.json();
}

export async function uploadMedicalScan(file: File): Promise<ImageMetadata> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("File upload failed");
  return res.json();
}
