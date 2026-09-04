import { Point3D, MarginStatus, SurgicalTelemetry } from '../../types';

export function calculateDistanceMm(p1: Point3D, p2: Point3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2));
}

export function evaluateMarginStatus(
  currentDistanceMm: number,
  safetyMarginThresholdMm: number
): MarginStatus {
  if (currentDistanceMm <= safetyMarginThresholdMm) {
    return 'CRITICAL';
  } else if (currentDistanceMm <= safetyMarginThresholdMm * 2.5) {
    return 'APPROACHING';
  }
  return 'SAFE';
}

export function computeTelemetry(
  pointerPosition: Point3D,
  targetPosition: Point3D,
  entryPosition: Point3D,
  safetyMarginThresholdMm: number
): SurgicalTelemetry {
  const distanceMm = calculateDistanceMm(pointerPosition, targetPosition);
  const marginStatus = evaluateMarginStatus(distanceMm, safetyMarginThresholdMm);

  const dx = targetPosition.x - entryPosition.x;
  const dy = targetPosition.y - entryPosition.y;
  const dz = targetPosition.z - entryPosition.z;
  const totalDepthMm = parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2));

  const azimuthDeg = parseFloat((Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(1));
  const planarDist = Math.sqrt(dx * dx + dy * dy);
  const elevationDeg = parseFloat((Math.atan2(dz, planarDist) * (180 / Math.PI)).toFixed(1));

  const unitVector = {
    x: totalDepthMm === 0 ? 0 : parseFloat((dx / totalDepthMm).toFixed(4)),
    y: totalDepthMm === 0 ? 0 : parseFloat((dy / totalDepthMm).toFixed(4)),
    z: totalDepthMm === 0 ? 1 : parseFloat((dz / totalDepthMm).toFixed(4))
  };

  return {
    distanceMm,
    marginStatus,
    safetyMarginThresholdMm,
    trajectory: {
      totalDepthMm,
      azimuthDeg,
      elevationDeg,
      unitVector,
      entryPoint: entryPosition
    },
    pointerPosition,
    targetPosition
  };
}

export const calculateNavigationTelemetry = computeTelemetry;
