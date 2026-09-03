"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLandmarkRegistration = computeLandmarkRegistration;
function computeLandmarkRegistration(fixedLandmarks, movingLandmarks) {
    const n = fixedLandmarks.length;
    if (n < 3 || movingLandmarks.length < 3) {
        return {
            pairedLandmarks: n,
            targetRegistrationErrorMm: 0,
            translationVectorMm: [0, 0, 0],
            isClinicallyAcceptable: false,
            status: 'idle'
        };
    }
    // 1. Calculate Centroids
    let cf = [0, 0, 0];
    let cm = [0, 0, 0];
    for (let i = 0; i < n; i++) {
        cf[0] += fixedLandmarks[i][0];
        cf[1] += fixedLandmarks[i][1];
        cf[2] += fixedLandmarks[i][2];
        cm[0] += movingLandmarks[i][0];
        cm[1] += movingLandmarks[i][1];
        cm[2] += movingLandmarks[i][2];
    }
    cf = [cf[0] / n, cf[1] / n, cf[2] / n];
    cm = [cm[0] / n, cm[1] / n, cm[2] / n];
    // 2. Translation Vector
    const translation = [
        parseFloat((cf[0] - cm[0]).toFixed(3)),
        parseFloat((cf[1] - cm[1]).toFixed(3)),
        parseFloat((cf[2] - cm[2]).toFixed(3))
    ];
    // 3. Compute Target Registration Error (TRE / RMS)
    let sumSqErr = 0;
    for (let i = 0; i < n; i++) {
        const tx = movingLandmarks[i][0] + translation[0];
        const ty = movingLandmarks[i][1] + translation[1];
        const tz = movingLandmarks[i][2] + translation[2];
        const dx = fixedLandmarks[i][0] - tx;
        const dy = fixedLandmarks[i][1] - ty;
        const dz = fixedLandmarks[i][2] - tz;
        sumSqErr += (dx * dx + dy * dy + dz * dz);
    }
    const tre = Math.sqrt(sumSqErr / n);
    return {
        pairedLandmarks: n,
        targetRegistrationErrorMm: parseFloat(tre.toFixed(3)),
        translationVectorMm: translation,
        isClinicallyAcceptable: tre <= 2.0,
        status: 'registered'
    };
}
