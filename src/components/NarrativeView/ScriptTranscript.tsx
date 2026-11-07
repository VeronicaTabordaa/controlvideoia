import React, { useState } from 'react';
import { Scene, SpeakerId } from '../../types/narrative';
import { CHARACTERS } from '../../data/storyboardData';
import { Play, Sparkles, Filter, BookOpen, AlertCircle } from 'lucide-react';

interface ScriptTranscriptProps {
  scenes: Scene[];
  onPlayScene: (sceneIndex: number) => void;
}

export const ScriptTranscript: React.FC<ScriptTranscriptProps> = ({
  scenes,
  onPlayScene,
}) => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerId | 'all'>('all');
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(1);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>GUION NARRATIVO COMPLETO · ACTIVIDAD 5</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              «Entre la precisión y el riesgo»
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Diálogo interdisciplinario de 4 a 5 minutos entre el paciente Martín (34), la bioingeniera Sofía (25) y el kinesiólogo Gastón (42).
            </p>
          </div>

          {/* Speaker Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Filtrar:</span>
            </span>
            {(['all', 'martin', 'sofia', 'gaston'] as const).map((spk) => (
              <button
                key={spk}
                onClick={() => setSelectedSpeaker(spk)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedSpeaker === spk
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spk === 'all'
                  ? 'Todos'
                  : spk === 'martin'
                  ? 'Martín'
                  : spk === 'sofia'
                  ? 'Sofía'
                  : 'Gastón'}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Note */}
        <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-start gap-3 text-xs text-amber-200/90">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">
              Nota académica para la entrega:
            </span>{' '}
            Las escenas 9 y 10 representan el resultado esperado de una validación satisfactoria, no una mejora clínica ya demostrada. Las cifras de mejora porcentual son ilustrativas y deberán reemplazarse por los ensayos efectivamente validados en MATLAB y en la prótesis física.
          </div>
        </div>
      </div>

      {/* Chronological Scene Script Cards */}
      <div className="space-y-4">
        {scenes.map((scene, sceneIdx) => {
          const isExpanded = expandedSceneId === scene.id;
          const filteredDialogues =
            selectedSpeaker === 'all'
              ? scene.dialogues
              : scene.dialogues.filter((d) => d.speaker === selectedSpeaker);

          if (selectedSpeaker !== 'all' && filteredDialogues.length === 0) {
            return null;
          }

          return (
            <div
              key={scene.id}
              className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
            >
              {/* Scene Accordion Header */}
              <div
                onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <img
                      src={scene.imageSrc}
                      alt={scene.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">
                        ESCENA {scene.number}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {scene.suggestedDurationSec} s
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {scene.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayScene(sceneIdx);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-all"
                    title="Reproducir esta escena en el video"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Ver Escena</span>
                  </button>
                </div>
              </div>

              {/* Scene Content */}
              {isExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 space-y-4">
                  {/* Technical Summary Callout */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs text-slate-300">
                    <span className="text-sky-400 font-mono font-bold mr-2">
                      [Pizarra / Laptop]:
                    </span>
                    {scene.laptopSummary}
                  </div>

                  {/* Dialogues List */}
                  <div className="space-y-3">
                    {filteredDialogues.map((dlg) => {
                      const spk = CHARACTERS[dlg.speaker];
                      return (
                        <div
                          key={dlg.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: spk.avatarColor }}
                              />
                              <span className="font-bold text-white">
                                {spk.name} ({spk.age} años)
                              </span>
                              <span className="text-slate-400">· {spk.role}</span>
                            </div>
                            {dlg.tone && (
                              <span className="text-slate-500 italic text-[11px]">
                                {dlg.tone}
                              </span>
                            )}
                          </div>

                          <p className="text-sm leading-relaxed text-slate-200">
                            «{dlg.text}»
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
