---
tags: []
provides: []
requires: []
---
# Templates Directory

This directory contains template files for reference. These templates are available to the AI for creating new files but are not loaded as Cursor rules themselves.

## Available Templates

### Documentation Templates

- `markdown-document-template.md` - Standard document structure with frontmatter
- `readme-template.md` - README file template for directories  
- `workflow-template.md` - Process workflow documentation template

### Code Templates

- `python-module-template.py` - Python module with frontmatter and structure
- `typescript-component-template.tsx` - TypeScript React component template
- `configuration-template.yml` - YAML configuration file template

### Meta Templates

- `assistant-guideline-template.md` - Template for assistant guidelines
- `task-breakdown-template.md` - Task decomposition document template

## Usage

When creating new files, the AI should:

1. Check this templates/ directory first
2. Select appropriate template for the file type
3. Customize template content for specific use case
4. Follow template frontmatter patterns
5. Maintain template structure and conventions

## Template Standards

All templates include:

- Proper DSS frontmatter with tags, provides, requires
- Clear structure and sections
- Example content and placeholders
- Comments explaining customization points
- Cross-reference patterns using mdc: links
