export type LocomotionType = 'quadruped_robot' | 'exoskeleton_human' | 'equine_locomotion' | 'bipedal_walker';

export interface Joint2D {
  id: string;
  name: string;
  x: number;
  y: number;
  contact: boolean; // Ground contact state
  forceN: number; // Force in Newtons
}

export interface CV2Telemetry {
  fps: number;
  fogDetected: boolean;
  fogConfidence: number; // 0 - 100%
  nonFogScore: number; // captured_non-FOG score
  tunnelToppleRisk: number; // 0 - 100%
  trafficSnailIRAT: number; // Instability / Ratio score
  hoverStrength: number; // N/cm^2
  amplifiedAttitudePitch: number; // degrees
  amplifiedAttitudeRoll: number; // degrees
  slantedSurfaceAngle: number; // degrees
  leakageBoundCoeff: number; // contactable_bound_with_leakage
  consumedPowerWatts: number; // Watts
  concaveEfficiencyScore: number; // %
}

export interface MuscleRingTelemetry {
  connected: boolean;
  deviceName: string;
  batteryLevel: number; // %
  signalRSSI: number; // dBm
  emgSignalMicrovolts: number; // uV
  muscleVerificationScore: number; // %
  hoverStrengthTarget: number; // N/cm^2
  appliedAttitudeOffset: number; // deg
}

export interface MonthlyHistoryRecord {
  id: string;
  month: string; // e.g. "2026-06"
  subjectId: string;
  locomotionType: LocomotionType;
  totalHours: number;
  consumedPowerKWh: number;
  avgHoverStrength: number;
  tunnelToppleIncidents: number;
  fogEventsCount: number;
  avgConcaveEfficiency: number;
  leakageRiskIndex: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface HeatmapPoint {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  intensity: number; // 0 - 1
  leakageRisk: boolean;
  dwellMs: number;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
