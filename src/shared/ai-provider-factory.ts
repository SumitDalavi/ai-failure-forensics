import OpenAI from 'openai';
import { isRealOpenAIKey, isRealAnthropicKey } from './credential-mode';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  mockResponseHint?: string;
}

export interface AICompletionResult {
  content: string;
  provider: 'openai' | 'anthropic' | 'mock';
  model: string;
  latencyMs: number;
  mode: 'live' | 'mock';
  promptTokens: number;
  completionTokens: number;
}

function generateMockResponse(req: AICompletionRequest): string {
  const lastUserMsg = [...req.messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  if (req.jsonMode) {
    return JSON.stringify({
      score: 4,
      reasoning: `[MOCK] Evaluated: "${lastUserMsg.slice(0, 60)}..."`,
      failure_category: 'None',
      result: 'mock_ok',
      confidence: 0.95,
    });
  }

  return (
    `[MOCK RESPONSE — set OPENAI_API_KEY or ANTHROPIC_API_KEY for live AI]\n` +
    `Query: ${lastUserMsg.slice(0, 120)}...\n` +
    `Simulated answer: This is a deterministic mock response for offline/CI execution.\n` +
    (req.mockResponseHint ? `Context hint: ${req.mockResponseHint}` : '')
  );
}

export type AIProvider = {
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
  mode: 'live' | 'mock';
  activeProviders: string[];
};

export function createAIProvider(): AIProvider {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasRealOpenAI = isRealOpenAIKey(openaiKey);
  const hasRealAnthropic = isRealAnthropicKey(anthropicKey);
  const isLive = hasRealOpenAI || hasRealAnthropic;

  const activeProviders: string[] = [];
  if (hasRealOpenAI) activeProviders.push('openai/gpt-4o-mini');
  if (hasRealAnthropic) activeProviders.push('anthropic/claude-3-5-haiku');
  if (!isLive) activeProviders.push('mock');

  async function complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const start = Date.now();

    // 1. Live or Test-Mocked OpenAI
    let openaiClient: OpenAI | null = null;
    if (hasRealOpenAI) {
      openaiClient = new OpenAI({ apiKey: openaiKey });
    } else if (process.env.NODE_ENV === 'test') {
      try {
        openaiClient = new OpenAI({ apiKey: openaiKey || 'test-mock-key' });
      } catch (e) {
        openaiClient = null;
      }
    }

    if (openaiClient) {
      try {
        const res = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: req.messages as any,
          max_tokens: req.maxTokens ?? 1024,
          temperature: req.temperature ?? 0.1,
          response_format: req.jsonMode ? { type: 'json_object' } : undefined,
        });

        return {
          content: res.choices[0]?.message?.content ?? '',
          provider: 'openai',
          model: 'gpt-4o-mini',
          latencyMs: Date.now() - start,
          mode: hasRealOpenAI ? 'live' : 'mock',
          promptTokens: res.usage?.prompt_tokens ?? 0,
          completionTokens: res.usage?.completion_tokens ?? 0,
        };
      } catch (err: any) {
        // If running in Jest test runner and not a real network key, rethrow so Jest assertions on errors pass
        if (process.env.NODE_ENV === 'test' && !hasRealOpenAI) {
          throw err;
        }
        console.warn('[ai-provider] OpenAI live attempt failed, falling back to mock:', err.message);
      }
    }

    // 2. Mock Mode (default, zero network dependencies)
    await new Promise((r) => setTimeout(r, 5));
    return {
      content: generateMockResponse(req),
      provider: 'mock',
      model: 'mock-v1',
      latencyMs: Date.now() - start,
      mode: 'mock',
      promptTokens: 0,
      completionTokens: 0,
    };
  }

  return {
    complete,
    mode: isLive ? 'live' : 'mock',
    activeProviders,
  };
}

export const aiProvider = createAIProvider();
