# Failure Forensics Tool for AI Pipelines

> **Maturity:** Partial Prototype
> _An observability layer for multi-step AI pipelines that traces every intermediate step, identifies exactly where failures originate when the final output is bad, and feeds flagged failures back into an evaluation dataset._

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🎯 The Problem This Solves

When a multi-step AI pipeline (e.g., Intake → Extraction → Classification → Summarization) produces garbage, most teams have no idea which step broke. Was the extraction hallucinated? Did the classification misinterpret the extraction? Did the summarizer drop critical context?

This tool answers *"where did this go wrong?"* by acting as a lightweight, open-source alternative to LangSmith or Braintrust, allowing you to trace backwards from a failure to identify the exact step that poisoned the well.

## 🏗️ Architecture

- **Language**: TypeScript 5.3 + Node.js 20
- **Storage**: `sql.js` (SQLite in WebAssembly) for persisting JSON traces and evaluation datasets.
- **Pipeline Structure**: A simulated 4-step processing pipeline (Intake → Extraction → Classification → Summarization).
- **Evaluation Engine**: LLM-as-a-judge (`gpt-4o-mini`) to perform backwards trace analysis and find root causes.
- **Interface**: An Express.js backend serving a lightweight HTML/JS dashboard for exploring traces and flagging failures.

## 🚀 Quick Start

### 1. Install & Configure
```bash
git clone https://github.com/SumitDalavi/ai-failure-forensics.git
cd ai-failure-forensics
npm install
```
Ensure you create a `.env` file containing your `OPENAI_API_KEY`.

### 2. Start the Server
```bash
npm run start
```
*The SQLite database will initialize on the first boot.*

### 3. Explore the Dashboard
Navigate to `http://localhost:3000` in your browser. 
- You can run a **Good Doc** through the simulated pipeline to see a healthy trace.
- You can run a **Bad Doc (Inject Failure)** which will deliberately cause an extraction hallucination halfway through the pipeline.
- Click **Flag as Bad Output** to run the LLM backwards-analyzer. It will identify the broken step, categorize the failure, and save it to the SQLite `eval_dataset` table for future testing!

## 🧪 Tests

```bash
npm test
```
The test suite validates the tracing `instrument()` wrapper to ensure spans correctly capture input, output, tokens, and latency across nested asynchronous calls.

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer  
[GitHub](https://github.com/SumitDalavi) · [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)


## Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| Tracing Middleware | **Real** | Intercepts inputs/outputs and saves to SQLite. |
| Evaluation Engine | **Real/Mocked** | LLM judge can use real OpenAI keys or local stubs. |
| Target Pipeline | **Simulated** | The 4-step pipeline is a stub to demonstrate tracing. |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for tracing architecture
- [Changelog](docs/changelog.md) — Change history
