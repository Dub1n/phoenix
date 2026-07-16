---
doc-type: target-architecture
id: templum-cli-character-grid-architecture
category: target-architecture
status: planned
tags: [cli, renderer, terminal, character-grid, architecture]
last_updated: 2026-07-16
---

# Templum CLI Character-Grid Architecture

> Status: Accepted target architecture. This document does not claim implementation completeness.

## Decision

Replace the current collection of CLI string renderers, Inquirer-owned menus, and direct stdout presentation with one CLI-specific presentation runtime. The runtime converts validated domain state into a declarative scene, lays that scene out into rectangles, rasterises it into a two-dimensional terminal-cell buffer, and paints the resulting frame through one terminal backend.

The orchestrator, discovery, skin validation, command routing, service ordering, and shared session infrastructure remain outside this rewrite.

## Current Replacement Boundary

The current implementation has multiple presentation authorities:

- `CLIInterfaceAdapter.applySkin()` can print procedural window sets.
- The live interactive loop uses `InteractiveMenuRenderer.displayMenu()` and hardcoded default menus.
- An enhanced interactive menu exists but is not the live loop's rendering path.
- Status, command results, prompts, spinners, warnings, and errors can write directly to stdout.
- CLI layout responsibilities are distributed across the universal layout engine, content layout system, window system, consistency engine, terminal UI components, and formatter utilities.

The rewrite begins where validated CLI-relevant state is converted into presentation data and ends at terminal input/output. It does not replace backend or cross-interface contracts.

## Target Data Flow

```text
Validated skins + service state + session state + command state
                              |
                              v
                     CliViewModelBuilder
                              |
                              v
                         CliViewModel
                              |
                              v
                        CliSceneBuilder
                              |
                              v
                         LayoutNode tree
                              |
                    measure and arrange
                              |
                              v
                      positioned scene tree
                              |
                         rasterise
                              |
                              v
                      CellBuffer(width,height)
                              |
                         paint or diff
                              |
                              v
                         terminal backend
```

Input follows the reverse control direction:

```text
terminal bytes -> KeyEvent -> CliStateReducer -> effect requests + new state -> render
```

## Components

### CliApplication

Owns startup, the event queue, render scheduling, effect completion, resize handling, and shutdown. It is the only coordinator allowed to connect input, state, and rendering.

### CliStateReducer

A pure transition function from the current state and a typed event to the next state plus requested effects. Selection, focus, navigation, text entry, confirmations, command execution, and skin switching are explicit states rather than prompt-local variables.

### CliViewModelBuilder

Normalises validated skins and runtime state into renderer-neutral page, menu, table, textbox, status, and navigation models. It may reuse pure parts of `cli-generator.ts`, but it produces no terminal strings and performs no output.

### CliSceneBuilder

Converts a view model into a declarative tree of components. Components describe content, constraints, focus, and style without absolute terminal coordinates.

### CliLayoutEngine

Performs two phases:

1. **Measure**: determine minimum, preferred, and maximum sizes using terminal display width.
2. **Arrange**: assign each node a rectangle within its parent bounds.

Layout owns padding, centring, wrapping policy, nesting offsets, clipping bounds, and z-order. Components receive local bounds and do not calculate global positions.

### CellBuffer

Represents the complete frame as terminal cells.

```ts
interface Cell {
  grapheme: string;
  displayWidth: 0 | 1 | 2;
  style: CellStyle;
  continuation: boolean;
}
```

Required operations include `fill`, `writeText`, `drawHorizontalLine`, `drawBorder`, `clip`, and `blit`. Writes outside a clipping rectangle are rejected or clipped deterministically.

Styles remain separate from graphemes so ANSI sequences never participate in measurement.

### TerminalPainter

Serialises a cell buffer into terminal output, groups adjacent cells with identical styles, controls cursor visibility and position, and resets styles after painting. The first implementation may repaint complete frames; a previous-frame diff is an optional optimisation after correctness is proven.

### TerminalInputController

Owns raw mode and converts terminal input into typed key, text, paste, resize, and interrupt events. No page component creates its own readline or Inquirer session.

### EffectRunner

Executes asynchronous commands, discovery refreshes, skin loads, and shutdown work requested by the reducer. Effect completion returns typed events to the application; effects do not print output.

## Scene Primitives

The renderer exposes composable primitives rather than page-specific coordinate scripts:

```ts
canvas.fill(rect, style);
canvas.drawBorder(rect, borderStyle);
canvas.writeText(point, text, style, clipRect);
canvas.drawMenu(rect, items, selectedIndex, focusState);
canvas.drawTextBox(rect, inputState);
canvas.blit(childBuffer, origin, clipRect);
```

Pages arrange components; primitives rasterise them. Backend and command handlers never call canvas operations directly.

## State Model

The application state includes:

- active skin and page identifiers
- navigation history
- current view model inputs
- focused component
- selected menu item
- text-box value and cursor
- command execution/result state
- pending exit confirmation
- terminal dimensions and capabilities
- transient status or error state

Every visible change is reproducible from this state.

## Output Ownership

- Interactive stdout is owned exclusively by `TerminalPainter` while the CLI application is active.
- Structured application logs use the logger transport, normally stderr or file output configured not to corrupt the frame.
- Non-interactive command output uses a separate renderer/serializer and does not initialise raw mode.
- Legacy helpers that write presentation fragments directly must be removed or placed behind the terminal backend during migration.

## Compatibility

- Use grapheme segmentation and display-width measurement compatible with Node.js 20.
- Support wide cells and combining characters without splitting them across borders.
- Provide Unicode and ASCII border sets.
- Detect non-TTY output and select deterministic non-interactive serialization.
- Always restore raw mode, cursor visibility, listeners, and styles during shutdown.

## Preserved Systems

- `TemplumCore` and orchestrator abstractions
- service discovery and connection lifecycle
- `UniversalSkinDefinition` validation and version enforcement
- backend command routing
- service ordering rules
- shared session/context management
- logger and error-handler infrastructure

## Replacement Candidates

CLI presentation responsibilities currently in the following modules are migrated and then removed or reduced:

- `interactive-menu-renderer.ts`
- CLI menu/window portions of `terminal-ui-components.ts`
- `enhanced-window-system.ts`
- `content-layout-system.ts`
- the CLI branch of `universal-layout-engine.ts`
- CLI presentation portions of `cli-display-consistency-engine.ts`
- direct presentation output in `cli-adapter-abstracted.ts`

Shared modules required by VSCode or command interfaces must not be deleted until their consumers are separated.

## Migration Strategy

1. Lock the product contract with pure golden-frame fixtures.
2. Implement display-width, geometry, style, and cell-buffer primitives.
3. Implement pure scene measurement, arrangement, and rasterisation.
4. Implement the reducer and typed input events.
5. Integrate skin and runtime state through a renderer-neutral view model.
6. Route one CLI workflow through the new runtime behind an explicit migration switch.
7. Migrate commands, help, status, errors, text input, skin switching, and shutdown.
8. Make the character-grid runtime the only interactive path.
9. Remove legacy render and input paths after parity and PTY validation.

## Architectural Gates

- One component owns interactive stdout.
- No renderer imports backend-specific implementations.
- No layout calculation consumes ANSI-decorated strings.
- No component starts its own readline, Inquirer, or raw-mode session.
- Renderer tests are deterministic without a live terminal.
- Input and state transitions are testable without rendering.
- Terminal restoration is proven through PTY tests.

## Documentation Synchronisation

When implementation status changes, update `architecture-spec.md`, `progress.md`, `testing-guide.md`, and `cli-character-grid-renderer.md` together. This target document changes only when the accepted architecture changes.
