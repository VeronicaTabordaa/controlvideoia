import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Info,
} from 'lucide-react';
import { ControllerConfig } from '../../types/control';
import {
  runSimulation,
  computePolesForK,
  generateRootLocusData,
  CONTROL_PRESETS,
} from '../../utils/controlMath';

interface ControlLabProps {
  initialPreset?: string;
}

export const ControlLab: React.FC<ControlLabProps> = ({ initialPreset }) => {
  const [config, setConfig] = useState<ControllerConfig>(() => {
    if (initialPreset && CONTROL_PRESETS[initialPreset]) {
      return { ...CONTROL_PRESETS[initialPreset].config };
    }
    return { ...CONTROL_PRESETS.proposedPID.config };
  });

  const [activePresetKey, setActivePresetKey] = useState<string>(
    initialPreset || 'proposedPID'
  );

  const [simNoiseEnabled, setSimNoiseEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'response' | 'lgr'>('response');

  // Handle external preset updates if props change
  useEffect(() => {
    if (initialPreset && CONTROL_PRESETS[initialPreset]) {
      setConfig({ ...CONTROL_PRESETS[initialPreset].config });
      setActivePresetKey(initialPreset);
    }
  }, [initialPreset]);

  // Run dynamic simulation
  const simulationResult = useMemo(() => {
    return runSimulation({
      ...config,
      emgFilterActive: config.emgFilterActive && !simNoiseEnabled,
    });
  }, [config, simNoiseEnabled]);

  const { points, metrics } = simulationResult;

  // Root Locus data
  const locusData = useMemo(() => generateRootLocusData(), []);
  const currentPoles = useMemo(() => computePolesForK(config.Kp), [config.Kp]);

  // SVG dimensions for plots
  const timeSvgWidth = 600;
  const timeSvgHeight = 220;
  const lgrSvgWidth = 500;
  const lgrSvgHeight = 340;

  // Map complex s-plane to SVG coordinates
  // Real axis: -16 to +4
  // Imag axis: -16 to +16
  const mapSToSvg = (real: number, imag: number) => {
    const xMin = -16;
    const xMax = 4;
    const yMin = -16;
    const yMax = 16;
    const x = ((real - xMin) / (xMax - xMin)) * lgrSvgWidth;
    const y = ((yMax - imag) / (yMax - yMin)) * lgrSvgHeight;
    return { x, y };
  };

  // Convert points to SVG path for time response
  const timePath = useMemo(() => {
    if (!points.length) return '';
    const maxT = 4.0;
    const maxY = 2.0;
    const minY = -0.2;

    const coords = points.map((p) => {
      const x = (p.t / maxT) * timeSvgWidth;
      const y = timeSvgHeight - ((p.y - minY) / (maxY - minY)) * timeSvgHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${coords.join(' L ')}`;
  }, [points]);

  // Reference step path
  const refPath = useMemo(() => {
    const maxT = 4.0;
    const maxY = 2.0;
    const minY = -0.2;
    const yRef0 = timeSvgHeight - ((0 - minY) / (maxY - minY)) * timeSvgHeight;
    const yRef1 = timeSvgHeight - ((1 - minY) / (maxY - minY)) * timeSvgHeight;
    const xStep = (0.5 / maxT) * timeSvgWidth;
    return `M 0,${yRef0} L ${xStep},${yRef0} L ${xStep},${yRef1} L ${timeSvgWidth},${yRef1}`;
  }, []);

  // EMG signal path
  const emgPath = useMemo(() => {
    if (!points.length) return '';
    const maxT = 4.0;
    const h = 50;
    const coords = points.map((p) => {
      const x = (p.t / maxT) * timeSvgWidth;
      const val = config.emgFilterActive ? p.emgFiltered : p.emgRaw;
      const y = h / 2 - val * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${coords.join(' L ')}`;
  }, [points, config.emgFilterActive]);

  // Current hand posture (value at t = 2.0s or latest)
  const currentHandOpening = points.length > 0 ? points[Math.min(points.length - 1, 300)].y : 0;
  const handNormalized = Math.max(0, Math.min(1.2, currentHandOpening));

  // Preset setter
  const handleSelectPreset = (key: string) => {
    if (CONTROL_PRESETS[key]) {
      setConfig({ ...CONTROL_PRESETS[key].config });
      setActivePresetKey(key);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Lab Header & Presets Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
              <Activity className="w-4 h-4" />
              <span>LABORATORIO DE CONTROL DE SISTEMAS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Modelado, LGR y Sintonización de la Prótesis Mioeléctrica
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Planta de tercer orden:{' '}
              <span className="font-mono text-sky-300 font-semibold">
                G(s) = 1 / ((s+4)(s+6)(s+10))
              </span>
              . Comprueba cómo varía la ubicación de los polos en el plano complejo y la respuesta de la mano de Martín ante órdenes musculares y ruido EMG.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(CONTROL_PRESETS).map(([key, item]) => {
              const isSelected = activePresetKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current preset description callout */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-3 text-xs sm:text-sm text-slate-300">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">
              {CONTROL_PRESETS[activePresetKey]?.label}:
            </span>{' '}
            {CONTROL_PRESETS[activePresetKey]?.desc}
          </div>
        </div>
      </div>

      {/* Main Grid: Visualizers & Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Plots (LGR & Time Response) (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tabs for Plots */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('response')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === 'response'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Respuesta Temporal y Prótesis y(t)
                </button>
                <button
                  onClick={() => setActiveTab('lgr')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === 'lgr'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lugar Geométrico de las Raíces (LGR)
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold ${
                    metrics.isStable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {metrics.isStable ? '● SISTEMA ESTABLE' : '▲ INESTABLE / CRÍTICO'}
                </span>
              </div>
            </div>

            {/* TAB 1: Temporal Step Response */}
            {activeTab === 'response' ? (
              <div className="space-y-4">
                {/* SVG Time Response Plot */}
                <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>Posición de la Mano y(t) vs Tiempo (0 - 4 s)</span>
                    <span className="text-sky-400">Orden de Cierre x(t) = 1.0</span>
                  </div>

                  <svg
                    viewBox={`0 0 ${timeSvgWidth} ${timeSvgHeight}`}
                    className="w-full h-44 sm:h-52 overflow-visible"
                  >
                    {/* Grid lines */}
                    <line x1="0" y1={timeSvgHeight * 0.1} x2={timeSvgWidth} y2={timeSvgHeight * 0.1} stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1={timeSvgHeight * 0.5} x2={timeSvgWidth} y2={timeSvgHeight * 0.5} stroke="#334155" strokeDasharray="3 3" />
                    <line x1="0" y1={timeSvgHeight * 0.9} x2={timeSvgWidth} y2={timeSvgHeight * 0.9} stroke="#1e293b" />

                    {/* Step order line (Reference x(t) = 1) */}
                    <path
                      d={refPath}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Settling time spec boundary (ts <= 2.0s -> t = 2.5s from start) */}
                    <line
                      x1={(2.5 / 4.0) * timeSvgWidth}
                      y1="0"
                      x2={(2.5 / 4.0) * timeSvgWidth}
                      y2={timeSvgHeight}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                    <text
                      x={(2.5 / 4.0) * timeSvgWidth + 4}
                      y="16"
                      fill="#10b981"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      ts = 2.0 s (máx)
                    </text>

                    {/* 25% overshoot limit line */}
                    <line
                      x1="0"
                      y1={timeSvgHeight - ((1.25 + 0.2) / 2.2) * timeSvgHeight}
                      x2={timeSvgWidth}
                      y2={timeSvgHeight - ((1.25 + 0.2) / 2.2) * timeSvgHeight}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                    <text
                      x="8"
                      y={timeSvgHeight - ((1.25 + 0.2) / 2.2) * timeSvgHeight - 4}
                      fill="#f59e0b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Límite MP = 25%
                    </text>

                    {/* Actual hand position y(t) curve */}
                    <path
                      d={timePath}
                      fill="none"
                      stroke={metrics.isStable ? '#38bdf8' : '#f43f5e'}
                      strokeWidth="2.5"
                    />
                  </svg>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-slate-500 stroke-dash" />
                      Referencia muscular
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-sky-400" />
                      Respuesta prótesis y(t)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500/30 border border-emerald-500 rounded-sm" />
                      Criterio ts ≤ 2s
                    </span>
                  </div>
                </div>

                {/* Simulated EMG Signal Box */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Señal Electromiográfica (EMG) en el muñón de Martín
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={simNoiseEnabled}
                        onChange={(e) => setSimNoiseEnabled(e.target.checked)}
                        className="rounded accent-sky-500"
                      />
                      <span>Inyectar perturbación SUBE / Colectivo</span>
                    </label>
                  </div>

                  <svg
                    viewBox={`0 0 ${timeSvgWidth} 50`}
                    className="w-full h-12 bg-slate-900/50 rounded-lg overflow-hidden"
                  >
                    <path
                      d={emgPath}
                      fill="none"
                      stroke={config.emgFilterActive ? '#38bdf8' : '#e879f9'}
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {config.emgFilterActive
                      ? '✓ Filtrado paso-banda activo: el ruido muscular y las vibraciones bruscas quedan amortiguados.'
                      : '⚠ Sin filtrado: el ruido electromiográfico amplificado ingresa al controlador generando movimientos involuntarios.'}
                  </p>
                </div>

                {/* Interactive Prosthesis Hand Mechanical Preview */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-6">
                  <div>
                    <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Simulación Mecánica de la Mano de Martín
                    </h4>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      Estado: {handNormalized > 0.85 ? 'Cierre Completo (Prensión)' : handNormalized > 0.2 ? 'Movimiento en Transitorio' : 'Mano Abierta (Reposo)'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-300">
                      <span>Apertura: {Math.round(handNormalized * 100)}%</span>
                      <span>Fuerza: {(handNormalized * config.forceLimit).toFixed(1)} N</span>
                    </div>
                  </div>

                  {/* SVG Hand Graphic with dynamic finger curl */}
                  <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Wrist / socket */}
                      <rect x="35" y="70" width="30" height="25" rx="4" fill="#334155" />
                      {/* Palm */}
                      <rect x="25" y="40" width="50" height="32" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                      {/* Fingers that curl as handNormalized increases */}
                      {[0, 1, 2, 3].map((fIndex) => {
                        const baseAngle = 10 + (handNormalized * 80);
                        const fx = 30 + fIndex * 12;
                        return (
                          <g key={fIndex} transform={`translate(${fx}, 40)`}>
                            {/* Proximal phalanx */}
                            <line
                              x1="0"
                              y1="0"
                              x2="0"
                              y2={-16 + handNormalized * 4}
                              stroke="#0284c7"
                              strokeWidth="4"
                              strokeLinecap="round"
                              transform={`rotate(${fIndex === 0 ? -baseAngle * 0.3 : baseAngle * 0.15})`}
                            />
                            {/* Distal phalanx */}
                            <circle
                              cx={fIndex === 0 ? -baseAngle * 0.1 : baseAngle * 0.1}
                              cy={-20 + handNormalized * 6}
                              r="3"
                              fill="#38bdf8"
                            />
                          </g>
                        );
                      })}
                      {/* Thumb */}
                      <g transform="translate(25, 55)">
                        <line
                          x1="0"
                          y1="0"
                          x2={-12 + handNormalized * 8}
                          y2={-8 + handNormalized * 4}
                          stroke="#0284c7"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <circle cx={-13 + handNormalized * 8} cy={-8 + handNormalized * 4} r="3" fill="#38bdf8" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: Root Locus (LGR) S-Plane View */
              <div className="space-y-4">
                <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>Plano s: Trayectoria de Polos según Ganancia K</span>
                    <span className="text-amber-400 font-bold">Límite Crítico: K = 2240</span>
                  </div>

                  <svg
                    viewBox={`0 0 ${lgrSvgWidth} ${lgrSvgHeight}`}
                    className="w-full h-72 sm:h-80 overflow-visible"
                  >
                    {/* Unstable region (Right-Half Plane, s > 0) */}
                    <rect
                      x={mapSToSvg(0, 16).x}
                      y="0"
                      width={lgrSvgWidth - mapSToSvg(0, 16).x}
                      height={lgrSvgHeight}
                      fill="#ef4444"
                      opacity="0.1"
                    />
                    <text
                      x={mapSToSvg(0, 16).x + 8}
                      y="20"
                      fill="#f87171"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SEMPLIPLANO DERECHO (INESTABLE)
                    </text>

                    {/* Real Axis */}
                    <line
                      x1="0"
                      y1={mapSToSvg(0, 0).y}
                      x2={lgrSvgWidth}
                      y2={mapSToSvg(0, 0).y}
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    {/* Imaginary Axis (jω) */}
                    <line
                      x1={mapSToSvg(0, 0).x}
                      y1="0"
                      x2={mapSToSvg(0, 0).x}
                      y2={lgrSvgHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />

                    {/* Asymptotes (intersect at sigma = -20/3 = -6.67, angles +-60 deg) */}
                    <line
                      x1={mapSToSvg(-6.67, 0).x}
                      y1={mapSToSvg(-6.67, 0).y}
                      x2={mapSToSvg(3, 16.7).x}
                      y2={mapSToSvg(3, 16.7).y}
                      stroke="#64748b"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={mapSToSvg(-6.67, 0).x}
                      y1={mapSToSvg(-6.67, 0).y}
                      x2={mapSToSvg(3, -16.7).x}
                      y2={mapSToSvg(3, -16.7).y}
                      stroke="#64748b"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Open Loop Poles at -4, -6, -10 (marked with X) */}
                    {[-4, -6, -10].map((poleVal) => {
                      const pos = mapSToSvg(poleVal, 0);
                      return (
                        <g key={poleVal} transform={`translate(${pos.x}, ${pos.y})`}>
                          <line x1="-5" y1="-5" x2="5" y2="5" stroke="#38bdf8" strokeWidth="2.5" />
                          <line x1="-5" y1="5" x2="5" y2="-5" stroke="#38bdf8" strokeWidth="2.5" />
                          <text x="-4" y="16" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                            {poleVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Breakaway Point at s = -4.90 */}
                    <circle
                      cx={mapSToSvg(locusData.breakaway.real, 0).x}
                      cy={mapSToSvg(locusData.breakaway.real, 0).y}
                      r="4"
                      fill="#e2e8f0"
                    />
                    <text
                      x={mapSToSvg(locusData.breakaway.real, 0).x - 18}
                      y={mapSToSvg(locusData.breakaway.real, 0).y - 8}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Ruptura (-4.9)
                    </text>

                    {/* Axis Crossing Point (j*sqrt(124) approx 11.135, K = 2240) */}
                    <circle
                      cx={mapSToSvg(0, locusData.criticalOmega).x}
                      cy={mapSToSvg(0, locusData.criticalOmega).y}
                      r="5"
                      fill="#ef4444"
                    />
                    <circle
                      cx={mapSToSvg(0, -locusData.criticalOmega).x}
                      cy={mapSToSvg(0, -locusData.criticalOmega).y}
                      r="5"
                      fill="#ef4444"
                    />
                    <text
                      x={mapSToSvg(0, locusData.criticalOmega).x + 8}
                      y={mapSToSvg(0, locusData.criticalOmega).y + 4}
                      fill="#ef4444"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      +j11.13 (K=2240)
                    </text>

                    {/* Pre-calculated branches */}
                    {locusData.branches.map((branch, bIdx) => {
                      const d = branch
                        .map((pt, idx) => {
                          const svgPt = mapSToSvg(pt.real, pt.imag);
                          return `${idx === 0 ? 'M' : 'L'} ${svgPt.x.toFixed(1)},${svgPt.y.toFixed(1)}`;
                        })
                        .join(' ');
                      return (
                        <path
                          key={bIdx}
                          d={d}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2"
                          opacity="0.75"
                        />
                      );
                    })}

                    {/* CURRENT CLOSED-LOOP POLES for this Kp (Moving colored dots) */}
                    {currentPoles.map((p, idx) => {
                      const pos = mapSToSvg(p.real, p.imag);
                      const isRhp = p.real > 0;
                      return (
                        <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                          <circle
                            r="6"
                            fill={isRhp ? '#ef4444' : '#22c55e'}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="animate-pulse"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                    <span>Polos actuales con Kp = {config.Kp}:</span>
                    <span className="text-sky-300">
                      {currentPoles
                        .map(
                          (p) =>
                            `${p.real.toFixed(2)}${
                              Math.abs(p.imag) > 0.05
                                ? ` ± j${Math.abs(p.imag).toFixed(2)}`
                                : ''
                            }`
                        )
                        .slice(0, 2)
                        .join(' | ')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinical & Control Specifications Scorecard */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-mono text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verificación de Criterios de Diseño (Actividad 5)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Spec 1: ts <= 2s */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  metrics.settlingTime <= 2.0 && metrics.isStable
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                }`}
              >
                {metrics.settlingTime <= 2.0 && metrics.isStable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase">
                    Tiempo Establecimiento
                  </div>
                  <div className="text-lg font-mono font-bold">
                    {metrics.settlingTime} s
                  </div>
                  <div className="text-[11px] opacity-80">Objetivo: ts ≤ 2.0 s</div>
                </div>
              </div>

              {/* Spec 2: MP <= 25% */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  metrics.overshootPct <= 25.0 && metrics.isStable
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                }`}
              >
                {metrics.overshootPct <= 25.0 && metrics.isStable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase">Sobreimpulso (MP)</div>
                  <div className="text-lg font-mono font-bold">
                    {metrics.overshootPct}%
                  </div>
                  <div className="text-[11px] opacity-80">Objetivo: MP ≤ 25%</div>
                </div>
              </div>

              {/* Spec 3: ess = 0 */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  metrics.steadyStateError < 0.02 && metrics.isStable
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                }`}
              >
                {metrics.steadyStateError < 0.02 && metrics.isStable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase">
                    Error Estacionario
                  </div>
                  <div className="text-lg font-mono font-bold">
                    {metrics.steadyStateError.toFixed(3)}
                  </div>
                  <div className="text-[11px] opacity-80">Objetivo: ess = 0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controller Tuning Deck (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  Sintonización del Controlador
                </h3>
              </div>

              {/* Controller Type Selector */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono font-bold">
                {(['P', 'PD', 'PI', 'PID'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, type: t }));
                      setActivePresetKey('custom');
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      config.type === t
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              {/* Kp Slider */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300 font-semibold">Ganancia Proporcional (Kp)</span>
                  <span className="text-sky-400 font-bold tabular-nums">
                    {config.Kp} {config.Kp >= 2240 && '(¡Límite Inestabilidad!)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="2500"
                  step="10"
                  value={config.Kp}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setConfig((prev) => ({ ...prev, Kp: val }));
                    setActivePresetKey('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                  <span>10 (Lento)</span>
                  <span className="text-amber-500">2240 (Crítico)</span>
                  <span>2500</span>
                </div>
              </div>

              {/* Ti Slider (only for PI, PID) */}
              {(config.type === 'PI' || config.type === 'PID') && (
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">Tiempo Integral (Ti)</span>
                    <span className="text-sky-400 font-bold tabular-nums">
                      {config.Ti.toFixed(2)} s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={config.Ti}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, Ti: parseFloat(e.target.value) }));
                      setActivePresetKey('custom');
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                    <span>0.1 s (Rápido pero oscilatorio)</span>
                    <span>3.0 s</span>
                  </div>
                </div>
              )}

              {/* Td Slider (only for PD, PID) */}
              {(config.type === 'PD' || config.type === 'PID') && (
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">Tiempo Derivativo (Td)</span>
                    <span className="text-sky-400 font-bold tabular-nums">
                      {config.Td.toFixed(2)} s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={config.Td}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, Td: parseFloat(e.target.value) }));
                      setActivePresetKey('custom');
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                    <span>0.01 s</span>
                    <span>1.0 s</span>
                  </div>
                </div>
              )}

              {/* Filter N (only for PD, PID) */}
              {(config.type === 'PD' || config.type === 'PID') && (
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">
                      Coeficiente Filtro Derivativo (N)
                    </span>
                    <span className="text-sky-400 font-bold tabular-nums">{config.N}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="25"
                    step="1"
                    value={config.N}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, N: parseInt(e.target.value) }));
                      setActivePresetKey('custom');
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Atenúa la amplificación de alta frecuencia del ruido mioeléctrico.
                  </p>
                </div>
              )}
            </div>

            {/* Safety & Firmware Toggles */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Capas de Seguridad de Software & Hardware
              </h4>

              <label className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Protección Anti-Windup
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Evita la saturación del integrador en límites de motor
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.antiWindup}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, antiWindup: e.target.checked }))
                  }
                  className="rounded accent-sky-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Filtrado Bioeléctrico EMG
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Filtro paso-banda 20-450 Hz con detector de envolvente
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.emgFilterActive}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, emgFilterActive: e.target.checked }))
                  }
                  className="rounded accent-sky-500 w-4 h-4"
                />
              </label>
            </div>

            {/* Reset to Optimal PID */}
            <button
              onClick={() => handleSelectPreset('proposedPID')}
              className="w-full py-2.5 px-4 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Parámetros Óptimos Validados</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
