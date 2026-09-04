import { Point3D } from '../../types';

export interface OpticalTrackerFrame {
  timestamp: number;
  position: Point3D;
  probePosition: Point3D;
  orientationEuler: { yaw: number; pitch: number; roll: number };
  qualityIndex: number;
  quality: number;
  rmsErrorMm: number;
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

  constructor(initialPosition: Point3D = { x: 58.0, y: -18.0, z: 65.0 }, targetPosition: Point3D = { x: 24.5, y: 12.0, z: 38.2 }) {
    this.currentPos = { ...initialPosition };
    this.targetPos = { ...targetPosition };
  }

  public setTarget(newTarget: Point3D) {
    this.targetPos = { ...newTarget };
  }

  public subscribe(callback: (frame: OpticalTrackerFrame) => void) {
    this.start(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0) {
        this.stop();
      }
    };
  }

  public start(onFrame: (frame: OpticalTrackerFrame) => void) {
    this.listeners.push(onFrame);
    if (this.isStreaming) return;
    this.isStreaming = true;

    let progress = 0;
    const stepIntervalMs = 1000 / 60; // 60 Hz

    this.timerId = setInterval(() => {
      progress += 0.005;
      if (progress > 1.0) progress = 0.0;

      const jitterX = (Math.random() - 0.5) * 0.08;
      const jitterY = (Math.random() - 0.5) * 0.08;
      const jitterZ = (Math.random() - 0.5) * 0.08;

      const posX = this.currentPos.x + (this.targetPos.x - this.currentPos.x) * progress + jitterX;
      const posY = this.currentPos.y + (this.targetPos.y - this.currentPos.y) * progress + jitterY;
      const posZ = this.currentPos.z + (this.targetPos.z - this.currentPos.z) * progress + jitterZ;

      const pos: Point3D = {
        x: parseFloat(posX.toFixed(2)),
        y: parseFloat(posY.toFixed(2)),
        z: parseFloat(posZ.toFixed(2))
      };

      const frame: OpticalTrackerFrame = {
        timestamp: Date.now(),
        position: pos,
        probePosition: pos,
        orientationEuler: {
          yaw: parseFloat((Math.sin(progress * Math.PI) * 15).toFixed(1)),
          pitch: parseFloat((-30 + Math.cos(progress * Math.PI) * 10).toFixed(1)),
          roll: parseFloat((Math.sin(progress * 2 * Math.PI) * 5).toFixed(1))
        },
        qualityIndex: 0.994,
        quality: 0.994,
        rmsErrorMm: 0.12,
        isLineOfSightObscured: false,
        frequencyHz: 60.0,
        trackingToolId: 'NDI_POLARIS_PASSIVE_STYLUS_01'
      };

      this.listeners.forEach((cb) => cb(frame));
    }, stepIntervalMs);
  }

  public stop() {
    this.isStreaming = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getStatus() {
    return {
      isStreaming: this.isStreaming,
      model: 'NDI Polaris Spectra / Vicra Optical Emulator',
      baudRate: 115200,
      refreshRate: '60 Hz',
      rmsErrorMm: 0.12,
      quality: 0.994,
      probePosition: { ...this.currentPos }
    };
  }
}

export const opticalTracker = new OpticalTrackerStream();
