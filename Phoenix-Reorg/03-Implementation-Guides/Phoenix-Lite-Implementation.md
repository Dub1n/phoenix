# Phoenix-Lite Implementation Guide

## Overview

Phoenix-Lite is a streamlined version of the Phoenix Framework designed for rapid development of simple, granular tasks. It uses a "Pragmatic TDD Loop" that collapses the full multi-agent roles into a lean, three-step process optimized for speed and efficiency.

## When to Use Phoenix-Lite

Phoenix-Lite is ideal for:

- Simple bug fixes and feature additions
- Well-defined, granular tasks
- Rapid prototyping
- Learning the Phoenix methodology
- Projects where comprehensive planning overhead isn't justified

Phoenix-Lite intentionally omits:

- Deep planning (SRS/WBS generation)
- Security auditing
- Deployment artifact generation
- Complex multi-agent orchestration

## Architecture

### The Pragmatic TDD Loop

Phoenix-Lite uses a condensed three-step process:

1. **Plan & Test**: Single LLM call analyzes the request and generates both a plan and test suite
2. **Implement & Fix**: Iterative loop where the LLM writes code to pass tests, with automated retries on failure
3. **Refactor & Document**: Final call to clean up and document the passing code

### Triage Decision Logic

The Triage Agent determines whether to use Phoenix-Lite based on:

- Task complexity assessment
- Scope of required changes
- Risk level evaluation
- Time constraints

## Implementation Steps

### Step 1: Environment Setup

```bash
# Install required dependencies
cargo new phoenix-lite --bin
cd phoenix-lite

# Add to Cargo.toml
[dependencies]
clap = "4.0"
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
reqwest = { version = "0.11", features = ["json"] }
anyhow = "1.0"
```

### Step 2: Basic CLI Structure

Create the main CLI interface:

```rust
use clap::{Arg, Command};
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    let matches = Command::new("phoenix-lite")
        .version("0.1.0")
        .about("Rapid AI-driven development tool")
        .arg(
            Arg::new("task")
                .short('t')
                .long("task")
                .value_name("DESCRIPTION")
                .help("Task description for Phoenix-Lite to execute")
                .required(true)
        )
        .get_matches();

    let task_description = matches.get_one::<String>("task").unwrap();
    
    execute_phoenix_lite(task_description).await?;
    
    Ok(())
}
```

### Step 3: Implement the Pragmatic TDD Loop

```rust
async fn execute_phoenix_lite(task: &str) -> Result<()> {
    println!("* Phoenix-Lite starting for task: {}", task);
    
    // Step 1: Plan & Test
    println!("⋇ STEP 1: Planning and generating tests...");
    let plan_and_tests = generate_plan_and_tests(task).await?;
    
    // Step 2: Implement & Fix
    println!("⚡ STEP 2: Implementing code to pass tests...");
    let implementation = implement_and_fix(&plan_and_tests).await?;
    
    // Step 3: Refactor & Document
    println!("✨ STEP 3: Refactoring and documenting code...");
    let final_code = refactor_and_document(&implementation).await?;
    
    println!("* Phoenix-Lite completed successfully!");
    
    Ok(())
}
```

### Step 4: LLM Integration

```rust
use reqwest::Client;
use serde_json::{json, Value};

struct LLMClient {
    client: Client,
    api_key: String,
}

impl LLMClient {
    fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }
    
    async fn generate_plan_and_tests(&self, task: &str) -> Result<String> {
        let prompt = format!(
            "You are a senior developer using Test-Driven Development. \
            For the task '{}', provide:\n\
            1. A brief implementation plan\n\
            2. Complete test suite covering the functionality\n\
            3. Clear success criteria\n\n\
            Focus on generating failing tests first, then outline the implementation needed.",
            task
        );
        
        self.call_llm(&prompt).await
    }
    
    async fn implement_code(&self, plan_and_tests: &str) -> Result<String> {
        let prompt = format!(
            "Based on the following plan and tests:\n{}\n\n\
            Write the minimal implementation code needed to make all tests pass. \
            Focus on the happy path and core functionality.",
            plan_and_tests
        );
        
        self.call_llm(&prompt).await
    }
    
    async fn refactor_and_document(&self, implementation: &str) -> Result<String> {
        let prompt = format!(
            "Review and improve the following implementation:\n{}\n\n\
            1. Refactor for better readability and maintainability\n\
            2. Add comprehensive documentation\n\
            3. Ensure consistent style and error handling\n\
            4. Provide usage examples",
            implementation
        );
        
        self.call_llm(&prompt).await
    }
    
    async fn call_llm(&self, prompt: &str) -> Result<String> {
        let payload = json!({
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4000,
            "messages": [{
                "role": "user",
                "content": prompt
            }]
        });
        
        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&payload)
            .send()
            .await?;
            
        let response_data: Value = response.json().await?;
        
        Ok(response_data["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string())
    }
}
```

### Step 5: Error Handling and Retry Logic

```rust
use std::time::Duration;
use tokio::time::sleep;

async fn implement_and_fix(plan_and_tests: &str) -> Result<String> {
    let llm_client = LLMClient::new(
        std::env::var("ANTHROPIC_API_KEY")
            .expect("ANTHROPIC_API_KEY environment variable required")
    );
    
    let mut attempts = 0;
    let max_attempts = 3;
    
    loop {
        attempts += 1;
        println!("  ⇔ Implementation attempt {}/{}", attempts, max_attempts);
        
        let implementation = llm_client.implement_code(plan_and_tests).await?;
        
        // Run tests to validate implementation
        match validate_implementation(&implementation).await {
            Ok(_) => {
                println!("  ✓ Tests passed!");
                return Ok(implementation);
            }
            Err(error) if attempts < max_attempts => {
                println!("  ✗ Tests failed: {}", error);
                println!("  ⇔ Retrying with error feedback...");
                
                // Add error context for next attempt
                let error_feedback = format!(
                    "Previous attempt failed with error: {}\n\
                    Original plan and tests: {}\n\
                    Please fix the implementation.",
                    error, plan_and_tests
                );
                
                let fixed_implementation = llm_client.call_llm(&error_feedback).await?;
                
                match validate_implementation(&fixed_implementation).await {
                    Ok(_) => return Ok(fixed_implementation),
                    Err(_) => {
                        sleep(Duration::from_secs(2)).await;
                        continue;
                    }
                }
            }
            Err(error) => {
                return Err(anyhow::anyhow!(
                    "Failed to implement after {} attempts. Last error: {}", 
                    max_attempts, 
                    error
                ));
            }
        }
    }
}

async fn validate_implementation(code: &str) -> Result<()> {
    // This would run the actual tests
    // For now, we'll do basic validation
    if code.trim().is_empty() {
        return Err(anyhow::anyhow!("Empty implementation"));
    }
    
    // Add more sophisticated validation here:
    // - Syntax checking
    // - Test execution
    // - Basic linting
    
    Ok(())
}
```

## Usage Examples

### Basic Usage

```bash
# Simple function implementation
phoenix-lite --task "Create a function to validate email addresses with tests"

# Bug fix
phoenix-lite --task "Fix the user login function that's not handling empty passwords"

# Feature addition
phoenix-lite --task "Add pagination to the user list endpoint"
```

### Integration with Existing Projects

```bash
# Navigate to your project
cd my-rust-project

# Use Phoenix-Lite for specific tasks
phoenix-lite --task "Add input validation to the User struct with proper error handling"

# Review and commit the changes
git add .
git commit -m "Add user input validation via Phoenix-Lite"
```

### Configuration Options

Create a `.phoenix-lite.toml` configuration file:

```toml
[llm]
model = "claude-3-5-sonnet-20241022"
max_tokens = 4000
temperature = 0.1

[validation]
run_tests = true
check_syntax = true
max_attempts = 3

[output]
verbose = true
save_intermediate = false
```

## Best Practices

### Task Description Guidelines

**Good task descriptions:**

- "Implement a user authentication middleware with JWT token validation and error handling"
- "Create a database migration to add email verification fields to users table"
- "Fix memory leak in the file upload handler by properly closing file handles"

**Poor task descriptions:**

- "Make the app better"
- "Add some features"
- "Fix everything"

### When to Escalate to Full Phoenix

Escalate to Full Phoenix when:

- Task affects multiple modules or domains
- Security implications are significant
- Comprehensive planning is needed
- Task requires architectural decisions
- Integration with multiple external systems

### Error Recovery Strategies

1. **Incremental Complexity**: Start with simpler versions and build up
2. **Error Context**: Always include error messages in retry attempts
3. **Fallback Plans**: Have manual intervention points for complex failures
4. **Learning Loop**: Track common failures for future improvement

## Integration with Claude Code

Phoenix-Lite works excellently with Claude Code CLI:

```bash
# Use Claude Code to set up the project structure
claude "Set up a new Rust project with Phoenix-Lite integration"

# Let Phoenix-Lite handle specific implementations
phoenix-lite --task "Implement the task Claude just planned"

# Use Claude Code for review and refinement
claude "Review the Phoenix-Lite generated code and suggest improvements"
```

## Performance Optimization

### Caching Strategies

```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct ResponseCache {
    cache: HashMap<String, (String, Instant)>,
    ttl: Duration,
}

impl ResponseCache {
    fn new(ttl_minutes: u64) -> Self {
        Self {
            cache: HashMap::new(),
            ttl: Duration::from_secs(ttl_minutes * 60),
        }
    }
    
    fn get(&mut self, key: &str) -> Option<&String> {
        if let Some((value, timestamp)) = self.cache.get(key) {
            if timestamp.elapsed() < self.ttl {
                return Some(value);
            } else {
                self.cache.remove(key);
            }
        }
        None
    }
    
    fn insert(&mut self, key: String, value: String) {
        self.cache.insert(key, (value, Instant::now()));
    }
}
```

### Batch Processing

For multiple related tasks:

```bash
# Process multiple tasks in sequence
phoenix-lite --batch tasks.json

# Where tasks.json contains:
{
  "tasks": [
    {
      "id": "user-validation",
      "description": "Add email validation to User struct",
      "priority": "high"
    },
    {
      "id": "error-handling", 
      "description": "Improve error handling in auth module",
      "priority": "medium"
    }
  ]
}
```

## Monitoring and Metrics

Track Phoenix-Lite performance:

```rust
#[derive(Debug)]
struct Metrics {
    total_tasks: u32,
    successful_tasks: u32,
    failed_tasks: u32,
    average_completion_time: Duration,
    retry_rate: f64,
}

impl Metrics {
    fn success_rate(&self) -> f64 {
        if self.total_tasks == 0 {
            0.0
        } else {
            self.successful_tasks as f64 / self.total_tasks as f64
        }
    }
    
    fn print_summary(&self) {
        println!("◊ Phoenix-Lite Metrics:");
        println!("  Tasks completed: {}", self.total_tasks);
        println!("  Success rate: {:.1}%", self.success_rate() * 100.0);
        println!("  Average time: {:?}", self.average_completion_time);
        println!("  Retry rate: {:.1}%", self.retry_rate * 100.0);
    }
}
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail repeatedly
**Solution**: Simplify the task description and break into smaller parts

**Issue**: Generated code doesn't compile
**Solution**: Enable syntax validation and provide more context about the project structure

**Issue**: Long response times
**Solution**: Use caching and consider using faster models for simple tasks

**Issue**: High API costs
**Solution**: Implement local caching and use task complexity assessment to choose appropriate models

### Debug Mode

```bash
# Enable verbose logging
RUST_LOG=debug phoenix-lite --task "your task" --verbose

# Save all intermediate steps
phoenix-lite --task "your task" --save-steps ./debug/
```

This Phoenix-Lite implementation provides a solid foundation for rapid, AI-driven development while maintaining the core principles of the Phoenix Framework in a streamlined, accessible format.
