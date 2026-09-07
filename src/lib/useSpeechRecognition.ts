'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Declare types for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // References
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Visualizer loop reading volume from mic
  const updateVolume = useCallback(() => {
    if (analyserRef.current) {
      const array = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(array);
      let sum = 0;
      for (let i = 0; i < array.length; i++) {
        sum += array[i];
      }
      const avg = sum / array.length;
      const normalized = Math.min(1, avg / 60); // 0 to 1
      setVolumeLevel(normalized);
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    }
  }, []);

  const startListening = useCallback(async () => {
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);

    // 1. Setup Audio Stream for volume visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setHasMicPermission(true);

        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
          updateVolume();
        }
      }
    } catch (micErr) {
      console.warn('Microphone access denied or not available:', micErr);
      setHasMicPermission(false);
    }

    // 2. Setup Speech Recognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentFinal = '';
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
              currentFinal += result[0].transcript + ' ';
            } else {
              currentInterim += result[0].transcript;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev + ' ' + currentFinal).trim());
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          // If still marked as listening, restart or finish
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  }, [updateVolume]);

  const stopListening = useCallback((): string => {
    setIsListening(false);

    // Stop Web Speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Stop Media Stream & Analyser
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVolumeLevel(0);

    const finalFullTranscript = (transcript + ' ' + interimTranscript).trim();
    return finalFullTranscript;
  }, [transcript, interimTranscript]);

  const cancelListening = useCallback(() => {
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
    setVolumeLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullLiveTranscript: (transcript + ' ' + interimTranscript).trim(),
    volumeLevel,
    hasMicPermission,
    speechSupported,
    setTranscript,
    startListening,
    stopListening,
    cancelListening,
  };
}
