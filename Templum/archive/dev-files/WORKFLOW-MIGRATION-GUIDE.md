# Templum Workflow System Migration Guide

> **Purpose**: Transition from 829-line templum-fix-planning.md to streamlined document architecture  
> **Created**: 2025-08-23  
> **Target**: Eliminate documentation update failures and prevent document bloat

## 🔥 Critical Issues Solved

### Before (Old System)

- **829-line planning document** with massive duplication
- **Same task appears 3-4 times** in different sections  
- **Agent confusion**: Updates one occurrence, misses others
- **Document growth**: Becoming "frankenstein's monster" after each fix
- **Context bloat**: Overwhelming information for simple tasks

### After (New System)

- **<100 lines per document** with single-purpose focus
- **Each task appears EXACTLY ONCE** with unique ID
- **Clear update rules**: Agent knows precisely what to update
- **Aggressive pruning**: Completed chains fully removed
- **Minimal context**: Only essential information for current work

## 📁 New Document Structure

### Primary Documents

``` filesystem
templum-active-tasks.md      # Current work queue (main document)
templum-patterns.md          # Implementation patterns (reference only)
templum-completed.md         # Historical archive (append-only)
templum-tracker-data.md      # Status dashboard (minimal updates)
```

### Legacy Documents

``` filesystem
templum-fix-planning.md           # ORIGINAL (829 lines) → ARCHIVE
templum-fix-planning-STREAMLINED.md  # REPLACEMENT (86 lines)
```

## 🎯 Task Marking System (Enhanced)

### Priority Markers

```markdown
[!] = User priority override (do this next)        ← USER CONTROL
[1-9] = Sequence order                              ← EXPLICIT SEQUENCING  
[ ] = Pending task                                  ← NORMAL QUEUE
[~] = In progress                                   ← ACTIVE WORK
[x] = Complete (ready for removal)                 ← PRUNING TARGET
[-] = Cancelled / won't-do                          ← ABANDONED
[>] = Migrated / forwarded                          ← MOVED
[<] = Scheduled / rescheduled                       ← DEFERRED
[?] = Question / blocked                            ← NEEDS INPUT
```

## 🔄 Enhanced Documentation Rules

### During Implementation

```typescript
// TODO: [TASK-NEW-001] Missing InterfaceRenderer type definition
// Priority: High | Complexity: 5 | Dependencies: VSCode adapter
// Location: Found during VSCode integration implementation
```

### Post-Implementation

1. **Search for TODOs**: `grep -r "TODO: \[TASK-" .`
2. **Add to active tasks**: New entries with appropriate markers
3. **Update status**: Change marker from `[ ]` to `[x]`
4. **Create fix document**: Detailed implementation in `dev/fixes/`
5. **Extract patterns**: Reusable patterns to `templum-patterns.md`
6. **Log entry**: One-line entry in tracker-data.md
7. **Remove TODOs**: Clean up after documentation

### Chain Completion Protocol

```markdown
IF all tasks in dependency chain complete:
  AND no other tasks depend on this chain:
    THEN remove entire chain from active tasks
    AND move one-line summary to completed.md
    AND ensure patterns preserved in patterns.md
```

## 🚀 Agent Workflow Changes

### Task Selection (ENHANCED)

```markdown
1. Check active-tasks.md for [!] user priority override
2. If no [!], follow [1-9] sequence markers
3. If no sequence, use highest priority score
4. Load implementation pattern from patterns.md
5. Begin implementation with TODO discovery protocol
```

### Documentation Updates (SIMPLIFIED)

```markdown
OLD: Update 3-4 occurrences across 829-line document
NEW: Update 1 task marker + create fix document + extract patterns
```

## 📊 Expected Improvements

### Quantitative Benefits

- **Document size**: 829 → <100 lines (88% reduction)
- **Update locations**: 3-4 → 1 (75% reduction)
- **Context tokens**: ~20K → ~5K (75% reduction)
- **Agent success rate**: ~60% → ~95% (58% improvement)

### Qualitative Benefits

- **No duplication**: Each task appears exactly once
- **Clear workflow**: Agent knows precisely what to update
- **Scalable growth**: Document size remains constant after 1000 tasks
- **User control**: [!] and [1-9] markers provide explicit task selection
- **Issue capture**: TODO tags prevent lost discoveries

## 🔧 Migration Steps (For Current Instance)

### Phase 1: Validate New System (COMPLETED ✅)

- ✅ Created templum-active-tasks.md with current queue
- ✅ Extracted patterns to templum-patterns.md  
- ✅ Archived completed work to templum-completed.md
- ✅ Streamlined tracker-data.md to single-line format
- ✅ Updated fix guides with enhanced documentation rules

### Phase 2: Test Workflow (READY FOR TESTING)

- [ ] **Test Case**: Complete [!] VSCode Integration task
- [ ] **Validate**: TODO discovery during implementation
- [ ] **Verify**: Single-update documentation workflow
- [ ] **Check**: Pattern extraction and chain completion

### Phase 3: Full Migration (AFTER VALIDATION)

- [ ] Archive original templum-fix-planning.md
- [ ] Rename templum-fix-planning-STREAMLINED.md if needed
- [ ] Update any remaining references to old structure
- [ ] Document lessons learned

## ⚠️ Important Notes

### For Agents Following This Workflow

1. **Always check templum-active-tasks.md first** for current work
2. **Respect [!] and [1-9] priority markers** - these override scoring
3. **Use TODO tags liberally** during implementation - capture everything
4. **Update only ONE location** per task (no duplication)
5. **Remove completed chains aggressively** to prevent bloat

### For Users Managing Tasks  

1. **Use [!] marker** to override agent task selection
2. **Use [1-9] markers** to specify work sequence
3. **Check templum-active-tasks.md** for current status
4. **Patterns are preserved** in templum-patterns.md for reuse

## 🎉 Success Validation

### System is working correctly when

- [ ] templum-active-tasks.md stays under 100 lines
- [ ] Each task appears exactly once with unique ID
- [ ] Agent completes 100% of documentation updates
- [ ] No duplication between documents
- [ ] Completed chains are fully removed within 24 hours
- [ ] TODO discoveries are captured and added to queue

### Red flags indicating problems

- [ ] Any document growing beyond 150 lines  
- [ ] Tasks appearing in multiple locations
- [ ] Agent missing documentation updates
- [ ] Accumulation of completed task details in active documents

---

**Migration Status**: Phase 1 Complete ✅  
**Next Step**: Test workflow with VSCode Integration task  
**Expected Outcome**: 95% reduction in documentation update failures
