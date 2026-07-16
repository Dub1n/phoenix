---
doc-type: task-log
id: cli-character-grid-renderer
tags: [templum, cli, renderer, migration]
status: planned
last_updated: 2026-07-16
---

# Task: Replace the CLI presentation runtime with a character-grid renderer

## Requirement Summary

- Status: `[ ]`
- Priority: MVP blocker
- Decision: Accepted 2026-07-16
- Product contract: `dev/CLI/CLI-product-spec.md`
- Target architecture: `dev/CLI/CLI-character-grid-architecture.md`
- Decision record: `dev/CLI/report_2026-07-16.md`

## Problem Statement

The CLI receives usable orchestrator and skin data, but its live interactive presentation is split across procedural window output, hardcoded Inquirer menus, enhanced menu components, and direct stdout writers. The current tests prove the presence of strings and borders without proving the complete interactive frame or terminal lifecycle.

## Preserved Boundary

- Preserve discovery, connection, validated skin payloads, command routing, service ordering, logger/error handling, and shared session state.
- Replace CLI view-model construction through interactive terminal input/output.
- Keep the renderer backend-agnostic and skin-driven.

## Pre-Implementation Gate

Complete this gate before Stage 2 implementation begins. Stage 1 tests may be written while these decisions are being resolved, but production renderer modules must not be added until every item below is recorded in the product contract, target architecture, or this task log.

### Product Behaviour Decisions

- [ ] Define wrapping, truncation, scrolling, and overflow behaviour for every content type.
- [ ] Define minimum supported terminal dimensions and the fallback shown below that size.
- [ ] Define resize behaviour for active menus, input fields, command results, and nested windows.
- [ ] Define dynamic command-response sizing, maximum retained output, and any scrolling controls.
- [ ] Define deterministic nested-window offsets, clipping, z-order, and active-window treatment.
- [ ] Define textbox focus, placeholder, editing, cancellation, submission, and focus-transfer behaviour.
- [ ] Define disabled Back/Home behaviour and selector traversal across the menu separator.
- [ ] Define grapheme, combining-character, wide-character, and unsupported-glyph behaviour.

### Reviewed Golden Frames

- [ ] Produce corrected golden frames for the main menu, nested backend page, and connected-service table.
- [ ] Produce focused and unfocused command-textbox frames.
- [ ] Produce command-result and error-result frames.
- [ ] Produce Exit and Ctrl+C confirmation frames.
- [ ] Produce empty-discovery and narrow-terminal fallback frames.
- [ ] Record the terminal dimensions and capability profile attached to every golden frame.

The retained 2.1 ASCII files are design inputs, not executable fixtures, until this review is complete.

### Presentation Contract

- [ ] Define a renderer-neutral CLI view model covering page, menu, navigation, service, input, command-result, focus, loading, error, and confirmation state.
- [ ] Prohibit backend-specific objects and preformatted terminal strings at the renderer boundary.
- [ ] Define which layer converts validated skins, service state, and session state into that view model.
- [ ] Record the command/effect interface used by reducer transitions without embedding execution in rendering components.

### Terminal Ownership and Test Seams

- [ ] Establish `TerminalPainter` as the only interactive stdout writer in the target architecture.
- [ ] Route logs and observability through non-interactive sinks so they cannot corrupt the managed frame.
- [ ] Specify injectable terminal dimensions, capabilities, input events, clock, output sink, and command executor.
- [ ] Specify ANSI-free framebuffer assertions separately from terminal-painter serialization tests.

### Migration and Cutover

- [ ] Classify each existing CLI presentation component as preserve, adapt, temporary coexistence, or delete after cutover.
- [ ] Identify all non-CLI consumers before modifying shared layout and formatting modules.
- [ ] Define a temporary old/new renderer selection mechanism, rollback point, and removal date.
- [ ] Define cutover gates: golden frames, reducer tests, adapter integration, PTY workflows, terminal restoration, and canonical documentation.

### Baseline and Utility Governance

- [ ] Capture current build, focused CLI suites, representative interactive workflows, and terminal output as baseline evidence.
- [ ] Record known current failures separately from rewrite regressions.
- [ ] Complete utility-consolidation Stage 1/2 consumer mapping for affected display utilities.
- [ ] Record and approve the required Stage 3-5 migration plan before shared utility implementation or replacement.

## Stage 1: Contract and Guardrails

- [ ] Resolve ambiguities in the retained ASCII examples and create reviewed golden fixtures.
- [ ] Add failing full-frame tests for home, service list, service detail, command input, command result, help, error, and exit confirmation.
- [ ] Add failing width/capability cases for narrow, standard, wide, Unicode, and ASCII terminals.
- [ ] Add a guardrail that inventories interactive stdout writers and prevents new unmanaged writers.
- [ ] Record affected consumers and migration boundaries before modifying shared rendering modules.

## Stage 2: Cell and Geometry Foundation

- [ ] Implement tested point, size, rectangle, clipping, and z-order primitives.
- [ ] Implement grapheme-aware display width and wide-cell continuation behaviour.
- [ ] Implement style-separated `Cell` and `CellBuffer` types.
- [ ] Implement fill, text, line, border, clip, and blit operations.
- [ ] Reach at least 80% coverage on new renderer utilities.

## Stage 3: Detailed Migration Plan

- [ ] Map legacy responsibilities in the adapter, interactive renderer, terminal UI, window system, content layout system, universal layout engine, and consistency engine.
- [ ] Identify non-CLI consumers before extracting or deleting shared code.
- [ ] Define the renderer package/module structure and dependency injection seams.
- [ ] Define the incremental migration switch and rollback point.
- [ ] Review the plan against SOLID and utility-consolidation requirements before Stage 4 implementation.

## Stage 4: Scene and Layout

- [ ] Implement renderer-neutral CLI view models.
- [ ] Implement declarative scene components for windows, text, menus, tables, text boxes, navigation, status, and overlays.
- [ ] Implement measure and arrange passes with local component bounds.
- [ ] Implement deterministic rasterisation into `CellBuffer`.
- [ ] Make golden-frame tests pass without terminal I/O.

## Stage 5: State and Input

- [ ] Implement typed CLI state, events, reducer transitions, and effect requests.
- [ ] Implement one raw-mode/input owner producing key, text, paste, resize, and interrupt events.
- [ ] Cover focus, cross-separator selection, text editing, cancellation, navigation history, and exit confirmation.
- [ ] Prove state transitions independently from rendering.

## Stage 6: Runtime Integration

- [ ] Feed validated Templum/system and backend skins into the CLI view-model builder.
- [ ] Integrate service status and skin switching without backend-name branches.
- [ ] Route command execution, results, errors, help, and progress through application state.
- [ ] Make the terminal painter the only interactive stdout owner.
- [ ] Preserve shared session state and compatible navigation context across skin changes.

## Stage 7: Legacy Removal

- [ ] Make the character-grid runtime the default and only interactive CLI path.
- [ ] Remove hardcoded default interactive menus.
- [ ] Remove redundant Inquirer/readline/raw-mode ownership.
- [ ] Remove or reduce superseded CLI rendering components after verifying non-CLI consumers.
- [ ] Remove arbitrary page and command-result timeouts.

## Stage 8: Validation and Documentation

- [ ] Add PTY workflows for normal exit, double Ctrl+C, input cancellation, resize, errors, and terminal restoration.
- [ ] Run build, focused renderer tests, adapter integration, CLI E2E, test CI, and Phase 6 validation.
- [ ] Capture command outputs and evidence paths here.
- [ ] Update `architecture-spec.md`, `progress.md`, `testing-guide.md`, and changelog entries to match verified behaviour.
- [ ] Archive or close superseded CLI task logs only after replacement coverage passes.

## Validation Commands

- `npm run build`
- `npm test -- --coverage=false --runInBand --runTestsByPath <renderer suites>`
- `npm run test:ci`
- `npm run phase6-validation`
- `npm run phase6-health`

## Current Evidence

- 2026-07-16: `npm run build` passed before the rewrite decision.
- 2026-07-16: Existing content-layout and interface-adapter suites passed 47 tests with coverage disabled. Their captured output remains visually non-compliant, so this is baseline evidence rather than completion evidence.

## Completion Criteria

- The live interactive CLI is entirely skin/state driven.
- One state model controls the complete frame and input lifecycle.
- One terminal backend owns interactive stdout.
- Golden frame, keyboard-event, integration, and PTY tests pass.
- Terminal state is restored after every exit and failure path.
- Canonical documentation describes only verified implementation.
