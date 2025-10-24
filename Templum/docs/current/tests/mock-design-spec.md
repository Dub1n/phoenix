---
doc-type: appendix
name: Canonical CLI Mock Layout
tags: [templum, mock, cli]
status: draft
last_updated: 2025-10-16
---

# Appendix A — Canonical CLI Mock Layout

## 0. Purpose

- Define the visual and structural rules the canonical backend mock must satisfy when rendering through the CLI adapter.
- Provide deterministic fixtures that test suites can assert against when validating skin-driven rendering.
- Ensure the mock exercises required interface behaviours: stacked windows, menu navigation, command input/output, and procedurally generated content.

> All layout elements described here are delivered via the canonical mock’s `UniversalSkinDefinition`. Tests SHOULD fail if the rendered output deviates from these rules.

## 1. Component Naming & Responsibilities

| Component Name   | Description                                                                   | Notes                                                                  |
| ---------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Window`         | Bordered container drawn with box-drawing characters.                         | Windows may be stacked; every window in a stack keeps the same width and connects to its parent using shared border joints (`┴`, `├`). Each nested window begins two rows lower and two columns to the right of its parent but retains the parent's width. |
| `WindowTitleBar` | Text row immediately beneath the top border and above the page divider.       | Format is `│{title centred}│` with plain whitespace padding; no inner box is drawn around the text. |
| `WindowBody`     | Content area inside a window. Holds menus, text blocks, and command panels.   | Page content starts three spaces in from the border on every line (the selector `›` replaces the middle space when present). |
| `PageMenu`       | Vertical menu rendered inside a `WindowBody`.                                 | Active item prefixed with `›`; inactive items align within the same column using the three-space padding rule. |
| `MenuSeparator`  | Horizontal rule that separates page content from the standard navigation menu.| Rendered as `│   ─────…────   │` using the page width and three-space padding. |
| `StatusStrip`    | Footer navigation (Back, Home, Help, Exit).                                   | Lives inside the current window body, one item per line, directly beneath the `MenuSeparator`. |
| `CommandPanel`   | Nested window containing command metadata, input line, and output log.        | Shares the same width and alignment rules as other windows.            |
| `CommandInput`   | Text box for command entry.                                                   | Rendered as a three-line sub-box inside the `CommandPanel`: top border, input row `│ > placeholder │`, bottom border. |
| `CommandOutput`  | Multi-line block immediately below `CommandInput`.                            | Populated with indexed rows produced by the mock command handler.      |

### 1.1 Global Layout Rules

- Window width is the minimum required to fit the widest content line while preserving three spaces of padding between the inner border and text (selector rows swap the centre space for `›`).
- Every window title uses the same pattern: top border (`┌─…┐`), title row (`│   Title   │` with centred text), then a divider (`├─…┤`) before the page content begins.
- Stacked windows do not shrink; each child window shares the parent width and aligns using the same top and bottom borders, offset by two rows and two columns to expose the parent frame.
- Page descriptions appear directly beneath the title divider, followed by a blank line before any menus or lists.
- The `MenuSeparator` inserts one blank line before and after itself to create breathing room above the `StatusStrip`.
- Command prompts and outputs stay inside the innermost window; the prompt box shifts horizontally to match its parent window's left padding.
- Only the selector (`›`) and box-drawing characters extend beyond ASCII; all other characters remain within the standard character set.

## 2. Page Set

The canonical mock publishes three CLI pages. Tests MUST confirm that each page matches both the ASCII structure and rule set below.

### 2.1 Main Menu (`pageId: templum.main`)

```terminal
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Templum                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│   Connect and interact with your Backend Services                                               │
│                                                                                                 │
│ › Backend Services - View and manage connected backend services                                 │
│   Execute Commands - Run commands on connected backends                                         │
│   System Status - View system health and configuration                                          │
│   Settings - Configure Templum behavior                                                         │
│                                                                                                 │
│   ───────────────────────────────────────────────────────────────────────────────────────────   │
│   Back                                                                                          │
│   Home                                                                                          │
│   Help                                                                                          │
│   Exit                                                                                          │
│                                                                                                 │
│                                                                                                 │
│                                                                                                 │
│                                                                                                 │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Rules:

- Exactly one `Window` containing the entire page.
- Title “Templum” centred within the title row, framed by a top border and divider as described in the global rules.
- Menu entries respect the three-space padding rule: labels left-justified after the padding, descriptions separated by a single space-hyphen-space sequence.
- Active menu item indicated with `›`. Remaining items align vertically beneath the page description.
- A `MenuSeparator` precedes the standard navigation menu (`Back`, `Home`, `Help`, `Exit`), which renders as a vertical stack, one item per line, in that order.

Dynamic content:

- None on this page (static baseline screen). Tests should still assert layout integrity.

### 2.2 Backend Services (`pageId: templum.services`)

```terminal
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              Templum                                             │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────┴─┐
│ │                                        Backend Services                                          │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │   Manage connections to a backend service                                                        │
│ │                                                                                                  │
│ │ › Connected Services        - Show all currently connected backend services                      │
│ │   Refresh Service Discovery - Scan for new backend servicres                                     │
│ │   minimal-example           - Healthy                                                            │
│ │   haruspex                  - Disconnected Not available                                         │
│ │   pcl                       - Disconnected Not available                                         │
│ │   litany                    - Disconnected Not available                                         │
│ │                                                                                                  │
│ │   ───────────────────────────────────────────────────────────────────────────────────────────    │
│ │   Back                                                                                           │
│ │   Home                                                                                           │
│ │   Help                                                                                           │
│ │   Exit                                                                                           │
│ │                                                                                                  │
└─┤                                                                                                  │
  │                                                                                                  │
  └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Rules:

- Two stacked `Window` elements (`Window` outer shell, nested `Window` for page).
- Both windows share the same width; the inner window begins two rows lower and two columns to the right, exposing the parent border.
- The inner title row text is “Backend Services”, centred according to the global title rule.
- Menu actions obey the three-space padding rule; the active entry uses the `›` marker.
- Service list rows maintain a 16-character fixed-width name column followed by two spaces and the status text (connected services listed before disconnected services, both groups alphabetised).
- A `MenuSeparator` and `StatusStrip` appear inside the inner window; the outer window does not repeat the navigation items.

Dynamic content:

- Service list is procedurally generated from the mock discovery registry. Tests should assert that row count matches available services and statuses align with mock state.

### 2.3 Execute Command (`pageId: templum.execute`)

```terminal
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                               Templum                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────┴─┐
│ │                                         Execute Command                                           │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────────────────┴─┐
│ │ │                                       minimal-example                                             │
│ │ ├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │ │   Run a minimal-example command                                                                   │
│ │ │                                                                                                   │
│ │ │   ┌─────────────────────────────────────────────────────────────────────────────────────────┐     │
│ │ │   │ > type a command                                                                        │     │
│ │ │   └─────────────────────────────────────────────────────────────────────────────────────────┘     │
│ │ │    <Response from the minimal-example server line 1>                                              │
│ │ │    <Response from the minimal-example server line 2>                                              │
│ │ │    <Response from the minimal-example server line 3>                                              │
│ │ │                                                                                                   │
│ │ │                                                                                                   │
│ │ │                                                                                                   │
│ │ │   ──────────────────────────────────────────────────────────────────────────────────────────      │
│ │ │   Back                                                                                            │
└─┤ │   Home                                                                                            │
  │ │   Help                                                                                            │
  └─┤   Exit                                                                                            │
    │                                                                                                   │
    └───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Rules:

- Three stacked `Window` elements (screen → page → command panel) sharing a common width and using the two-row/two-column offset between each layer.
- The top-level page title is “Execute Command”; the innermost window title equals the selected backend identifier (`minimal-example` in the default mock).
- The command prompt renders as a dedicated three-line box (`┌…┐`, `│ > type a command │`, `└…┘`) aligned to the page padding; when input is active the placeholder text disappears.
- `CommandOutput` lists indexed rows `[n] mock-result: line n+1` generated from the executed command, positioned directly beneath the prompt box with one blank line between sections.
- A `MenuSeparator` and the standard navigation menu live inside the command panel window beneath the output block; selecting Exit follows the double-confirmation behaviour defined for the CLI.

Dynamic content:

- Output entries derive from the command handler response and MUST match the data returned by `executeCommand`.
- Tests should inject varying payloads (e.g., command arguments) and assert output updates accordingly.

## 3. Procedural Content Expectations

- Service list and command output are generated from the mock backend’s in-memory data; no hard-coded static text other than descriptive labels.
- Menu selection (`›`) must track navigation state coming from the Phase 6 harness or CLI adapter.
- Command execution updates a timestamped history maintained by the mock for potential future streaming/state capabilities.

## 4. Validation Checklist

Tests adopting the canonical mock SHOULD verify the following:

1. **Window hierarchy** matches the counts specified for each page (1 for Main Menu, 2 for Backend Services, 3 for Execute Command).
2. **Titles** (`Templum`, `Backend Services`, `Execute Command`, backend identifier) are centred and surrounded by the appropriate box-drawing characters.
3. **Page menus** show the correct labels, with exactly one active entry indicated by `›`.
4. **Footer navigation** renders `Back`, `Home`, `Help`, `Exit` as a vertical stack (one item per line) in that order within each relevant window.
5. **Service list** rows align to the column widths and reflect mock discovery state (one healthy, remaining disconnected by default).
6. **Command panel** contains both input and output sections; output rows are enumerated and reflect command handler responses.
7. **Procedural updates** (service status toggles, command results) mutate only the dynamic sections and preserve the layout frame.
8. **Nested window gutters** maintain a two-space gap between bordering windows (double-width separation) exactly as shown in the examples.

This appendix is authoritative for visual regression of the canonical mock. Any changes to the layouts above require updating both this appendix and the associated tests.

## Appendix B — Sample Rendering Scripts

The following helper commands were used to generate the illustrative terminal layouts shown above.

### B.1 Main Menu Render

```bash
python3 - <<'PY'
width = 56
outer_top = '┌' + '─'*width + '┐'
outer_bottom = '└' + '─'*width + '┘'

def title_row(text):
    return '│' + text.center(width) + '│'

def divider():
    return '├' + '─'*width + '┤'

def body_line(text=''):
    return '│' + text.ljust(width) + '│'

lines = [
    outer_top,
    title_row('Templum'),
    divider(),
    body_line('   Connect and interact with your Backend Services'),
    body_line(),
    body_line(' › Backend Services - View and manage connected backend services'),
    body_line('   Execute Commands - Run commands on connected backends'),
    body_line('   System Status - View system health and configuration'),
    body_line('   Settings - Configure Templum behavior'),
    body_line(),
    body_line('   ───────────────────────────────────────────────────────────────────────────────────────────   '),
    body_line('   Back'),
    body_line('   Home'),
    body_line('   Help'),
    body_line('   Exit'),
    outer_bottom,
]

print('\n'.join(lines))
PY
```

### B.2 Backend Services Render

```bash
python3 - <<'PY'
width = 56
page_width = width
outer_top = '┌' + '─'*width + '┐'
outer_bottom = '└' + '─'*width + '┘'

def title_row(text):
    return '│' + text.center(width) + '│'

def divider():
    return '├' + '─'*width + '┤'

def body_line(text=''):
    return '│' + text.ljust(width) + '│'

def child_top():
    return '│┌' + '─'*(width-2) + '┴┐│'

def child_divider():
    return '│├' + '─'*(width-2) + '┤│'

def child_body(text=''):
    return '││' + text.ljust(width-2) + '││'

lines = [
    outer_top,
    title_row('Templum'),
    child_top(),
    child_body('                                       Backend Services'),
    child_divider(),
    child_body('   Manage connections to a backend service'),
    child_body(),
    child_body(' › Connected Services        - Show all currently connected backend services'),
    child_body('   Refresh Service Discovery - Scan for new backend servicres'),
    child_body('   minimal-example           - Healthy'),
    child_body('   haruspex                  - Disconnected Not available'),
    child_body('   pcl                       - Disconnected Not available'),
    child_body('   litany                    - Disconnected Not available'),
    child_body(),
    child_body('   ───────────────────────────────────────────────────────────────────────────────────────────   '),
    child_body('   Back'),
    child_body('   Home'),
    child_body('   Help'),
    child_body('   Exit'),
    outer_bottom,
]

print('\n'.join(lines))
PY
```

### B.3 Execute Command Render

```bash
python3 - <<'PY'
width = 56

def outer_top():
    return '┌' + '─'*width + '┐'

def outer_bottom():
    return '└' + '─'*width + '┘'

def wrap(line):
    return '│' + line + '│'

def page_top():
    return wrap('─'*width)

def section(title):
    return [
        wrap(' ' + title.center(width-2) + ' '),
        wrap('─'*width),
    ]

lines = [
    outer_top(),
    wrap('Templum'.center(width)),
    wrap('─'*width),
    wrap(' Execute Command '.center(width-2, '─')),
    wrap(' minimal-example '.center(width-2, '─')),
    wrap('   Run a minimal-example command'.ljust(width-2)),
    wrap(''),
    wrap('   ┌' + '─'*(width-6) + '┐   '),
    wrap('   │ > type a command'.ljust(width-2) + '│'),
    wrap('   └' + '─'*(width-6) + '┘   '),
    wrap('    [0] mock-result: line 1'.ljust(width)),
    wrap('    [1] mock-result: line 2'.ljust(width)),
    wrap('    [2] mock-result: line 3'.ljust(width)),
    wrap(''),
    wrap('   ───────────────────────────────────────────────────────────────────────────────────────────   '),
    wrap('   Back'.ljust(width)),
    wrap('┌─ Home'.ljust(width)),
    wrap('│  Help'.ljust(width)),
    wrap('└─ Exit'.ljust(width)),
    outer_bottom(),
]

print('\n'.join(lines))
PY
```
