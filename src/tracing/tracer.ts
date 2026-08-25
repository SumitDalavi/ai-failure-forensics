import { v4 as uuidv4 } from 'uuid';
import { Span, Trace } from '../types';
import { storeTrace } from './db';

let currentTrace: Trace | null = null;

export function startTrace(): string {
  currentTrace = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    status: 'success',
    spans: []
  };
  return currentTrace.id;
}

export async function finishTrace(finalOutput: string, status: 'success' | 'failure' | 'degraded' = 'success') {
  if (currentTrace) {
    currentTrace.final_output = finalOutput;
    currentTrace.status = status;
    await storeTrace(currentTrace);
    currentTrace = null;
  }
}

export function getCurrentTrace(): Trace | null {
  return currentTrace;
}

export async function instrument<T>(
  stepName: string, 
  input: string, 
  fn: () => Promise<{ output: string, prompt?: string, tokens?: number, confidence?: number }>
): Promise<string> {
  const trace = getCurrentTrace();
  if (!trace) {
    console.warn(`No active trace for step ${stepName}`);
    const res = await fn();
    return res.output;
  }

  const span: Span = {
    id: uuidv4(),
    trace_id: trace.id,
    step_name: stepName,
    input,
    output: '',
    confidence: 5,
    latency_ms: 0,
    timestamp: new Date().toISOString()
  };

  const start = Date.now();
  try {
    const result = await fn();
    span.output = result.output;
    span.prompt = result.prompt;
    span.tokens = result.tokens;
    span.confidence = result.confidence ?? 5;
  } catch (error) {
    span.error = (error as Error).message;
    span.output = 'ERROR';
    trace.status = 'failure';
    throw error;
  } finally {
    span.latency_ms = Date.now() - start;
    trace.spans.push(span);
  }

  return span.output;
}
