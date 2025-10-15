---
date-created: 2025-08-27-0000
last-updated: 2025-09-11-0000
name: vscode-extension-configuration
description: Systematic package.json configuration for converting Node.js CLI applications to VSCode extensions
status: "[x]"
category: configuration
use-when:
  - Converting Node.js CLI applications to VSCode extensions
  - Setting up VSCode extension manifest configuration
  - Configuring activity bar containers and views
  - Adding commands to VSCode command palette
  - Setting up extension development dependencies
keywords:
  - vscode
  - extension
  - configuration
  - manifest
  - package.json
  - cli-conversion
  - activation-events
  - view-contributions
prerequisites:
  - vscode-extension-development-knowledge
related-patterns:
  - extension-development-lifecycle
  - cli-to-extension-migration
---

<!-- TODO: [TASK-PATTERN-001] Pattern: vscode-extension-configuration | Complexity: 3 | Dependencies: vscode-api,typescript -->
<!-- Context: Updated frontmatter format for VSCode extension configuration pattern following standardized template -->
<!-- Validation-Required: pattern-compliance, yaml-syntax, searchability -->
<!-- Pattern-Info: { approach: "yaml-frontmatter-standardization", alternatives: "markdown-headers", trade-offs: "better-searchability-vs-readability" } -->

### VSCode Extension Configuration Pattern

**Problem**: Converting Node.js CLI applications to VSCode extensions requires specific manifest configuration

**Solution**: Systematic package.json configuration with VSCode extension fields, activation events, and view contributions

#### VSCode Extension Configuration Pattern: Implementation Steps

**Step 1**: Identity Configuration

Set `displayName`, `publisher`, and `engines` field for VSCode compatibility.

**Step 2**: Activation Setup

Configure `activationEvents` for extension loading:

```json
{
  "displayName": "Extension Display Name",
  "publisher": "publisher-id",
  "engines": {
    "vscode": "^1.74.0"
  },
  "activationEvents": [
    "onStartupFinished"
  ]
}
```

**Step 3**: View Contributions

Define activity bar containers, webviews, and commands:

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "extension-id",
          "title": "Extension Title",
          "icon": "$(symbol-interface)"
        }
      ]
    },
    "views": {
      "extension-id": [
        {
          "type": "webview",
          "id": "extension.viewId",
          "name": "View Name"
        }
      ]
    },
    "commands": [
      {
        "command": "extension.commandId",
        "title": "Extension: Command Name"
      }
    ]
  }
}
```

**Step 4**: Development Dependencies

Add VSCode API types and testing framework:

```json
{
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@vscode/test-electron": "^2.3.0"
  }
}
```

**Step 5**: Validation

Verify JSON syntax and VSCode extension structure.

#### VSCode Extension Configuration Pattern: Success Metrics

- Extension manifest configuration complete with all required fields
- VSCode extension successfully recognized and loadable
- Activity bar containers and views properly registered
- Commands accessible through VSCode command palette
- Development dependencies correctly configured for TypeScript support

#### VSCode Extension Configuration Pattern: Anti-Patterns

- **X** Missing required VSCode engine version specification
- **X** Incomplete view contributions causing registration failures
- **X** Missing development dependencies for TypeScript support
- **X** Invalid JSON syntax in package.json breaking extension loading

#### VSCode Extension Configuration Pattern: Validation Checklist

- [ ] `displayName`, `publisher`, and `engines` fields configured
- [ ] `activationEvents` properly set for extension loading
- [ ] Activity bar containers defined with valid icons
- [ ] Views registered with correct IDs and types
- [ ] Commands defined with clear titles
- [ ] Development dependencies added for VSCode API
- [ ] JSON syntax validated and error-free

#### VSCode Extension Configuration Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### VSCode Extension Configuration Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-NEW-042] (completed ✅)  
**Successfully Applied**: Haruspex → Templum pattern adaptation  
**Files Using This Pattern**: `package.json` (configuration-only change)  
**Integration Points**: REUSE Pattern - Adapt configuration from proven extensions  
