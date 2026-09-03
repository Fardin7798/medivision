import { PatientCase, Point3D } from '../../types';
import { PRESET_CASES } from '../../data/presetCases';

const STORAGE_KEY_ACTIVE_CASE = 'medivision_active_case_id';
const STORAGE_KEY_CUSTOM_LANDMARKS = 'medivision_custom_landmarks';

export const CaseStorage = {
  // Get active case ID or fallback to default glioma case
  getActiveCaseId(): string {
    if (typeof window === 'undefined') return PRESET_CASES[0].id;
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CASE) || PRESET_CASES[0].id;
  },

  // Save active case ID
  setActiveCaseId(caseId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ACTIVE_CASE, caseId);
  },

  // Save custom fiducial landmark positions
  saveCustomLandmarks(caseId: string, landmarks: { name: string; position: Point3D }[]): void {
    if (typeof window === 'undefined') return;
    const existing = this.getCustomLandmarks();
    existing[caseId] = landmarks;
    localStorage.setItem(STORAGE_KEY_CUSTOM_LANDMARKS, JSON.stringify(existing));
  },

  // Retrieve custom fiducial landmark positions
  getCustomLandmarks(): Record<string, { name: string; position: Point3D }[]> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOM_LANDMARKS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // Clear all local cache
  clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CASE);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_LANDMARKS);
  }
};
