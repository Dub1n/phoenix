"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationGenerator = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const glob_1 = require("glob");
class DocumentationGenerator {
    async generateAPIDocs(outputPath) {
        await fs_1.promises.mkdir(outputPath, { recursive: true });
        const apiDocs = await this.extractAPIDocumentation();
        await fs_1.promises.writeFile((0, path_1.join)(outputPath, 'auto-generated-api.md'), apiDocs);
        console.log('Auto-generated API documentation created at auto-generated-api.md');
        console.log('Note: Use API-REFERENCE.md for comprehensive, human-curated documentation');
    }
    async generateUserGuide(outputPath) {
        await fs_1.promises.mkdir(outputPath, { recursive: true });
        const userGuide = this.generateUserGuideContent();
        await fs_1.promises.writeFile((0, path_1.join)(outputPath, 'user-guide.md'), userGuide);
        const quickStart = this.generateQuickStartContent();
        await fs_1.promises.writeFile((0, path_1.join)(outputPath, 'quick-start.md'), quickStart);
        console.log('User documentation generated successfully');
    }
    async extractAPIDocumentation() {
        const sourceFiles = await (0, glob_1.glob)('src/**/*.ts', { ignore: ['src/**/*.test.ts', 'src/**/*.spec.ts'] });
        let apiDocs = '# Phoenix-Code-Lite API Reference\n\n';
        apiDocs += 'Auto-generated API documentation for Phoenix-Code-Lite components.\n\n';
        for (const file of sourceFiles) {
            const content = await fs_1.promises.readFile(file, 'utf-8');
            const classes = this.extractClasses(content);
            const interfaces = this.extractInterfaces(content);
            if (classes.length > 0 || interfaces.length > 0) {
                apiDocs += `## ${file.replace('src/', '').replace('.ts', '')}\n\n`;
                interfaces.forEach(iface => {
                    apiDocs += `### Interface: ${iface.name}\n\n`;
                    apiDocs += '```typescript\n';
                    apiDocs += iface.definition;
                    apiDocs += '\n```\n\n';
                });
                classes.forEach(cls => {
                    apiDocs += `### Class: ${cls.name}\n\n`;
                    if (cls.description) {
                        apiDocs += `${cls.description}\n\n`;
                    }
                    apiDocs += '#### Methods\n\n';
                    cls.methods.forEach(method => {
                        apiDocs += `**${method.name}**\n\n`;
                        if (method.description) {
                            apiDocs += `${method.description}\n\n`;
                        }
                        apiDocs += '```typescript\n';
                        apiDocs += method.signature;
                        apiDocs += '\n```\n\n';
                    });
                });
            }
        }
        return apiDocs;
    }
    extractClasses(content) {
        const classes = [];
        const classRegex = /export class (\w+)[\s\S]*?\{([\s\S]*?)\n\}/g;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const classBody = match[2];
            const methods = this.extractMethods(classBody);
            classes.push({
                name: className,
                methods,
            });
        }
        return classes;
    }
    extractInterfaces(content) {
        const interfaces = [];
        const interfaceRegex = /export interface (\w+)[\s\S]*?\{([\s\S]*?)\n\}/g;
        let match;
        while ((match = interfaceRegex.exec(content)) !== null) {
            interfaces.push({
                name: match[1],
                definition: match[0],
            });
        }
        return interfaces;
    }
    extractMethods(classBody) {
        const methods = [];
        const methodRegex = /(async\s+)?(\w+)\s*\([^)]*\)\s*:\s*[^{]+/g;
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            const methodName = match[2];
            if (methodName !== 'constructor') {
                methods.push({
                    name: methodName,
                    signature: match[0].trim(),
                });
            }
        }
        return methods;
    }
    generateUserGuideContent() {
        return `# Phoenix-Code-Lite User Guide

## Overview

Phoenix-Code-Lite is a TDD (Test-Driven Development) workflow orchestrator designed to work seamlessly with Claude Code. It transforms natural language task descriptions into tested, working code through an intelligent three-phase workflow.

## Features

- **TDD-First Approach**: Automatically generates tests before implementation
- **Quality Gates**: Multi-tier validation ensuring code quality and reliability
- **Agent Specialization**: Specialized AI agents for planning, implementation, and quality review
- **Configuration Management**: Flexible configuration system with templates for different use cases
- **Audit Logging**: Comprehensive tracking of all workflow activities and metrics
- **Professional CLI**: Advanced command-line interface with progress tracking and contextual help

## Getting Started

### Installation

\`\`\`bash
npm install -g phoenix-code-lite
\`\`\`

### Quick Setup

1. **Initialize your project**:
   \`\`\`bash
   phoenix-code-lite init
   \`\`\`

2. **Run the setup wizard** (optional):
   \`\`\`bash
   phoenix-code-lite wizard
   \`\`\`

3. **Generate your first implementation**:
   \`\`\`bash
   phoenix-code-lite generate --task "Create a function that calculates compound interest"
   \`\`\`

## Configuration

Phoenix-Code-Lite supports three configuration templates:

### Starter Template

- **Use case**: Learning and experimentation
- **Test coverage**: 70%
- **Quality gates**: Basic validation
- **Setup**: \`phoenix-code-lite config --template starter\`

### Enterprise Template

- **Use case**: Production applications
- **Test coverage**: 90%
- **Quality gates**: Strict validation with comprehensive documentation
- **Setup**: \`phoenix-code-lite config --template enterprise\`

### Performance Template

- **Use case**: Speed-optimized workflows
- **Test coverage**: 60%
- **Quality gates**: Minimal overhead with fast execution
- **Setup**: \`phoenix-code-lite config --template performance\`

## Workflow Process

Phoenix-Code-Lite follows a three-phase TDD workflow:

### Phase 1: Plan & Test

- Analyzes task requirements
- Designs test strategy
- Generates comprehensive test cases
- Validates test coverage

### Phase 2: Implement & Fix

- Implements code to pass tests
- Performs iterative refinement
- Handles edge cases and error conditions
- Validates functional requirements

### Phase 3: Refactor & Document

- Optimizes code structure and performance
- Adds comprehensive documentation
- Performs final quality validation
- Generates usage examples

## Command Reference

### Core Commands

#### generate

Generate code using the TDD workflow.

\`\`\`bash
phoenix-code-lite generate --task "Your task description"
\`\`\`

**Options**:

- \`--task, -t\`: Task description (required)
- \`--project-path, -p\`: Project path (default: current directory)
- \`--language, -l\`: Programming language
- \`--framework, -f\`: Framework to use
- \`--verbose, -v\`: Verbose output
- \`--max-attempts\`: Maximum implementation attempts

#### config

Manage configuration settings.

\`\`\`bash
phoenix-code-lite config --show          # Show current configuration
phoenix-code-lite config --reset         # Reset to defaults
phoenix-code-lite config --template starter  # Apply template
\`\`\`

#### init

Initialize Phoenix-Code-Lite in the current directory.

\`\`\`bash
phoenix-code-lite init [--force]
\`\`\`

### Utility Commands

#### history

View command history and performance metrics.

\`\`\`bash
phoenix-code-lite history [--limit 20]
\`\`\`

#### help

Get contextual help and usage examples.

\`\`\`bash
phoenix-code-lite help [--contextual]
\`\`\`

## Examples

### Basic Function Generation

\`\`\`bash
phoenix-code-lite generate --task "Create a function that validates email addresses with regex"
\`\`\`

### Framework-Specific Development

\`\`\`bash
phoenix-code-lite generate --task "Create a React component for user authentication" --framework react
\`\`\`

### API Development

\`\`\`bash
phoenix-code-lite generate --task "Build Express.js REST API for user management" --framework express --language javascript
\`\`\`

### Complex Application Logic

\`\`\`bash
phoenix-code-lite generate --task "Implement shopping cart with discount calculations and tax handling" --max-attempts 5 --verbose
\`\`\`

## Best Practices

### Task Description Guidelines

- Be specific and detailed in task descriptions
- Include context about the intended use case
- Specify any constraints or requirements
- Mention desired patterns or approaches

### Configuration Management

- Use templates as starting points, then customize
- Version control your configuration files
- Test configuration changes with simple tasks first
- Document custom configuration decisions

### Quality Assurance

- Review generated tests before accepting implementations
- Use enterprise template for production code
- Monitor audit logs for workflow improvements
- Validate all generated code before deployment

## Troubleshooting

### Common Issues

**Issue**: Workflow fails with timeout errors
**Solution**: Increase timeout in configuration or use performance template

**Issue**: Generated tests are insufficient
**Solution**: Use enterprise template or adjust test quality threshold

**Issue**: Code doesn't match requirements
**Solution**: Provide more detailed task descriptions with specific examples

### Getting Help

1. **Contextual help**: \`phoenix-code-lite help --contextual\`
2. **Command history**: \`phoenix-code-lite history\`
3. **Configuration validation**: \`phoenix-code-lite config --show\`
4. **Verbose mode**: Add \`--verbose\` to any command for detailed output

## Advanced Features

### Audit Logging

All workflow activities are automatically logged with comprehensive metadata:

- Command execution history
- Performance metrics and timing
- Quality scores and validation results
- Error tracking and retry patterns

### Performance Monitoring

Built-in performance tracking includes:

- Workflow execution time
- Token usage optimization
- Memory usage monitoring
- Success rate analytics

### Extensibility

Phoenix-Code-Lite is designed for extensibility:

- Custom configuration templates
- Agent specialization customization
- Quality gate threshold adjustment
- Integration with existing CI/CD pipelines

## Support

For issues, feature requests, or contributions, please visit the project repository or contact the development team.
`;
    }
    generateQuickStartContent() {
        return `# Phoenix-Code-Lite Quick Start Guide

Get up and running with Phoenix-Code-Lite in under 5 minutes.

## Step 1: Installation

\`\`\`bash
npm install -g phoenix-code-lite
\`\`\`

## Step 2: Initialize Project

\`\`\`bash
cd your-project-directory
phoenix-code-lite init
\`\`\`

## Step 3: Your First Generation

\`\`\`bash
phoenix-code-lite generate --task "Create a function that calculates the area of a circle"
\`\`\`

## Step 4: Review Results

Phoenix-Code-Lite will generate:

- Implementation file (\`circle-area.js\`)
- Test file (\`circle-area.test.js\`)
- Documentation
- Quality report

## Step 5: Customize Configuration

\`\`\`bash
# For production-ready code
phoenix-code-lite config --template enterprise

# For learning and experimentation
phoenix-code-lite config --template starter

# For speed-optimized workflows
phoenix-code-lite config --template performance
\`\`\`

## Next Steps

1. **Explore examples**: Try generating different types of code
2. **Read the full user guide**: Learn about advanced features
3. **Customize configuration**: Adjust settings for your workflow
4. **Review audit logs**: Analyze your development patterns

## Need Help?

\`\`\`bash
phoenix-code-lite help --contextual
\`\`\`

Happy coding!
`;
    }
}
exports.DocumentationGenerator = DocumentationGenerator;
//# sourceMappingURL=generator.js.map