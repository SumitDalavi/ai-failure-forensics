import { Pool } from 'pg';
import { Trace, EvalCase } from '../types';

let dbInstance: Pool | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'forensics',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  await dbInstance.query(`
    CREATE TABLE IF NOT EXISTS traces (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      final_output TEXT,
      spans_json TEXT
    );

    CREATE TABLE IF NOT EXISTS eval_dataset (
      id TEXT PRIMARY KEY,
      original_input TEXT,
      failing_step TEXT,
      bad_output TEXT,
      human_corrected_output TEXT,
      failure_category TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return dbInstance;
}

export async function storeTrace(trace: Trace) {
  const db = await getDb();
  await db.query(`INSERT INTO traces (id, timestamp, status, final_output, spans_json) VALUES ($1, $2, $3, $4, $5)`,
  [
    trace.id,
    new Date(trace.timestamp).toISOString(),
    trace.status,
    trace.final_output || '',
    JSON.stringify(trace.spans)
  ]);
}

export async function getTraces(): Promise<Trace[]> {
  const db = await getDb();
  const res = await db.query(`SELECT id, timestamp, status, final_output, spans_json FROM traces ORDER BY timestamp DESC LIMIT 50`);

  return res.rows.map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    status: row.status,
    final_output: row.final_output,
    spans: JSON.parse(row.spans_json)
  }));
}

export async function getTrace(id: string): Promise<Trace | null> {
  const db = await getDb();
  const res = await db.query(`SELECT id, timestamp, status, final_output, spans_json FROM traces WHERE id = $1`, [id]);
  
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    status: row.status as 'success' | 'failure' | 'degraded',
    final_output: row.final_output,
    spans: JSON.parse(row.spans_json)
  };
}

export async function storeEvalCase(evalCase: EvalCase) {
  const db = await getDb();
  await db.query(`INSERT INTO eval_dataset (id, original_input, failing_step, bad_output, human_corrected_output, failure_category, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [
    evalCase.id,
    evalCase.original_input,
    evalCase.failing_step,
    evalCase.bad_output,
    evalCase.human_corrected_output,
    evalCase.failure_category,
    new Date(evalCase.timestamp).toISOString()
  ]);
}

