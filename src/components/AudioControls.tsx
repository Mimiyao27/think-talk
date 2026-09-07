import React from 'react';
import { MicIcon, CancelCrossIcon, SaveCheckIcon } from './Icons';
import { AppState } from '@/types';

interface AudioControlsProps {
  appState: AppState;
  volumeLevel: number;
  onStartRecord: () => void;
  onCancelRecord: () => void;
  onSaveRecord: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  appState,
  volumeLevel,
  onStartRecord,
  onCancelRecord,
  onSaveRecord,
}) => {
  const isRecording = appState === 'recording';
  const isProcessing = appState === 'processing';

  // Dynamic bar heights for the visualizer
  const barHeights = [
    Math.max(12, Math.min(36, 12 + volumeLevel * 30 + Math.sin(Date.now() / 150) * 8)),
    Math.max(16, Math.min(46, 16 + volumeLevel * 45 + Math.cos(Date.now() / 120) * 12)),
    Math.max(22, Math.min(54, 22 + volumeLevel * 60 + Math.sin(Date.now() / 100) * 16)),
    Math.max(16, Math.min(46, 16 + volumeLevel * 45 + Math.cos(Date.now() / 130) * 12)),
    Math.max(12, Math.min(36, 12 + volumeLevel * 30 + Math.sin(Date.now() / 160) * 8)),
  ];

  if (!isRecording && !isProcessing) {
    // IMAGE 1 STATE: Single Blue Mic Button
    return (
      <div className="flex flex-col items-center justify-center pt-8 pb-12">
        <button
          onClick={onStartRecord}
          id="mic-start-btn"
          aria-label="Click the mic and start to speak"
          className="group relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#38bdf8] text-white shadow-[0_8px_20px_rgba(56,189,248,0.45)] hover:shadow-[0_12px_28px_rgba(56,189,248,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#38bdf8]/50"
        >
          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#38bdf8] opacity-30 group-hover:animate-ping pointer-events-none" />
          
          <MicIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-sm transition-transform group-hover:scale-110" />
        </button>

        <span className="mt-5 text-sm sm:text-base font-extrabold tracking-wider text-black text-center uppercase select-none">
          CLICK THE MIC AND START TO SPEAK
        </span>
      </div>
    );
  }

  // IMAGE 2 STATE: Cancel, Recording, Save Buttons
  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-12">
      <div className="flex items-center justify-center gap-8 sm:gap-14 md:gap-20">
        
        {/* 1. CANCEL BUTTON (RED) */}
        <div className="flex flex-col items-center">
          <button
            onClick={onCancelRecord}
            disabled={isProcessing}
            id="cancel-record-btn"
            aria-label="Cancel recording"
            className="group flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#f84b4b] text-white shadow-[0_8px_18px_rgba(248,75,75,0.4)] hover:shadow-[0_12px_24px_rgba(248,75,75,0.6)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <CancelCrossIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-sm transition-transform group-hover:rotate-90" />
          </button>
          <span className="mt-4 text-xs sm:text-sm font-extrabold tracking-wider text-black uppercase select-none">
            CANCEL
          </span>
        </div>

        {/* 2. RECORDING... BUTTON (CYAN/BLUE WITH ANIMATED WAVEFORM) */}
        <div className="flex flex-col items-center">
          <div
            id="recording-indicator"
            aria-label="Recording in progress"
            className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#38bdf8] text-white shadow-[0_8px_20px_rgba(56,189,248,0.45)] ring-4 ring-[#38bdf8]/40 animate-pulse"
          >
            {/* Animated Sound Waveform Bars */}
            <div className="flex items-center justify-center gap-1.5 h-12">
              <span className="w-1.5 bg-white rounded-full animate-wave-1 h-4 sm:h-5" />
              <span className="w-1.5 bg-white rounded-full animate-wave-2 h-7 sm:h-8" />
              <span className="w-1.5 bg-white rounded-full animate-wave-3 h-10 sm:h-11" />
              <span className="w-1.5 bg-white rounded-full animate-wave-2 h-7 sm:h-8" />
              <span className="w-1.5 bg-white rounded-full animate-wave-1 h-4 sm:h-5" />
            </div>
          </div>
          <span className="mt-4 text-xs sm:text-sm font-extrabold tracking-wider text-black uppercase select-none animate-pulse">
            {isProcessing ? 'PROCESSING...' : 'RECORDING...'}
          </span>
        </div>

        {/* 3. SAVE BUTTON (GREEN) */}
        <div className="flex flex-col items-center">
          <button
            onClick={onSaveRecord}
            disabled={isProcessing}
            id="save-record-btn"
            aria-label="Save and get feedback"
            className="group flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#66cc52] text-white shadow-[0_8px_18px_rgba(102,204,82,0.45)] hover:shadow-[0_12px_24px_rgba(102,204,82,0.65)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <SaveCheckIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-sm transition-transform group-hover:scale-115" />
          </button>
          <span className="mt-4 text-xs sm:text-sm font-extrabold tracking-wider text-black uppercase select-none">
            SAVE
          </span>
        </div>

      </div>
    </div>
  );
};
