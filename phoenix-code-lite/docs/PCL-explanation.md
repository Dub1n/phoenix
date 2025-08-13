<!--
title: [Phoenix Code Lite - System Explanation]
tags: [Documentation, Guide, Overview, TDD]
provides: [System Overview, Workflow Explanation, Getting Started]
requires: [docs/index/API-REFERENCE.md, docs/index/CODEBASE-INDEX.md]
description: [Explains Phoenix Code Lite’s purpose, agent roles, TDD phases, and user experience]
-->

# Phoenix Code Lite - System Explanation

## ⊕ What Phoenix Code Lite Is

Phoenix Code Lite is a Test-Driven Development (TDD) workflow orchestrator that transforms natural language task descriptions into tested, working code through an intelligent 3-phase process powered by specialized AI agents. Think of it as an AI-powered development assistant that:

- Takes your plain English task description
- Creates comprehensive tests first (TDD approach)
- Implements code to pass those tests
- Refactors and documents the final solution

## ⑇ Core Concept: AI Agent Specialization

Phoenix Code Lite uses three specialized AI agents, each with distinct expertise:

1. Planning Analyst ⌕
    - Role: Senior Technical Analyst & Test Designer
    - Expertise: Requirements analysis, test strategy, edge case identification
    - What it does:
      - Breaks down your task into testable requirements
      - Creates comprehensive test cases before any code is written
      - Identifies edge cases you might not have considered

2. Implementation Engineer ⚡
    - Role: Senior Software Engineer
    - Expertise: Clean code, design patterns, performance optimization
    - What it does:
        - Writes minimal code that passes all the tests
        - Focuses on clean, maintainable implementations
        - Iteratively fixes failing tests

3. Quality Reviewer ⑇
    - Role: Senior Code Reviewer & Documentation Specialist
    - Expertise: Code quality, maintainability, documentation
    - What it does:
        - Refactors code for better structure and performance
        - Adds comprehensive documentation
        - Ensures production-ready quality

## ⇔ The 3-Phase TDD Workflow

  Phase 0: Codebase Scan (Anti-Reimplementation)
      ↓
  Phase 1: Plan & Test (Planning Analyst)
      ↓
  Phase 2: Implement & Fix (Implementation Engineer)
      ↓
  Phase 3: Refactor & Document (Quality Reviewer)

## Phase 0: Mandatory Codebase Scan

- Purpose: Prevent reimplementing existing functionality
- Process:
  - Scans your existing codebase
  - Identifies reusable components
  - Detects potential naming conflicts
  - Provides integration recommendations

## Phase 1: Plan & Test

- Agent: Planning Analyst
- Input: Your task description + codebase scan results
- Output: Comprehensive test suite with acceptance criteria
- Example: For "create email validation function"
  - Creates tests for valid emails, invalid formats, edge cases
  - Defines expected behavior and error handling
  - Generates acceptance criteria

## Phase 2: Implement & Fix

- Agent: Implementation Engineer
- Input: Test suite from Phase 1
- Output: Working code that passes all tests
- Process:
  - Writes minimal implementation to pass tests
  - Iteratively fixes failing tests
  - Ensures clean, maintainable code structure

## Phase 3: Refactor & Document

- Agent: Quality Reviewer
- Input: Working implementation from Phase 2
- Output: Production-ready code with documentation
- Enhancements:
  - Code refactoring for better structure
  - Performance optimizations
  - Comprehensive documentation with examples

## ⊜ Quality Gates System

Each phase includes 4-tier quality validation:

1. Syntax Gate: Language parsing, type checking, compilation
2. Test Gate: Test execution, coverage analysis, assertions
3. Quality Gate: Code complexity, maintainability, conventions
4. Documentation Gate: Comment coverage, API docs, examples

Quality gates provide weighted scoring and improvement recommendations.

## ⑄ Security Framework

Phoenix Code Lite includes comprehensive security guardrails:

### File System Security

- Allowed paths: ./src/**, ./tests/**, ./docs/**, config files
- Blocked paths: System directories, secrets, node_modules, .git

### Command Execution Security

- Safe commands: npm, node, tsc, jest, eslint, git
- Blocked commands: rm, sudo, curl, network tools

### Additional Protection

- File size limits and execution timeouts
- Comprehensive audit logging
- Security violation tracking

## ◊ Configuration Templates

Three pre-configured templates for different use cases:

### Starter Template

- Use case: Learning and experimentation
- Test coverage: 70% threshold
- Quality gates: Basic validation
- Speed: Balanced for learning

### Enterprise Template

- Use case: Production applications
- Test coverage: 90% threshold
- Quality gates: Strict comprehensive validation
- Focus: Quality over speed

### Performance Template

- Use case: Speed-optimized workflows
- Test coverage: 60% threshold
- Quality gates: Minimal overhead
- Focus: Fast execution

## ⌨ User Experience

### Command Line Interface

### Basic usage

  phoenix-code-lite generate --task "Create user authentication system"

### With configuration

  phoenix-code-lite generate --task "Build REST API" --framework express --language
  typescript

### Template selection

  phoenix-code-lite config --template enterprise

### Visual Progress Tracking

- Real-time phase progress visualization
- Multi-step completion monitoring
- ETA calculations and performance metrics
- Spinner animations with status updates

### Interactive Features

- Configuration wizard for project setup
- Template selection with descriptions
- Task input validation and guidance
- Contextual help system

## ⌕ How It Works: Example Walkthrough

Your Input: "Create a function that validates email addresses"

### Phase 0 - Codebase Scan

- Scans project for existing email validation
- Finds no conflicts, proceeds with implementation

### Phase 1 - Plan & Test (Planning Analyst)

- Creates comprehensive tests:
  describe('validateEmail', () => {
    it('should accept valid email formats', () => {
      expect(validateEmail('user@domain.com')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });
  });

### Phase 2 - Implement & Fix (Implementation Engineer)

- Creates working implementation:
  export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

### Phase 3 - Refactor & Document (Quality Reviewer)

- Enhances with documentation:

```typescript
/**
* Validates email address format using RFC-compliant regex pattern
* @param email - Email address to validate
* @returns True if email format is valid, false otherwise
* @example
* validateEmail('user@domain.com') // true
* validateEmail('invalid') // false
*/
  export function validateEmail(email: string): boolean {
    // Input validation
    if (!email || typeof email !== 'string') {
      return false;
    }

    // RFC 5322 simplified regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
```

## ⋰ Monitoring & Analytics

### Audit Logging

- Complete workflow activity tracking
- Performance metrics and timing
- Quality scores and validation results
- Error tracking and retry patterns

### Metrics Collection

- Workflow execution time and success rates
- Token usage optimization
- Memory usage monitoring
- Quality score trends and analytics

### Reporting

- Workflow summary reports (table, JSON, CSV, HTML)
- Command history and performance analysis
- Quality assessment summaries
- Export capabilities for further analysis

## ◦ Integration with Claude Code SDK

Phoenix Code Lite is designed to work seamlessly with Claude Code:

### Enhanced Client Wrapper

- Exponential backoff retry logic
- Zod schema response validation
- Token usage tracking and optimization
- Error recovery and graceful degradation

### Specialized Prompting

- Agent-specific prompt templates
- Context-aware prompt construction
- Task-specific formatting
- Quality and security guidelines integration

## ⊕ Key Benefits

### For Developers

- Faster Development: Automated test creation and implementation
- Better Quality: Built-in quality gates and validation
- Learning Tool: See how experts approach problems
- Consistency: Standardized development patterns

### For Teams

- Standardization: Consistent code quality across team
- Documentation: Automatic comprehensive documentation
- Security: Built-in security guardrails
- Metrics: Performance and quality tracking

### For Projects

- Reliability: TDD approach ensures robust code
- Maintainability: Clean, well-documented code
- Scalability: Professional-grade architecture
- Auditability: Complete workflow tracking

## ^ Getting Started

  1. Install: npm install -g phoenix-code-lite
  2. Initialize: phoenix-code-lite init
  3. Generate: phoenix-code-lite generate --task "Your task description"
  4. Review: Examine generated tests, code, and documentation
  5. Customize: Adjust configuration for your workflow

Phoenix Code Lite transforms the traditional development process by bringing AI-powered expertise to every phase of TDD, ensuring you get tested, documented, production-ready code from natural language descriptions.

## ✓ Current Status: Nearly Ready

### What's Already Done

- ✓ All dependencies installed (23/23 packages present)
- ✓ Project already built (complete dist/ folder with compiled JavaScript)
- ✓ Binary configuration set up in package.json ("bin": {"phoenix-code-lite":
  "./dist/index.js"})
- ✓ All source maps generated for debugging
- ✓ Complete TypeScript compilation successful

### ✓ Ready for Local Use Right Now

You can actually use Phoenix Code Lite immediately with these steps:

``` bash
# Navigate to the project
cd 'C:\Users\gabri\Documents\Infotopology\Phoenix\phoenix-code-lite'

# Link it globally for local testing
npm link

# Now you can use it anywhere
phoenix-code-lite --help
phoenix-code-lite generate --task "Create a hello world function"
```

### For Global NPM Installation (npm install -g phoenix-code-lite)

To make it available via npm install -g phoenix-code-lite, you would need to:

- Publish to NPM Registry

``` bash
# From the project directory
npm login          # If you have an npm account
npm publish         # Makes it globally available
```

- Or Use Local Global Install

``` bash
# Install from local directory
npm install -g .    # From within the project folder
```

### ⌕ Current Functionality Status

The project appears to be feature-complete based on the documentation and built
artifacts. The dist/ folder contains:

- ✓ Main entry point (index.js)
- ✓ Complete CLI system (cli/)
- ✓ TDD orchestration engine (tdd/)
- ✓ Claude Code integration (claude/)
- ✓ Security framework (security/)
- ✓ Configuration system (config/)
- ✓ Testing utilities (testing/)
- ✓ Audit logging and metrics (utils/)

### ⊕ Bottom Line

Phoenix Code Lite is essentially ready for use right now. You just need to:

1. For immediate local use: npm link (then use globally)
2. For others to install: Publish to NPM registry

The project is built, configured, and appears to have all the components documented
in the comprehensive architecture we just explored.
