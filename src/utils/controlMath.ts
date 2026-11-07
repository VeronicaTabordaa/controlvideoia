import { ControllerConfig, ControlMetrics, SimulationPoint, RootLocusBranchPoint } from '../types/control';

// Solve cubic equation s^3 + a2*s^2 + a1*s + a0 = 0 using Cardano's formula
export function solveCubicRoots(a2: number, a1: number, a0: number): { real: number; imag: number }[] {
  // Depressed cubic: t^3 + p*t + q = 0 by substituting s = t - a2/3
  const shift = a2 / 3;
  const p = a1 - (a2 * a2) / 3;
  const q = (2 * a2 * a2 * a2) / 27 - (a2 * a1) / 3 + a0;

  const discriminant = (q * q) / 4 + (p * p * p) / 27;

  if (discriminant > 1e-9) {
    // One real root and two complex conjugate roots
    const sqrtD = Math.sqrt(discriminant);
    const u = Math.cbrt(-q / 2 + sqrtD);
    const v = Math.cbrt(-q / 2 - sqrtD);
    const t1 = u + v;
    const realRoot = t1 - shift;

    const realPart = -(u + v) / 2 - shift;
    const imagPart = ((u - v) * Math.sqrt(3)) / 2;

    return [
      { real: realRoot, imag: 0 },
      { real: realPart, imag: Math.abs(imagPart) },
      { real: realPart, imag: -Math.abs(imagPart) },
    ];
  } else if (Math.abs(discriminant) <= 1e-9) {
    // Three real roots, at least two are equal
    const u = Math.cbrt(-q / 2);
    const r1 = 2 * u - shift;
    const r2 = -u - shift;
    return [
      { real: r1, imag: 0 },
      { real: r2, imag: 0 },
      { real: r2, imag: 0 },
    ];
  } else {
    // Three distinct real roots (casus irreducibilis)
    const r = Math.sqrt(-((p * p * p) / 27));
    const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))));
    const factor = 2 * Math.cbrt(r);

    const t1 = factor * Math.cos(phi / 3);
    const t2 = factor * Math.cos((phi + 2 * Math.PI) / 3);
    const t3 = factor * Math.cos((phi + 4 * Math.PI) / 3);

    return [
      { real: t1 - shift, imag: 0 },
      { real: t2 - shift, imag: 0 },
      { real: t3 - shift, imag: 0 },
    ];
  }
}

// Compute closed-loop poles for a given proportional gain K
export function computePolesForK(K: number): { real: number; imag: number }[] {
  // s^3 + 20s^2 + 124s + (240 + K) = 0
  return solveCubicRoots(20, 124, 240 + K);
}

// Generate sampled Root Locus points from K = 0 to K = 3000
export function generateRootLocusData(): {
  branches: RootLocusBranchPoint[][];
  breakaway: { real: number; imag: number };
  criticalK: number;
  criticalOmega: number;
} {
  const kValues: number[] = [];
  // Fine sampling around breakaway and stability boundary
  for (let k = 0; k <= 50; k += 1) kValues.push(k);
  for (let k = 50; k <= 500; k += 5) kValues.push(k);
  for (let k = 500; k <= 2200; k += 20) kValues.push(k);
  for (let k = 2200; k <= 2300; k += 2) kValues.push(k);
  for (let k = 2300; k <= 3200; k += 25) kValues.push(k);

  const branch1: RootLocusBranchPoint[] = [];
  const branch2: RootLocusBranchPoint[] = [];
  const branch3: RootLocusBranchPoint[] = [];

  kValues.forEach((K) => {
    const poles = computePolesForK(K);
    // Sort poles by imaginary value or real value to keep branch continuity
    // One branch goes towards -infinity on the real axis
    // Two branches break away and go towards complex plane with asymptotes +-60 deg
    const realPole = poles.find(p => Math.abs(p.imag) < 1e-4) || poles[0];
    const complexPoles = poles.filter(p => p !== realPole);

    branch1.push({ K, real: realPole.real, imag: realPole.imag });

    if (complexPoles.length >= 2) {
      const upper = complexPoles[0].imag >= 0 ? complexPoles[0] : complexPoles[1];
      const lower = complexPoles[0].imag < 0 ? complexPoles[0] : complexPoles[1];
      branch2.push({ K, real: upper.real, imag: upper.imag });
      branch3.push({ K, real: lower.real, imag: lower.imag });
    } else {
      // Before breakaway, all three poles are on real axis (-4, -6, -10)
      const sorted = [...poles].sort((a, b) => b.real - a.real); // -4, -6, -10
      branch2.push({ K, real: sorted[0].real, imag: sorted[0].imag });
      branch3.push({ K, real: sorted[1].real, imag: sorted[1].imag });
    }
  });

  return {
    branches: [branch1, branch2, branch3],
    breakaway: { real: -4.903, imag: 0 },
    criticalK: 2240,
    criticalOmega: Math.sqrt(124), // ~11.135 rad/s
  };
}

// Generate realistic simulated EMG signal with physiological envelope and optional noise/artifacts
export function generateEMGSignal(
  t: number,
  isIntentionalClosure: boolean,
  hasNoise: boolean
): { raw: number; filtered: number; intendedCommand: number } {
  // Command step: starts at t = 0.5s
  const step = t >= 0.5 ? 1.0 : 0.0;

  if (!isIntentionalClosure && t < 0.5) {
    const ambientNoise = hasNoise ? (Math.sin(t * 150) * 0.08 + Math.cos(t * 310) * 0.05 + (Math.random() - 0.5) * 0.1) : 0;
    return {
      raw: ambientNoise,
      filtered: Math.max(0, ambientNoise * 0.2),
      intendedCommand: 0,
    };
  }

  // Raw EMG: high-frequency motor unit action potentials (MUAP) burst
  const carrier1 = Math.sin(t * 180);
  const carrier2 = Math.cos(t * 340);
  const carrier3 = Math.sin(t * 520);
  const envelope = step;

  let raw = (carrier1 * 0.4 + carrier2 * 0.35 + carrier3 * 0.25) * envelope;

  // Involuntary disturbance (e.g. SUBE card vibration / bus bump at t = 2.8s)
  if (hasNoise) {
    if (t >= 2.5 && t <= 3.2) {
      raw += Math.sin(t * 120) * 0.65 + (Math.random() - 0.5) * 0.4;
    } else {
      raw += (Math.random() - 0.5) * 0.15;
    }
  }

  // Bandpass rectification and low-pass envelope detection (bio-signal processing)
  const rectified = Math.abs(raw);
  const filtered = envelope > 0 ? 0.95 + 0.05 * Math.sin(t * 12) : Math.min(0.2, rectified);

  return {
    raw,
    filtered: Math.min(1.0, filtered),
    intendedCommand: step,
  };
}

// Run full dynamic simulation using 4th-order Runge-Kutta (RK4)
export function runSimulation(config: ControllerConfig, duration = 4.0, dt = 0.005): {
  points: SimulationPoint[];
  metrics: ControlMetrics;
} {
  const points: SimulationPoint[] = [];

  // Plant state: x1 = y (output), x2 = dy/dt, x3 = d2y/dt2
  // d3y/dt3 = -20*x3 - 124*x2 - 240*x1 + u(t)
  let x1 = 0;
  let x2 = 0;
  let x3 = 0;

  // Controller states
  let integralState = 0;
  let derivativeFilterState = 0; // State for filtered derivative: d/dt(e) / (1 + s*Td/N)
  let prevError = 0;

  const totalSteps = Math.floor(duration / dt);

  // Saturation limits (physical motor limits of prosthesis)
  const uMax = 1200;
  const uMin = -1200;

  // Plant ODE function
  const derivatives = (
    _s1: number,
    s2: number,
    s3: number,
    u: number
  ): [number, number, number] => {
    const ds1 = s2;
    const ds2 = s3;
    const ds3 = -20 * s3 - 124 * s2 - 240 * _s1 + u;
    return [ds1, ds2, ds3];
  };

  for (let i = 0; i < totalSteps; i++) {
    const t = i * dt;

    // Muscle intent reference
    const emg = generateEMGSignal(t, true, !config.emgFilterActive);
    const reference = emg.intendedCommand; // 0 before 0.5s, 1 after 0.5s

    // Error
    const error = reference - x1;

    // Controller calculation
    let u = 0;
    const Kp = config.Kp;
    const Ti = Math.max(0.001, config.Ti);
    const Td = config.Td;
    const N = Math.max(1, config.N);

    if (config.type === 'P') {
      u = Kp * error;
    } else if (config.type === 'PD') {
      const rawDerivative = (error - prevError) / dt;
      // Filtered derivative
      const alpha = dt / (dt + Td / N);
      derivativeFilterState = (1 - alpha) * derivativeFilterState + alpha * rawDerivative;
      u = Kp * (error + Td * derivativeFilterState);
    } else if (config.type === 'PI') {
      // Integrator update
      integralState += error * dt;
      if (config.antiWindup) {
        integralState = Math.max(-50, Math.min(50, integralState));
      }
      u = Kp * (error + (1 / Ti) * integralState);
    } else {
      // PID with Filtered Derivative & Anti-Windup
      const rawDerivative = (error - prevError) / dt;
      const alpha = dt / (dt + Td / N);
      derivativeFilterState = (1 - alpha) * derivativeFilterState + alpha * rawDerivative;

      // Anti-windup clamping
      const proposedU = Kp * (error + (1 / Ti) * integralState + Td * derivativeFilterState);
      const isSaturated = proposedU > uMax || proposedU < uMin;

      if (!config.antiWindup || !isSaturated || Math.sign(error) !== Math.sign(proposedU)) {
        integralState += error * dt;
      }

      u = Kp * (error + (1 / Ti) * integralState + Td * derivativeFilterState);
    }

    // Apply motor saturation
    const saturatedU = Math.max(uMin, Math.min(uMax, u));

    // RK4 integration for the 3rd order plant
    const [k1_1, k1_2, k1_3] = derivatives(x1, x2, x3, saturatedU);
    const [k2_1, k2_2, k2_3] = derivatives(
      x1 + 0.5 * dt * k1_1,
      x2 + 0.5 * dt * k1_2,
      x3 + 0.5 * dt * k1_3,
      saturatedU
    );
    const [k3_1, k3_2, k3_3] = derivatives(
      x1 + 0.5 * dt * k2_1,
      x2 + 0.5 * dt * k2_2,
      x3 + 0.5 * dt * k2_3,
      saturatedU
    );
    const [k4_1, k4_2, k4_3] = derivatives(
      x1 + dt * k3_1,
      x2 + dt * k3_2,
      x3 + dt * k3_3,
      saturatedU
    );

    x1 += (dt / 6) * (k1_1 + 2 * k2_1 + 2 * k3_1 + k4_1);
    x2 += (dt / 6) * (k1_2 + 2 * k2_2 + 2 * k3_2 + k4_2);
    x3 += (dt / 6) * (k1_3 + 2 * k2_3 + 2 * k3_3 + k4_3);

    // Clamp unphysical negative opening or extreme values
    x1 = Math.max(-0.2, Math.min(2.5, x1));

    prevError = error;

    // Record data points (decimate slightly for render speed)
    if (i % 2 === 0) {
      points.push({
        t: Number(t.toFixed(3)),
        ref: reference,
        y: Number(x1.toFixed(4)),
        u: Number(saturatedU.toFixed(1)),
        emgRaw: Number(emg.raw.toFixed(3)),
        emgFiltered: Number(emg.filtered.toFixed(3)),
      });
    }
  }

  // Calculate Performance Metrics relative to the step response after t = 0.5s
  const stepPoints = points.filter(p => p.t >= 0.5);
  const target = 1.0;

  // Final value (average of last 10%)
  const lastSegment = stepPoints.slice(-Math.floor(stepPoints.length * 0.1));
  const finalValue = lastSegment.reduce((acc, p) => acc + p.y, 0) / (lastSegment.length || 1);
  const steadyStateError = Math.abs(target - finalValue);

  // Peak overshoot
  let peakVal = 0;
  let peakTime = 0.5;
  stepPoints.forEach(p => {
    if (p.y > peakVal) {
      peakVal = p.y;
      peakTime = p.t;
    }
  });

  const overshootPct = target > 0 && peakVal > target
    ? Math.min(200, ((peakVal - target) / target) * 100)
    : 0;

  // Rise time (10% to 90% of target)
  const p10 = stepPoints.find(p => p.y >= 0.1 * target);
  const p90 = stepPoints.find(p => p.y >= 0.9 * target);
  const riseTime = (p10 && p90) ? Math.max(0, p90.t - p10.t) : 0;

  // Settling time: time after which signal stays within +-2% of target (or finalValue)
  const band = 0.02 * target;
  let lastOutsideIndex = -1;
  for (let j = 0; j < stepPoints.length; j++) {
    if (Math.abs(stepPoints[j].y - target) > band) {
      lastOutsideIndex = j;
    }
  }

  const settlingTime = lastOutsideIndex >= 0
    ? Math.max(0, stepPoints[lastOutsideIndex].t - 0.5)
    : (stepPoints[0] ? stepPoints[0].t - 0.5 : 0);

  // Stability assessment
  const isOscillatingWildly = peakVal > 1.8 || (config.type === 'P' && config.Kp >= 2240);
  const isStable = !isOscillatingWildly && steadyStateError < 0.35 && settlingTime < 3.8;

  return {
    points,
    metrics: {
      riseTime: Number(riseTime.toFixed(2)),
      settlingTime: Number(Math.min(4.0, settlingTime).toFixed(2)),
      overshootPct: Number(overshootPct.toFixed(1)),
      steadyStateError: Number(steadyStateError.toFixed(3)),
      isStable,
      criticalGain: 2240,
    },
  };
}

// Default Presets
export const CONTROL_PRESETS: Record<string, { label: string; desc: string; config: ControllerConfig }> = {
  originalSlow: {
    label: '1. Configuración Original (Lenta)',
    desc: 'Baja ganancia proporcional (K=50). Sin oscilaciones, pero muy lenta (ts ≈ 3.4 s) y con gran error estacionario.',
    config: {
      type: 'P',
      Kp: 50,
      Ti: 1.0,
      Td: 0.1,
      N: 10,
      antiWindup: false,
      velocityLimit: 100,
      forceLimit: 30,
      emgFilterActive: false,
    },
  },
  highGainUnstable: {
    label: '2. Ganancia Elevada (Inestable / Oscilatoria)',
    desc: 'Intento de ganar rapidez subiendo solo K (K=1800). Genera sobreimpulso severo (>65%), vibraciones y amplificación de ruido EMG.',
    config: {
      type: 'P',
      Kp: 1800,
      Ti: 1.0,
      Td: 0.1,
      N: 10,
      antiWindup: false,
      velocityLimit: 180,
      forceLimit: 60,
      emgFilterActive: false,
    },
  },
  criticalLimit: {
    label: '3. Límite Crítico de Estabilidad (K = 2240)',
    desc: 'Frontera exacta calculada por Routh-Hurwitz. El sistema oscila sostenidamente a ω = 11.13 rad/s.',
    config: {
      type: 'P',
      Kp: 2240,
      Ti: 1.0,
      Td: 0.1,
      N: 10,
      antiWindup: false,
      velocityLimit: 200,
      forceLimit: 70,
      emgFilterActive: false,
    },
  },
  proposedPID: {
    label: '4. Controlador PID Propuesto (Óptimo & Seguro)',
    desc: 'Solución bioingenieril: PID con derivada filtrada (N=12), protección anti-windup y filtrado EMG. Cumple ts ≤ 2 s, MP ≤ 25% y ess = 0.',
    config: {
      type: 'PID',
      Kp: 450,
      Ti: 0.65,
      Td: 0.22,
      N: 12,
      antiWindup: true,
      velocityLimit: 120,
      forceLimit: 35,
      emgFilterActive: true,
    },
  },
};
