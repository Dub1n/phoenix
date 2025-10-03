# Consolidation State Registry — Draft Overview

This folder proposes the next-generation workflow backbone for utility consolidation. It introduces a single source of truth (`consolidation-state.json`), supporting schema, and automation entrypoints that drive the existing plan/tracker/log outputs.

The documents in this directory are drafts. They capture the intended structure, validation rules, and tooling flow so the cohort can review and adjust before replacing the current manual process.

## Contents

- `consolidation-state.json` — Sample state registry drafted from Pattern 5 data (lane 6a complete). Serves as a reference payload for generators.
- `consolidation-state.schema.json` — JSON Schema describing valid registry structure, enforced by tooling/CI.
- `cli-design.md` — Interaction design for the `npm run consolidate` companion, including prompts, validation rules, and update flows.
- `generators.md` — Outlines how Markdown tracker views will be generated from the registry and how to integrate with existing docs.
- `migration-plan.md` — Step-by-step transition strategy to adopt the registry in parallel with the current cohort.

Reviewers should read the schema alongside the CLI/generator design to ensure edge cases are covered (multiple agents, reopened stages, evidence updates, etc.).

Once ratified, the registry will become authoritative; Markdown files move to generated artefacts with minimal manual editing.
