# Architecture — ai-failure-forensics
> Last updated: 2026-08-29 | Maturity: Partial Prototype
> _Observability layer for tracing multi-step AI pipelines and root-causing failures._

## System Diagram
```mermaid
flowchart TD
    Client(["Web Dashboard"])
    API["Express Backend\n:3000"]
    Pipeline["Target Pipeline\n(4 steps)"]
    Tracer["Tracing Middleware"]
    DB[("SQLite\n(sql.js)")]
    Judge["LLM Judge\n(Backwards Analysis)"]

    Client -->|"Trigger Run"| API
    API --> Pipeline
    Pipeline -->|"Step 1..4"| Tracer
    Tracer -->|"Save Span"| DB
    Client -->|"Flag Bad Output"| API
    API -->|"Fetch Trace"| DB
    API -->|"Analyze Trace"| Judge
    Judge -->|"Root Cause Found"| API
    API -->|"Save to Eval Dataset"| DB
```

## Component Table
| Component | File | Responsibility | Tech |
|---|---|---|---|
| API Server | `src/server.ts` | REST endpoints for dashboard | Express |
| Tracer | `src/tracer.ts` | Wraps functions to capture input/output | TypeScript |
| Judge | `src/evaluator.ts` | Analyzes traces for root causes | OpenAI / Prompt |
| Database | `src/db.ts` | Stores traces and evaluations | SQLite |

## Dependency Honesty Table
| Dependency | Status | Notes |
|---|---|---|
| SQLite | **Real** | Embedded in-memory DB for prototype. |
| OpenAI API | **Mocked** | Can be toggled to real via `.env`, but test suites use static stubs. |


## Component Breakdown
- **Core Technology**: TypeScript, LangChain.js, OpenTelemetry, SQLite
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security.