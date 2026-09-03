import { Point3D } from '../../types';

export interface OpticalTrackerFrame {
  timestamp: number;
  position: Point3D;
  orientationEuler: { yaw: number; pitch: number; roll: number };
  qualityIndex: number; // 0.0 to 1.0 (sub-millimeter precision indicator)
  isLineOfSightObscured: boolean;
  frequencyHz: number;
  trackingToolId: string;
}

export class OpticalTrackerStream {
  private isStreaming = false;
  private timerId: any = null;
  private currentPos: Point3D;
  private targetPos: Point3D;
  private listeners: ((frame: OpticalTrackerFrame) => void)[] = [];

  constructor(initialPosition: Point3D, targetPosition: Point3D) {
    this.currentPos = { ...initialPosition };
    this.targetPos = { ...targetPosition };
  }

  public setTarget(newTarget: Point3D) {
    this.targetPos = { ...newTarget };
  }

  public start(onFrame: (frame: OpticalTrackerFrame) => void) {
    if (this.isStreaming) return;
    this.isStreaming = true;
    this.listeners.push(onFrame);

    let progress = 0;
    const stepIntervalMs = 1000 / 60; // 60 Hz standard tracking frequency

    this.timerId = setInterval(() => {
      progress += 0.005;
      if (progress > 1.0) progress = 0.0; // Cyclic loop

      // Realistic Optical Jitter (Gaussian noise ~ 0.05 mm)
      const jitterX = (Math.random() - 0.5) * 0.08;
      const jitterY = (Math.random() - 0.5) * 0.08;
      const jitterZ = (Math.random() - 0.5) * 0.08;

      const posX = this.currentPos.x + (this.targetPos.x - this.currentPos.x) * progress + jitterX;
      const posY = this.currentPos.y + (this.targetPos.y - this.currentPos.y) * progress + jitterY;
      const posZ = this.currentPos.z + (this.targetPos.z - this.currentPos.z) * progress + jitterZ;

      const frame: OpticalTrackerFrame = {
        timestamp: Date.now(),
        position: {
          x: parseFloat(posX.toFixed(2)),
          y: parseFloat(posY.toFixed(2)),
          z: parseFloat(posZ.toFixed(2))
        },
        orientationEuler: {
          yaw: parseFloat((Math.sin(progress * Math.PI) * 15).toFixed(1)),
          pitch: parseFloat((-30 + Math.cos(progress * Math.PI) * 10).toFixed(1)),
          roll: parseFloat((Math.sin(progress * 2 * Math.PI) * 5).toFixed(1))
        },
        qualityIndex: 0.994,
        isLineOfSightObscured: false,
        frequencyHz: 60.0,
        trackingToolId: 'NDI_POLARIS_PASSIVE_STYLUS_01'
      };

      this.listeners.forEach(cb => cb(frame));
    }, stepIntervalMs);
  }

  public stop() {
    this.isStreaming = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.listeners = [];
  }

  public getStatus() {
    return {
      isStreaming: this.isStreaming,
      model: 'NDI Polaris Spectra / Vicra Optical Emulator',
      baudRate: 115200,
      refreshRate: '60 Hz',
      rmsErrorMm: 0.12
    };
  }
}
