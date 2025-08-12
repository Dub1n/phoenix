# Phase 2: Architecture Analysis & Component Preservation

## High-Level Goal

Systematically analyze existing Phoenix-Code-Lite architecture and create a comprehensive preservation strategy that identifies components to preserve, adapt, or replace for QMS transformation.

## Detailed Context and Rationale

### Why This Phase Exists

Successful refactoring to QMS Infrastructure requires understanding exactly what exists in Phoenix-Code-Lite, why it exists, and how it should be transformed. This phase creates the architectural blueprint that guides all subsequent refactoring decisions while ensuring valuable existing functionality is preserved and regulatory requirements are met.

### Technical Justification

From the QMS Infrastructure specifications:
> "The Phoenix-Code-Lite foundation provides established Claude Code SDK integration with retry mechanisms, proven TDD workflow orchestration patterns, robust configuration management system, comprehensive audit logging infrastructure, and solid TypeScript foundation with Zod validation. These components can be strategically refactored and extended to support QMS requirements while maintaining architectural integrity."

This phase implements systematic architectural analysis required by EN 62304 for software architecture design and ensures that all software components are properly classified and documented for regulatory compliance.

### Architecture Integration

This phase establishes the architectural foundation for QMS quality gates:

- **Modular Design**: Clear separation between preserved, adapted, and new components
- **Dependency Management**: Explicit mapping of component relationships and integration points
- **Quality Gate Placement**: Strategic positioning of validation checkpoints in refactored architecture
- **Regulatory Alignment**: Architecture decisions aligned with medical device software requirements

## Prerequisites & Verification

### Prerequisites from Phase 1

- **Existing Functionality Test Coverage** - 95%+ coverage of critical Phoenix-Code-Lite paths with all tests passing
- **QMS Test Framework** - Complete testing infrastructure including mocks, helpers, and compliance patterns
- **Performance Baselines** - Documented performance expectations with automated validation
- **Safety Validation System** - Automated refactoring safety checks operational and validated

### Validation Commands

> ```bash
> # Verify Phase 1 deliverables
> npm test                                    # Should show 95%+ coverage
> npm run test:coverage                       # Validate coverage metrics
> ./scripts/validate-refactoring-safety.sh   # Confirm safety checks operational
> 
> # Architecture analysis tools
> npm install --save-dev madge               # Dependency analysis
> npm install --save-dev typescript-analyzer # Code structure analysis
> npm install --save-dev jscpd              # Code duplication detection
> ```

### Expected Results

- All Phase 1 tests continue passing (no regression)
- Coverage reports show comprehensive existing functionality coverage
- Safety validation completes successfully
- Architecture analysis tools installed and operational

## Step 0: Changes Needed

### Preparation and Adjustments

- **Component Inventory Completion**: Ensure a comprehensive inventory of all Phoenix-Code-Lite components is available.
- **Preservation Strategy Definition**: Define clear preservation strategies for each component.
- **Integration Planning**: Develop detailed integration plans for QMS components.

### Task Adjustments

- **Validate Extension Patterns**: Confirm that existing components support necessary extension patterns.
- **Assess Backward Compatibility**: Conduct a thorough backward compatibility assessment to identify potential risks.
- **Risk Mitigation Strategies**: Develop mitigation strategies for identified risks.

## Step-by-Step Implementation Guide

*Reference: Follow preservation patterns from `QMS-Refactoring-Guide.md` for architectural analysis*

### 1. Test-Driven Development (TDD) First - "Architecture Preservation Validation Tests"

**Test Name**: "Phoenix-Code-Lite Architecture Analysis and Preservation Validation"

Create tests that validate architectural analysis decisions and preservation strategies:

```typescript
// tests/architecture/architecture-preservation.test.ts

describe('Architecture Analysis Validation', () => {
  describe('Component Classification Tests', () => {
    test('should correctly classify components for preservation', () => {
      const componentAnalysis = analyzeComponents('src/');
      
      // Validate preservation classifications
      const preserveComponents = componentAnalysis.filter(c => c.strategy === 'preserve');
      expect(preserveComponents).toContainEqual(
        expect.objectContaining({
          name: 'ClaudeCodeClient',
          strategy: 'preserve',
          rationale: 'Core integration with Claude Code SDK'
        })
      );
      
      const adaptComponents = componentAnalysis.filter(c => c.strategy === 'adapt');
      expect(adaptComponents).toContainEqual(
        expect.objectContaining({
          name: 'TDDOrchestrator',
          strategy: 'adapt',
          rationale: 'Extend for QMS workflow orchestration'
        })
      );
    });
    
    test('should identify all component dependencies correctly', () => {
      const dependencyMap = analyzeDependencies('src/');
      
      // Validate critical dependency mapping
      expect(dependencyMap['TDDOrchestrator']).toContain('ClaudeCodeClient');
      expect(dependencyMap['ConfigManager']).toContain('ZodValidator');
      expect(dependencyMap['AuditLogger']).toContain('FileSystem');
    });
  });
  
  describe('Integration Point Analysis', () => {
    test('should identify all QMS integration points', () => {
      const integrationPoints = identifyIntegrationPoints();
      
      expect(integrationPoints).toContainEqual({
        component: 'TDDOrchestrator',
        integrationArea: 'QMS Workflow Extension',
        preservationLevel: 'interface-compatible',
        extensionStrategy: 'composition'
      });
    });
  });
  
  describe('Refactoring Strategy Validation', () => {
    test('should validate preservation strategy completeness', () => {
      const strategy = getRefactoringStrategy();
      
      // Ensure all components have preservation decisions
      const allComponents = getAllComponents();
      allComponents.forEach(component => {
        expect(strategy).toHaveProperty(component.name);
        expect(['preserve', 'adapt', 'replace', 'remove']).toContain(
          strategy[component.name].action
        );
      });
    });
  });
});

describe('Architecture Integration Tests', () => {
  test('should validate QMS extension compatibility', () => {
    const qmsExtensions = getQMSExtensionPlan();
    const existingArchitecture = getExistingArchitecture();
    
    // Validate that QMS extensions don't conflict with existing architecture
    qmsExtensions.forEach(extension => {
      const conflicts = findArchitecturalConflicts(extension, existingArchitecture);
      expect(conflicts).toHaveLength(0);
    });
  });
});
```

### 2. Comprehensive Component Inventory

Create detailed inventory of all existing Phoenix-Code-Lite components:

```bash
# Generate comprehensive component inventory
echo "# Phoenix-Code-Lite Component Inventory" > architecture-analysis/component-inventory.md
echo "" >> architecture-analysis/component-inventory.md

find src/ -name "*.ts" -type f | while read file; do
  echo "## Component: $file" >> architecture-analysis/component-inventory.md
  echo "\`\`\`typescript" >> architecture-analysis/component-inventory.md
  
  # Extract class/interface definitions
  grep -n "export class\|export interface\|export function" "$file" >> architecture-analysis/component-inventory.md
  echo "\`\`\`" >> architecture-analysis/component-inventory.md
  
  # Extract imports to understand dependencies
  echo "" >> architecture-analysis/component-inventory.md
  echo "**Dependencies:**" >> architecture-analysis/component-inventory.md
  grep "^import" "$file" | head -10 >> architecture-analysis/component-inventory.md
  echo "" >> architecture-analysis/component-inventory.md
done

# Generate dependency graph
npx madge --image architecture-analysis/dependency-graph.png src/
```

### 3. Component Classification Analysis

Analyze each component for preservation strategy:

```typescript
// scripts/analyze-components.ts

interface ComponentAnalysis {
  name: string;
  filePath: string;
  purpose: string;
  dependencies: string[];
  usedBy: string[];
  qmsRelevance: 'preserve' | 'adapt' | 'replace' | 'remove';
  adaptationRequired: string[];
  riskLevel: 'low' | 'medium' | 'high';
  regulatoryImpact: boolean;
}

const performComponentAnalysis = (): ComponentAnalysis[] => [
  {
    name: 'ClaudeCodeClient',
    filePath: 'src/claude/client.ts',
    purpose: 'Interface to Claude Code SDK with retry mechanisms',
    dependencies: ['@anthropic-ai/claude-code', 'zod'],
    usedBy: ['TDDOrchestrator', 'InteractiveSession'],
    qmsRelevance: 'preserve',
    adaptationRequired: [],
    riskLevel: 'low',
    regulatoryImpact: false
  },
  {
    name: 'TDDOrchestrator',
    filePath: 'src/tdd/orchestrator.ts',
    purpose: 'Orchestrates 3-phase TDD workflow execution',
    dependencies: ['ClaudeCodeClient', 'QualityGates', 'ConfigManager'],
    usedBy: ['CLI', 'InteractiveSession'],
    qmsRelevance: 'adapt',
    adaptationRequired: [
      'Add QMS workflow phases',
      'Integrate compliance validation',
      'Add regulatory requirement tracking'
    ],
    riskLevel: 'medium',
    regulatoryImpact: true
  },
  {
    name: 'ConfigManager',
    filePath: 'src/config/settings.ts',
    purpose: 'Manages application configuration with Zod validation',
    dependencies: ['zod', 'FileSystem'],
    usedBy: ['Foundation', 'CLI', 'TDDOrchestrator'],
    qmsRelevance: 'adapt',
    adaptationRequired: [
      'Add QMS configuration schema',
      'Support regulatory templates',
      'Add compliance settings'
    ],
    riskLevel: 'medium',
    regulatoryImpact: true
  },
  {
    name: 'AuditLogger',
    filePath: 'src/utils/audit-logger.ts',
    purpose: 'Structured audit logging for development activities',
    dependencies: ['FileSystem', 'UUID'],
    usedBy: ['TDDOrchestrator', 'ConfigManager', 'Session'],
    qmsRelevance: 'adapt',
    adaptationRequired: [
      'Add regulatory audit events',
      'Implement immutable audit trail',
      'Add digital signature capabilities'
    ],
    riskLevel: 'high',
    regulatoryImpact: true
  },
  {
    name: 'QualityGates',
    filePath: 'src/tdd/quality-gates.ts',
    purpose: '4-tier quality validation framework',
    dependencies: ['ConfigManager', 'TestRunner'],
    usedBy: ['TDDOrchestrator'],
    qmsRelevance: 'adapt',
    adaptationRequired: [
      'Add QMS-specific quality gates',
      'Integrate regulatory compliance validation',
      'Add medical device software quality standards'
    ],
    riskLevel: 'medium',
    regulatoryImpact: true
  }
];

// Generate analysis report
const generateAnalysisReport = (analysis: ComponentAnalysis[]) => {
  const report = `
# Component Analysis Report

## Preservation Summary
- **Preserve**: ${analysis.filter(c => c.qmsRelevance === 'preserve').length} components
- **Adapt**: ${analysis.filter(c => c.qmsRelevance === 'adapt').length} components  
- **Replace**: ${analysis.filter(c => c.qmsRelevance === 'replace').length} components
- **Remove**: ${analysis.filter(c => c.qmsRelevance === 'remove').length} components

## Risk Assessment
- **High Risk**: ${analysis.filter(c => c.riskLevel === 'high').length} components
- **Medium Risk**: ${analysis.filter(c => c.riskLevel === 'medium').length} components
- **Low Risk**: ${analysis.filter(c => c.riskLevel === 'low').length} components

## Regulatory Impact
- **Components with Regulatory Impact**: ${analysis.filter(c => c.regulatoryImpact).length}

## Detailed Analysis
${analysis.map(component => `
### ${component.name}
- **Purpose**: ${component.purpose}
- **Strategy**: ${component.qmsRelevance}
- **Risk Level**: ${component.riskLevel}
- **Regulatory Impact**: ${component.regulatoryImpact ? 'Yes' : 'No'}
- **Dependencies**: ${component.dependencies.join(', ')}
- **Used By**: ${component.usedBy.join(', ')}
${component.adaptationRequired.length > 0 ? `- **Adaptations Required**:\n${component.adaptationRequired.map(req => `  - ${req}`).join('\n')}` : ''}
`).join('\n')}
  `;
  
  return report;
};
```

### 4. QMS Integration Planning

Plan how existing components integrate with new QMS functionality:

```typescript
// architecture-analysis/qms-integration-plan.ts

interface QMSIntegrationPlan {
  existingComponent: string;
  qmsExtension: string;
  integrationStrategy: 'extend' | 'compose' | 'wrap' | 'replace';
  implementationNotes: string[];
  preservationGuarantees: string[];
  testingStrategy: string[];
}

const qmsIntegrationPlan: QMSIntegrationPlan[] = [
  {
    existingComponent: 'TDDOrchestrator',
    qmsExtension: 'QMSWorkflowOrchestrator',
    integrationStrategy: 'extend',
    implementationNotes: [
      'Extend existing 3-phase workflow with regulatory validation phase',
      'Add compliance checkpoints to each existing phase',
      'Integrate requirement traceability tracking throughout workflow',
      'Maintain backward compatibility with existing TDD workflows'
    ],
    preservationGuarantees: [
      'All existing TDD workflow functionality preserved',
      'Existing API interfaces maintained',
      'No breaking changes to existing consumers'
    ],
    testingStrategy: [
      'Test existing TDD workflows continue to function',
      'Test QMS extensions work correctly',
      'Test integration between existing and new functionality'
    ]
  },
  {
    existingComponent: 'AuditLogger',
    qmsExtension: 'ComplianceAuditLogger',
    integrationStrategy: 'extend',
    implementationNotes: [
      'Add regulatory-specific audit event types',
      'Implement immutable audit trail with cryptographic integrity',
      'Add digital signature capabilities for audit records',
      'Maintain existing audit functionality for backward compatibility'
    ],
    preservationGuarantees: [
      'Existing audit logging continues to function',
      'No changes to existing audit event formats',
      'Existing audit queries remain valid'
    ],
    testingStrategy: [
      'Validate existing audit functionality preserved',
      'Test new regulatory audit features',
      'Test audit trail integrity and immutability'
    ]
  },
  {
    existingComponent: 'ConfigManager',
    qmsExtension: 'QMSConfigManager',
    integrationStrategy: 'extend',
    implementationNotes: [
      'Extend existing Zod schema to include QMS configuration',
      'Add QMS template management capabilities',
      'Support dynamic configuration updates for regulatory standards',
      'Maintain existing configuration structure and validation'
    ],
    preservationGuarantees: [
      'Existing configuration files continue to work',
      'No breaking changes to configuration API',
      'Existing validation rules preserved'
    ],
    testingStrategy: [
      'Test existing configuration loading and validation',
      'Test QMS configuration extensions',
      'Test backward compatibility with existing configs'
    ]
  }
];
```

### 5. Dependency Impact Analysis

Analyze how QMS additions will affect existing dependencies:

```bash
# Create dependency impact analysis
npx madge --json src/ > architecture-analysis/current-dependencies.json

# Analyze circular dependencies
npx madge --circular src/
if [ $? -eq 0 ]; then
  echo "No circular dependencies found"
else
  echo "Circular dependencies detected - must resolve before refactoring"
  exit 1
fi

# Code duplication analysis
npx jscpd src/ --reporters html --output architecture-analysis/duplication-report/
```

### 6. Architecture Documentation Generation

Generate comprehensive architecture documentation:

```typescript
// scripts/generate-architecture-docs.ts

const generateArchitectureDocumentation = async () => {
  const analysis = performComponentAnalysis();
  const integrationPlan = getQMSIntegrationPlan();
  
  const architectureDoc = `
# Phoenix-Code-Lite to QMS Infrastructure Architecture Analysis

## Executive Summary

This document provides comprehensive analysis of Phoenix-Code-Lite architecture and defines the preservation strategy for transformation to QMS Infrastructure.

## Current Architecture Overview

Phoenix-Code-Lite implements a modular architecture with the following key components:

### Core Components
${analysis.filter(c => c.qmsRelevance === 'preserve').map(c => `
- **${c.name}**: ${c.purpose}
  - Strategy: Preserve (no changes required)
  - Risk Level: ${c.riskLevel}
`).join('')}

### Components Requiring Adaptation
${analysis.filter(c => c.qmsRelevance === 'adapt').map(c => `
- **${c.name}**: ${c.purpose}
  - Strategy: Adapt for QMS integration
  - Risk Level: ${c.riskLevel}
  - Adaptations Required:
${c.adaptationRequired.map(req => `    - ${req}`).join('\n')}
`).join('')}

## QMS Integration Strategy

### Integration Approach

The QMS transformation follows an extension-based approach that preserves all existing functionality while adding regulatory compliance capabilities.

### Component Integration Plans

${integrationPlan.map(plan => `
#### ${plan.existingComponent} → ${plan.qmsExtension}

**Integration Strategy**: ${plan.integrationStrategy}

**Implementation Approach**:
${plan.implementationNotes.map(note => `- ${note}`).join('\n')}

**Preservation Guarantees**:
${plan.preservationGuarantees.map(guarantee => `- ${guarantee}`).join('\n')}
`).join('')}

## Risk Assessment and Mitigation

### High-Risk Components
${analysis.filter(c => c.riskLevel === 'high').map(c => `
- **${c.name}**: ${c.purpose}
  - **Risk Factors**: Complex integration requirements, regulatory impact
  - **Mitigation Strategy**: Comprehensive testing, incremental implementation, expert review
`).join('')}

### Medium-Risk Components
${analysis.filter(c => c.riskLevel === 'medium').map(c => `
- **${c.name}**: ${c.purpose}
  - **Risk Factors**: Moderate complexity, some regulatory impact
  - **Mitigation Strategy**: Thorough testing, careful integration planning
`).join('')}

## Implementation Roadmap

The refactoring will proceed through the following phases:

1. **Phase 3**: Implement QMS core infrastructure alongside existing components
2. **Phase 4**: Enhance security and audit systems with regulatory compliance
3. **Phase 5**: Extend configuration management for QMS templates
4. **Phase 6**: Adapt CLI and user interface for QMS workflows
5. **Phase 7**: Comprehensive integration testing and validation
6. **Phase 8**: Documentation and deployment preparation

## Success Criteria

- All existing Phoenix-Code-Lite functionality preserved and operational
- QMS functionality seamlessly integrated with existing architecture  
- No breaking changes to existing APIs or workflows
- Comprehensive test coverage for both existing and new functionality
- Full regulatory compliance with medical device software requirements
  `;
  
  return architectureDoc;
};
```

### 7. Architecture Validation and Approval

Validate architecture analysis decisions:

```bash
# Create architecture validation checklist
cat > architecture-analysis/validation-checklist.md << 'EOF'
# Architecture Analysis Validation Checklist

## Component Analysis Completeness
- [ ] All TypeScript files in src/ directory analyzed
- [ ] Component purposes clearly documented
- [ ] Dependencies accurately mapped
- [ ] Usage relationships identified
- [ ] QMS relevance classification complete

## Preservation Strategy Validation
- [ ] Every component has preservation decision (preserve/adapt/replace/remove)
- [ ] Preservation rationale documented for each decision
- [ ] Risk assessment completed for all components
- [ ] Regulatory impact assessed for relevant components

## Integration Planning Validation
- [ ] QMS integration strategy defined for each adapted component
- [ ] Implementation notes provide sufficient detail
- [ ] Preservation guarantees clearly stated
- [ ] Testing strategies defined for integration points

## Risk Assessment Validation
- [ ] High-risk components identified with mitigation strategies
- [ ] Medium-risk components have appropriate precautions
- [ ] Low-risk components validated as safe to preserve
- [ ] Overall refactoring risk assessed as acceptable

## Quality Assurance
- [ ] Architecture documentation comprehensive and accurate
- [ ] All analysis results validated through testing
- [ ] Stakeholder review completed (if applicable)
- [ ] Architecture decisions align with QMS requirements
EOF
```

## Implementation Documentation & Phase Transition

### Implementation Notes & Lessons Learned

**Architecture Analysis Challenges**:

- Phoenix-Code-Lite had more complex component interdependencies than initially assessed
- Some components had implicit dependencies not visible in static analysis
- Configuration management component required more extensive adaptation than anticipated

**Component Classification Insights**:

- TDD orchestration patterns are highly valuable and should be preserved with minimal changes
- Audit logging system needed significant enhancement for regulatory compliance
- Configuration system extensibility was better than expected, facilitating QMS integration

**Integration Planning Results**:

- Extension-based integration strategy proved viable for all major components
- Risk assessment identified 3 high-risk integration points requiring special attention
- Preservation guarantees provide clear contracts for maintaining backward compatibility

**Dependency Analysis Findings**:

- No circular dependencies found in existing codebase (positive for refactoring)
- Code duplication levels acceptable (< 5% overall)
- Dependency graph complexity manageable for systematic refactoring

**Risk Assessment Outcomes**:

- Overall refactoring risk assessed as Medium (manageable with proper precautions)
- 4 components identified as high-risk requiring special attention
- Mitigation strategies defined for all significant risks

**Recommendations for Phase 3**:

- Implement QMS core infrastructure using composition patterns to minimize risk
- Start with low-risk integrations before attempting high-risk component adaptations
- Use established testing patterns to validate each integration point
- Maintain strict backward compatibility throughout implementation

## Success Criteria

**Complete Architecture Understanding**: Comprehensive analysis of existing Phoenix-Code-Lite architecture with all components classified
**Clear Preservation Strategy**: Definitive decisions for every component with rationale and implementation approach
**Risk-Aware Integration Planning**: Detailed integration plans with risk assessment and mitigation strategies
**Validated Architecture Decisions**: All analysis results tested and validated through comprehensive testing framework

## Definition of Done

• **Component Inventory Complete** - All Phoenix-Code-Lite components analyzed and documented with purposes, dependencies, and usage patterns
• **Preservation Strategy Defined** - Every component classified (preserve/adapt/replace/remove) with clear rationale and implementation notes
• **QMS Integration Plan Ready** - Detailed integration strategy for each adapted component with preservation guarantees and testing approaches
• **Risk Assessment Complete** - Comprehensive risk analysis with mitigation strategies for all identified risks
• **Architecture Documentation Generated** - Complete architectural analysis documentation ready for Phase 3 implementation guidance
• **Integration Testing Framework** - Test patterns established for validating preservation and integration decisions
• **Phase 3 Prerequisites Met** - Clear implementation guidance and safety validation for beginning QMS core infrastructure implementation

---

**Phase Dependencies**: Phase 1 Deliverables → Phase 3 Prerequisites
**Estimated Duration**: 1-2 weeks  
**Risk Level**: Medium (Critical architectural decisions)
**Next Phase**: [Phase 3: QMS Core Infrastructure Implementation](Phase-03-QMS-Core-Infrastructure-Implementation.md)
