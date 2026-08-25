# Architecture: Failure Forensics Tool for AI Pipelines

## System Diagram
The following Mermaid.js sequence diagram maps the core workflow and interactions:

```mermaid
sequenceDiagram
Pipeline->>Tracer: Start Trace
Step1->>Tracer: Log span + confidence
Step2->>Tracer: Log span + confidence
Tracer->>Analyzer: Detect root cause on failure
Analyzer->>Dashboard: Highlight bad node
```

## Component Breakdown
- **Core Technology**: TypeScript, LangChain.js, OpenTelemetry, SQLite
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security.
