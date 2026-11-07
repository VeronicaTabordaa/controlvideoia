import React, { useState, useEffect } from 'react';
import { Volume2, Play, Check, X, RotateCcw, Mic, User } from 'lucide-react';
import { CHARACTERS } from '../../data/storyboardData';
import { speechNarrator, SpeakerAcoustics } from '../../utils/speechSynthesis';
import { SpeakerId } from '../../types/narrative';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [martinAcoustics, setMartinAcoustics] = useState<SpeakerAcoustics>(() =>
    speechNarrator.getAcoustics('martin')
  );
  const [gastonAcoustics, setGastonAcoustics] = useState<SpeakerAcoustics>(() =>
    speechNarrator.getAcoustics('gaston')
  );
  const [sofiaAcoustics, setSofiaAcoustics] = useState<SpeakerAcoustics>(() =>
    speechNarrator.getAcoustics('sofia')
  );

  useEffect(() => {
    if (isOpen) {
      setVoices(speechNarrator.getAvailableVoices());
      setMartinAcoustics(speechNarrator.getAcoustics('martin'));
      setGastonAcoustics(speechNarrator.getAcoustics('gaston'));
      setSofiaAcoustics(speechNarrator.getAcoustics('sofia'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (speaker: SpeakerId, updates: Partial<SpeakerAcoustics>) => {
    speechNarrator.setAcoustics(speaker, updates);
    if (speaker === 'martin') {
      setMartinAcoustics((prev) => ({ ...prev, ...updates }));
    } else if (speaker === 'gaston') {
      setGastonAcoustics((prev) => ({ ...prev, ...updates }));
    } else {
      setSofiaAcoustics((prev) => ({ ...prev, ...updates }));
    }
  };

  const handlePreview = (speaker: SpeakerId) => {
    speechNarrator.previewVoice(speaker);
  };

  const handleResetDefaults = () => {
    handleUpdate('martin', { pitch: 1.15, rate: 1.02, voiceURI: null });
    handleUpdate('gaston', { pitch: 0.60, rate: 0.86, voiceURI: null });
    handleUpdate('sofia', { pitch: 1.28, rate: 1.04, voiceURI: null });
  };

  const spanishVoices = voices.filter((v) => v.lang.startsWith('es'));
  const selectableVoices = spanishVoices.length > 0 ? spanishVoices : voices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Configuración y Diferenciación de Voces
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Se han asignado perfiles acústicos marcadamente distintos para que la voz de <strong>Gastón (kinesiólogo, 42 años)</strong> suene barítona, profunda y pausada, mientras que la de <strong>Martín (paciente, 34 años)</strong> suena como un tenor ágil y enérgico.
        </p>

        {/* Character Voice Cards */}
        <div className="space-y-4">
          {/* Gaston */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                <div>
                  <h4 className="text-sm font-bold text-white">Gastón (42 años)</h4>
                  <p className="text-[11px] text-emerald-400">Barítono Maduro / Kinesiólogo</p>
                </div>
              </div>
              <button
                onClick={() => handlePreview('gaston')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Escuchar a Gastón</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between font-mono mb-1 text-slate-400">
                  <span>Tono (Pitch grave):</span>
                  <span className="text-emerald-400 font-bold">{gastonAcoustics.pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={gastonAcoustics.pitch}
                  onChange={(e) =>
                    handleUpdate('gaston', { pitch: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono mb-1 text-slate-400">
                  <span>Velocidad (Pausada):</span>
                  <span className="text-emerald-400 font-bold">{gastonAcoustics.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.2"
                  step="0.05"
                  value={gastonAcoustics.rate}
                  onChange={(e) =>
                    handleUpdate('gaston', { rate: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-400"
                />
              </div>
            </div>

            {selectableVoices.length > 1 && (
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Voz del sistema asignada a Gastón:
                </label>
                <select
                  value={gastonAcoustics.voiceURI || ''}
                  onChange={(e) =>
                    handleUpdate('gaston', { voiceURI: e.target.value || null })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="">(Automática: Segunda voz masculina / Barítono)</option>
                  {selectableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Martin */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-sky-400 ring-2 ring-sky-400/20" />
                <div>
                  <h4 className="text-sm font-bold text-white">Martín (34 años)</h4>
                  <p className="text-[11px] text-sky-400">Tenor Juvenil / Diseñador Gráfico</p>
                </div>
              </div>
              <button
                onClick={() => handlePreview('martin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Escuchar a Martín</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between font-mono mb-1 text-slate-400">
                  <span>Tono (Pitch agudo/tenor):</span>
                  <span className="text-sky-400 font-bold">{martinAcoustics.pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.05"
                  value={martinAcoustics.pitch}
                  onChange={(e) =>
                    handleUpdate('martin', { pitch: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono mb-1 text-slate-400">
                  <span>Velocidad (Dinámica):</span>
                  <span className="text-sky-400 font-bold">{martinAcoustics.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.05"
                  value={martinAcoustics.rate}
                  onChange={(e) =>
                    handleUpdate('martin', { rate: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-400"
                />
              </div>
            </div>

            {selectableVoices.length > 1 && (
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Voz del sistema asignada a Martín:
                </label>
                <select
                  value={martinAcoustics.voiceURI || ''}
                  onChange={(e) =>
                    handleUpdate('martin', { voiceURI: e.target.value || null })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="">(Automática: Primera voz masculina / Tenor)</option>
                  {selectableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sofia */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-purple-400 ring-2 ring-purple-400/20" />
                <div>
                  <h4 className="text-sm font-bold text-white">Sofía (25 años)</h4>
                  <p className="text-[11px] text-purple-400">Femenino Claro / Bioingeniera</p>
                </div>
              </div>
              <button
                onClick={() => handlePreview('sofia')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold rounded-lg transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Escuchar a Sofía</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Valores Acústicos Óptimos</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
