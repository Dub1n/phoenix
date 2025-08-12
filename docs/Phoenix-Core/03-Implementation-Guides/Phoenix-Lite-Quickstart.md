# Phoenix-Lite Quickstart Guide

## Overview

Phoenix-Lite is the streamlined version of the Phoenix Framework, designed for rapid development of simple to moderate complexity tasks. It uses a "Pragmatic TDD Loop" that collapses the full multi-agent workflow into a lean, three-step process optimized for speed and efficiency.

## When to Use Phoenix-Lite

### Ideal Use Cases

- **Bug Fixes**: Resolving specific issues in existing codebases
- **Simple Features**: CRUD operations, API endpoints, basic UI components  
- **Rapid Prototyping**: Quick validation of concepts and approaches
- **Isolated Tasks**: Components that don't require complex integration
- **Learning**: Getting familiar with Phoenix methodology before tackling complex projects

### Not Recommended For

- **New Projects**: Full applications requiring architectural planning
- **Complex Integrations**: Multi-system interactions and data flows
- **Security-Critical Code**: Systems requiring comprehensive security auditing
- **Production Systems**: Code that needs extensive documentation and deployment artifacts

## Architecture Overview

Phoenix-Lite simplifies the full Phoenix workflow into three core steps:

> User Request → Plan & Test → Implement & Fix → Refactor & Document → Complete

### Simplified Agent Model

Instead of multiple specialized agents, Phoenix-Lite uses a single, context-switching agent that adapts its behavior for each phase:

1. **Planning Agent Mode**: Analyzes requirements and generates test strategy
2. **Implementation Agent Mode**: Writes code to satisfy tests with automated retries  
3. **Quality Agent Mode**: Refactors, documents, and performs final validation

## Quick Installation

### Prerequisites

- Python 3.8+ with pip
- Access to Claude API (Anthropic account with API key)
- Git (for project management)

### Install Phoenix-Lite

```bash
# Install from PyPI (when available)
pip install phoenix-lite

# Or install from source
git clone https://github.com/phoenix-framework/phoenix-lite
cd phoenix-lite
pip install -e .
```

### Configuration

```bash
# Set up Claude API access
export ANTHROPIC_API_KEY="your-api-key-here"

# Initialize Phoenix-Lite in your project
phoenix-lite init

# Verify installation
phoenix-lite --version
```

## Basic Usage

### 1. Project Setup

Create a new project or initialize Phoenix-Lite in an existing project:

```bash
# New project
mkdir my-project
cd my-project
phoenix-lite init

# Existing project
cd existing-project
phoenix-lite init --existing
```

This creates a `phoenix.toml` configuration file:

```toml
[project]
name = "my-project"
language = "python"
framework = "fastapi"

[phoenix-lite]
model = "claude-3-5-sonnet"
max_iterations = 5
test_framework = "pytest"

[quality]
min_coverage = 0.8
run_linter = true
run_security_scan = false
```

### 2. Define Your Task

Create a clear, specific task description in natural language:

```bash
# Simple API endpoint
phoenix-lite generate "Create a FastAPI endpoint that accepts user registration data (name, email, password) and returns a success message with user ID"

# Database operation
phoenix-lite generate "Add a function to update user profile information in the database, including validation for email format and password strength"

# Bug fix
phoenix-lite fix "The login endpoint returns 500 error when password is empty - should return 400 with clear error message"
```

### 3. Review and Approve

Phoenix-Lite will show you the generated plan before implementation:

``` markdown
Phoenix-Lite Plan:
================

Task: Create user registration endpoint
Complexity: Medium (estimated 15 minutes)

Plan:
1. Generate test cases for user registration scenarios
   - Valid registration data
   - Invalid email format
   - Missing required fields
   - Duplicate email handling

2. Implement FastAPI endpoint
   - Request model with validation
   - Database integration
   - Response model
   - Error handling

3. Refactor and document
   - Add docstrings
   - Optimize database queries
   - Add logging

Estimated cost: $0.15
Continue? (y/n):
```

### 4. Execute and Iterate

Phoenix-Lite runs through its three-phase cycle:

```bash
✓ Phase 1: Plan & Test (30s)
  - Generated 8 test cases
  - Created test fixtures
  - Validated test completeness

✓ Phase 2: Implement & Fix (45s)  
  - Initial implementation complete
  - Fixed 2 compilation errors
  - All tests passing (100% coverage)

✓ Phase 3: Refactor & Document (20s)
  - Added comprehensive docstrings
  - Optimized database query
  - Generated API documentation

Total time: 95 seconds
Files created: user_registration.py, test_user_registration.py
Files modified: main.py, models.py
```

## Advanced Usage

### Custom Configuration

#### Model Selection

Choose different Claude models based on task complexity:

```toml
[phoenix-lite]
# For simple tasks
model = "claude-3-haiku"

# For complex logic (default)
model = "claude-3-5-sonnet" 

# For architectural decisions
model = "claude-3-opus"
```

#### Framework Integration

Configure for your specific tech stack:

```toml
[project]
language = "typescript"
framework = "express"
database = "postgresql"
orm = "prisma"

[testing]
framework = "jest"
coverage_tool = "nyc"
e2e_framework = "playwright"
```

### Batch Processing

Process multiple related tasks efficiently:

```bash
# Create a task file
cat > tasks.txt << EOF
Create user authentication middleware
Add password reset functionality  
Implement user profile endpoint
Add user avatar upload feature
EOF

# Process all tasks
phoenix-lite batch tasks.txt --parallel=2
```

### Integration with Existing Workflows

#### Git Integration

```bash
# Automatic commit after successful generation
phoenix-lite generate "Add user logout endpoint" --auto-commit

# Create feature branch
phoenix-lite generate "Add user search" --branch="feature/user-search"
```

#### CI/CD Integration

```yaml
# .github/workflows/phoenix-lite.yml
name: Phoenix-Lite Code Generation
on:
  workflow_dispatch:
    inputs:
      task:
        description: 'Task description'
        required: true

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Phoenix-Lite
        run: pip install phoenix-lite
      - name: Generate Code
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          phoenix-lite generate "${{ github.event.inputs.task }}" --auto-commit
          git push origin main
```

## Best Practices

### Task Description Guidelines

#### Good Task Descriptions

✓ **Specific and Actionable**

``` text
"Create a REST API endpoint POST /api/users that accepts JSON with name, email, password fields, validates email format, hashes password with bcrypt, stores in PostgreSQL users table, and returns 201 with user ID on success or 400 with validation errors"
```

✓ **Include Context**  

``` text
"Add error handling to the existing payment processing function in payment.py - it should catch network timeouts, retry up to 3 times with exponential backoff, and log failures to the audit log"
```

#### Poor Task Descriptions

✗ **Too Vague**

``` text
"Make the app better"
"Fix the bug"
"Add user stuff"
```

✗ **Too Complex**

``` text
"Build a complete e-commerce platform with user management, product catalog, shopping cart, payment processing, order management, and admin dashboard"
```

### Quality Guidelines

#### Code Quality

- Phoenix-Lite automatically applies linting and formatting
- Maintains consistent coding standards across generated code
- Includes comprehensive error handling by default

#### Test Coverage

- Aims for 80%+ test coverage automatically
- Generates both unit and integration tests
- Includes edge cases and error scenarios

#### Documentation

- Auto-generates docstrings for all functions
- Creates API documentation for web endpoints
- Updates README files with usage examples

## Troubleshooting

### Common Issues

#### "Task too complex for Phoenix-Lite"

```bash
Error: Task complexity score 8/10 exceeds Phoenix-Lite threshold (6/10)
Recommendation: Use full Phoenix Framework or break into smaller tasks

# Solution 1: Break down the task
phoenix-lite generate "Create user model with basic fields"
phoenix-lite generate "Add user validation logic"
phoenix-lite generate "Create user registration endpoint"

# Solution 2: Use full Phoenix
phoenix generate "Complete user management system"
```

#### "Tests failing after generation"

```bash
Warning: 2/10 tests failing after implementation
Running auto-fix attempt 1/3...

# Phoenix-Lite will automatically attempt to fix failing tests
# If auto-fix fails, you'll get a detailed report:
Failed tests:
- test_user_registration_duplicate_email: Expected 409, got 500
- test_user_login_invalid_password: Expected error message format not matched

# Manual review and fix may be required
```

#### "API rate limits exceeded"

```bash
Error: Claude API rate limit exceeded
Estimated wait time: 60 seconds

# Configure rate limiting
phoenix-lite config set rate_limit.requests_per_minute 20
phoenix-lite config set rate_limit.auto_retry true
```

### Performance Optimization

#### Reduce Costs

```bash
# Use cheaper model for simple tasks
phoenix-lite config set model claude-3-haiku

# Enable caching for repeated patterns
phoenix-lite config set cache.enabled true
phoenix-lite config set cache.ttl 3600

# Batch similar tasks
phoenix-lite batch tasks.txt --optimize-cost
```

#### Speed Up Generation

```bash
# Skip documentation generation for prototypes
phoenix-lite generate "Add user endpoint" --skip-docs

# Reduce test coverage for quick iterations
phoenix-lite config set quality.min_coverage 0.6

# Parallel processing for independent tasks
phoenix-lite batch tasks.txt --parallel=4
```

## Migration to Full Phoenix

When your project outgrows Phoenix-Lite, you can migrate to the full Phoenix Framework:

```bash
# Analyze current project for migration readiness
phoenix-lite analyze --migration-report

# Generate full Phoenix configuration
phoenix-lite migrate-to-full

# This creates:
# - phoenix-config.yaml (full framework configuration)
# - agent-specifications/ (detailed agent configs)
# - state-flow.yaml (workflow definition)
# - quality-gates.yaml (comprehensive quality requirements)
```

The migration preserves all existing code and tests while adding the advanced capabilities of the full Phoenix Framework for future development.

---

*Phoenix-Lite provides a gentle introduction to AI-driven development with immediate productivity gains, while maintaining a clear upgrade path to the full Phoenix Framework as your needs evolve.*
