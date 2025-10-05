---
date-created: 2025-09-05-0000
last-updated: 2025-09-11-0000
name: file-based-handoff-infrastructure
description: Structured file-based communication system with JSON schemas, automated cleanup, and comprehensive error handling
status: established
category: infrastructure
use-when:
  - Subagent workflow implementations requiring context isolation
  - Multi-phase operations where agents need to pass structured data
  - Cross-project agent reusability with standardized communication protocols
  - Long-running workflows that need audit trails and recovery capabilities
keywords:
  - agent-communication
  - context-isolation
  - handoff
  - json-schemas
  - file-system
  - workflow
  - audit-trail
prerequisites:
  - node-js-environment
  - typescript-interfaces
  - json-schema-validation
related-patterns:
  - sequential-workflow-integration
  - error-recovery-pattern
  - configuration-management
---

### File-Based Handoff Infrastructure Pattern

**Problem**: Agent-to-agent communication needs context isolation to prevent context pollution and enable scalable workflows  
**Solution**: Structured file-based communication system with JSON schemas, automated cleanup, and comprehensive error handling

#### File-Based Handoff Infrastructure Pattern: Implementation Steps

**Step 1**: Directory Structure

```diagram
.claude/
├── handoff/
│   ├── input/          # Agent handoff input files
│   ├── output/         # Agent handoff output files  
│   └── archive/        # Archived handoff files (7-day input, 30-day output retention)
└── agents/
    ├── interfaces/     # TypeScript interface definitions
    └── utils/          # Utility functions for file management
```

**Step 2**: Core Interfaces

**HandoffInput Interface** (`.claude/agents/interfaces/handoff-types.ts`):

```typescript
interface HandoffInput {
  taskId: string;
  phase: 'research' | 'execution' | 'validation';
  context: string;
  requirements: string[];
  constraints: Record<string, any>;
  executionParameters: {
    timeout: number;
    confidenceThreshold: number;
    maxTokens: number;
  };
}
```

**HandoffOutput Interface**:

```typescript
interface HandoffOutput {
  taskId: string;
  phase: 'research' | 'execution' | 'validation';
  status: 'success' | 'partial' | 'failed' | 'retry';
  results: any;
  confidence: number;
  executionTime: number;
  errorDetails?: string;
  nextActions?: string[];
}
```

**Step 3**: File Management Utilities

**File Naming Convention**: `{phase}-{context|results}-{task-id}-{timestamp}.json`

**Automated Cleanup**:

- Input files: 7-day retention
- Output files: 30-day retention  
- Archive files: Permanent retention for audit trails

**Error Handling**: Comprehensive retry mechanisms, timeout handling, and partial result processing

#### File-Based Handoff Infrastructure Pattern: Success Metrics

- [Success-Metrics]

#### File-Based Handoff Infrastructure Pattern: Anti-Patterns

- **X** [Anti-Patterns]

#### File-Based Handoff Infrastructure Pattern: Validation Checklist

- [ ] **Schema Validation**: All JSON files validated against TypeScript interfaces
- [ ] **File System Integrity**: Directory structure creation and permission validation
- [ ] **Cleanup Automation**: Retention policies enforced automatically
- [ ] **Error Recovery**: Comprehensive error handling with audit trails
- [ ] **Cross-Platform Compatibility**: Works across different operating systems

#### File-Based Handoff Infrastructure Pattern: Implementation Feedback

- **2025-09-05 - TASK-SUBAGENT-001**: Infrastructure foundation established successfully. All 27 validation items passed. Directory structure, interfaces, and utilities implemented with comprehensive error handling. Ready for Phase 2 agent implementations.

// TODO: [TASK-PATTERN-001] Pattern: frontmatter-update | Complexity: 3 | Dependencies: yaml-frontmatter,pattern-standardization
// Context: Updated YAML frontmatter to follow standardized template format with kebab-case fields, structured arrays, and improved searchability
// Validation-Required: yaml-syntax, pattern-compliance, metadata-completeness
// Pattern-Info: { approach: "template-based-transformation", alternatives: "manual-editing", trade-offs: "consistency-vs-flexibility" }

#### File-Based Handoff Infrastructure Pattern: Pattern Metadata

Benefits

- **Context Isolation**: Eliminates context pollution between agents
- **Audit Capability**: Complete audit trail for all agent communications
- **Error Recovery**: Robust error handling and retry mechanisms
- **Scalability**: Linear scaling vs exponential context degradation
- **Cross-Project Reuse**: Generic infrastructure usable across VDL_Vault projects

Prerequisites

- Node.js environment for file system operations
- TypeScript for interface validation
- Basic understanding of JSON schema validation

Related Patterns

- **Sequential Workflow Integration**: Builds upon file-based communication
- **Error Recovery Pattern**: Uses same error handling principles
- **Configuration Management**: Similar structured data approach

Used By Active Tasks

- **TASK-SUBAGENT-001**: File-Based Handoff Infrastructure Setup ✅ **COMPLETED**
- **TASK-SUBAGENT-002**: Generic Analysis Agent Implementation (implemented-testing)
- **TASK-SUBAGENT-004**: Generic Execution Agent Implementation (planned)
