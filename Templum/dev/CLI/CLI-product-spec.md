---
doc-type: product-spec
id: templum-cli-product-spec
category: product-specification
status: planned
tags: [cli, terminal-ui, user-experience, acceptance-criteria]
last_updated: 2026-07-16
---

# Templum CLI Product Specification

> Status: Accepted target state. Implementation is tracked in `../tasks/cli-character-grid-renderer.md`.

## Purpose

The Templum CLI provides one persistent, skin-driven terminal interface for discovering backend services, navigating their capabilities, entering commands, and viewing results. Every visible interactive element is rendered inside the managed CLI surface.

## Product Principles

- The CLI renders validated Templum and backend skin data without backend-specific presentation code.
- One application state controls the visible frame, focus, selection, input, navigation, and confirmation states.
- The terminal surface has one output owner; commands, status, errors, help, and progress do not print around the renderer.
- Navigation is predictable across Templum pages and backend-provided pages.
- The interface degrades deliberately when terminal capabilities are limited.

## Terminology

- **Frame**: the complete terminal-cell surface produced for one application state.
- **Window**: a bordered rectangular region containing a title bar and page.
- **Window title bar**: the row between the top border and page border containing a centred title.
- **Page**: the content area below the title bar.
- **Page description**: the first explanatory text in a page.
- **Selector**: `›`, occupying the middle cell of the standard three-cell left padding when an item is selected.
- **Menu separator**: the horizontal rule between page content and universal navigation.
- **Text box**: an input control placed within the active page rather than below the managed frame.

## Frame and Layout

- The active frame is derived from the current skin, session state, service state, command state, and terminal dimensions.
- Windows use box-drawing borders when supported and a defined ASCII fallback otherwise.
- Window titles are centred by terminal display width, not JavaScript string length.
- Page content has three terminal cells of left and right padding.
- The selector replaces the middle cell of the left padding; it does not shift item text.
- A blank row separates the page description from following content.
- A blank row separates page content from the menu separator.
- The universal navigation items are `Back`, `Home`, `Help`, and `Exit` in that order.
- `Back` and `Home` remain visible but disabled when they are not applicable.
- Menu selection moves continuously across page items and universal navigation while skipping disabled entries.
- Nested or overlapping windows are composed deterministically with explicit bounds and z-order.
- Content that cannot fit must follow a component-specific wrapping, truncation, scrolling, or pagination rule; it must not overflow borders.
- Terminal resize produces a new valid frame without corrupting input or navigation state.

## Width Policy

- Preferred window width is the minimum width required by the widest measurable page in the active skin, including borders and three-cell page padding.
- Preferred width is clamped to the available terminal width.
- Dynamic content such as command responses and timestamps does not permanently expand the navigation window; its component uses wrapping or scrolling within the available bounds.
- Display width calculations account for ANSI-free grapheme width, combining characters, and wide characters.

## Focus and Input

- Exactly one interactive element owns focus.
- Menu focus displays a coloured selector and a muted text-box prompt where a text box is present.
- Text-box focus displays its prompt and cursor using the active focus style while the menu selector is muted.
- Text entry is represented in application state and rendered inside the page.
- Submitting a command transitions to an executing state and then to a result or error state without an arbitrary timeout.
- Cancelling input restores the prior stable page without leaving stdin in an invalid mode.
- No page uses `Press Enter to continue`; results and help remain normal navigable pages.

## Navigation and Skins

- Menu routes and commands originate from validated skin definitions or Templum's own schema-conforming system skin.
- The renderer has no backend-name branches and no hardcoded route map for backend pages.
- The home page exposes connected backend services as shortcuts to their service pages.
- A service page may expose loading its skin, service details, capabilities, and commands according to available data.
- Loaded but disconnected services remain inspectable when cached metadata is available; unavailable actions are disabled rather than hiding the service.
- Switching the active skin replaces the rendered menu graph while preserving compatible session context.

## Service Status

- Connected services display their health state.
- Disconnected services display `Disconnected` without a second `Not available` label.
- Connected services appear before disconnected services.
- Each status group is ordered alphabetically.
- Status indicators use text and theme styling; the normal interface contains no emoji status glyphs.

## Exit Behaviour

- Selecting `Exit` changes that item to `Press Enter again to shut down Templum CLI`.
- A second Enter while the confirmation remains selected performs complete cleanup and returns control to the terminal.
- The first Ctrl+C changes the managed frame to show `Press Ctrl+C again to shut down Templum CLI`.
- A second consecutive Ctrl+C performs complete cleanup and returns control to the terminal.
- Any unrelated input cancels the pending confirmation.
- Shutdown must restore raw mode, cursor visibility, input listeners, and terminal styling.

## Feedback and Errors

- Loading, execution, success, warning, and failure are rendered as states or components inside the managed frame.
- Application logs use the configured logger and must not corrupt the interactive surface.
- Errors provide a stable recovery action through the same navigation model.
- Pages do not disappear because a timer elapsed.

## Accessibility and Compatibility

- Essential state is communicated through text, not colour alone.
- Disabled and selected states remain distinguishable without colour.
- Unicode box drawing has a complete ASCII fallback.
- Non-interactive output uses a separate deterministic serialization path rather than starting the interactive renderer.
- Screen-reader or basic-terminal mode may use a linear frame while preserving labels, ordering, actions, and results.

## Acceptance Evidence

- Golden full-frame tests cover representative home, service, command-entry, command-result, help, error, and confirmation states.
- Golden tests run at multiple terminal dimensions and in Unicode and ASCII modes.
- Keyboard-event tests cover selection, cross-separator navigation, input, cancellation, skin switching, resize, and both exit confirmation paths.
- Integration tests prove validated skin data produces the view model and that only the terminal painter writes interactive frame output.
- PTY tests prove cleanup restores terminal control after normal exit, Ctrl+C, command cancellation, and errors.
