import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  Sliders,
  ExternalLink,
  Mic,
} from 'lucide-react';
import { Scene, DialogueLine } from '../../types/narrative';
import { CHARACTERS } from '../../data/storyboardData';
import { VoicePlaybackState } from '../../utils/speechSynthesis';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface CinematicPlayerProps {
  scenes: Scene[];
  currentSceneIndex: number;
  currentDialogueIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  voiceState: VoicePlaybackState;
  playbackSpeed: number;
  isMuted: boolean;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onNextScene: () => void;
  onPrevScene: () => void;
  onSelectScene: (index: number) => void;
  onSelectDialogue: (sceneIndex: number, dialogueIndex: number) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onChangeVolume: (vol: number) => void;
  onOpenInLab?: (sceneNumber: string) => void;
}

export const CinematicPlayer: React.FC<CinematicPlayerProps> = ({
  scenes,
  currentSceneIndex,
  currentDialogueIndex,
  isPlaying,
  voiceState,
  playbackSpeed,
  isMuted,
  volume,
  onPlay,
  onPause,
  onNextScene,
  onPrevScene,
  onSelectScene,
  onChangeSpeed,
  onToggleMute,
  onChangeVolume,
  onOpenInLab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  const scene = scenes[currentSceneIndex];
  const dialogue: DialogueLine | undefined = scene?.dialogues[currentDialogueIndex] || scene?.dialogues[0];
  const speaker = dialogue ? CHARACTERS[dialogue.speaker] : CHARACTERS.sofia;

  // Calculate cumulative timeline progress
  const totalDurationSec = scenes.reduce((sum, s) => sum + s.suggestedDurationSec, 0);
  const elapsedBeforeCurrentScene = scenes
    .slice(0, currentSceneIndex)
    .reduce((sum, s) => sum + s.suggestedDurationSec, 0);

  // Approximate elapsed in current scene based on dialogue index
  const totalDialoguesInScene = scene?.dialogues.length || 1;
  const sceneProgressRatio = (currentDialogueIndex + voiceState.wordProgress) / totalDialoguesInScene;
  const currentSceneElapsed = (scene?.suggestedDurationSec || 25) * sceneProgressRatio;
  const totalElapsedSec = elapsedBeforeCurrentScene + currentSceneElapsed;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Hide controls on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  // Split dialogue into words for karaoke highlight
  const words = dialogue?.text.split(' ') || [];
  const currentWordIndex = Math.floor(voiceState.wordProgress * words.length);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Cinematic Main Stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group select-none"
      >
        {/* Storyboard High-Res Image with Subtle Ken Burns Movement */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={scene.imageSrc}
            alt={scene.title}
            className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
              isPlaying ? 'scale-105 translate-y-[-1%]' : 'scale-100'
            }`}
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient vignette for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40 opacity-70" />
        </div>

        {/* Top Header Overlay: Scene Number, Title & Lab Quick-Jump */}
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-start justify-between transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md">
              ESCENA {scene.number} / 10
            </span>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
              {scene.title}
            </h2>
          </div>

          {onOpenInLab && (
            <button
              onClick={() => onOpenInLab(scene.number)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-slate-900/80 hover:bg-sky-950/90 border border-sky-700/50 rounded-lg shadow-lg backdrop-blur-md transition-all hover:scale-105"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Explorar en Laboratorio</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          )}
        </div>

        {/* Center / Bottom Speaker & Dialogue Karaoke Box */}
        <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 sm:left-8 sm:right-8 space-y-3 pointer-events-none">
          {/* Speaker Badge & Live Audio Wave */}
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg ${speaker.badgeClass}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: speaker.avatarColor }}
              />
              <span className="font-bold text-xs sm:text-sm text-white">
                {speaker.name} ({speaker.age} años)
              </span>
              <span className="text-slate-400 text-xs hidden md:inline">
                · {speaker.role}
              </span>
            </div>

            {/* Audio Wave Simulation while Voice is Speaking */}
            {isPlaying && voiceState.isPlaying && (
              <div className="flex items-end gap-1 h-5 px-2 py-1 bg-slate-950/60 rounded-md border border-slate-800 backdrop-blur-sm">
                <span className="w-1 bg-sky-400 rounded-full animate-pulse h-2" />
                <span className="w-1 bg-sky-400 rounded-full animate-bounce h-4" />
                <span className="w-1 bg-sky-400 rounded-full animate-pulse h-3" />
                <span className="w-1 bg-sky-400 rounded-full animate-bounce h-5" />
                <span className="w-1 bg-sky-400 rounded-full animate-pulse h-2.5" />
              </div>
            )}

            {dialogue?.tone && (
              <span className="text-xs text-slate-400 italic hidden sm:inline">
                [{dialogue.tone}]
              </span>
            )}
          </div>

          {/* Subtitle Box with Karaoke-Style Word Highlighting */}
          <div className="bg-slate-950/85 backdrop-blur-lg border border-slate-800/90 rounded-xl p-3.5 sm:p-5 shadow-2xl max-w-4xl pointer-events-auto">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-200">
              {words.map((word, idx) => {
                const isCurrent = idx === currentWordIndex && isPlaying;
                const isPast = idx < currentWordIndex && isPlaying;
                const isHighlightWord = dialogue?.highlightWords?.some((hw) =>
                  word.toLowerCase().includes(hw.toLowerCase())
                );

                return (
                  <span
                    key={idx}
                    className={`transition-colors duration-150 inline-block mr-1.5 ${
                      isCurrent
                        ? 'text-sky-300 font-bold scale-105 underline decoration-sky-400 underline-offset-4'
                        : isPast
                        ? 'text-slate-100 font-medium'
                        : isHighlightWord
                        ? 'text-amber-300/90 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </p>

            {/* Clinical takeaway ticker */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate pr-4 italic">
                💡 {scene.caption}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-sky-400/80">
                Paso {currentDialogueIndex + 1}/{totalDialoguesInScene}
              </span>
            </div>
          </div>
        </div>

        {/* Video Transportation Control Deck */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent border-t border-slate-800/50 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Bar (Scrubber) */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const targetSceneIdx = Math.min(
                scenes.length - 1,
                Math.floor(ratio * scenes.length)
              );
              onSelectScene(targetSceneIdx);
            }}
            className="w-full h-2 bg-slate-800 hover:h-2.5 rounded-full cursor-pointer relative mb-3 transition-all group/scrub"
          >
            {/* Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full relative"
              style={{ width: `${Math.min(100, (totalElapsedSec / totalDurationSec) * 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/scrub:scale-100 transition-transform" />
            </div>

            {/* Scene Markers */}
            <div className="absolute inset-0 flex justify-between pointer-events-none">
              {scenes.map((s, idx) => (
                <div
                  key={s.id}
                  className={`w-0.5 h-full ${
                    idx <= currentSceneIndex ? 'bg-sky-400/40' : 'bg-slate-700/60'
                  }`}
                  style={{
                    left: `${
                      (scenes
                        .slice(0, idx)
                        .reduce((acc, curr) => acc + curr.suggestedDurationSec, 0) /
                        totalDurationSec) *
                      100
                    }%`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Transport Buttons Row */}
          <div className="flex items-center justify-between gap-3 text-white">
            {/* Left Controls: Prev, Play/Pause, Next, Time */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={onPrevScene}
                disabled={currentSceneIndex === 0 && currentDialogueIndex === 0}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Escena anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={isPlaying ? onPause : onPlay}
                className="p-2 sm:p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-full shadow-lg hover:shadow-sky-500/30 transition-transform hover:scale-105"
                title={isPlaying ? 'Pausa' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={onNextScene}
                disabled={currentSceneIndex === scenes.length - 1 && currentDialogueIndex === (scene?.dialogues.length || 1) - 1}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Siguiente escena"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="text-xs font-mono text-slate-300 tabular-nums ml-2">
                <span>{formatTime(totalElapsedSec)}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{formatTime(totalDurationSec)}</span>
              </div>
            </div>

            {/* Right Controls: Volume, Speed, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Volume & Mute */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleMute}
                  className="p-1.5 text-slate-300 hover:text-white transition-colors"
                  title={isMuted ? 'Activar voz' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 hidden sm:block"
                />
              </div>

              {/* Playback Speed */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
                {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onChangeSpeed(spd)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      playbackSpeed === spd
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Voice Config (Martín vs Gastón differentiation) */}
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 rounded-lg transition-colors"
                title="Configuración de Voces: Martín vs Gastón"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-mono text-[11px]">Voces</span>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Customization Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Filmstrip Scene Navigation Drawer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Guion Gráfico · 10 Escenas de la Actividad 5</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Haz clic en una miniatura para saltar a la escena
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {scenes.map((s, idx) => {
            const isCurrent = idx === currentSceneIndex;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScene(idx)}
                className={`relative aspect-video rounded-lg overflow-hidden border text-left transition-all group ${
                  isCurrent
                    ? 'border-sky-400 ring-2 ring-sky-400/40 scale-[1.02] shadow-lg'
                    : 'border-slate-800 hover:border-slate-600 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={s.imageSrc}
                  alt={s.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-950/80 rounded text-sky-300">
                  {s.number}
                </div>
                <div className="absolute bottom-1 left-1 right-1 text-[10px] text-slate-200 font-medium truncate">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
