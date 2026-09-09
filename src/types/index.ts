export type AppState = 'idle' | 'recording' | 'processing' | 'feedback';

export interface PracticeTemplate {
  id: string;
  title: string;
  category: string;
  level: string;
  promptText: string;
  blankCount: number;
  expectedPattern: {
    slotIndex: number;
    placeholder: string;
    description: string;
    sampleAnswers: string[];
  }[];
  referenceAudio?: string;
  fullExample: string;
}

export interface FilledBlank {
  slotIndex: number;
  label: string;
  detectedValue: string;
  isFilled: boolean;
}

export interface EvaluationResult {
  isCorrect: boolean;
  score: number; // 0 - 100
  title: string;
  feedbackMessage: string;
  details: string[];
  filledBlanks: FilledBlank[];
  fluencyScore: number;
  pronunciationNotes: string;
  rawTranscript: string;
  missingBlanksCount: number;
  totalBlanksCount: number;
  userAudioUrl?: string;
}

export interface SpeechRecordingResult {
  transcript: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioBase64: string | null;
  mimeType: string;
}
