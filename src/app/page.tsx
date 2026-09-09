'use client';

import React, { useState } from 'react';
import { AppState, EvaluationResult, PracticeTemplate } from '@/types';
import { PRACTICE_TEMPLATES } from '@/lib/templates';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { evaluateSpeechTranscript } from '@/lib/evaluator';
import { sounds } from '@/lib/soundEffects';
import { Header } from '@/components/Header';
import { SentenceCard } from '@/components/SentenceCard';
import { AudioControls } from '@/components/AudioControls';
import { FeedbackModal } from '@/components/FeedbackModal';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<PracticeTemplate>(PRACTICE_TEMPLATES[0]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [simulatedSpeech, setSimulatedSpeech] = useState('');

  const {
    volumeLevel,
    startListening,
    stopListening,
    cancelListening,
    setTranscript,
    fullLiveTranscript,
    hasMicPermission,
    micError,
  } = useSpeechRecognition();

  // 1. START RECORDING (Transitions from Image 1 -> Image 2)
  const handleStartRecord = async () => {
    if (soundEnabled) sounds.playStartRecord();
    setSimulatedSpeech('');
    await startListening();
    setAppState('recording');
  };

  // 2. CANCEL RECORDING (Transitions from Image 2 -> Image 1)
  const handleCancelRecord = () => {
    if (soundEnabled) sounds.playCancel();
    cancelListening();
    setSimulatedSpeech('');
    setAppState('idle');
  };

  // 3. SAVE RECORDING (Transitions from Image 2 -> Processing -> Image 3 Feedback)
  const handleSaveRecord = async () => {
    if (soundEnabled) sounds.playClick();

    // Stop recording and retrieve captured speech & audio blob/base64
    const recordingResult = await stopListening();
    const finalTranscript = simulatedSpeech.trim() || recordingResult.transcript.trim();

    setAppState('processing');

    try {
      // Call Evaluation API
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalTranscript,
          templateId: selectedTemplate.id,
          audioBase64: recordingResult.audioBase64,
          audioMimeType: recordingResult.mimeType,
        }),
      });

      if (res.ok) {
        const data: EvaluationResult = await res.json();
        if (recordingResult.audioUrl) {
          data.userAudioUrl = recordingResult.audioUrl;
        }
        setEvaluation(data);
      } else {
        // Local evaluation fallback
        const localEval = evaluateSpeechTranscript(finalTranscript, selectedTemplate);
        if (recordingResult.audioUrl) {
          localEval.userAudioUrl = recordingResult.audioUrl;
        }
        setEvaluation(localEval);
      }
    } catch {
      // Offline / network fallback
      const localEval = evaluateSpeechTranscript(finalTranscript, selectedTemplate);
      if (recordingResult.audioUrl) {
        localEval.userAudioUrl = recordingResult.audioUrl;
      }
      setEvaluation(localEval);
    } finally {
      setAppState('feedback');
    }
  };

  // 4. CLOSE FEEDBACK MODAL (Transitions from Image 3 -> Image 1)
  const handleCloseFeedback = () => {
    setEvaluation(null);
    setAppState('idle');
  };

  // Quick simulation helper for instant testing
  const handleInjectSampleSpeech = (sampleText: string) => {
    setSimulatedSpeech(sampleText);
    setTranscript(sampleText);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#fafaf9] text-zinc-900 font-sans select-none overflow-x-hidden">
      {/* Top Navigation */}
      <Header
        selectedTemplate={selectedTemplate}
        onSelectTemplate={(tpl) => {
          setSelectedTemplate(tpl);
          if (appState === 'recording') {
            cancelListening();
            setAppState('idle');
          }
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Speaking Stage */}
      <div className="flex-1 flex flex-col justify-center items-center py-8 sm:py-12 md:py-16">
        {/* Step Instructions Banner */}
        <div className="text-center mb-6 px-4">
          <div className="inline-flex items-center gap-2 bg-amber-100/80 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-3 shadow-xs">
            <span>🎯 Activity: Read the sentence and speak your answers</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900">
            {selectedTemplate.title} Practice
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base mt-1 max-w-lg mx-auto font-medium">
            Fill in each blank line with your personal details as you speak.
          </p>
        </div>

        {/* Microphone Permission / Insecure Origin Notice if blocked */}
        {(micError || hasMicPermission === false) && appState === 'idle' && (
          <div className="w-full max-w-xl mx-auto px-4 mb-4">
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl p-4 shadow-sm text-sm">
              <div className="font-bold flex items-center gap-2 text-rose-800 mb-1">
                <span>⚠️ Microphone Access Alert</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
                {micError || 'Microphone access is not enabled.'}
              </p>
              <div className="mt-2 text-xs text-rose-600 font-medium">
                💡 <strong>Tip for Mobile:</strong> Mobile browsers require <strong>HTTPS</strong> or <strong>localhost</strong> to access the microphone. If connecting from a phone on local WiFi, use an HTTPS tunnel or grant microphone permissions in browser settings.
              </div>
            </div>
          </div>
        )}

        {/* PROMPT SENTENCE CARD (Image 1 & Image 2) */}
        <SentenceCard
          template={selectedTemplate}
          isRecording={appState === 'recording'}
          liveTranscript={simulatedSpeech || fullLiveTranscript}
        />

        {/* AUDIO ACTION CONTROLS */}
        <AudioControls
          appState={appState}
          volumeLevel={volumeLevel}
          onStartRecord={handleStartRecord}
          onCancelRecord={handleCancelRecord}
          onSaveRecord={handleSaveRecord}
        />

        {/* Quick Testing Bar for convenience */}
        <div className="w-full max-w-xl mx-auto px-4 mt-2">
          <div className="bg-white/70 border border-black/10 rounded-2xl p-3 shadow-xs flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
              <span>💡 Quick Test Speech:</span>
            </div>
            <button
              onClick={() => {
                if (appState !== 'recording') handleStartRecord();
                handleInjectSampleSpeech(selectedTemplate.fullExample);
              }}
              className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-black/15 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Fill a complete sample introduction"
            >
              ✨ Load Sample Answer
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK POPUP MODAL (Image 3) */}
      {appState === 'feedback' && evaluation && (
        <FeedbackModal
          evaluation={evaluation}
          template={selectedTemplate}
          onClose={handleCloseFeedback}
        />
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-500 border-t border-black/5 bg-white/40">
        ThinkTalk Interactive Speech Engine • Next.js + Web Speech API + AI Feedback
      </footer>
    </main>
  );
}
