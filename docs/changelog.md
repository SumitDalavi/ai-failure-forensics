# Changelog

## [0.2.0] - 2026-10-20
### Added
- **Progressive Credential Loading (PCL):** Dynamic auto-promotion between zero-dependency mock fallbacks and live production backends based on environment credentials.
- **Dual Distribution:** Universal OCI container publishing to GitHub Container Registry (`ghcr.io/sumitdalavi/ai-failure-forensics`) and Helm OCI registries alongside GitHub Release tarballs.
- **Health Reporting:** Exposed `/health` or `/healthz` endpoint with PCL status detection (`mock` vs `live`).
- **Dynamic Reloading:** Support for atomic ConfigMap / secret reloads without requiring pod restarts.
- **Supply Chain Security:** Trivy vulnerability scan gates and SPDX JSON SBOM (`sbom.spdx.json`) generation for all releases.

## [0.1.0] - 2026-10-18
### Added
- Initial baseline service implementation, unit test suites, and CI workflows.

## [v0.1.0] — 2026-10-18
### Added
- Automated DevSecOps release pipeline triggering on `v*.*.*` git tags.
- Container image build targeting GitHub Container Registry (`ghcr.io`).
- Trivy vulnerability scanning step with vulnerability reporting.
- Anchore Syft SPDX-JSON SBOM artifact generation.
- Automated GitHub Release publication with attached `sbom.spdx.json`.


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
