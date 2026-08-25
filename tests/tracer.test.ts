import { startTrace, instrument, finishTrace, getCurrentTrace } from '../src/tracing/tracer';

jest.mock('../src/tracing/db', () => ({
  storeTrace: jest.fn().mockResolvedValue(undefined),
}));

describe('Tracer', () => {
  it('should capture spans when instrumented', async () => {
    startTrace();
    
    await instrument('TestStep1', 'input1', async () => ({ output: 'output1', confidence: 5 }));
    await instrument('TestStep2', 'output1', async () => ({ output: 'output2', confidence: 4 }));

    const trace = getCurrentTrace();
    expect(trace).toBeDefined();
    expect(trace!.spans.length).toBe(2);
    expect(trace!.spans[0].step_name).toBe('TestStep1');
    expect(trace!.spans[1].step_name).toBe('TestStep2');
    
    await finishTrace('final');
    expect(getCurrentTrace()).toBeNull(); // Cleared after finish
  });

  it('should run without trace context gracefully', async () => {
    // No startTrace() called
    const out = await instrument('OrphanStep', 'input', async () => ({ output: 'out' }));
    expect(out).toBe('out');
  });
});
