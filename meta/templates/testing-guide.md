---
doc-type: operations-guide
name: [Project Name] Testing Guide
tags: [project, testing, qa]
status: draft
last_updated: TODO-YYYY-MM-DD
---

# [Project Name] — Testing Guide

## 0. Purpose

- Summarise why the guide exists (e.g., canonical commands, troubleshooting, onboarding).
- Mention how it complements the architecture spec/progress tracker.

## 1. Environment Prerequisites

- Node/Runtime version(s) and how to install (or link to setup doc).
- Local services/backends/mocks required; include port expectations.
- Dependency install steps (`npm install`, additional package dirs).
- Notes about environment variables, `.env`, credentials, or filesystem requirements.

## 2. Quick Command Reference

| Command               | When to use                           | Notes                                               |
| --------------------- | ------------------------------------- | --------------------------------------------------- |
| `npm test`            | Default unit/integration suite.       | Include typical runtime, coverage behaviour.        |
| `npx jest --config …` | Example of scoped/integration config. | Highlight serial execution, detectOpenHandles, etc. |
| `npm run <script>`    | Long-running harness or smoke test.   | Capture prerequisites, output locations.            |

Add/edit rows to reflect the project’s script surface.

## 3. Suite Taxonomy

### 3.1 Unit Tests

- Location/glob pattern.
- Runtime expectations (seconds, parallel).
- Dependencies/mocks worth knowing about.

### 3.2 Integration Tests

- Breakdown by subsystem (backend, interfaces, adapters, etc.).
- Explain when to run individually vs. part of the full suite.

### 3.3 Long-Running / End-to-End Suites

- Describe harness behaviour (e.g., spawns services, uses Playwright).
- Document timeouts and exit expectations (Ctrl+C handling, cleanup guard rails).

Extend with additional subsections as needed (load testing, contract tests, etc.).

## 4. Scripted Validations / Pipelines

- Document orchestrated scripts (e.g., Phase 6) with step-by-step instructions.
- Note required build steps, generated reports, and cleanup responsibilities.

## 5. Troubleshooting & Tips

- Common failure symptoms and remediation steps (port collisions, leftover processes).
- How to enable verbose logging or isolate tests (`--runTestsByPath`, env toggles).
- References to monitoring dashboards or log files when relevant.

## 6. Related Documentation

- Link to architecture spec, progress tracker, onboarding guides, ADRs.
- Mention where to record updates when commands/timeouts change.

> Keep this template short and actionable. When adopting it for a project, remove placeholder text and ensure every section points to current behaviour.
