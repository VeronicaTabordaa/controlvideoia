export type SpeakerId = 'martin' | 'sofia' | 'gaston';

export interface CharacterProfile {
  id: SpeakerId;
  name: string;
  age: number;
  role: string;
  description: string;
  avatarColor: string;
  badgeClass: string;
  pitch: number; // For SpeechSynthesis
  rate: number;
}

export interface DialogueLine {
  id: string;
  speaker: SpeakerId;
  text: string;
  tone?: string;
  highlightWords?: string[];
  durationMs: number;
}

export interface Scene {
  id: number;
  number: string;
  title: string;
  suggestedDurationSec: number;
  imageSrc: string;
  caption: string;
  laptopSummary: string;
  controlTopic: string;
  dialogues: DialogueLine[];
  focusRegion: {
    x: number; // percentage 0-100
    y: number;
    scale: number;
  };
}
