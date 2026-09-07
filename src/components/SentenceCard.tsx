import React from 'react';
import { PracticeTemplate } from '@/types';

interface SentenceCardProps {
  template: PracticeTemplate;
  isRecording: boolean;
  liveTranscript?: string;
  volumeLevel?: number;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  template,
  isRecording,
  liveTranscript = '',
  volumeLevel = 0,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      {/* Outer border wrapper matching the purple highlight in image 2 when recording */}
      <div
        className={`relative rounded-[32px] p-1 transition-all duration-300 ${
          isRecording
            ? 'ring-4 ring-[#8b5cf6]/80 shadow-[0_0_25px_rgba(139,92,246,0.35)]'
            : 'ring-0 shadow-sm'
        }`}
      >
        {/* Main Yellowish/Cream Card */}
        <div className="relative w-full rounded-[28px] border-[3.5px] border-black bg-[#faedb7] p-6 sm:p-10 md:p-12 shadow-[0_6px_0_#1a1a1a] transition-all">
          {/* Subtle live recording badge */}
          {isRecording && (
            <div className="absolute top-4 right-5 flex items-center gap-2 bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LISTENING
            </div>
          )}

          {/* Sentence Prompt Text */}
          <div className="text-zinc-900 font-sans text-lg sm:text-2xl md:text-[26px] leading-[1.8] sm:leading-[2.2] tracking-normal font-medium select-none">
            {template.promptText}
          </div>

          {/* Real-time speech transcript feedback banner when student is speaking */}
          {isRecording && liveTranscript && (
            <div className="mt-6 pt-4 border-t-2 border-black/15 flex items-start gap-2.5">
              <div className="text-xs uppercase font-bold text-zinc-600 tracking-wider pt-0.5 whitespace-nowrap">
                You said:
              </div>
              <p className="text-sm sm:text-base font-medium text-blue-900 bg-white/70 px-3 py-1.5 rounded-xl border border-black/10 italic flex-1">
                &ldquo;{liveTranscript}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
