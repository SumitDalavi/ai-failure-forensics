# Changelog

## [Unreleased] - 2026-08-30

### Added/Fixed (Phase 6 Functional Upgrades)
- Added `src/cli.ts` to provide a functional, heuristic-based demo entry point that runs without an OpenAI key.
- Introduced detailed failure trace fixtures (`oom-crash-trace.json` and `hallucination-trace.json`).
- Verified robust unit test suite (21+ tests) covering analyzer edge cases.
- Added GitHub Actions CI status badge.

## [2026-08-29] — Phase 2 Evidence
### Added
- Created `tests/e2e/test_trace_replay.sh` to simulate replaying a stored trace.
- Created `fixtures/failure_corpus.json` with 5 distinct failure scenarios.
- Standardized documentation (`runbook.md`, `decisions.md`, `ARCHITECTURE.md`).
- Added maturity badge and mock boundaries to `README.md`.
