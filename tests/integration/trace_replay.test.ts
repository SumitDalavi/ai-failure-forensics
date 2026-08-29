import { analyzeTrace } from '../../src/forensics/analyzer';
import { getTrace } from '../../src/tracing/db';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

jest.mock('../../src/tracing/db', () => ({
  getTrace: jest.fn(),
  storeEvalCase: jest.fn()
}));
jest.mock('openai');

describe('Trace Replay Integration Test', () => {
  let mockCreate: jest.Mock;

  beforeAll(() => {
    mockCreate = jest.fn();
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));
  });

  it('replays synthetic traces and identifies correct root causes', async () => {
    const fixturesPath = path.join(__dirname, '../../fixtures/synthetic_traces.json');
    const traces = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
    
    for (const trace of traces) {
      (getTrace as jest.Mock).mockResolvedValue(trace);
      
      // We simulate OpenAI identifying the root cause
      mockCreate.mockImplementation(async (args: any) => {
        const userMsg = args.messages[1].content;
        if (userMsg.includes(trace.expected_root_cause)) {
           return { choices: [{ message: { content: JSON.stringify({ score: 1, reasoning: "bad", failure_category: "Simulated Hallucination" }) } }] };
        }
        return { choices: [{ message: { content: JSON.stringify({ score: 5, reasoning: "good", failure_category: "None" }) } }] };
      });

      const result = await analyzeTrace(trace.id);
      expect(result.rootCauseStep).toBe(trace.expected_root_cause);
    }
  });
});
