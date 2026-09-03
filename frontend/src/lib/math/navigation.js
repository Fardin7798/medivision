"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceMm = calculateDistanceMm;
exports.evaluateMarginStatus = evaluateMarginStatus;
exports.computeTelemetry = computeTelemetry;
function calculateDistanceMm(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2));
}
function evaluateMarginStatus(distanceMm, thresholdMm) {
    if (distanceMm <= thresholdMm) {
        return 'CRITICAL';
    }
    else if (distanceMm <= thresholdMm * 2.5) {
        return 'APPROACHING';
    }
    return 'SAFE';
}
function computeTelemetry(probeTip, targetPoint, entryPoint, thresholdMm) {
    const distanceMm = calculateDistanceMm(probeTip, targetPoint);
    const marginStatus = evaluateMarginStatus(distanceMm, thresholdMm);
    // Trajectory calculations
    const totalDepthMm = calculateDistanceMm(entryPoint, targetPoint);
    const dx = targetPoint.x - entryPoint.x;
    const dy = targetPoint.y - entryPoint.y;
    const dz = targetPoint.z - entryPoint.z;
    const angleAlphaDeg = parseFloat((Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(1));
    const horizontalDist = Math.sqrt(dx * dx + dy * dy);
    const angleBetaDeg = parseFloat((Math.atan2(dz, horizontalDist) * (180 / Math.PI)).toFixed(1));
    return {
        probeTip,
        targetPoint,
        distanceMm,
        marginStatus,
        safetyMarginThresholdMm: thresholdMm,
        trajectory: {
            entryPoint,
            totalDepthMm,
            angleAlphaDeg,
            angleBetaDeg
        }
    };
}
