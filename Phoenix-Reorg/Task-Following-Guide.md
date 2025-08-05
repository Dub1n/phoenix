# Task Following Guide

> Your Holy Bible for Executing Task Breakdown Documents

This guide is your complete reference for systematically executing any task breakdown document created by the Task-Breakdown-Guide. Follow this religiously - it's designed to ensure you never miss a step, always follow project guidelines, and deliver professional-quality results.

## The Golden Rules (Read This First)

1. **NEVER skip steps** - Each step builds on the previous ones
2. **Always validate before proceeding** - Check your work at every checkpoint
3. **Document everything** - Your future self (and teammates) will thank you
4. **When in doubt, ask** - Use your tools to find answers before making assumptions
5. **Take breaks to evaluate** - Step back periodically to ensure you're on track
6. **Follow project rules** - The project's guidelines override general best practices

## Phase 1: Pre-Work & Preparation

### Step 1.1: Understand Your Mission

- [ ] **Read the Executive Summary** - What's the one-sentence goal?
- [ ] **Read the entire task document** - Don't start coding yet, just read
- [ ] **Highlight unclear parts** - Mark anything you don't understand
- [ ] **Identify the main deliverable** - What exactly are you building/fixing?

### Step 1.2: Find and Load Project Rules

**CRITICAL**: You must understand the project's specific guidelines before starting.

**DSS Projects:**

- [ ] Load project rules: `get_dss_rules()` with default parameters
- [ ] Read any `.cursor/rules/` files mentioned in the task
- [ ] Check for project-specific configuration files

**Non-DSS Projects:**

- [ ] Look for `README.md`, `CONTRIBUTING.md`, `docs/` folder
- [ ] Search for `.eslintrc`, `jest.config.js`, or similar config files
- [ ] Check for any `guidelines/` or `standards/` directories

### Step 1.3: Understand Project Context

- [ ] **Read the Context and Technical Rationale section** - Why does this task exist?
- [ ] **Check Task Scope & Boundaries** - What's included and excluded?
- [ ] **Review Technical Justification** - Understand the reasoning
- [ ] **Note Success Impact** - How will you know you've succeeded?

### Step 1.4: Self-Check Questions

Ask yourself:

- Do I understand what needs to be done?
- Do I understand why it needs to be done?
- Do I know what success looks like?
- Have I found and read the project's guidelines?

**If any answer is "no", go back and research more before proceeding.**

## Phase 2: Environment Setup & Validation

### Step 2.1: Prerequisites Check

- [ ] **Read Required Prerequisites section** - What do you need?
- [ ] **Verify you have access** to all required systems, tools, repositories
- [ ] **Install missing dependencies** - Don't assume anything is already there
- [ ] **Document what you installed** - Others might need this later

### Step 2.2: Environment Validation

- [ ] **Run all validation commands** from the task document exactly as written
- [ ] **Verify expected results** match what's documented
- [ ] **Troubleshoot any failures** before proceeding
- [ ] **Document any issues** you encountered and how you resolved them

### Step 2.3: Create Your Workspace

- [ ] **Create a branch** if using version control
- [ ] **Set up your development environment** (IDE, debugger, etc.)
- [ ] **Run existing tests** to ensure baseline is working
- [ ] **Take a snapshot** of current state (mentally or literally)

## Phase 3: Implementation Execution

### Step 3.1: Implementation Roadmap Overview

- [ ] **Read the complete Implementation Roadmap** - Don't start Step 1 yet
- [ ] **Understand the sequence** - How do steps connect?
- [ ] **Identify potential challenges** - What might go wrong?
- [ ] **Plan your approach** - How will you tackle each step?

### Step 3.2: Execute Each Implementation Step

**For EVERY step in the Implementation Roadmap:**

#### Pre-Step Checklist

- [ ] **Read the step completely** before starting
- [ ] **Understand the objective** - What's this step trying to achieve?
- [ ] **Review the technical approach** - Do you understand how to do it?
- [ ] **Check quality checkpoints** - What will you validate?

#### Execution Checklist

- [ ] **Follow Test-Driven Development** - Write tests first (if this is Step 1)
- [ ] **Implement according to technical approach** - Follow the documented method
- [ ] **Test your implementation** - Run tests frequently
- [ ] **Verify quality checkpoints** - Check each checkpoint as you go

#### Post-Step Validation

- [ ] **Run all tests** - Ensure nothing broke
- [ ] **Check code quality** - Linting, formatting, complexity
- [ ] **Review against step objective** - Did you achieve the goal?
- [ ] **Document any deviations** - Why did you change the approach?

#### Between-Step Self-Evaluation

**STOP and ask yourself every 2-3 steps:**

- Is my approach working?
- Am I following the project's guidelines?
- Should I continue with this implementation?
- Do I need to consult someone or research more?

## Phase 4: Quality Gates & Validation

### Step 4.1: Code Quality Gates

Work through EACH category in the Quality Gates section:

**Code Quality:**

- [ ] **Run linting tools** and fix all issues
- [ ] **Apply code formatting** consistently
- [ ] **Check complexity metrics** - Are functions too complex?
- [ ] **Review documentation** - Are all public interfaces documented?

**Testing Quality:**

- [ ] **Verify test coverage** meets minimum requirements
- [ ] **Run all integration tests** and ensure they pass
- [ ] **Execute performance tests** if specified
- [ ] **Validate security tests** if applicable

**Security Quality:**

- [ ] **Run vulnerability scanning** if tools are available
- [ ] **Audit dependencies** for security issues
- [ ] **Review code for security issues** - No hardcoded secrets, proper validation
- [ ] **Verify access controls** are appropriate

**Deployment Quality:**

- [ ] **Test in target environment** if possible
- [ ] **Prepare rollback plan** if deploying to production
- [ ] **Set up monitoring** if specified
- [ ] **Complete operational documentation**

### Step 4.2: Quality Gate Failures

**If any quality gate fails:**

- [ ] **Stop implementation** - Don't continue until fixed
- [ ] **Understand the failure** - What exactly is wrong?
- [ ] **Fix the issue** - Address the root cause
- [ ] **Re-run all affected tests** - Ensure fix doesn't break anything
- [ ] **Document the issue** - Help future developers avoid the same problem

## Phase 5: Documentation & Knowledge Transfer

### Step 5.1: Implementation Documentation

**Complete ALL sections in Implementation Documentation Requirements:**

- [ ] **Technical Implementation Notes** - Document challenges, decisions, insights
- [ ] **Tool/Framework Decisions** - Why did you choose specific tools?
- [ ] **Performance Insights** - What did you learn about performance?
- [ ] **Testing Strategy Results** - How effective were your tests?
- [ ] **Security/Quality Findings** - What security or quality issues did you discover?
- [ ] **User Experience Considerations** - How does this affect users?
- [ ] **Architecture Insights** - What architectural patterns did you apply?
- [ ] **Future Enhancement Opportunities** - What could be improved later?

### Step 5.2: Knowledge Transfer Documentation

- [ ] **Key Learnings** - Most important insights from this work
- [ ] **Gotchas & Pitfalls** - What should future developers watch out for?
- [ ] **Recommended Practices** - Best practices you discovered
- [ ] **Tool/Process Improvements** - How could the development process be better?

## Phase 6: Final Validation & Completion

### Step 6.1: Success Criteria Verification

**Check EVERY item in the Success Criteria section:**

- [ ] **Functional Success** - Does it work as intended?
- [ ] **Technical Success** - Is the code quality professional?
- [ ] **Business/User Value** - Does it solve the intended problem?

### Step 6.2: Definition of Done Checklist

**Verify EVERY item in the Definition of Done section:**

- [ ] **Core Deliverables** - All specific deliverables completed with measurable criteria
- [ ] **Quality Requirements** - All quality gates passed
- [ ] **Operational Readiness** - Ready for deployment/use
- [ ] **Validation Methods** - All validation criteria met

### Step 6.3: Final Self-Evaluation

**Critical questions to ask yourself:**

- Have I completed everything in the Definition of Done?
- Would a senior developer approve this work?
- Does this follow the project's specific guidelines?
- Is the documentation complete and helpful?
- Can someone else pick up where I left off?

### Step 6.4: Completion Documentation

- [ ] **Update task status** - Mark completed sections
- [ ] **Create summary** - Brief overview of what was accomplished
- [ ] **Note any deviations** - What was done differently and why
- [ ] **Identify follow-up tasks** - What should be done next?

## Emergency Procedures

### When You're Stuck

1. **Stop and read** - Re-read the relevant section of the task document
2. **Check project guidelines** - Look for project-specific guidance
3. **Search for examples** - Look for similar implementations in the codebase
4. **Ask for help** - Use tools to search for information or ask questions
5. **Document the problem** - What exactly are you stuck on?

### When Tests Fail

1. **Don't ignore failing tests** - They're telling you something is wrong
2. **Understand the failure** - Read the error message carefully
3. **Fix the issue** - Don't just make tests pass, fix the underlying problem
4. **Run all tests** - Ensure your fix doesn't break anything else
5. **Document the fix** - Help future developers understand what happened

### When You Want to Skip Steps

**DON'T.** Every step is there for a reason. If you think a step isn't needed:

1. **Re-read the step** - Make sure you understand why it's there
2. **Check project guidelines** - See if this step is required by project standards
3. **Consider the consequences** - What could go wrong if you skip it?
4. **Document your reasoning** - If you absolutely must skip, explain why

### When You Want to Change the Approach

**Think twice.** The task document was created for a reason. If you want to change the approach:

1. **Understand why the current approach was chosen** - Read the technical rationale
2. **Consider the risks** - What could go wrong with your alternative?
3. **Check with project guidelines** - Does your approach follow project standards?
4. **Document your reasoning** - Explain why the change is necessary
5. **Update the task document** - If you change course, update the documentation

## Common Mistakes to Avoid

### The "I'll Come Back to Documentation" Mistake

**DON'T SKIP DOCUMENTATION.** Document as you go. Your future self won't remember why you made certain decisions.

### The "Tests Are Optional" Mistake

**TESTS ARE NEVER OPTIONAL.** If the task says write tests, write tests. If it doesn't mention tests, you should probably still write them.

### The "Good Enough" Mistake

**QUALITY GATES EXIST FOR A REASON.** Don't skip quality checks because "it works on my machine."

### The "I Don't Need to Read the Guidelines" Mistake

**PROJECT GUIDELINES OVERRIDE EVERYTHING.** Always check and follow project-specific rules.

### The "One More Feature" Mistake

**STICK TO THE SCOPE.** Don't add features that aren't in the task scope, even if they seem useful.

## Daily Workflow Checklist

**Every time you start working:**

- [ ] Read where you left off in the task document
- [ ] Review what you accomplished yesterday
- [ ] Check if anything has changed in the project
- [ ] Plan what you'll accomplish today
- [ ] Run tests to ensure baseline is still working

**Every time you finish a major step:**

- [ ] Update your progress in the task document
- [ ] Run all tests
- [ ] Check quality gates
- [ ] Document what you learned
- [ ] Plan your next step

**Every time you finish for the day:**

- [ ] Commit your work (if using version control)
- [ ] Update documentation with today's progress
- [ ] Note any blockers or questions for tomorrow
- [ ] Review tomorrow's planned work

## Remember: You're Building for the Future

Every task you complete will be maintained by someone else (maybe future you). Write code, documentation, and tests as if the person who has to maintain it is a violent psychopath who knows where you live. Make their life easy, and they'll thank you for it.

## Quick Reference: When to Use Which Tools

**Finding Information:**

- `read_file` - Read project files, documentation, configuration
- `grep_search` - Find specific patterns, function names, imports
- `file_search` - Find files when you know partial names
- `list_dir` - Explore directory structure

**Code Changes:**

- `search_replace` - Make specific code changes
- `MultiEdit` - Make multiple changes to the same file
- `write` - Create new files
- `edit_notebook` - Edit Jupyter notebooks

**Project Rules:**

- `get_dss_rules()` - Load DSS project rules
- `list_available_rules` - See what DSS rules are available

**Terminal Operations:**

- `run_terminal_cmd` - Run commands, tests, build scripts

Remember: When in doubt, use tools to find information rather than making assumptions!

## Final Words

This guide is your safety net. Follow it religiously, and you'll deliver professional-quality work that follows project standards and won't embarrass you in code review. Skip steps at your own peril - every step is there because someone learned the hard way that it's necessary.

Good luck, and remember: slow and steady wins the race. Better to take time and do it right than to rush and create technical debt.
