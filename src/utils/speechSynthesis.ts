import { SpeakerId } from '../types/narrative';
import { CHARACTERS } from '../data/storyboardData';

export interface VoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSpeaker: SpeakerId | null;
  currentText: string;
  charIndex: number;
  wordProgress: number; // 0 to 1
}

export interface SpeakerAcoustics {
  pitch: number;
  rate: number;
  voiceURI: string | null;
}

class SpeechNarrator {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private fallbackTimer: number | null = null;
  private isMuted: boolean = false;
  private playbackRate: number = 1.0;
  private volume: number = 1.0;
  private onStateChangeCallback: ((state: VoicePlaybackState) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;

  // Custom acoustic profiles per speaker
  private acoustics: Record<SpeakerId, SpeakerAcoustics> = {
    martin: {
      pitch: 1.15, // Tenor juvenil, ágil y expresivo (34 años)
      rate: 1.02,
      voiceURI: null,
    },
    sofia: {
      pitch: 1.28, // Femenino claro, técnico y pedagógico (25 años)
      rate: 1.04,
      voiceURI: null,
    },
    gaston: {
      pitch: 0.60, // Barítono profundo, clínico, maduro y pausado (42 años)
      rate: 0.86,
      voiceURI: null,
    },
  };

  private state: VoicePlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentSpeaker: null,
    currentText: '',
    charIndex: 0,
    wordProgress: 0,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.synth) {
      this.loadVoices();
    }
    return this.voices;
  }

  public getAcoustics(speaker: SpeakerId): SpeakerAcoustics {
    return { ...this.acoustics[speaker] };
  }

  public setAcoustics(speaker: SpeakerId, updates: Partial<SpeakerAcoustics>) {
    this.acoustics[speaker] = {
      ...this.acoustics[speaker],
      ...updates,
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth && this.state.isPlaying) {
      this.synth.cancel();
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1.0, vol));
  }

  public subscribe(callback: (state: VoicePlaybackState) => void) {
    this.onStateChangeCallback = callback;
    callback(this.state);
  }

  private updateState(partial: Partial<VoicePlaybackState>) {
    this.state = { ...this.state, ...partial };
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  public selectVoiceForSpeaker(speaker: SpeakerId): SpeechSynthesisVoice | undefined {
    if (!this.voices.length && this.synth) {
      this.loadVoices();
    }

    // Check custom override by URI
    const customUri = this.acoustics[speaker]?.voiceURI;
    if (customUri) {
      const found = this.voices.find(v => v.voiceURI === customUri);
      if (found) return found;
    }

    const spanishVoices = this.voices.filter(v => v.lang.startsWith('es'));
    const pool = spanishVoices.length > 0 ? spanishVoices : this.voices;

    if (!pool.length) return undefined;

    // Filter female and male candidate lists
    const femaleVoices = pool.filter(v =>
      /female|mujer|paulina|mónica|monica|helena|sabina|laura|elena|victoria|lucia|lucía|soledad|carolina/i.test(
        v.name
      )
    );
    const maleVoices = pool.filter(v =>
      /male|hombre|diego|jorge|carlos|miguel|pablo|raul|raúl|juan|alberto|antonio|david|enrique/i.test(
        v.name
      )
    );

    if (speaker === 'sofia') {
      return femaleVoices[0] || pool[0];
    } else if (speaker === 'martin') {
      // Martín: younger male voice or first male voice
      if (maleVoices.length > 1) {
        // Pick first male voice
        return maleVoices[0];
      }
      return pool[0];
    } else {
      // Gastón: distinctly DIFFERENT male voice if more than 1 voice exists!
      if (maleVoices.length > 1) {
        // Pick second male voice so Gaston NEVER shares the voice of Martin
        return maleVoices[1];
      }
      if (pool.length > 1) {
        // If only 1 explicitly labeled male voice, pick second pool voice for Gaston
        return pool[pool.length - 1];
      }
      return pool[0];
    }
  }

  public speak(
    speaker: SpeakerId,
    text: string,
    estimatedDurationMs: number,
    onComplete?: () => void
  ) {
    this.stop();
    this.onCompleteCallback = onComplete || null;

    const acoustic = this.acoustics[speaker] || {
      pitch: CHARACTERS[speaker]?.pitch || 1.0,
      rate: CHARACTERS[speaker]?.rate || 1.0,
      voiceURI: null,
    };
    const effectiveDuration = estimatedDurationMs / this.playbackRate;

    this.updateState({
      isPlaying: true,
      isPaused: false,
      currentSpeaker: speaker,
      currentText: text,
      charIndex: 0,
      wordProgress: 0,
    });

    const words = text.split(/\s+/);
    const totalWords = words.length;
    let wordIndex = 0;

    // Use Web Speech if available and unmuted
    if (this.synth && !this.isMuted) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-AR';
        const matchedVoice = this.selectVoiceForSpeaker(speaker);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        // Apply starkly distinct acoustic parameters
        utterance.pitch = acoustic.pitch;
        utterance.rate = acoustic.rate * this.playbackRate;
        utterance.volume = this.volume;

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            wordIndex++;
            const progress = Math.min(1, wordIndex / Math.max(1, totalWords));
            this.updateState({
              charIndex: event.charIndex,
              wordProgress: progress,
            });
          }
        };

        utterance.onend = () => {
          this.finishLine();
        };

        utterance.onerror = () => {
          this.startVisualTimer(effectiveDuration, totalWords);
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
        return;
      } catch {
        // Fallback below
      }
    }

    // Fallback: visual timer and word highlighting progression
    this.startVisualTimer(effectiveDuration, totalWords);
  }

  public previewVoice(speaker: SpeakerId, sampleText?: string) {
    const samples: Record<SpeakerId, string> = {
      martin: sampleText || 'Hola, soy Martín. Como diseñador gráfico necesito rapidez pero sin que la prótesis vibre.',
      gaston: sampleText || 'Hola Martín, soy Gastón. Como kinesiólogo vamos a priorizar movimientos seguros y controlados.',
      sofia: sampleText || 'Hola a ambos, soy Sofía. Rediseñamos el control PID para garantizar estabilidad y precisión.',
    };

    this.speak(speaker, samples[speaker], 4000);
  }

  private startVisualTimer(durationMs: number, totalWords: number) {
    const startTime = Date.now();
    const intervalMs = 60;

    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
    }

    this.fallbackTimer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const currentWordIdx = Math.floor(progress * totalWords);

      this.updateState({
        wordProgress: progress,
        charIndex: currentWordIdx,
      });

      if (progress >= 1) {
        if (this.fallbackTimer) {
          window.clearInterval(this.fallbackTimer);
          this.fallbackTimer = null;
        }
        this.finishLine();
      }
    }, intervalMs);
  }

  private finishLine() {
    this.updateState({
      isPlaying: false,
      isPaused: false,
      wordProgress: 1,
    });
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  public pause() {
    if (this.synth && this.state.isPlaying && !this.state.isPaused) {
      this.synth.pause();
    }
    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.updateState({ isPaused: true });
  }

  public resume() {
    if (this.synth && this.state.isPaused) {
      this.synth.resume();
    }
    this.updateState({ isPaused: false });
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.currentUtterance = null;
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentSpeaker: null,
      currentText: '',
      charIndex: 0,
      wordProgress: 0,
    });
  }
}

export const speechNarrator = new SpeechNarrator();
