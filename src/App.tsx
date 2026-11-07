/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CinematicPlayer } from './components/VideoPlayer/CinematicPlayer';
import { ControlLab } from './components/ControlLab/ControlLab';
import { ScriptTranscript } from './components/NarrativeView/ScriptTranscript';
import { ClinicalCaseModal } from './components/ClinicalCaseModal';
import { STORYBOARD_SCENES } from './data/storyboardData';
import { speechNarrator, VoicePlaybackState } from './utils/speechSynthesis';

export default function App() {
  const [activeTab, setActiveTab] = useState<'video' | 'lab' | 'script' | 'case'>('video');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [labPreset, setLabPreset] = useState<string>('proposedPID');

  const [voiceState, setVoiceState] = useState<VoicePlaybackState>({
    isPlaying: false,
    isPaused: false,
    currentSpeaker: null,
    currentText: '',
    charIndex: 0,
    wordProgress: 0,
  });

  // Track playback state in ref for callbacks
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentSceneIndexRef = useRef(currentSceneIndex);
  currentSceneIndexRef.current = currentSceneIndex;

  const currentDialogueIndexRef = useRef(currentDialogueIndex);
  currentDialogueIndexRef.current = currentDialogueIndex;

  // Subscribe to speech narrator state
  useEffect(() => {
    speechNarrator.subscribe((state) => {
      setVoiceState(state);
    });
  }, []);

  // Sync mute, volume and speed
  useEffect(() => {
    speechNarrator.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    speechNarrator.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    speechNarrator.setPlaybackRate(playbackSpeed);
  }, [playbackSpeed]);

  // Play a specific dialogue line
  const speakCurrentLine = useCallback(
    (sceneIdx: number, dialogueIdx: number) => {
      const scene = STORYBOARD_SCENES[sceneIdx];
      if (!scene) return;
      const dialogue = scene.dialogues[dialogueIdx];
      if (!dialogue) return;

      speechNarrator.speak(
        dialogue.speaker,
        dialogue.text,
        dialogue.durationMs,
        () => {
          // On dialogue line complete:
          if (!isPlayingRef.current) return;

          const currentScene = STORYBOARD_SCENES[currentSceneIndexRef.current];
          if (!currentScene) return;

          if (currentDialogueIndexRef.current < currentScene.dialogues.length - 1) {
            // Next dialogue in same scene
            const nextDiag = currentDialogueIndexRef.current + 1;
            setCurrentDialogueIndex(nextDiag);
            speakCurrentLine(currentSceneIndexRef.current, nextDiag);
          } else if (currentSceneIndexRef.current < STORYBOARD_SCENES.length - 1) {
            // Next scene
            const nextScene = currentSceneIndexRef.current + 1;
            setCurrentSceneIndex(nextScene);
            setCurrentDialogueIndex(0);
            speakCurrentLine(nextScene, 0);
          } else {
            // End of storyboard
            setIsPlaying(false);
          }
        }
      );
    },
    []
  );

  // Play handler
  const handlePlay = () => {
    if (isPaused) {
      speechNarrator.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(true);
    setIsPaused(false);
    speakCurrentLine(currentSceneIndex, currentDialogueIndex);
  };

  // Pause handler
  const handlePause = () => {
    speechNarrator.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  // Next Scene
  const handleNextScene = () => {
    if (currentSceneIndex < STORYBOARD_SCENES.length - 1) {
      const nextIdx = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIdx);
      setCurrentDialogueIndex(0);
      if (isPlaying) {
        speakCurrentLine(nextIdx, 0);
      }
    }
  };

  // Prev Scene
  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      const prevIdx = currentSceneIndex - 1;
      setCurrentSceneIndex(prevIdx);
      setCurrentDialogueIndex(0);
      if (isPlaying) {
        speakCurrentLine(prevIdx, 0);
      }
    }
  };

  // Select Scene from Filmstrip / Tabs
  const handleSelectScene = (index: number) => {
    setCurrentSceneIndex(index);
    setCurrentDialogueIndex(0);
    if (isPlaying) {
      speakCurrentLine(index, 0);
    }
  };

  // Select Dialogue line directly
  const handleSelectDialogue = (sceneIndex: number, dialogueIndex: number) => {
    setCurrentSceneIndex(sceneIndex);
    setCurrentDialogueIndex(dialogueIndex);
    if (isPlaying) {
      speakCurrentLine(sceneIndex, dialogueIndex);
    }
  };

  // Jump from video player to control lab with relevant preset
  const handleOpenInLab = (sceneNumber: string) => {
    if (sceneNumber === '01') {
      setLabPreset('originalSlow');
    } else if (sceneNumber === '02' || sceneNumber === '04') {
      setLabPreset('highGainUnstable');
    } else if (sceneNumber === '03' || sceneNumber === '05' || sceneNumber === '06' || sceneNumber === '07' || sceneNumber === '08') {
      setLabPreset('proposedPID');
    } else {
      setLabPreset('proposedPID');
    }
    setActiveTab('lab');
  };

  const currentScene = STORYBOARD_SCENES[currentSceneIndex] || STORYBOARD_SCENES[0];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        onTogglePlay={isPlaying ? handlePause : handlePlay}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        currentSceneNumber={currentScene.number}
      />

      {/* Main View Area */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8">
        {activeTab === 'video' && (
          <CinematicPlayer
            scenes={STORYBOARD_SCENES}
            currentSceneIndex={currentSceneIndex}
            currentDialogueIndex={currentDialogueIndex}
            isPlaying={isPlaying}
            isPaused={isPaused}
            voiceState={voiceState}
            playbackSpeed={playbackSpeed}
            isMuted={isMuted}
            volume={volume}
            onPlay={handlePlay}
            onPause={handlePause}
            onNextScene={handleNextScene}
            onPrevScene={handlePrevScene}
            onSelectScene={handleSelectScene}
            onSelectDialogue={handleSelectDialogue}
            onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onChangeVolume={(vol) => setVolume(vol)}
            onOpenInLab={handleOpenInLab}
          />
        )}

        {activeTab === 'lab' && (
          <ControlLab initialPreset={labPreset} />
        )}

        {activeTab === 'script' && (
          <ScriptTranscript
            scenes={STORYBOARD_SCENES}
            onPlayScene={(idx) => {
              setCurrentSceneIndex(idx);
              setCurrentDialogueIndex(0);
              setActiveTab('video');
              handlePlay();
            }}
          />
        )}

        {activeTab === 'case' && (
          <ClinicalCaseModal
            onStartVideo={() => {
              setActiveTab('video');
              handlePlay();
            }}
            onOpenLab={() => {
              setLabPreset('proposedPID');
              setActiveTab('lab');
            }}
          />
        )}
      </main>

      {/* Discreet Footer adhering to anti-slop rules */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Actividad 5: «Entre la precisión y el riesgo» · Control de Sistemas
          </span>
          <span className="text-slate-400">
            Facultad de Ingeniería · Universidad Nacional de Entre Ríos (UNER)
          </span>
        </div>
      </footer>
    </div>
  );
}
