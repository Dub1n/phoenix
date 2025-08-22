## When to use the files

When an *agent claims completion*:
    Reference @prompts\tracking\Agent-Verification-Protocol.md and demand actual evidence

When you *discover issues*:
    Quick-add to @cross-project-dev\Quick-Add-Tracker.md then organize later

When *verifying components*:
    Update the appropriate Implementation-Tracker with evidence
        @Haruspex\dev\04-H-Implementation-Tracker.md
        @Templum\dev\01-T-Implementation-Tracker.md

When you *notice patterns*:
    Document in @cross-project-dev\Implementation-Notes.md for future reference

## Example Prompts for Agent Implementation Tracking

### 1. Prompt to Populate Implementation Trackers

I need you to populate the implementation tracker for [Haruspex/Templum] by examining the actual codebase and updating the tracker with real status.

REQUIREMENTS:

- Read and follow the @prompts\tracking\Agent-Verification-Protocol.md exactly
- For each component in [Haruspex-Implementation-Tracker.md/Templum-Implementation-Tracker.md], verify its actual status
- Use the verification commands from the protocol (ls, npx tsc, npm ls, etc.) and show actual output
- Update the tracker table with evidence-based status, not assumptions

CRITICAL: If you cannot verify a component due to build issues or missing files, mark it as 🔴 **Broken** or 🔴 **Unknown** and state exactly why in the Evidence column.

NEVER claim something is working without showing actual compilation output, test results, or runtime proof.

Which project do you want to examine first - Haruspex or Templum?

### 2. Prompt to Verify Specific Components

I need you to verify the implementation status of [specific component names] following the Agent-Verification-Protocol.md.

VERIFICATION REQUIREMENTS:

1. Read Agent-Verification-Protocol.md and follow it exactly
2. For each component, run these verification steps and show actual output:
    - File existence check: `ls -la [component-path]`
    - TypeScript compilation: `npx tsc --noEmit [files]`
    - Dependency check: `npm ls [packages]`
    - Test execution: `npm test [component]` (if tests exist)
    - Runtime check: Attempt to import/require the component

3. Update the appropriate Implementation Tracker with:
    - Verification status (✅ verified or ❌ unverified)
    - Current status (🟢 working, 🟡 partial, 🔴 broken, ⚠️ unverified)
    - Evidence summary in the Evidence column
    - Any issues found in the Notes column

4. If you find mocks or placeholders, explicitly state this and explain why

CRITICAL: Show me the actual command output, not just descriptions. If something doesn't work, I need to see the exact error messages.

Components to verify: [list specific components]

### 3. Prompt After Implementation Work

You've completed work on [describe the work done]. Now I need you to add the implemented components to the tracking system and verify they actually work.

POST-IMPLEMENTATION PROTOCOL:

1. Identify all components you created/modified during this work
2. Add any new components to the appropriate Implementation Tracker (Haruspex or Templum)
3. For each component, follow Agent-Verification-Protocol.md and verify:
    - Do any tests pass? Show test execution output
    - Can it be imported/instantiated? Show runtime verification
    - Does it compile? Show `npx tsc --noEmit` output
    - Are all dependencies properly declared? Show `npm ls` output
  
4. Update the tracker with:
    - Component name and location
    - Claimed status (✅ if you implemented it)
    - Verified status (✅ only if verification proves it works)
    - Actual functional status (🟢/🟡/🔴 based on verification results)
    - Evidence of verification (compilation output, test results, etc.)

5. If you used any mocks or placeholders, explicitly document this in the Notes column

6. Add any issues discovered to the TODO/Investigation Queue

CRITICAL RULE: Mark components as "Verified" only if you can prove they work with actual command output. If verification fails, mark as 🔴 and document the blocking issues.

What components did you implement/modify that need to be added to tracking?

## Specialized Prompt Variations

### For Integration Claims

You claimed that [integration X] is working. I need you to verify this using the Agent-Verification-Protocol.md.

INTEGRATION VERIFICATION REQUIREMENTS:

1. Start both services that should be integrating
2. Demonstrate actual communication between them
3. Show network logs, connection attempts, or API calls
4. Prove data flows correctly between components
5. Document any mocks or simulated components used

If the integration only works with mocks, explicitly state this and explain why real integration isn't possible.

Update both relevant Implementation Trackers with the integration verification results.

Show me the actual proof of integration working.

### For Build Issues Discovery

I discovered build issues in [project]. Use the tracking system to document this properly.

ISSUE DOCUMENTATION REQUIREMENTS:

1. Add discovery to Quick-Add-Tracker.md with full context
2. Update the appropriate Implementation Tracker's "Build Issues Log"
3. Check if this affects the status of tracked components
4. Update component statuses if build issues prevent verification
5. Add necessary investigation items to the TODO queue

Include the exact error messages and describe what you were trying to do when you found the issue.

### For Pattern Recognition

I've noticed [pattern/behavior]. Document this in the Implementation-Notes.md Pattern Recognition section.

PATTERN DOCUMENTATION REQUIREMENTS:

1. Add to the appropriate pattern category in Implementation-Notes.md
2. Include specific examples from our project
3. Document the risk level and mitigation strategies
4. Update communication strategies if this affects how we should work with agents

Provide specific examples of this pattern from actual work we've done.

## Key Phrases to Include

### To Prevent False Claims

- "Show actual command output, not descriptions"
- "If you cannot verify with evidence, mark as unverified"
- "NEVER claim something works without proof"
- "Follow Agent-Verification-Protocol.md exactly"

### To Require Evidence

- "Show me the compilation output"
- "Provide actual test execution results"
- "Demonstrate with runtime proof"
- "Include exact error messages if things fail"

### To Handle Mocks Properly

- "If using mocks, explicitly state this and explain why"
- "Document any placeholder or simulated components"
- "Distinguish between mock success and real functionality"

## Usage Tips

1. Be Specific: Always specify which tracker file to update and which components to verify
2. Reference the Protocol: Always mention Agent-Verification-Protocol.md to ensure consistent verification
3. Demand Evidence: Use phrases that require actual command output, not just assertions
4. Handle Failures Gracefully: Make it clear that finding broken components is acceptable and valuable
5. Track Context: Include why you're asking for verification (post-implementation, investigating claims, etc.)

These prompts are designed to prevent the exact issues you experienced in Phase 6 by requiring evidence-based verification and proper documentation of both successes and failures.
