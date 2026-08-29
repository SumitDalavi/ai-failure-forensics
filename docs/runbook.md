# Runbook — ai-failure-forensics
> Last updated: 2026-08-29

## Quick Start
```bash
npm install
npm run start
```
Open `http://localhost:3000` to view the dashboard.

## Run Tests
```bash
npm test
bash tests/e2e/test_trace_replay.sh
```

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| OPENAI_API_KEY | - | Used for the real LLM judge (if mocks are disabled) |
