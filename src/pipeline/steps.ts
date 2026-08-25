import OpenAI from 'openai';
import { instrument } from '../tracing/tracer';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function processDocument(rawText: string): Promise<string> {
  // Step 1: Intake (No LLM, just basic parsing)
  const intakeOutput = await instrument('Intake', rawText, async () => {
    // Simulated normalization
    const normalized = rawText.trim().replace(/\n{3,}/g, '\n\n');
    return { output: normalized, confidence: 5 };
  });

  // Step 2: Extraction
  const extractionOutput = await instrument('Extraction', intakeOutput, async () => {
    const prompt = `Extract the main entities (names, dates, amounts) from this text: ${intakeOutput}`;
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });
    
    // Inject deliberate failure for demonstration if text contains "BAD_INVOICE"
    if (rawText.includes("BAD_INVOICE")) {
      return { 
        output: "Entities Extracted: John Doe, 12th Century, $1000", // hallucination
        prompt,
        tokens: res.usage?.total_tokens,
        confidence: 2 // Low confidence signal
      };
    }

    return {
      output: res.choices[0].message.content || '',
      prompt,
      tokens: res.usage?.total_tokens,
      confidence: 4
    };
  });

  // Step 3: Classification
  const classificationOutput = await instrument('Classification', extractionOutput, async () => {
    const prompt = `Classify the following extracted entities into a document type (Invoice, Contract, Report): ${extractionOutput}`;
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    return {
      output: res.choices[0].message.content || 'Unknown',
      prompt,
      tokens: res.usage?.total_tokens,
      confidence: 5
    };
  });

  // Step 4: Summarization
  const summarizationOutput = await instrument('Summarization', classificationOutput, async () => {
    const prompt = `Write a 1-sentence summary for a document of type: ${classificationOutput}, with entities: ${extractionOutput}`;
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    return {
      output: res.choices[0].message.content || '',
      prompt,
      tokens: res.usage?.total_tokens,
      confidence: 4
    };
  });

  return summarizationOutput;
}
