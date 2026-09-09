import React, { useEffect, useState, useRef } from 'react';
import { EvaluationResult, PracticeTemplate } from '@/types';
import { CancelCrossIcon, VolumeUpIcon, SparklesIcon, RefreshCwIcon } from './Icons';
import { speakText, stopSpeaking } from '@/lib/speechSynthesis';
import { triggerConfetti } from '@/lib/confetti';
import { sounds } from '@/lib/soundEffects';

interface FeedbackModalProps {
  evaluation: EvaluationResult;
  template: PracticeTemplate;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  evaluation,
  onClose,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play celebratory sound & confetti on positive evaluation
    if (evaluation.isCorrect && evaluation.score >= 50) {
      sounds.playSuccess();
      triggerConfetti();
    }

    // Auto-speak feedback after a short delay
    const timer = setTimeout(() => {
      setIsSpeaking(true);
      speakText(evaluation.feedbackMessage, () => {
        setIsSpeaking(false);
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      stopSpeaking();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [evaluation]);

  const handleToggleSpeak = () => {
    if (isPlayingUserAudio && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingUserAudio(false);
    }

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(evaluation.feedbackMessage, () => setIsSpeaking(false));
    }
  };

  const handleToggleUserAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }

    if (!audioPlayerRef.current && evaluation.userAudioUrl) {
      const audio = new Audio(evaluation.userAudioUrl);
      audio.onended = () => setIsPlayingUserAudio(false);
      audio.onerror = () => setIsPlayingUserAudio(false);
      audioPlayerRef.current = audio;
    }

    if (audioPlayerRef.current) {
      if (isPlayingUserAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingUserAudio(false);
      } else {
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current
          .play()
          .then(() => setIsPlayingUserAudio(true))
          .catch(() => setIsPlayingUserAudio(false));
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      {/* Container matching Image 3 */}
      <div className="relative w-full max-w-2xl sm:max-w-3xl">
        {/* RED CLOSE "X" CIRCLE BUTTON AT TOP-RIGHT OVERLAPPING CORNER */}
        <button
          onClick={() => {
            sounds.playClick();
            stopSpeaking();
            if (audioPlayerRef.current) audioPlayerRef.current.pause();
            onClose();
          }}
          id="close-feedback-btn"
          aria-label="Close feedback modal"
          className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 z-20 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f43f5e] text-white border-2 border-white shadow-[0_4px_12px_rgba(244,63,94,0.5)] hover:bg-[#e11d48] hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#f43f5e]/50"
        >
          <CancelCrossIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </button>

        {/* MAIN YELLOWISH/CREAM FEEDBACK CARD (IMAGE 3) */}
        <div className="relative w-full rounded-[28px] border-[3.5px] border-black bg-[#faedb7] p-8 sm:p-12 md:p-14 shadow-[0_12px_0_#1a1a1a] transition-all overflow-hidden">
          {/* Header Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h2
              id="feedback-title"
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-black uppercase"
            >
              FEEDBACK
            </h2>
            <div className="w-16 h-1 bg-black mx-auto mt-2 rounded-full opacity-20" />
          </div>

          {/* Core AI Feedback Message (Exact quote style from Image 3) */}
          <div className="my-6 sm:my-8 text-center">
            <p className="text-zinc-900 font-sans text-lg sm:text-2xl md:text-[25px] leading-relaxed font-normal">
              {evaluation.feedbackMessage}
            </p>
          </div>

          {/* Spoken Transcript pill & Audio Playback buttons */}
          <div className="mt-8 pt-6 border-t-2 border-black/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Audio Voice buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleToggleSpeak}
                id="speak-feedback-btn"
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-blue-600 text-white shadow-md animate-pulse'
                    : 'bg-white/80 text-zinc-900 hover:bg-white shadow-sm'
                }`}
              >
                <VolumeUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{isSpeaking ? 'Speaking...' : 'Listen to AI Tutor'}</span>
              </button>

              {evaluation.userAudioUrl && (
                <button
                  onClick={handleToggleUserAudio}
                  id="play-user-recording-btn"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isPlayingUserAudio
                      ? 'bg-emerald-600 text-white shadow-md animate-pulse'
                      : 'bg-white/80 text-zinc-900 hover:bg-white shadow-sm'
                  }`}
                >
                  <span className="text-sm">🎤</span>
                  <span>{isPlayingUserAudio ? 'Playing...' : 'Play Your Voice'}</span>
                </button>
              )}
            </div>

            {/* Score & Fluency Badges */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 bg-white/80 border-2 border-black px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm text-zinc-900 shadow-sm">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                Score: {evaluation.score}%
              </span>
              <span className="bg-white/80 border-2 border-black px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm text-zinc-900 shadow-sm">
                Fluency: {evaluation.fluencyScore}%
              </span>
            </div>
          </div>

          {/* Transcript Details */}
          {evaluation.rawTranscript && (
            <div className="mt-4 bg-white/60 rounded-2xl p-4 border border-black/15">
              <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                Your Spoken Words:
              </div>
              <p className="text-sm sm:text-base text-zinc-800 italic">
                &ldquo;{evaluation.rawTranscript}&rdquo;
              </p>
            </div>
          )}

          {/* Action Button to Practice Again */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                sounds.playClick();
                stopSpeaking();
                if (audioPlayerRef.current) audioPlayerRef.current.pause();
                onClose();
              }}
              id="try-again-btn"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-black text-white font-extrabold text-base tracking-wider uppercase shadow-[0_4px_0_#444] hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCwIcon className="w-5 h-5" />
              Practice Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
