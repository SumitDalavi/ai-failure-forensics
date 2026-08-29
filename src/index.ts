import 'dotenv/config';
import express, { Request, Response } from 'express';
import { startTrace, finishTrace } from './tracing/tracer';
import { processDocument } from './pipeline/steps';
import { getTraces, getDb } from './tracing/db';
import { analyzeTrace } from './forensics/analyzer';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Start SQLite DB
getDb().then(() => console.log('Database initialized'));

// Endpoint to simulate a pipeline run
app.post('/api/run', async (req: Request, res: Response) => {
  const { document } = req.body;
  if (!document) {
    res.status(400).json({ error: 'Missing document' });
    return;
  }

  const traceId = startTrace();
  try {
    const finalResult = await processDocument(document);
    await finishTrace(finalResult, 'success');
    res.json({ trace_id: traceId, result: finalResult });
  } catch (err) {
    await finishTrace('', 'failure');
    res.status(500).json({ error: (err as Error).message });
  }
});

// Endpoint to fetch recent traces
app.get('/api/traces', async (_req, res) => {
  const traces = await getTraces();
  res.json(traces);
});

// Endpoint to flag a trace and run backward forensics
app.post('/api/traces/:id/flag', async (req: Request, res: Response) => {
  try {
    const analysis = await analyzeTrace(req.params.id as string);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Simple Dashboard HTML (Vanilla JS)
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Failure Forensics Dashboard</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #111; color: #fff; padding: 2rem; }
        .trace { border: 1px solid #333; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: #222; }
        .span { margin-left: 20px; border-left: 2px solid #555; padding-left: 10px; margin-bottom: 0.5rem; font-size: 0.9rem;}
        button { background: #e53935; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; }
        pre { background: #000; padding: 10px; overflow-x: auto; font-size: 0.8rem; }
      </style>
    </head>
    <body>
      <h1>AI Failure Forensics Dashboard</h1>
      <button onclick="runPipeline('Valid Invoice: John Doe, 12th Jan 2024, $500')">Run Good Doc</button>
      <button onclick="runPipeline('BAD_INVOICE: No dates specified.')">Run Bad Doc (Inject Failure)</button>
      <hr/>
      <div id="traces"></div>

      <script>
        async function loadTraces() {
          const res = await fetch('/api/traces');
          const traces = await res.json();
          document.getElementById('traces').innerHTML = traces.map(t => \`
            <div class="trace">
              <h3>Trace \${t.id} (\${t.status})</h3>
              <button onclick="flagTrace('\${t.id}')">Flag as Bad Output (Run Forensics)</button>
              <div id="result-\${t.id}"></div>
              \${t.spans.map(s => \`
                <div class="span">
                  <strong>\${s.step_name}</strong> (\${s.latency_ms}ms)
                  <pre>IN: \${s.input}\\nOUT: \${s.output}</pre>
                </div>
              \`).join('')}
            </div>
          \`).join('');
        }

        async function runPipeline(doc) {
          await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: doc })
          });
          loadTraces();
        }

        async function flagTrace(id) {
          document.getElementById('result-'+id).innerHTML = '<i>Analyzing backwards...</i>';
          const res = await fetch('/api/traces/'+id+'/flag', { method: 'POST' });
          const analysis = await res.json();
          document.getElementById('result-'+id).innerHTML = \`
            <div style="background: #520; padding: 10px; margin: 10px 0;">
              <strong>Root Cause Identified:</strong> \${analysis.rootCauseStep}<br/>
              <strong>Category:</strong> \${analysis.category}<br/>
              <strong>Reasoning:</strong> \${analysis.reasoning}<br/>
            </div>
          \`;
        }

        loadTraces();
      </script>
    </body>
    </html>
  `);
});

if (process.argv.includes('--cli')) {
  console.log('--- CLI Demo Mode ---');
  getDb().then(async () => {
    console.log('Running synthetic bad document through pipeline...');
    const traceId = startTrace();
    try {
      const finalResult = await processDocument('BAD_INVOICE: No dates specified.');
      await finishTrace(finalResult, 'success');
    } catch (err) {
      await finishTrace('', 'failure');
      console.log('Pipeline failed as expected.');
    }
    
    console.log(`Analyzing trace: ${traceId} backwards...`);
    const analysis = await analyzeTrace(traceId);
    console.log('Root Cause Analysis:', JSON.stringify(analysis, null, 2));
    process.exit(0);
  });
} else {
  app.listen(PORT, () => console.log(`Forensics Dashboard listening on port ${PORT}`));
}
