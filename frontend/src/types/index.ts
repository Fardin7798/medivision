export type Plane = 'axial' | 'coronal' | 'sagittal';
export type ActiveMode = 'navigation' | 'mpr' | 'ai' | 'layers';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Vector3D = Point3D;

export interface AnatomicalStructure {
  id: string;
  name: string;
  color: string;
  opacity: number;
  visible: boolean;
  type?: 'organ' | 'target' | 'critical' | 'vessel';
}

export interface FiducialLandmark {
  name: string;
  fixed: [number, number, number];
  moving: [number, number, number];
}

export interface PatientCase {
  id: string;
  name: string;
  modality: string;
  category: string;
  patientAge: number;
  gender: string;
  description: string;
  volumeUrl: string;
  targetPosition: Point3D;
  entryPosition: Point3D;
  secondaryTargetPosition?: Point3D;
  secondaryEntryPosition?: Point3D;
  safetyMarginMm: number;
  anatomicalStructures: AnatomicalStructure[];
  fiducials: FiducialLandmark[];
}

export type ClinicalCase = PatientCase;
export type MarginStatus = 'SAFE' | 'APPROACHING' | 'CRITICAL' | 'BREACHED';

export interface SurgicalTelemetry {
  distanceMm: number;
  marginStatus: MarginStatus;
  safetyMarginThresholdMm: number;
  trajectory: {
    totalDepthMm: number;
    azimuthDeg: number;
    elevationDeg: number;
    unitVector: Point3D;
    entryPoint?: Point3D;
  };
  pointerPosition: Point3D;
  targetPosition: Point3D;
  secondaryDistanceMm?: number;
  secondaryMarginStatus?: MarginStatus;
}

export type NavigationTelemetry = SurgicalTelemetry;

export interface RegistrationResult {
  pairedLandmarks: number;
  targetRegistrationErrorMm: number;
  translationVectorMm: number[];
  rotationMatrix3x3?: number[][];
  solverMethod?: 'kabsch-svd' | 'horns-quaternion';
  isClinicallyAcceptable: boolean;
}
