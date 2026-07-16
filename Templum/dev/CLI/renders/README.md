---
doc-type: documentation-index
id: templum-cli-render-references
tags: [templum, cli, renderer, fixtures]
status: current
last_updated: 2026-07-16
---

# CLI Render References

## Active Source Examples

- `2.1_examples.ASCII` contains reviewed design inputs for the character-grid renderer.
- `2.1_condensed_heading.ASCII` preserves the condensed-title experiment for comparison.

These files are not yet executable golden tests. Stage 1 of `../../tasks/cli-character-grid-renderer.md` must resolve remaining layout ambiguities and derive exact fixtures for multiple terminal sizes and capability modes.

## Removed Experiments

The older execute-command transparency examples and their Python mock renderer were removed on 2026-07-16. They duplicated the accepted character-grid direction without providing reusable production or test infrastructure.
