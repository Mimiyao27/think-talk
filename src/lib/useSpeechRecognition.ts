'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SpeechRecordingResult } from '@/types';

// Declare types for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// Cross-browser MIME type detector for MediaRecorder
function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav',
  ];
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Continue checking next candidate
    }
  }
  return '';
}

// Convert audio Blob to Base64 data string safely
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data:*/*;base64, prefix for clean base64 if needed
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [micError, setMicError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  // References to keep state across async and speech event cycles
  const isListeningRef = useRef(false);
  const accumulatedFinalTextRef = useRef('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevAudioUrlRef = useRef<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (prevAudioUrlRef.current) {
        URL.revokeObjectURL(prevAudioUrlRef.current);
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Visualizer loop reading volume from microphone
  const updateVolume = useCallback(() => {
    const loop = () => {
      if (analyserRef.current && isListeningRef.current) {
        const array = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(array);
        let sum = 0;
        for (let i = 0; i < array.length; i++) {
          sum += array[i];
        }
        const avg = sum / array.length;
        const normalized = Math.min(1, Math.max(0, avg / 45)); // 0 to 1 normalized range
        setVolumeLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        setVolumeLevel(0);
      }
    };
    loop();
  }, []);

  // Start continuous audio recording & speech recognition
  const startListening = useCallback(async () => {
    setMicError(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedFinalTextRef.current = '';
    recordedChunksRef.current = [];
    isListeningRef.current = true;
    setIsListening(true);

    // Clean up any existing recorded audio preview
    if (prevAudioUrlRef.current) {
      URL.revokeObjectURL(prevAudioUrlRef.current);
      prevAudioUrlRef.current = null;
    }
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);

    // 1. Request microphone access
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API is not supported in this browser or environment.');
      }

      // Check for insecure context (e.g. HTTP on local network IP from mobile)
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Microphone recording requires HTTPS or localhost on mobile devices.');
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setHasMicPermission(true);

      // 2. Setup AudioContext for real-time visualizer
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        // Safari & mobile autoplay policy: resume if suspended
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyserRef.current = analyser;

        updateVolume();
      }

      // 3. Setup MediaRecorder for actual audio capture across PC and Mobile
      if (typeof MediaRecorder !== 'undefined') {
        try {
          const supportedMime = getSupportedMimeType();
          const recorderOptions: MediaRecorderOptions = supportedMime ? { mimeType: supportedMime } : {};
          const recorder = new MediaRecorder(stream, recorderOptions);

          recorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.start(250); // Slice data every 250ms for reliable chunks
          mediaRecorderRef.current = recorder;
        } catch (recErr) {
          console.warn('MediaRecorder init fallback (default options):', recErr);
          try {
            const fallbackRecorder = new MediaRecorder(stream);
            fallbackRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
            };
            fallbackRecorder.start(250);
            mediaRecorderRef.current = fallbackRecorder;
          } catch (e2) {
            console.warn('MediaRecorder not available:', e2);
          }
        }
      }
    } catch (micErr: unknown) {
      const err = micErr as Error;
      console.warn('Microphone access denied or error:', err);
      setHasMicPermission(false);
      setMicError(err.message || 'Microphone access denied. Please allow microphone permissions.');
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    // 4. Setup Speech Recognition with mobile auto-restart resiliency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

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
            accumulatedFinalTextRef.current = (
              accumulatedFinalTextRef.current + ' ' + currentFinal
            ).replace(/\s+/g, ' ').trim();
            setTranscript(accumulatedFinalTextRef.current);
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // Ignore benign no-speech or aborted errors
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          console.warn('Speech recognition warning:', event.error, event.message);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setSpeechSupported(false);
          }
        };

        recognition.onend = () => {
          // Mobile auto-recovery: If user is still recording, restart recognition smoothly
          if (isListeningRef.current) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {
                  // Ignore start attempts if already started
                }
              }
            }, 120);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setSpeechSupported(true);
      } catch (speechErr) {
        console.warn('Web Speech API could not start (will rely on recorded audio):', speechErr);
      }
    } else {
      setSpeechSupported(false);
    }
  }, [updateVolume]);

  // Stop listening and finalize speech + audio recording
  const stopListening = useCallback(async (): Promise<SpeechRecordingResult> => {
    isListeningRef.current = false;
    setIsListening(false);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Stop Visualizer & AudioContext
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVolumeLevel(0);

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Finalize MediaRecorder audio capture
    let finalBlob: Blob | null = null;
    let finalAudioUrl: string | null = null;
    let finalAudioBase64: string | null = null;
    let recordedMime = 'audio/webm';

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      recordedMime = recorder.mimeType || 'audio/webm';

      if (recorder.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          try {
            recorder.stop();
          } catch {
            resolve();
          }
        });
      }

      if (recordedChunksRef.current.length > 0) {
        finalBlob = new Blob(recordedChunksRef.current, { type: recordedMime });
        finalAudioUrl = URL.createObjectURL(finalBlob);
        prevAudioUrlRef.current = finalAudioUrl;
        setRecordedAudioUrl(finalAudioUrl);
        setRecordedAudioBlob(finalBlob);

        try {
          finalAudioBase64 = await blobToBase64(finalBlob);
        } catch (b64Err) {
          console.warn('Failed to encode audio base64:', b64Err);
        }
      }
      mediaRecorderRef.current = null;
    }

    // Stop and release MediaStream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    const finalFullTranscript = (
      accumulatedFinalTextRef.current + ' ' + interimTranscript
    ).replace(/\s+/g, ' ').trim();

    setTranscript(finalFullTranscript);
    setInterimTranscript('');

    return {
      transcript: finalFullTranscript,
      audioBlob: finalBlob,
      audioUrl: finalAudioUrl,
      audioBase64: finalAudioBase64,
      mimeType: recordedMime,
    };
  }, [interimTranscript]);

  // Cancel listening and discard recording
  const cancelListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    accumulatedFinalTextRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setVolumeLevel(0);
    recordedChunksRef.current = [];

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (prevAudioUrlRef.current) {
      URL.revokeObjectURL(prevAudioUrlRef.current);
      prevAudioUrlRef.current = null;
    }
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullLiveTranscript: (transcript + ' ' + interimTranscript).trim(),
    volumeLevel,
    hasMicPermission,
    speechSupported,
    micError,
    recordedAudioUrl,
    recordedAudioBlob,
    setTranscript,
    startListening,
    stopListening,
    cancelListening,
  };
}
