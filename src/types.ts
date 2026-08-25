export interface Span {
  id: string;
  trace_id: string;
  step_name: string;
  input: string;
  output: string;
  prompt?: string;
  confidence: number;
  latency_ms: number;
  tokens?: number;
  error?: string;
  timestamp: string;
}

export interface Trace {
  id: string;
  timestamp: string;
  status: 'success' | 'failure' | 'degraded';
  final_output?: string;
  spans: Span[];
}

export interface EvalCase {
  id: string;
  original_input: string;
  failing_step: string;
  bad_output: string;
  human_corrected_output: string;
  failure_category: string;
  timestamp: string;
}
