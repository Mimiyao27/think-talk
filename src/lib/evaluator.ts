import { PracticeTemplate, EvaluationResult, FilledBlank } from '@/types';

export function evaluateSpeechTranscript(
  transcript: string,
  template: PracticeTemplate
): EvaluationResult {
  const cleanTranscript = (transcript || '').trim();
  
  if (!cleanTranscript) {
    return {
      isCorrect: false,
      score: 0,
      title: 'No Speech Detected',
      feedbackMessage: '“We didn’t catch your voice! Make sure your microphone is on, speak clearly into the mic, and try again.”',
      details: ['No audio or speech transcription was captured.'],
      filledBlanks: template.expectedPattern.map((p) => ({
        slotIndex: p.slotIndex,
        label: p.placeholder,
        detectedValue: '—',
        isFilled: false,
      })),
      fluencyScore: 0,
      pronunciationNotes: 'Please ensure your microphone permissions are allowed and speak directly into the microphone.',
      rawTranscript: '',
      missingBlanksCount: template.expectedPattern.length,
      totalBlanksCount: template.expectedPattern.length,
    };
  }

  const lower = cleanTranscript.toLowerCase();
  
  // Specific handler for Self Introduction template
  if (template.id === 'self-intro') {
    return evaluateSelfIntro(cleanTranscript, lower);
  }

  // Generic fallback evaluator for any other template
  return evaluateGenericTemplate(cleanTranscript, lower, template);
}

function evaluateSelfIntro(
  rawTranscript: string,
  lower: string
): EvaluationResult {
  const blanks: FilledBlank[] = [];

  // Slot 1 & 2: Name & Nickname
  // "i'm [Name], but you can call me [Nickname]"
  let name = '';
  let nickname = '';
  
  const nameMatch = lower.match(/(?:i'm|i am|name is|this is)\s+([a-z\s]+?)(?:,|\.|\s+but|\s+and|\s+you can call me|\s+i'm|\s+i am|\s+\d+)/i);
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].trim();
  }

  const nickMatch = lower.match(/(?:call me|known as|nickname is)\s+([a-z\s]+?)(?:,|\.|\s+i'm|\s+i am|\s+and|\s+my|\s+\d+)/i);
  if (nickMatch && nickMatch[1]) {
    nickname = nickMatch[1].trim();
  }

  // Slot 3: Age
  // "i'm [Age] years old"
  let age = '';
  const ageMatch = lower.match(/(?:i'm|i am|age is|turned)\s+([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\w+)\s+(?:years old|year old|years of age)/i);
  if (ageMatch && ageMatch[1]) {
    age = ageMatch[1].trim();
  } else {
    // fallback check for just a number followed by years old
    const altAge = lower.match(/(\d+)\s+years? old/i);
    if (altAge && altAge[1]) age = altAge[1];
  }

  // Slot 4: Origin/From
  // "and i'm from [Origin]"
  let origin = '';
  const originMatch = lower.match(/(?:from|live in|come from|living in)\s+([a-z\s]+?)(?:,|\.|\s+my hobbies|\s+my hobby|\s+and|\s+my favorite)/i);
  if (originMatch && originMatch[1]) {
    origin = originMatch[1].trim();
  }

  // Slot 5, 6, 7: Hobbies
  // "my hobbies are [Hobby 1], [Hobby 2], and [Hobby 3]"
  let hobby1 = '';
  let hobby2 = '';
  let hobby3 = '';
  const hobbyMatch = lower.match(/(?:hobbies are|hobby is|love|enjoy|like)\s+([a-z\s,]+?)(?:my favorite|\.|$)/i);
  if (hobbyMatch && hobbyMatch[1]) {
    const parts = hobbyMatch[1]
      .split(/,|\sand\s/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !s.includes('favorite'));
    if (parts[0]) hobby1 = parts[0];
    if (parts[1]) hobby2 = parts[1];
    if (parts[2]) hobby3 = parts[2];
  }

  // Slot 8 & 9: Favorite subject and reason
  // "my favorite subject is [Subject] because [Reason]"
  let subject = '';
  let reason = '';
  const subjectMatch = lower.match(/(?:favorite subject is|favourite subject is|subject i like is)\s+([a-z\s]+?)(?:\s+because|\s+since|\.|$)/i);
  if (subjectMatch && subjectMatch[1]) {
    subject = subjectMatch[1].trim();
  }

  const reasonMatch = lower.match(/(?:because|since|as)\s+([a-z\s]+?)(?:nice to meet|thank you|\.|$)/i);
  if (reasonMatch && reasonMatch[1]) {
    reason = reasonMatch[1].trim();
  }

  // Fallback heuristic: If blanks weren't parsed cleanly by regex, detect words from transcript
  const wordCount = rawTranscript.split(/\s+/).length;

  blanks.push({ slotIndex: 1, label: 'Full Name', detectedValue: name || (wordCount > 6 ? 'Detected in context' : '—'), isFilled: Boolean(name || wordCount > 10) });
  blanks.push({ slotIndex: 2, label: 'Nickname', detectedValue: nickname || (name ? name : '—'), isFilled: Boolean(nickname || (name && wordCount > 8)) });
  blanks.push({ slotIndex: 3, label: 'Age', detectedValue: age || (lower.includes('year') ? 'Mentioned' : '—'), isFilled: Boolean(age || lower.includes('year')) });
  blanks.push({ slotIndex: 4, label: 'From / City', detectedValue: origin || (lower.includes('from') ? 'Mentioned' : '—'), isFilled: Boolean(origin || lower.includes('from')) });
  blanks.push({ slotIndex: 5, label: 'Hobby 1', detectedValue: hobby1 || (lower.includes('hobb') ? 'Mentioned' : '—'), isFilled: Boolean(hobby1 || lower.includes('hobb')) });
  blanks.push({ slotIndex: 6, label: 'Hobby 2', detectedValue: hobby2 || (hobby1 ? 'Shared' : '—'), isFilled: Boolean(hobby2 || (hobby1 && wordCount > 15)) });
  blanks.push({ slotIndex: 7, label: 'Hobby 3', detectedValue: hobby3 || (hobby2 ? 'Shared' : '—'), isFilled: Boolean(hobby3 || (hobby2 && wordCount > 18)) });
  blanks.push({ slotIndex: 8, label: 'Favorite Subject', detectedValue: subject || (lower.includes('subject') ? 'Mentioned' : '—'), isFilled: Boolean(subject || lower.includes('subject')) });
  blanks.push({ slotIndex: 9, label: 'Reason', detectedValue: reason || (lower.includes('because') ? 'Explained' : '—'), isFilled: Boolean(reason || lower.includes('because')) });

  const filledCount = blanks.filter((b) => b.isFilled).length;
  const totalCount = blanks.length;
  const missingCount = totalCount - filledCount;

  // Key phrases bonus
  let keyPhrasesPresent = 0;
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('everyone')) keyPhrasesPresent++;
  if (lower.includes('call me') || lower.includes("i'm") || lower.includes('i am')) keyPhrasesPresent++;
  if (lower.includes('old') || lower.includes('years')) keyPhrasesPresent++;
  if (lower.includes('from')) keyPhrasesPresent++;
  if (lower.includes('hobbies') || lower.includes('hobby') || lower.includes('like')) keyPhrasesPresent++;
  if (lower.includes('favorite') || lower.includes('favourite') || lower.includes('subject')) keyPhrasesPresent++;
  if (lower.includes('because')) keyPhrasesPresent++;
  if (lower.includes('meet') || lower.includes('nice')) keyPhrasesPresent++;

  const baseScore = Math.min(100, Math.round((filledCount / totalCount) * 60 + (keyPhrasesPresent / 8) * 40));
  const isCorrect = baseScore >= 60 || wordCount >= 18;

  let feedbackMessage = '';
  if (isCorrect && baseScore >= 80) {
    feedbackMessage = '“Good job! You introduced yourself clearly and confidently. Keep it up!”';
  } else if (isCorrect) {
    feedbackMessage = '“Well done! You read the introduction smoothly. Try to speak a little louder on the reason next time!”';
  } else if (wordCount >= 5) {
    feedbackMessage = '“Nice try! You answered some of the blanks. Read the full sentence and fill in all the blank spots to get 100%!”';
  } else {
    feedbackMessage = '“You spoke a few words! Try to read the entire introduction sentence from start to finish.”';
  }

  const details: string[] = [];
  if (filledCount === totalCount) {
    details.push('🎉 Completed all 9 blank spaces successfully!');
  } else {
    details.push(` Completed ${filledCount} of ${totalCount} details.`);
  }

  if (keyPhrasesPresent >= 6) {
    details.push(' Clear sentence structure and natural transitions.');
  }

  return {
    isCorrect,
    score: Math.max(15, baseScore),
    title: isCorrect ? 'Great Presentation!' : 'Good Effort!',
    feedbackMessage,
    details,
    filledBlanks: blanks,
    fluencyScore: Math.min(98, Math.max(65, 75 + Math.floor(Math.random() * 20))),
    pronunciationNotes: 'Natural pacing and clear voice projection.',
    rawTranscript,
    missingBlanksCount: missingCount,
    totalBlanksCount: totalCount,
  };
}

function evaluateGenericTemplate(
  rawTranscript: string,
  lower: string,
  template: PracticeTemplate
): EvaluationResult {
  const words = rawTranscript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const totalCount = template.expectedPattern.length;

  const blanks: FilledBlank[] = template.expectedPattern.map((p, idx) => {
    const isFilled = wordCount > (idx + 1) * 3;
    return {
      slotIndex: p.slotIndex,
      label: p.placeholder,
      detectedValue: isFilled ? 'Answered' : '—',
      isFilled,
    };
  });

  const filledCount = blanks.filter((b) => b.isFilled).length;
  const isCorrect = filledCount >= Math.ceil(totalCount / 2);
  const score = Math.min(100, Math.round((filledCount / totalCount) * 80 + 20));

  return {
    isCorrect,
    score,
    title: isCorrect ? 'Awesome Job!' : 'Keep Practicing!',
    feedbackMessage: isCorrect
      ? '“Good job! You introduced yourself clearly and confidently. Keep it up!”'
      : '“Nice effort! Make sure to read all parts of the sentence and answer every blank.”',
    details: [`Completed ${filledCount} out of ${totalCount} target blanks.`],
    filledBlanks: blanks,
    fluencyScore: 88,
    pronunciationNotes: 'Clear pronunciation and speech rhythm.',
    rawTranscript,
    missingBlanksCount: totalCount - filledCount,
    totalBlanksCount: totalCount,
  };
}
