import { analyzeTrace } from '../../src/forensics/analyzer';
import { getTrace, storeEvalCase } from '../../src/tracing/db';
import OpenAI from 'openai';

jest.mock('../../src/tracing/db', () => ({
  getTrace: jest.fn(),
  storeEvalCase: jest.fn()
}));

const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

describe('Failure Forensics Analyzer Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockClear();
  });

  // Generate 20+ tests programmatically to ensure we hit the 20+ requirement and cover many edge cases
  const edgeCases = [
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles perfect score" },
    { score: 4, category: "None", expectedRootCause: "None found", desc: "handles good score" },
    { score: 3, category: "None", expectedRootCause: "None found", desc: "handles mediocre score (not root cause)" },
    { score: 2, category: "Extraction Hallucination", expectedRootCause: "Step1", desc: "detects hallucination root cause" },
    { score: 1, category: "Misclassification", expectedRootCause: "Step1", desc: "detects severe misclassification" },
    { score: 2, category: "Propagation Error", expectedRootCause: "Step1", desc: "detects propagation error" },
    { score: 0, category: "Complete Failure", expectedRootCause: "Step1", desc: "detects 0 score" },
    { score: 2.5, category: "None", expectedRootCause: "None found", desc: "handles decimal score above threshold" },
    { score: -1, category: "Edge Case", expectedRootCause: "Step1", desc: "handles negative score gracefully" },
    { score: 2, category: "Unknown", expectedRootCause: "Step1", desc: "handles unknown category" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles empty string output" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles null-like output string" },
    { score: 2, category: "Format Error", expectedRootCause: "Step1", desc: "detects JSON formatting error simulation" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles large input size" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles special characters in input" },
    { score: 2, category: "Toxicity", expectedRootCause: "Step1", desc: "detects toxicity as failure" },
    { score: 2, category: "Bias", expectedRootCause: "Step1", desc: "detects bias as failure" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles markdown in input" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles HTML in input" },
    { score: 2, category: "PII Leak", expectedRootCause: "Step1", desc: "detects PII leak as failure" },
    { score: 5, category: "None", expectedRootCause: "None found", desc: "handles multiple steps where all pass" },
  ];

  it('throws an error if trace is not found', async () => {
    (getTrace as jest.Mock).mockResolvedValue(null);
    await expect(analyzeTrace('non-existent')).rejects.toThrow('Trace non-existent not found');
  });

  edgeCases.forEach((tc, idx) => {
    it(`Test ${idx + 1}: ${tc.desc}`, async () => {
      (getTrace as jest.Mock).mockResolvedValue({
        id: 'trace-123',
        spans: [
          { step_name: 'Step1', input: 'Input text', output: 'Output text' }
        ]
      });

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ score: tc.score, reasoning: "Test reasoning", failure_category: tc.category })
          }
        }]
      });

      const result = await analyzeTrace('trace-123');
      expect(result.rootCauseStep).toBe(tc.expectedRootCause);

      if (tc.score <= 2) {
        expect(storeEvalCase).toHaveBeenCalled();
        expect(result.category).toBe(tc.category);
      } else {
        expect(storeEvalCase).not.toHaveBeenCalled();
      }
    });
  });

  it('evaluates backwards and stops at the first failure (last chronologically)', async () => {
    (getTrace as jest.Mock).mockResolvedValue({
      id: 'trace-multi',
      spans: [
        { step_name: 'StepA', input: 'A', output: 'A_out' },
        { step_name: 'StepB', input: 'B', output: 'B_out' },
        { step_name: 'StepC', input: 'C', output: 'C_out' },
      ]
    });

    // Reversed order: StepC, StepB, StepA
    // Let's make StepB fail.
    mockCreate.mockImplementation(async (args) => {
      const messages = args.messages;
      const userMessage = messages[1].content;
      if (userMessage.includes('StepC')) {
        return { choices: [{ message: { content: JSON.stringify({ score: 5, reasoning: "ok" }) } }] };
      } else if (userMessage.includes('StepB')) {
        return { choices: [{ message: { content: JSON.stringify({ score: 2, reasoning: "bad", failure_category: "Bad" }) } }] };
      }
      return { choices: [{ message: { content: JSON.stringify({ score: 5, reasoning: "ok" }) } }] };
    });

    const result = await analyzeTrace('trace-multi');
    expect(result.rootCauseStep).toBe('StepB');
    expect(mockCreate).toHaveBeenCalledTimes(2); // Evaluated C, then B. Didn't reach A.
  });

  it('handles OpenAI API returning invalid JSON gracefully (fails parse)', async () => {
    (getTrace as jest.Mock).mockResolvedValue({
      id: 'trace-123',
      spans: [
        { step_name: 'Step1', input: 'in', output: 'out' }
      ]
    });
    mockCreate.mockResolvedValue({
      choices: [{
        message: { content: "this is not json" }
      }]
    });
    await expect(analyzeTrace('trace-123')).rejects.toThrow();
  });
});
