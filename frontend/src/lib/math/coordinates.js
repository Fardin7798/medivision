"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoordinatePipeline = void 0;
exports.CoordinatePipeline = {
    // Convert Physical RAS Millimeters to Voxel Grid Indices
    physicalToVoxel(physical, volumeDim) {
        return {
            i: Math.round((physical.x / volumeDim.spacingX) + (volumeDim.dimX / 2)),
            j: Math.round((physical.y / volumeDim.spacingY) + (volumeDim.dimY / 2)),
            k: Math.round((physical.z / volumeDim.spacingZ) + (volumeDim.dimZ / 2))
        };
    },
    // Convert Voxel Grid Indices to Physical RAS Millimeters
    voxelToPhysical(voxel, volumeDim) {
        return {
            x: parseFloat(((voxel.i - volumeDim.dimX / 2) * volumeDim.spacingX).toFixed(2)),
            y: parseFloat(((voxel.j - volumeDim.dimY / 2) * volumeDim.spacingY).toFixed(2)),
            z: parseFloat(((voxel.k - volumeDim.dimZ / 2) * volumeDim.spacingZ).toFixed(2))
        };
    },
    // Compute 3D Insertion Trajectory Unit Vector and Angles
    computeTrajectoryVector(entry, target) {
        const dx = target.x - entry.x;
        const dy = target.y - entry.y;
        const dz = target.z - entry.z;
        const depthMm = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (depthMm === 0) {
            return { unitVector: { x: 0, y: 0, z: 1 }, depthMm: 0, azimuthDeg: 0, elevationDeg: 0 };
        }
        const unitVector = {
            x: parseFloat((dx / depthMm).toFixed(4)),
            y: parseFloat((dy / depthMm).toFixed(4)),
            z: parseFloat((dz / depthMm).toFixed(4))
        };
        const azimuthDeg = parseFloat((Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(2));
        const planarDist = Math.sqrt(dx * dx + dy * dy);
        const elevationDeg = parseFloat((Math.atan2(dz, planarDist) * (180 / Math.PI)).toFixed(2));
        return {
            unitVector,
            depthMm: parseFloat(depthMm.toFixed(2)),
            azimuthDeg,
            elevationDeg
        };
    }
};
