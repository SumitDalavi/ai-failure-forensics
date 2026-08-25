import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { Trace, EvalCase } from '../types';

const DB_FILE = path.join(process.cwd(), 'forensics.sqlite');

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(filebuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS traces (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return dbInstance;
}

export async function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export async function storeTrace(trace: Trace) {
  const db = await getDb();
  const stmt = db.prepare(`INSERT INTO traces (id, timestamp, status, final_output, spans_json) VALUES (?, ?, ?, ?, ?)`);
  stmt.run([
    trace.id,
    trace.timestamp,
    trace.status,
    trace.final_output || '',
    JSON.stringify(trace.spans)
  ]);
  stmt.free();
  await saveDb();
}

export async function getTraces(): Promise<Trace[]> {
  const db = await getDb();
  const res = db.exec(`SELECT id, timestamp, status, final_output, spans_json FROM traces ORDER BY timestamp DESC LIMIT 50`);
  if (res.length === 0) return [];

  return res[0].values.map((row: any) => ({
    id: row[0],
    timestamp: row[1],
    status: row[2],
    final_output: row[3],
    spans: JSON.parse(row[4])
  }));
}

export async function getTrace(id: string): Promise<Trace | null> {
  const db = await getDb();
  const res = db.exec(`SELECT id, timestamp, status, final_output, spans_json FROM traces WHERE id = '${id}'`);
  if (res.length === 0) return null;
  const row = res[0].values[0];
  return {
    id: row[0] as string,
    timestamp: row[1] as string,
    status: row[2] as 'success' | 'failure' | 'degraded',
    final_output: row[3] as string,
    spans: JSON.parse(row[4] as string)
  };
}

export async function storeEvalCase(evalCase: EvalCase) {
  const db = await getDb();
  const stmt = db.prepare(`INSERT INTO eval_dataset (id, original_input, failing_step, bad_output, human_corrected_output, failure_category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run([
    evalCase.id,
    evalCase.original_input,
    evalCase.failing_step,
    evalCase.bad_output,
    evalCase.human_corrected_output,
    evalCase.failure_category,
    evalCase.timestamp
  ]);
  stmt.free();
  await saveDb();
}

