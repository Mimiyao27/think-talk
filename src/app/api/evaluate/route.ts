import { NextRequest, NextResponse } from 'next/server';
import { PRACTICE_TEMPLATES } from '@/lib/templates';
import { evaluateSpeechTranscript } from '@/lib/evaluator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript = '', templateId, audioBase64, audioMimeType } = body;

    const template = PRACTICE_TEMPLATES.find((t) => t.id === templateId) || PRACTICE_TEMPLATES[0];

    // Initial evaluation with provided transcript
    let effectiveTranscript = (transcript || '').trim();
    let evaluation = evaluateSpeechTranscript(effectiveTranscript, template);

    // Optional Gemini LLM multimodal enhancement if API key is supplied
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && (effectiveTranscript.length > 3 || audioBase64)) {
      try {
        const prompt = `You are a warm, encouraging English speaking tutor for young students.
The student was asked to practice reading this prompt and fill in the blanks:
"${template.promptText}"

${effectiveTranscript ? `The transcribed speech is: "${effectiveTranscript}"` : 'Please transcribe the student speaking from the attached audio recording.'}

Evaluate the student's speaking response.
1. Transcribe the speech accurately (or confirm the spoken words).
2. Check how many of the required blanks were filled.
3. Provide a warm, 1-2 sentence encouraging feedback quote (in English).

Return ONLY a JSON object:
{
  "transcribedText": string,
  "isCorrect": boolean,
  "score": number (0-100),
  "feedbackMessage": string (warm quote for student like "Good job! You introduced yourself clearly and confidently. Keep it up!"),
  "fluencyScore": number (0-100)
}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [{ text: prompt }];

        if (audioBase64) {
          // Normalize mimeType for Gemini inline data
          let mime = audioMimeType || 'audio/webm';
          if (mime.includes(';')) mime = mime.split(';')[0];
          parts.push({
            inlineData: {
              mimeType: mime,
              data: audioBase64,
            },
          });
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (res.ok) {
          const geminiData = await res.json();
          const parsed = JSON.parse(
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
          );

          if (parsed.transcribedText && (!effectiveTranscript || effectiveTranscript.length < 5)) {
            effectiveTranscript = parsed.transcribedText;
            evaluation = evaluateSpeechTranscript(effectiveTranscript, template);
          }

          if (parsed.feedbackMessage) {
            evaluation.feedbackMessage = `“${parsed.feedbackMessage.replace(/["“”]/g, '')}”`;
          }
          if (typeof parsed.score === 'number') evaluation.score = parsed.score;
          if (typeof parsed.isCorrect === 'boolean') evaluation.isCorrect = parsed.isCorrect;
          if (typeof parsed.fluencyScore === 'number') evaluation.fluencyScore = parsed.fluencyScore;
          if (effectiveTranscript) evaluation.rawTranscript = effectiveTranscript;
        }
      } catch (geminiErr) {
        console.warn('Gemini API call skipped or fallback triggered:', geminiErr);
      }
    }

    return NextResponse.json(evaluation);
  } catch (err: unknown) {
    console.error('Evaluation API error:', err);
    return NextResponse.json(
      { error: 'Failed to process evaluation', message: (err as Error)?.message },
      { status: 500 }
    );
  }
}
