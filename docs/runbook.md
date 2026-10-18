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

## Release Runbook

### Triggering a New Release
Releases are automated via GitHub Actions (`.github/workflows/release.yml`) and trigger whenever a semantic version tag is pushed:

```bash
# 1. Ensure master is clean and up-to-date
git checkout master
git pull origin master

# 2. Tag the release
git tag -a v0.1.0 -m "Release v0.1.0"

# 3. Push the tag to trigger the pipeline
git push origin v0.1.0
```

### Release Pipeline Stages
1. **Test Verification:** Runs project test suite gates prior to container build.
2. **Container Image Build:** Builds the production container image (`ghcr.io/sumitdalavi/ai-failure-forensics:<tag>`).
3. **Trivy Vulnerability Scan:** Scans the built container for CRITICAL and HIGH CVEs via Aqua Security Trivy.
4. **Anchore Syft SBOM Generation:** Creates an SPDX JSON Software Bill of Materials (`sbom.spdx.json`).
5. **GitHub Release Publishing:** Creates the release with auto-generated release notes and attaches `sbom.spdx.json`.

### Verifying the Release
```bash
# Check workflow run status
gh run list --workflow=release.yml --repo SumitDalavi/ai-failure-forensics

# Inspect the published release and attached assets
gh release view v0.1.0 --repo SumitDalavi/ai-failure-forensics

# Download and inspect the SBOM
gh release download v0.1.0 --repo SumitDalavi/ai-failure-forensics -p "sbom.spdx.json"
cat sbom.spdx.json | jq .spdxVersion
```

### Release Failure Modes
| Symptom | Cause | Resolution |
|---|---|---|
| `Unable to resolve action ... unable to find version` | Pinned action tag missing or upstream tag modified | Pin action to a verified release tag (`@v0.36.0`) or commit SHA |
| `invalid reference format: repository name must be lowercase` | Container repository owner contains uppercase characters | Lowercase the repository owner before tagging (`tr '[:upper:]' '[:lower:]'`) |
| `File not found: sbom.spdx.json` during release step | SBOM action configured with `artifact-name` instead of `output-file` | Ensure `output-file: sbom.spdx.json` is set in Anchore action |
