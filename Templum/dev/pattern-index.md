---

# Pattern Index Metadata

generated: 2025-09-12
  total_patterns: 65
  categories: [Foundation, Infrastructure, Integration, Testing, Configuration, Optimization]
  last_updated: TASK-MCP-006 CLI Rework Implementation
  new_patterns_added: 5
  ---

# Templum Patterns Index

## Pattern: [pattern-name]

**Category**: Foundation | Infrastructure | Integration | Testing | Configuration | Optimization
**Status**: ESTABLISHED | EXPERIMENTAL | DEPRECATED
**Description**: [One-line description focusing on what problem it solves]
**Use When**:
  - [Specific trigger scenario 1]
  - [Specific trigger scenario 2]
**Keywords**: [searchable, terms, components, features]
**Prerequisites**: [pattern-1, pattern-2] or None
**Related**: [complementary-pattern, alternative-pattern]
**Complexity**: Low | Medium | High
**File**: patterns/[filename].md
---

  Example Entry

## Pattern: advanced-compatibility-validation

**Category**: Infrastructure
**Status**: ESTABLISHED
**Description**: Multi-dimensional compatibility validation with interface-specific requirements and
performance constraints
**Use When**:

- Validating skin compatibility across multiple interface types
- Need deep structural and performance analysis
- Preventing runtime failures in cross-platform deployments
**Keywords**: validation, compatibility, interfaces, performance, structural, cross-platform
**Prerequisites**: [skin-versioning-system, universal-skin-engine, unified-type-system]
**Related**: [enhanced-skin-registration-validation, test-type-system-alignment]
**Complexity**: High
**File**: patterns/advanced-compatibility-validation.md

  Why This Format Works for LLMs

  1. Use When field is crucial - it helps the agent match current task context to relevant patterns
  2. Keywords enable semantic search and pattern discovery
  3. Prerequisites prevent the agent from suggesting patterns without required foundations
  4. Related patterns help the agent suggest complementary or alternative approaches
  5. Category and Complexity help filter patterns by scope and difficulty
  6. Status prevents using deprecated patterns or warns about experimental ones

  Additional Metadata Considerations

  You might also consider adding:

- Interfaces: [CLI, VSCode, Web] - which interfaces the pattern applies to
- Components: [backend, renderer, configuration] - which components it affects
- Impact: [performance, security, maintainability] - what aspects it improves

  Script Generation Approach

  Your script should:

  1. Parse the frontmatter from each pattern file
  2. Extract the "Problem" statement to generate the "Use When" scenarios
  3. Generate keywords from the pattern name, category, and description
  4. Identify prerequisites from the frontmatter
  5. Detect related patterns through shared categories or prerequisites
  6. Output a single index file with all patterns in this structured format

## Pattern: cli-visual-design-structured-windows

**Category**: Integration
**Status**: ESTABLISHED
**Description**: Structured window rendering system with Unicode box-drawing and ASCII fallback for clean, emoji-free CLI interfaces with proper padding and progressive enhancement
**Use When**:

- Migrating from emoji-heavy CLI interfaces to clean structured design
- Need terminal compatibility with Unicode fallback to ASCII borders
- Building professional CLI interfaces requiring structured window layout
- Implementing accessibility-compliant CLI design with screen reader support
**Keywords**: structured-windows, border-rendering, unicode-fallback, terminal-compatibility, progressive-enhancement, emoji-elimination, accessibility-compliance
**Prerequisites**: [terminal-ui-components, chalk-theming]
**Related**: [emoji-elimination-systematic-replacement, progressive-enhancement-terminal-ui, accessibility-compliance-cli-interfaces]
**Complexity**: Advanced
**File**: patterns/cli-visual-design-structured-windows.md

---

## Pattern: emoji-elimination-systematic-replacement

**Category**: Infrastructure
**Status**: ESTABLISHED
**Description**: Comprehensive emoji removal and replacement system with 47+ mapped emojis, text equivalents, and batch processing for clean CLI interface design
**Use When**:

- Converting emoji-heavy interfaces to professional text-based design
- Need systematic emoji replacement across multiple files and components
- Building accessibility-compliant interfaces requiring text equivalents
- Implementing clean design standards that eliminate emoji dependencies
**Keywords**: emoji-elimination, systematic-replacement, text-equivalents, batch-processing, accessibility-compliance, clean-design, unicode-cleanup
**Prerequisites**: [none]
**Related**: [cli-visual-design-structured-windows, accessibility-compliance-cli-interfaces, progressive-enhancement-terminal-ui]
**Complexity**: Medium
**File**: patterns/emoji-elimination-systematic-replacement.md

---

## Pattern: mcp-integration-preservation-ui-changes

**Category**: Integration
**Status**: ESTABLISHED
**Description**: Maintain MCP Channel compatibility and agent-CLI interaction capabilities during major UI transformations while preserving backward compatibility and command mapping
**Use When**:

- Performing major CLI interface redesigns while maintaining agent compatibility
- Updating UI frameworks that could break existing MCP tool integrations
- Need to preserve agent-CLI interaction patterns during visual transformation
- Ensuring backward compatibility for automated agent workflows during UI changes
**Keywords**: mcp-preservation, agent-cli-compatibility, backward-compatibility, ui-transformation, command-mapping, session-management, mcp-bridge
**Prerequisites**: [mcp-pty-integration, agent-cli-interaction-validation, session-management-unified]
**Related**: [cli-visual-design-structured-windows, progressive-enhancement-terminal-ui, hybrid-cli-development-testing]
**Complexity**: Advanced
**File**: patterns/mcp-integration-preservation-ui-changes.md

---

## Pattern: progressive-enhancement-terminal-ui

**Category**: Infrastructure
**Status**: ESTABLISHED
**Description**: Environment capability detection with multi-layer fallback strategies and adaptive UI enhancement selection for optimal terminal experience across all platforms
**Use When**:

- Building CLI interfaces that must work across diverse terminal environments
- Need optimal visual experience while maintaining universal compatibility
- Implementing features that depend on terminal capabilities (Unicode, colors, dimensions)
- Creating professional interfaces that degrade gracefully on limited terminals
**Keywords**: progressive-enhancement, terminal-compatibility, capability-detection, adaptive-ui, fallback-strategies, environment-detection, graceful-degradation
**Prerequisites**: [terminal-ui-components, chalk-theming]
**Related**: [cli-visual-design-structured-windows, emoji-elimination-systematic-replacement, accessibility-compliance-cli-interfaces]
**Complexity**: Medium
**File**: patterns/progressive-enhancement-terminal-ui.md

---

## Pattern: accessibility-compliance-cli-interfaces

**Category**: Infrastructure
**Status**: ESTABLISHED
**Description**: WCAG 2.1 AA compliant CLI interface design with screen reader support, keyboard navigation accessibility, and semantic markup for assistive technologies
**Use When**:

- Building CLI applications requiring accessibility compliance (WCAG 2.1 AA)
- Need screen reader compatibility and assistive technology support
- Implementing interfaces for users with visual, motor, or cognitive disabilities
- Creating enterprise applications with accessibility requirements
**Keywords**: accessibility-compliance, wcag-2-1-aa, screen-reader-support, keyboard-navigation, assistive-technologies, semantic-markup, inclusive-design
**Prerequisites**: [terminal-ui-components, emoji-elimination-systematic-replacement]
**Related**: [cli-visual-design-structured-windows, progressive-enhancement-terminal-ui, emoji-elimination-systematic-replacement]
**Complexity**: Advanced
**File**: patterns/accessibility-compliance-cli-interfaces.md

---

SCRIPT:

1. Scan all markdown files in the patterns directory
2. Parse frontmatter and content from each pattern file
3. Generate an index with the recommended format including:
    - Pattern name and description
    - Category and status
    - "Use When" scenarios (extracted from Problem section)
    - Keywords (generated from name, category, description)
    - Prerequisites and related patterns
    - Complexit level
4. Output a single patterns-index.md file optimized for LLM consumption
