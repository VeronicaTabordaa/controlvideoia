import React from 'react';
import { CHARACTERS } from '../data/storyboardData';
import { UserCheck, ShieldAlert, Cpu, HeartPulse, Sparkles, CheckCircle2 } from 'lucide-react';

interface ClinicalCaseModalProps {
  onStartVideo: () => void;
  onOpenLab: () => void;
}

export const ClinicalCaseModal: React.FC<ClinicalCaseModalProps> = ({
  onStartVideo,
  onOpenLab,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hero Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-2">
          <UserCheck className="w-4 h-4" />
          <span>EXPEDIENTE CLÍNICO & EQUIPO INTERDISCIPLINARIO</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Caso Clínico: Prótesis Mioeléctrica Transradial
        </h2>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Articulación entre la kinesiología y la bioingeniería para transformar un reclamo de inseguridad y retardo motor en una solución de control robusta, rápida y predecible.
        </p>
      </div>

      {/* The 3 Protagonists Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Martin */}
        <div className="bg-slate-900/70 border border-sky-800/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-lg">
              M
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Martín (34 años)</h3>
              <p className="text-xs text-sky-400 font-medium">Paciente / Diseñador Gráfico</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              <strong className="text-white">Antecedente:</strong> Amputación de miembro superior derecho a nivel transradial producto de un accidente de tránsito.
            </p>
            <p>
              <strong className="text-white">Demanda funcional:</strong> Requiere prensión fina para trabajar largas horas con el mouse de diseño y seguridad para tomar tazas o viajar en transporte público sin cierres bruscos.
            </p>
          </div>
        </div>

        {/* Sofia */}
        <div className="bg-slate-900/70 border border-purple-800/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-lg">
              S
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sofía (25 años)</h3>
              <p className="text-xs text-purple-400 font-medium">Bioingeniera de Control</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              <strong className="text-white">Responsabilidad:</strong> Modelado matemático de la prótesis (<span className="font-mono text-purple-300">G(s) = 1/((s+4)(s+6)(s+10))</span>), análisis de estabilidad por LGR y sintonización del PID con derivada filtrada.
            </p>
            <p>
              <strong className="text-white">Enfoque:</strong> Prioriza márgenes de estabilidad seguros frente al límite crítico de K=2240 y la atenuación del ruido mioeléctrico.
            </p>
          </div>
        </div>

        {/* Gaston */}
        <div className="bg-slate-900/70 border border-emerald-800/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              G
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gastón (42 años)</h3>
              <p className="text-xs text-emerald-400 font-medium">Lic. en Kinesiología</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              <strong className="text-white">Especialidad:</strong> Rehabilitación funcional y adaptación protésica.
            </p>
            <p>
              <strong className="text-white">Enfoque:</strong> Traduce las variables de ingeniería en confianza del paciente, diseñando tareas progresivas desde la apertura/cierre básico hasta la manipulación de objetos frágiles.
            </p>
          </div>
        </div>
      </div>

      {/* The Technical Challenge vs The Clinical Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* The Incident & Grievance */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>El Reclamo Original y el Incidente SUBE</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Martín experimentaba un retardo frustrante al intentar accionar la mano para agarrar una taza o utilizar el mouse de su computadora. Al subir la ganancia proporcional de forma simplista para acelerarla, la prótesis comenzó a presentar vibraciones oscilatorias.
          </p>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
            «Viajando en colectivo, cuando intenté usar la SUBE, la prótesis se movió sola. Me dio miedo que volviera a pasar.»
          </div>
        </div>

        {/* The Bioengineering Solution */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>La Respuesta Bioingenieril</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            El rediseño reemplazó la simple ganancia P por un controlador PID completo que garantiza <strong className="text-white">ts ≤ 2 s</strong>, <strong className="text-white">MP ≤ 25%</strong> y <strong className="text-white">ess = 0</strong>.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong className="text-white">Derivada Filtrada (N=12):</strong> Evita que el ruido EMG dispare cierres no deseados.</li>
            <li><strong className="text-white">Anti-Windup:</strong> Clampa la acción integral en saturación de motor.</li>
            <li><strong className="text-white">Límites de Velocidad y Fuerza:</strong> Protección biomecánica del usuario.</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          onClick={onOpenLab}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
        >
          Explorar Laboratorio de Control
        </button>
        <button
          onClick={onStartVideo}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all"
        >
          Comenzar Reproducción del Video
        </button>
      </div>
    </div>
  );
};
