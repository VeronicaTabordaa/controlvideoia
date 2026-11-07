export interface PlantParameters {
  // G(s) = 1 / ((s+4)(s+6)(s+10)) = 1 / (s^3 + 20s^2 + 124s + 240)
  poles: [number, number, number];
  dcGain: number;
}

export interface ControllerConfig {
  type: 'P' | 'PD' | 'PI' | 'PID';
  Kp: number;
  Ti: number; // in seconds
  Td: number; // in seconds
  N: number; // filter coefficient for derivative action (typically 8-20)
  antiWindup: boolean;
  velocityLimit: number; // deg/s or %/s
  forceLimit: number; // N
  emgFilterActive: boolean;
}

export interface SimulationPoint {
  t: number;
  ref: number; // desired opening/closure (0 to 1)
  y: number; // actual hand position (0 to 1)
  u: number; // control signal
  emgRaw: number;
  emgFiltered: number;
}

export interface ControlMetrics {
  riseTime: number; // tr in seconds
  settlingTime: number; // ts (2%) in seconds
  overshootPct: number; // MP%
  steadyStateError: number; // ess
  isStable: boolean;
  gainMarginDb?: number;
  phaseMarginDeg?: number;
  criticalGain: number; // 2240 for this plant
}

export interface RootLocusBranchPoint {
  K: number;
  real: number;
  imag: number;
}
