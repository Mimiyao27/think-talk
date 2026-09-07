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
  const [showHelperModal, setShowHelperModal] = useState(false);

  const {
    isListening,
    fullLiveTranscript,
    volumeLevel,
    startListening,
    stopListening,
    cancelListening,
    setTranscript,
    hasMicPermission,
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
    
    // Stop recording and retrieve captured speech
    const recordedText = stopListening();
    const finalTranscript = simulatedSpeech.trim() || recordedText.trim();
    
    setAppState('processing');

    try {
      // Call Evaluation API
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalTranscript,
          templateId: selectedTemplate.id,
        }),
      });

      if (res.ok) {
        const data: EvaluationResult = await res.json();
        setEvaluation(data);
      } else {
        // Local evaluation fallback
        const localEval = evaluateSpeechTranscript(finalTranscript, selectedTemplate);
        setEvaluation(localEval);
      }
    } catch {
      // Offline / network fallback
      const localEval = evaluateSpeechTranscript(finalTranscript, selectedTemplate);
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

        {/* PROMPT SENTENCE CARD (Image 1 & Image 2) */}
        <SentenceCard
          template={selectedTemplate}
          isRecording={appState === 'recording'}
          liveTranscript={simulatedSpeech || fullLiveTranscript}
          volumeLevel={volumeLevel}
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
          <div className="bg-white/70 border border-black/10 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
              <span>💡 Quick Test Speech:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (appState !== 'recording') handleStartRecord();
                  handleInjectSampleSpeech(selectedTemplate.fullExample);
                }}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-black/15 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Fill a complete sample introduction"
              >
                ✨ Load Perfect Answer
              </button>
              <button
                onClick={() => {
                  if (appState !== 'recording') handleStartRecord();
                  handleInjectSampleSpeech("Hi everyone! I'm Alex. My hobbies are reading and gaming.");
                }}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 border border-black/15 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Fill a partial introduction to test partial AI feedback"
              >
                📝 Load Partial Answer
              </button>
            </div>
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
