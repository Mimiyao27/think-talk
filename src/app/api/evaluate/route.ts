import { NextRequest, NextResponse } from 'next/server';
import { PRACTICE_TEMPLATES } from '@/lib/templates';
import { evaluateSpeechTranscript } from '@/lib/evaluator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, templateId } = body;

    const template = PRACTICE_TEMPLATES.find((t) => t.id === templateId) || PRACTICE_TEMPLATES[0];
    
    // Evaluate the spoken transcript
    const evaluation = evaluateSpeechTranscript(transcript || '', template);

    // Optional Gemini LLM enhancement if API key is supplied
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && transcript && transcript.trim().length > 5) {
      try {
        const prompt = `You are a supportive, encouraging English speaking tutor for young students.
The student was asked to read this prompt and fill in the blanks:
"${template.promptText}"

The student spoke and said:
"${transcript}"

Evaluate their response.
1. Is it mostly complete and introducing themselves nicely?
2. Provide a short 1-2 sentence encouraging feedback quote (in English).
Return ONLY a JSON object with:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedbackMessage": string (warm quote for student like "Good job! You introduced yourself clearly and confidently. Keep it up!"),
  "fluencyScore": number (0-100)
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
        });

        if (res.ok) {
          const geminiData = await res.json();
          const parsed = JSON.parse(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
          if (parsed.feedbackMessage) {
            evaluation.feedbackMessage = `“${parsed.feedbackMessage.replace(/["“”]/g, '')}”`;
          }
          if (typeof parsed.score === 'number') evaluation.score = parsed.score;
          if (typeof parsed.isCorrect === 'boolean') evaluation.isCorrect = parsed.isCorrect;
          if (typeof parsed.fluencyScore === 'number') evaluation.fluencyScore = parsed.fluencyScore;
        }
      } catch (geminiErr) {
        console.warn('Gemini API optional call skipped or failed, using local evaluator:', geminiErr);
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
