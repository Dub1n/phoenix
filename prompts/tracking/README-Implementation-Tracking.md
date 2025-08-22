# Implementation Tracking System - User Guide

> **Purpose**: Complete guide to using the markdown-based implementation tracking system for Haruspex/Templum separation  
> **Created**: 2025-08-21  
> **System Version**: 1.0 - Initial markdown-only implementation  
> **Target Users**: Human developers and AI agents working on this project

## System Overview

This tracking system solves the critical problem of **claimed implementation vs actual reality** in AI-assisted development. It provides tools to:

1. Track what agents claim is implemented vs what actually works
2. Maintain evidence of verification attempts and results  
3. Document lessons learned and prevent recurring issues
4. Provide clear protocols for agents to follow when claiming completion

## File Structure

``` filesystem
04-Separation-Roadmap/
├── Haruspex-Implementation-Tracker.md     # Haruspex backend component status
├── Templum-Implementation-Tracker.md      # Templum interface component status  
├── Agent-Verification-Protocol.md         # Instructions for agents to follow
├── Implementation-Notes.md                # Discovery log and pattern recognition
├── Quick-Add-Tracker.md                  # Rapid issue capture during development
└── README-Implementation-Tracking.md      # This file - system usage guide
```

## Quick Start Guide

### For Human Developers

#### 1. Daily Workflow

``` text
Morning: Check Quick-Add-Tracker.md for yesterday's issues
Development: Add discoveries to Quick-Add-Tracker.md as you find them  
Agent Work: Reference Agent-Verification-Protocol.md when working with agents
Evening: Move Quick-Add items to appropriate detailed trackers
```

#### 2. When Agent Claims Completion

``` text
1. Immediately add claim to Quick-Add-Tracker.md  
2. Use Agent-Verification-Protocol.md to verify
3. Update Implementation-Tracker with results
4. Document any patterns in Implementation-Notes.md
```

#### 3. When You Discover Issues

``` text
1. Quick capture in Quick-Add-Tracker.md
2. Include context: what were you doing when you found this?
3. Set priority: Critical/High/Medium/Low
4. Note if this is a pattern you've seen before
```

### For AI Agents

#### 1. Before Claiming Any Completion

- Read Agent-Verification-Protocol.md completely
- Follow ALL verification steps with actual command output
- Never use phrases like "should work" or "excellent" without evidence

#### 2. When Updating Status

- Update the appropriate Implementation-Tracker.md file
- Provide actual evidence in the Evidence column
- If using mocks, explicitly state this and why

#### 3. When Discovering Issues

- Add to Implementation-Notes.md Discovery Log
- Include what you expected vs what you found
- Specify the root cause if known

## File Usage Patterns

### Haruspex-Implementation-Tracker.md

**Use for**: Tracking Haruspex 2.0 backend service components
**Update when**:

- Verifying any Haruspex component
- Discovering Haruspex-related issues
- Completing Haruspex development work

**Key sections**:

- Component status table (primary tracking)
- TODO/Investigation Queue (next actions)
- Evidence Archive (verification history)

### Templum-Implementation-Tracker.md  

**Use for**: Tracking Templum 1.0 universal interface components
**Update when**:

- Verifying any Templum component
- Testing cross-interface functionality
- Working on integration features

**Key sections**:

- Component status table (primary tracking)
- Integration verification queue
- Build issues log (TypeScript problems)

### Agent-Verification-Protocol.md

**Use for**: Ensuring consistent verification by agents
**Reference when**:

- Agent claims something is complete
- You need to verify implementation yourself
- Training new agents on verification requirements

**Key sections**:

- Mandatory verification commands
- Evidence documentation requirements
- Red flag phrases to avoid

### Implementation-Notes.md

**Use for**: Learning from discoveries and tracking patterns
**Update when**:

- You discover something unexpected
- You notice a recurring pattern
- You learn a lesson that could help future work

**Key sections**:

- Discovery Log (specific unexpected findings)
- Pattern Recognition (recurring behaviors/issues)
- Lessons Learned Archive (extracted wisdom)

### Quick-Add-Tracker.md

**Use for**: Fast capture during active development
**Update when**:

- You find an issue but don't want to interrupt your workflow
- Agent makes a claim you want to verify later
- You discover something that needs investigation

**Key sections**:

- Quick Adds (rapid entry format)
- Pending Verification Queue (items needing checks)
- Daily cleanup checklist

## Workflow Examples

### Example 1: Agent Claims Component Complete

``` text
1. Agent: "Haruspex analysis engine is now complete and excellent!"

2. You → Quick-Add-Tracker.md:
   "Component: Haruspex analysis engine
    Issue: Agent claims complete
    Priority: High
    Added by: Agent claim
    Context: Development session, agent reported completion"

3. You → Agent-Verification-Protocol.md:
   Use verification commands to check compilation, tests, runtime

4. Results → Haruspex-Implementation-Tracker.md:
   Update component status based on verification results

5. If patterns emerge → Implementation-Notes.md:
   Document agent behavior patterns
```

### Example 2: You Discover Build Issues

``` text
1. You find: TypeScript compilation failing with 50 errors

2. Quick-Add-Tracker.md:
   "Component: Templum build system
    Issue: 50 TypeScript compilation errors  
    Priority: Critical
    Added by: Human
    Context: Trying to test integration, build failed"

3. Templum-Implementation-Tracker.md:
   Update build status, add to Known Issues section

4. Implementation-Notes.md:
   Add discovery to Discovery Log with full context
```

### Example 3: Verifying Integration Claims

``` text
1. Agent: "Haruspex-Templum integration working perfectly!"

2. Agent-Verification-Protocol.md:
   Follow integration verification steps
   Demand actual connection logs and communication evidence

3. Discovery: Integration uses mock backends only

4. Update both trackers:
   Haruspex-Implementation-Tracker.md: Update integration status
   Templum-Implementation-Tracker.md: Note mock dependency

5. Implementation-Notes.md:
   Document pattern: "Agent integration claims using mocks"
```

## Status Indicators Guide

### Component Status Legend

- 🟢 **Verified Working**: Confirmed functional with evidence
- 🟡 **Partial Implementation**: Exists but has known issues
- 🔴 **Broken/Unknown**: Non-functional or unverified  
- ⚠️ **Claimed but Unverified**: Agent reports complete, not independently verified
- ⏳ **Under Investigation**: Currently being verified
- ❌ **Not Implemented**: Confirmed missing or placeholder

### Priority Levels

- **Critical**: Blocks all progress, prevents basic functionality
- **High**: Significantly impacts development, prevents important features
- **Medium**: Affects specific features but doesn't block overall progress
- **Low**: Minor issues, convenience improvements

### Evidence Quality

- **High Quality**: Actual command output, test results, runtime logs
- **Medium Quality**: File existence confirmation, partial testing
- **Low Quality**: Agent assertions without verification
- **No Evidence**: Claims without any supporting verification

## Common Usage Scenarios

### Scenario 1: Starting New Development Phase

1. Review all tracker files for current status
2. Check Implementation-Notes.md for relevant patterns/lessons
3. Set up Quick-Add-Tracker.md for the session
4. Brief agent on Agent-Verification-Protocol.md requirements

### Scenario 2: Agent Makes Suspicious Claims

1. Immediately note in Quick-Add-Tracker.md
2. Reference Agent-Verification-Protocol.md for verification steps
3. Demand actual evidence, not assertions
4. Update appropriate tracker with verification results

### Scenario 3: Build/Integration Failures

1. Quick capture in Quick-Add-Tracker.md with full error details
2. Update build status in appropriate Implementation-Tracker
3. Add to Implementation-Notes.md Discovery Log
4. Check for patterns with previous failures

### Scenario 4: End of Development Session

1. Review Quick-Add-Tracker.md entries
2. Move items to appropriate detailed trackers
3. Update any patterns noticed in Implementation-Notes.md
4. Plan next session verification priorities

## Maintenance Guidelines

### Daily Maintenance

- Review and organize Quick-Add-Tracker.md entries
- Update status in Implementation-Tracker files based on day's work
- Add any discoveries to Implementation-Notes.md

### Weekly Maintenance  

- Review patterns across all tracker files
- Update Agent-Verification-Protocol.md based on new agent behaviors
- Consolidate similar issues and patterns
- Archive completed items from TODO queues

### Phase Completion Maintenance

- Comprehensive review of all claimed vs verified implementation
- Update master roadmap based on tracker reality
- Extract major lessons learned for future phases
- Reset verification priorities for next phase

## Integration with Existing Documentation

### Master Roadmap Updates

- Use tracker status to update phase completion percentages
- Replace theoretical completion with evidence-based status
- Include discovered issues in troubleshooting sections

### Phase Document Updates

- Add verification results to individual phase documents  
- Include lessons learned in phase retrospectives
- Update dependency information based on actual verification

### Agent Training

- Use patterns from Implementation-Notes.md to improve agent instructions
- Update verification requirements based on discovered failure modes
- Refine completion criteria based on real verification experiences

## Success Metrics

### System Effectiveness Indicators

- Decreased gap between claimed and verified implementation
- Faster identification of mock vs real implementation
- Reduced time spent on false leads from agent claims
- Improved agent behavior through consistent verification requirements

### Quality Improvements

- Higher percentage of verified vs claimed components
- Earlier detection of build and integration issues  
- Better documentation of actual vs theoretical functionality
- More realistic progress reporting

---

## Getting Help

### If the System Isn't Working

1. Check if agents are following Agent-Verification-Protocol.md
2. Verify you're updating trackers with actual evidence
3. Review Implementation-Notes.md for similar issues
4. Consider if verification requirements need updating

### If You Find System Gaps

1. Add observations to Implementation-Notes.md
2. Update verification protocol based on new patterns
3. Modify tracker templates if needed
4. Document improvements for future reference

This tracking system evolves with your project - modify it as you discover better ways to maintain implementation reality vs claims.
