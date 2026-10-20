# Decisions

## ADR-001: SQLite (sql.js) for Trace Storage
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
We need to store hierarchical traces (spans and parent-child relationships) and query them for backwards analysis.

**Decision:**  
We use embedded `sql.js` (SQLite) instead of a heavier distributed trace store like Jaeger or a full Postgres DB.

**Consequences:**  
- ✅ Zero-configuration startup.
- ✅ Easy to dump the trace database to a file for debugging.
- ⚠️ Volatile by default; not suitable for high-throughput production without migrating to a persistent SQL backend.

## ADR-002: Progressive Credential Loading (PCL) Architecture
- **Context:** Production hardening required live backends (PostgreSQL, Redis, OpenAI, Anthropic), but removing mocks would break CI pipelines and create high developer onboarding friction.
- **Decision:** Implement Progressive Credential Loading. Keep in-memory and local mock heuristics as the default safe baseline, while wrapping external integrations in auto-promoting factory adapters triggered by environment variables.
- **Consequences:** 
  - *Pros:* 100% CI pass rate without requiring external secrets; zero setup friction for new contributors; progressive upgrade to production clusters.
  - *Cons:* Adds lightweight factory abstraction layers and runtime credential detection logic.
