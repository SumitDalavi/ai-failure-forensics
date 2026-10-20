
# Failure Forensics Tool for AI Pipelines

[![Release](https://img.shields.io/github/v/release/SumitDalavi/ai-failure-forensics?color=blue&logo=github)](https://github.com/SumitDalavi/ai-failure-forensics/releases)
[![Release Workflow](https://github.com/SumitDalavi/ai-failure-forensics/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/ai-failure-forensics/actions/workflows/release.yml)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%20JSON-blueviolet?logo=spdx)](https://github.com/SumitDalavi/ai-failure-forensics/releases)

[![Release](https://img.shields.io/github/v/release/SumitDalavi/ai-failure-forensics?color=blue&logo=github)](https://github.com/SumitDalavi/ai-failure-forensics/releases)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%20JSON-blueviolet?logo=spdx)](https://github.com/SumitDalavi/ai-failure-forensics/releases)

[![CI](https://github.com/SumitDalavi/ai-failure-forensics/actions/workflows/ci.yml/badge.svg)](https://github.com/SumitDalavi/ai-failure-forensics/actions/workflows/ci.yml)

> **Maturity:** Functional Prototype
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
Run the unit and integration tests (20+ tests covering edge cases for the LLM-as-a-judge):
```bash
npm test
```

## 💻 CLI Demo Mode
You can run a synthetic failure and root cause analysis trace directly from the command line without starting the server:
```bash
npx ts-node src/index.ts --cli
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

## 🚀 Progressive Credential Loading & Execution Tiers

This project implements **Progressive Credential Loading (PCL)**, allowing it to run immediately out-of-the-box without external dependencies while seamlessly upgrading as credentials are provided.

### Tier 1: Zero-Config Mock Mode (Default)
Ideal for CI, testing, and rapid local evaluation.
- **Execution:** Run with default configuration (`cp .env.example .env`). Zero API keys, databases, or cloud credentials required.
- **Fallback Behavior:** In-memory caches, deterministic offline heuristics, mock vector embeddings, and local mock storage are automatically used.
- **Health Verification:** Endpoints report `{"mode": "mock"}` for unconfigured dependencies.

### Tier 2: Local Development with Live Services
Connect specific external services while keeping others mocked.
- **Execution:** Provide credentials in `.env` for the services you want active (e.g., `OPENAI_API_KEY, ANTHROPIC_API_KEY, DB_PATH`).
- **Progressive Upgrade:** The runtime inspects environment variables on boot and dynamically promotes only configured modules to live mode.
- **Safe Fallback:** Any missing credentials automatically remain on mock fallbacks with no crashes or missing service errors.

### Tier 3: Production Hardened
Enterprise deployment with production-grade backends, security scans, and container distributions.
- **OCI Container Image:** Pre-built, multi-arch image on GitHub Container Registry:
  ```bash
  docker pull ghcr.io/sumitdalavi/ai-failure-forensics:v0.2.0
  ```
- **Production Orchestration:** Mount secrets via Kubernetes Secrets or cloud secret managers with atomic config reload support.
- **Release Verification:** Checksums and SPDX SBOM available on [GitHub Releases](https://github.com/SumitDalavi/ai-failure-forensics/releases).

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for tracing architecture
- [Changelog](docs/changelog.md) — Change history

## Release & Security Verification

The project includes an automated DevSecOps release pipeline (`.github/workflows/release.yml`) triggered on semantic version tags (`v*.*.*`).

Each release automatically:
1. Executes test suite gates.
2. Builds the container image.
3. Performs vulnerability scanning via Trivy.
4. Generates an SPDX SBOM (`sbom.spdx.json`) using Anchore Syft.
5. Publishes a GitHub Release with attached SBOM.

### Verifying the Release
```bash
# Verify release via GitHub CLI
gh release view v0.1.0 --repo SumitDalavi/ai-failure-forensics

# Download and inspect SBOM
gh release download v0.1.0 --repo SumitDalavi/ai-failure-forensics --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/runbook.md)
- [Decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)