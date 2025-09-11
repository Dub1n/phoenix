---

# Pattern Index Metadata

generated: 2024-01-09
  total_patterns: 60
  categories: [Foundation, Infrastructure, Integration, Testing, Configuration, Optimization]
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
