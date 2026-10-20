import { getTrace, storeEvalCase } from '../tracing/db';
import { v4 as uuidv4 } from 'uuid';
import { aiProvider } from '../shared/ai-provider-factory';

const EVAL_PROMPT = `You are a failure forensics expert analyzing a pipeline step.
You will be given the Input to the step, and the Output produced by the step.
Determine if the Output is a reasonable and correct transformation of the Input based on general logic.
Score the quality of the step's transformation on a scale from 1 (completely wrong/hallucinated) to 5 (perfectly fine).

Provide your answer in strict JSON:
{
  "score": 4,
  "reasoning": "...",
  "failure_category": "Extraction Hallucination | Misclassification | Propagation Error | None"
}`;

export async function analyzeTrace(traceId: string) {
  const trace = await getTrace(traceId);
  if (!trace) throw new Error(`Trace ${traceId} not found`);

  // Walk backwards
  const reversedSpans = [...trace.spans].reverse();

  let rootCauseSpan = null;
  let rootCauseAnalysis = null;

  for (const span of reversedSpans) {
    // LLM-as-a-judge scores the step
    const userMessage = `Step Name: ${span.step_name}\nInput:\n${span.input}\n\nOutput:\n${span.output}`;
    
    const result = await aiProvider.complete({
      messages: [
        { role: 'system', content: EVAL_PROMPT },
        { role: 'user', content: userMessage }
      ],
      jsonMode: true,
      temperature: 0.1,
      mockResponseHint: 'failure-forensics-eval',
    });

    const parsed = JSON.parse(result.content || '{}');
    
    // If score <= 2, we found the root cause
    if (parsed.score <= 2) {
      rootCauseSpan = span;
      rootCauseAnalysis = parsed;
      break;
    }
  }

  if (rootCauseSpan && rootCauseAnalysis) {
    // Generate human corrected output (simulated for now)
    const correctedOutput = `[Requires Human Correction] originally was: ${rootCauseSpan.output}`;

    await storeEvalCase({
      id: uuidv4(),
      original_input: rootCauseSpan.input,
      failing_step: rootCauseSpan.step_name,
      bad_output: rootCauseSpan.output,
      human_corrected_output: correctedOutput,
      failure_category: rootCauseAnalysis.failure_category,
      timestamp: new Date().toISOString()
    });

    return {
      rootCauseStep: rootCauseSpan.step_name,
      reasoning: rootCauseAnalysis.reasoning,
      category: rootCauseAnalysis.failure_category,
      badOutput: rootCauseSpan.output
    };
  }

  return { rootCauseStep: 'None found', reasoning: 'All steps appeared correct to the evaluator.' };
}
