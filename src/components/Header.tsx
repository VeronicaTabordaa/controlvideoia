import React from 'react';
import { Play, Pause, Activity, Film, FileText, UserCheck, Volume2, VolumeX, Captions } from 'lucide-react';

interface HeaderProps {
  activeTab: 'video' | 'lab' | 'script' | 'case';
  setActiveTab: (tab: 'video' | 'lab' | 'script' | 'case') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  currentSceneNumber: string;
  showSubtitles?: boolean;
  onToggleSubtitles?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPlaying,
  onTogglePlay,
  isMuted,
  onToggleMute,
  currentSceneNumber,
  showSubtitles,
  onToggleSubtitles,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 md:gap-8 transition-colors">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('video');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-sky-400 transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
          <span>Entre la Precisión y el Riesgo</span>
        </a>
      </div>

      {/* Zone 2: Navigation Links (Single-line, clear active states) */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'video'
              ? 'bg-sky-500/15 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Video Narrativo</span>
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'lab'
              ? 'bg-sky-500/15 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Laboratorio de Control</span>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'script'
              ? 'bg-sky-500/15 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Guion & Fundamentos</span>
        </button>

        <button
          onClick={() => setActiveTab('case')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'case'
              ? 'bg-sky-500/15 text-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Equipo & Paciente</span>
        </button>
      </nav>

      {/* Zone 3: Quick Action & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {activeTab === 'video' && onToggleSubtitles && (
          <button
            onClick={onToggleSubtitles}
            title={showSubtitles ? 'Ocultar tarjeta de transcripción' : 'Mostrar tarjeta de transcripción'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showSubtitles
                ? 'bg-sky-500/25 text-sky-300 border-sky-500/60 shadow-sm'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-600'
            }`}
          >
            <Captions className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">
              {showSubtitles ? 'Ocultar Transcripción' : 'Mostrar Transcripción'}
            </span>
            <span className="sm:hidden">
              {showSubtitles ? 'Ocultar' : 'Texto'}
            </span>
          </button>
        )}

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Activar voz' : 'Silenciar voz'}
          className={`p-2 rounded-lg border transition-colors ${
            isMuted
              ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
              : 'bg-slate-900 border-slate-700 text-sky-400 hover:text-sky-300'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm hover:shadow-sky-500/25 transition-all whitespace-nowrap"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Reproducir</span>
            </>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono text-sky-200/80">
            [E{currentSceneNumber}]
          </span>
        </button>
      </div>
    </header>
  );
};
