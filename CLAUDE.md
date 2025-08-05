# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

### QMS Infrastructure for Medical Device Software Development

This repository is being transformed from Phoenix-Code-Lite (aka PCL) into a specialized **QMS (Quality Management System) Infrastructure** designed for medical device software development compliance and documentation workflows. The system integrates regulatory requirements into modern AGILE development practices while maintaining the existing TypeScript foundation.

**Core Purpose**: Transform medical device QMS documents and regulatory requirements into a structured, searchable, and compliant development infrastructure that supports EN 62304, AAMI TIR45, and ISO standards integration.

### Architecture Overview

The QMS Infrastructure builds upon the existing Phoenix-Code-Lite foundation with specialized QMS capabilities:

``` text
┌────────────────────────────────────────────────────────────────┐
│                    QMS Infrastructure Architecture             │
├────────────────────────────────────────────────────────────────┤
│  CLI Interface & Interactive QMS Workflows                     │
├────────────────────────────────────────────────────────────────┤
│  Document Processing Engine │ Compliance Validation System    │
├────────────────────────────────────────────────────────────────┤
│  Requirement Traceability Matrix & Audit Trail                │
├────────────────────────────────────────────────────────────────┤
│  Preserved Phoenix-Code-Lite Core & Claude Code Integration    │
├────────────────────────────────────────────────────────────────┤
│  TypeScript Environment & Foundation                           │
└────────────────────────────────────────────────────────────────┘
```

**Technology Stack**:

- **Language**: TypeScript/Node.js (preserved from Phoenix-Code-Lite)
- **LLM Integration**: Claude Code SDK (preserved integration)
- **Document Processing**: PDF-to-Markdown conversion, structure analysis
- **Validation**: Zod schemas for regulatory data validation
- **Testing**: Jest with specialized QMS workflow coverage
- **QMS Standards**: EN 62304, AAMI TIR45, ISO 13485, ISO 14971
- **Security**: Cryptographic audit trails and digital signatures

## QMS Development Roadmap

### 16-Week Implementation Plan

Based on the QMS Roadmap, development follows a systematic approach:

#### **Phase 1: Foundation (Weeks 1-2)**
- Establish comprehensive test coverage for existing Phoenix-Code-Lite system
- Create performance baselines and continuous validation pipeline
- Document preservation strategy for reusable components

#### **Phase 2: Architecture (Weeks 3-4)**
- Analyze existing system architecture for QMS integration points
- Design document processing engine and compliance validation system
- Plan component preservation and enhancement approach

#### **Phase 3: Core Implementation (Weeks 5-7)**
- Build PDF-to-Markdown document processing engine for VDL2/QMS/Docs
- Implement EN 62304 and AAMI TIR45 compliance validation system
- Create requirement traceability infrastructure

#### **Phase 4: Security & Audit (Weeks 8-10)**
- Implement cryptographic audit trails with digital signature support
- Build role-based access controls for QMS content
- Create evidence collection and audit package generation

#### **Phase 5: User Experience (Weeks 11-13)**
- Enhance CLI with QMS-specific commands and workflows
- Build interactive document analysis and compliance reporting
- Create regulatory compliance dashboard

#### **Phase 6: Validation & Deployment (Weeks 14-16)**
- Comprehensive QMS workflow testing and validation
- Regulatory compliance verification against standards
- Production deployment preparation and documentation

## Development Commands

### Core Development (Preserved from Phoenix-Code-Lite)

```bash
# Build TypeScript to JavaScript
npm run build

# Run development version with ts-node  
npm run dev

# Execute Jest test suite with coverage
npm test

# ESLint validation with TypeScript rules
npm run lint

# Start CLI application
npm start
```

### QMS-Specific Commands (New)

```bash
# Document Processing
npm run dev process-document --input "VDL2/QMS/Docs/SSI-SOP-20.pdf" --output "processed/"
npm run dev batch-process --source "VDL2/QMS/Docs/" --output "structured/"

# Compliance Analysis
npm run dev validate-compliance --standard EN62304 --safety-class B
npm run dev analyze-requirements --standards "EN62304,AAMI-TIR45"
npm run dev generate-traceability --output "traceability-matrix.xlsx"

# Audit and Reporting
npm run dev generate-audit-package --output "audit-evidence/"
npm run dev compliance-report --format pdf --standards "EN62304"
npm run dev gap-analysis --project-path "." --standard EN62304
```

### Development Testing

```bash
# QMS workflow testing
npm run test -- --testNamePattern="QMS"
npm run test:qms-integration
npm run test:document-processing
npm run test:compliance-validation

# Performance testing for document processing
npm run test:performance -- --testNamePattern="Document Processing"
```

## Project Structure

### Current Structure (Preserved)
``` text
phoenix-code-lite/
├── src/
│   ├── cli/           # CLI interface (enhanced for QMS)
│   ├── core/          # Core foundation (preserved)
│   ├── config/        # Configuration management (enhanced)
│   ├── types/         # Type definitions (enhanced with QMS schemas)
│   └── utils/         # Utility functions (preserved + QMS utilities)
```

### New QMS Components
``` text
src/
├── qms/
│   ├── document-processor/     # PDF-to-Markdown conversion engine
│   ├── compliance-validator/   # EN 62304, AAMI TIR45 validation
│   ├── traceability/          # Requirement traceability matrix
│   ├── audit-logger/          # Cryptographic audit trails
│   └── standards/             # Regulatory standards integration
├── preparation/               # QMS preparation utilities
└── types/
    ├── qms-types.ts          # QMS-specific type definitions
    ├── regulatory-standards.ts # Standards compliance schemas
    └── document-processing.ts  # Document processing interfaces
```

### VDL2 Content Structure
``` text
VDL2/
├── QMS/
│   ├── Docs/
│   │   ├── SSI-SOP-10*/      # Design and Development Control documents
│   │   ├── SSI-SOP-20*/      # Software Development documents
│   │   ├── EN 62304*/        # Medical device software standard
│   │   └── AAMI*/            # AGILE practices guidance
│   └── processed/            # Generated structured documents
```

## QMS Development Methodology

### Document-Driven Development

QMS development follows a document-centric approach:

1. **Document Analysis**: Process VDL2/QMS/Docs content to extract requirements
2. **Standards Mapping**: Map documents to EN 62304, AAMI TIR45, ISO standards
3. **Workflow Integration**: Embed compliance into development processes
4. **Evidence Collection**: Automated audit trail and evidence generation

### Regulatory Compliance Integration

```typescript
// Example QMS workflow structure
interface QMSWorkflowPhases {
  documentProcessing: {
    input: PDFDocument,
    process: "PDF-to-Markdown conversion with structure preservation",
    output: StructuredDocument
  },
  complianceValidation: {
    input: StructuredDocument,
    process: "EN 62304 and AAMI TIR45 requirement validation",
    output: ComplianceReport
  },
  traceabilityGeneration: {
    input: [Requirements, Implementation, Tests],
    process: "Automated traceability matrix generation",
    output: TraceabilityMatrix
  }
}
```

## Security and Audit Framework

### QMS Security Requirements

- **Document Security**: Secure handling of regulatory documents and sensitive QMS content
- **Audit Trail**: Cryptographic audit trails with digital signature support for all QMS operations
- **Access Control**: Role-based access for QMS documents and compliance data
- **Evidence Integrity**: Tamper-proof evidence collection and audit package generation

### Compliance Data Protection

- **Regulatory Documents**: Encrypted storage for sensitive compliance documentation
- **Audit Logging**: Complete logging of all QMS-related operations with cryptographic verification
- **Role-Based Access**: Developer, Quality Engineer, Regulatory Affairs, Administrator roles
- **Data Retention**: GDPR/HIPAA compliant handling of patient data and regulatory information

## Integration with Existing Phoenix-Code-Lite

### Preserved Components

- **Core Foundation**: All core Phoenix-Code-Lite infrastructure preserved
- **Claude Code SDK**: Existing Claude Code integration maintained
- **TypeScript Environment**: Build system, testing, and development tools preserved
- **Configuration System**: Enhanced with QMS-specific settings and templates

### Enhanced Components

- **CLI Interface**: Enhanced with QMS commands while preserving existing functionality
- **Configuration Management**: Extended with regulatory standards and QMS templates
- **Type System**: Enhanced with QMS-specific schemas and regulatory data validation
- **Testing Framework**: Extended with QMS workflow and compliance testing

## QMS Standards Integration

### Supported Standards

- **EN 62304:2006+A1:2015**: Medical Device Software lifecycle processes
- **AAMI TIR45:2023**: AGILE practices in medical device software development
- **ISO 13485:2016**: Quality Management Systems for medical devices
- **ISO 14971:2019**: Risk Management for medical devices

### Compliance Templates

```typescript
// QMS Configuration Schema
interface QMSConfiguration {
  regulatory: {
    primaryStandards: ['EN62304', 'AAMI-TIR45', 'ISO13485'];
    safetyClassification: 'A' | 'B' | 'C';
    complianceLevel: 'basic' | 'comprehensive';
  };
  documents: {
    sourceDirectory: 'VDL2/QMS/Docs';
    outputDirectory: 'processed-qms';
    processingOptions: DocumentProcessingOptions;
  };
  audit: {
    enableCryptographicTrail: true;
    digitalSignatureRequired: boolean;
    retentionPeriod: string;
  };
}
```

## Development Guidelines

### Working with QMS Infrastructure

When implementing QMS features:

1. **Preserve Phoenix-Code-Lite**: Maintain all existing functionality while adding QMS capabilities
2. **Standards Compliance**: Ensure all QMS features align with EN 62304 and AAMI TIR45 requirements
3. **Document Processing**: Use secure, validated PDF processing with structure preservation
4. **Audit Trail**: All QMS operations must generate cryptographic audit entries
5. **Type Safety**: All regulatory data must be validated with Zod schemas
6. **Evidence Collection**: Automatic collection of development artifacts for compliance evidence

### Current Development Priority

**Primary Focus**: QMS Infrastructure development according to 16-week roadmap
**Secondary**: Maintain Phoenix-Code-Lite compatibility and existing functionality
**Target**: Complete medical device software QMS infrastructure ready for regulatory compliance

This repository represents the transformation of Phoenix-Code-Lite into a specialized QMS infrastructure while preserving the sophisticated TypeScript foundation and Claude Code integration. Focus on regulatory compliance, document processing, audit trails, and systematic approach to medical device software development standards.