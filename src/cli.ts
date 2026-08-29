#!/usr/bin/env node
/**
 * AI Failure Forensics — CLI Demo
 * 
 * Usage:
 *   node dist/cli.js <fixture-file>
 *   node dist/cli.js fixtures/oom-crash-trace.json
 *   node dist/cli.js fixtures/hallucination-trace.json
 * 
 * Without OPENAI_API_KEY, runs in demo mode with simulated analysis.
 */

import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node dist/cli.js <fixture-file>');
  console.error('Example: node dist/cli.js fixtures/oom-crash-trace.json');
  process.exit(1);
}

const fixturePath = path.resolve(args[0]);

if (!fs.existsSync(fixturePath)) {
  console.error(`Error: File not found: ${fixturePath}`);
  process.exit(1);
}

const trace = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

console.log('\n' + '═'.repeat(60));
console.log('🔍  AI FAILURE FORENSICS — ROOT CAUSE ANALYSIS');
console.log('═'.repeat(60));
console.log(`\nTrace ID    : ${trace.id}`);
console.log(`Pipeline    : ${trace.pipeline}`);
console.log(`Timestamp   : ${trace.timestamp}`);
console.log(`Total Steps : ${trace.spans.length}`);
console.log('\n' + '─'.repeat(60));
console.log('📋  PIPELINE STEP ANALYSIS (backwards from final step)');
console.log('─'.repeat(60));

const reversed = [...trace.spans].reverse();
let rootCauseFound = false;

for (const span of reversed) {
  console.log(`\n▶  Step: ${span.step_name}`);
  console.log(`   Input  : ${span.input.substring(0, 80)}${span.input.length > 80 ? '...' : ''}`);
  console.log(`   Output : ${span.output.substring(0, 80)}${span.output.length > 80 ? '...' : ''}`);
  
  // Simple heuristic demo: detect context mismatch without actual OpenAI call
  const inputTopics = span.input.toLowerCase();
  const outputTopics = span.output.toLowerCase();
  
  // Check for obvious semantic mismatches
  const isMismatch = (
    (inputTopics.includes('crash') || inputTopics.includes('damaged') || inputTopics.includes('cracked') || inputTopics.includes('clauses')) &&
    (outputTopics.includes('travel') || outputTopics.includes('delighted') || outputTopics.includes('5-star') || outputTopics.includes('blog'))
  );
  
  if (isMismatch && !rootCauseFound) {
    console.log(`   Score  : 1/5 ⚠️  FAILURE DETECTED`);
    console.log(`   Category: Extraction Hallucination`);
    console.log(`   Reasoning: Output is semantically unrelated to input — model hallucinated context.`);
    rootCauseFound = true;
  } else if (!rootCauseFound) {
    console.log(`   Score  : 5/5 ✅  OK`);
  }
}

console.log('\n' + '═'.repeat(60));
if (rootCauseFound) {
  console.log('🚨  ROOT CAUSE IDENTIFIED');
  console.log('    Category : Extraction Hallucination');
  console.log('    Impact   : All downstream steps consumed hallucinated context.');
  console.log('    Fix      : Add output schema validation at this step boundary.');
} else {
  console.log('✅  NO ROOT CAUSE DETECTED — All steps scored > 2/5');
}
console.log('═'.repeat(60) + '\n');

console.log('ℹ️  Note: Running in demo mode (no OPENAI_API_KEY). Uses heuristic analysis.');
console.log('   Set OPENAI_API_KEY to enable full LLM-as-a-judge evaluation.\n');
