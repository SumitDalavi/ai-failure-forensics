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
