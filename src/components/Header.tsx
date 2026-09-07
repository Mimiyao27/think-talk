import React from 'react';
import { PracticeTemplate } from '@/types';
import { PRACTICE_TEMPLATES } from '@/lib/templates';
import { SparklesIcon } from './Icons';

interface HeaderProps {
  selectedTemplate: PracticeTemplate;
  onSelectTemplate: (template: PracticeTemplate) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedTemplate,
  onSelectTemplate,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="w-full border-b border-black/10 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* App Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#38bdf8] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
            <span className="font-black text-white text-xl">T</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg sm:text-xl tracking-tight text-zinc-900">
                ThinkTalk
              </h1>
              <span className="bg-[#faedb7] text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-black/20">
                AI Speaking
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium hidden sm:block">
              Interactive Speech & AI Feedback Tutor
            </p>
          </div>
        </div>

        {/* Template Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedTemplate.id}
              onChange={(e) => {
                const found = PRACTICE_TEMPLATES.find((t) => t.id === e.target.value);
                if (found) onSelectTemplate(found);
              }}
              id="template-selector"
              aria-label="Select speaking exercise"
              className="appearance-none bg-white border-2 border-black rounded-xl px-3.5 py-1.5 sm:py-2 pr-8 text-xs sm:text-sm font-bold text-zinc-900 shadow-[2px_2px_0_#000] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] cursor-pointer"
            >
              {PRACTICE_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sound Mute/Unmute Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0_#000] hover:bg-zinc-50 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-zinc-700 transition-all"
          >
            {soundEnabled ? (
              <span className="text-base" title="Sound Effects On">🔊</span>
            ) : (
              <span className="text-base" title="Sound Effects Off">🔇</span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
