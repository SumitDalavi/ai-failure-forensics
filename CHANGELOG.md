# Changelog

All notable changes to the `ai-failure-forensics` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-08-30

### Added/Fixed (Phase 6 Functional Upgrades)
- Added `src/cli.ts` to provide a functional, heuristic-based demo entry point that runs without an OpenAI key.
- Introduced detailed failure trace fixtures (`oom-crash-trace.json` and `hallucination-trace.json`).
- Verified robust unit test suite (21+ tests) covering analyzer edge cases.
- Added GitHub Actions CI status badge.
