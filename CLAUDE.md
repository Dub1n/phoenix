# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Documentation Index & Navigation

**Essential References for Development**:

- **[Phoenix Code Lite Codebase Index](phoenix-code-lite/docs/index/CODEBASE-INDEX.md)** - Complete file-by-file documentation of the Phoenix Code Lite system
- **[Phoenix Code Lite Architecture](phoenix-code-lite/docs/index/ARCHITECTURE-DIAGRAM.md)** - Visual system architecture with Mermaid diagrams
- **[Phoenix Code Lite API Reference](phoenix-code-lite/docs/index/API-REFERENCE.md)** - TypeScript interfaces, method signatures, and usage examples

**⚡ Quick Development Workflow**:

1. **Before making changes**: Always reference the Codebase Index to understand file relationships and dependencies
2. **For architecture decisions**: Consult the Architecture Diagram to understand system flow and component interactions  
3. **For navigation**: Use the Structure Map for rapid file location and context understanding

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
│  Document Processing Engine │ Compliance Validation System     │
├────────────────────────────────────────────────────────────────┤
│  Requirement Traceability Matrix & Audit Trail                 │
├────────────────────────────────────────────────────────────────┤
│  Preserved Phoenix-Code-Lite Core & Claude Code Integration    │
├────────────────────────────────────────────────────────────────┤
│  TypeScript Environment & Foundation                           │
└────────────────────────────────────────────────────────────────┘
```

## 🔍 Key Guidelines for Claude Code

### Documentation Management Guideline

- **Always use the phoenix-code-lite\docs\index\ARCHITECTURE-DIAGRAM.md and phoenix-code-lite\docs\index\CODEBASE-INDEX.md index files for context and update them when any non-trivial changes are made**
- **Store markdown files/explanations in the phoenix-code-lite\docs folder, not the phoenix-code-lite\src folder**

### File Creation Guidelines

- **ALWAYS include an info stub at the top of EVERY new file, including the `Get-Date -Format "yyyy-MM-dd-HHmmss"` output**
