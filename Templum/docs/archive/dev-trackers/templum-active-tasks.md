# Templum 1.0 Active Tasks Queue

> **Purpose**: Dependency-optimized task queue with priority markers and single-occurrence rule
> **Created**: 2025-08-23
> **Integration**: Used by /pr:task.md, /pr:validate, /pr:document
> **Architecture**: See templum-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = priority (do this next)
- `[n]` = sequence-order (do these in order after !)
- `[ ]` = pending
- `[~]` = in-progress  
- `[x]` = complete
- `[-]` = cancelled
- `[>]` = forwarded
- `[<]` = scheduled
- `[?]` = blocked/unknown
- `[B]` = implemented-broken: core logic done but compilation/tests failing (requires structural fix)
- `[T]` = implemented-testing: compiles but needs functional validation
- `[D]` = documenting: validated and awaiting documentation

- [x] [TASK-MCP-011] **UTILITY PATTERNS** | 2025-09-14T131600
  - Using Templum\dev\architecture\safe-consolidation-candidates.md, follow the "Pattern File Creation Guide" to create pattern files for the remaining patterns. This is a clear case of parallel opportunity - each pattern file can be (and should be for minimal context clutter and maximal focus) created by a separate agent (the documentation agent could be appropriate). At least 8 agents can be run in parallel - there is no point in deploying any fewer at one time.
