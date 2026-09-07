// Browser Speech Synthesis for reading feedback aloud to the student

export function speakText(text: string, onEnd?: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {};
  }

  window.speechSynthesis.cancel(); // Stop any active speech

  const clean = text.replace(/["“”]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95; // Slightly slower, friendly pace for learners
  utterance.pitch = 1.05;

  // Try to pick a natural friendly English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny')) && v.lang.startsWith('en')
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
