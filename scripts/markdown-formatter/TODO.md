# Markdown Formatter TODO

## Planned Features

### High Priority

- [ ] **Partial Text Formatting**
  - Allow formatting of selected text ranges instead of entire files
  - Support for VS Code text selection integration
  - Command line option: `--range start_line:end_line`
  - Preserve context around selected text
  - Useful for formatting specific sections during editing

### Medium Priority

- [ ] **Interactive Mode**
  - Show preview of changes before applying
  - Allow selective rule application
  - Interactive configuration editing

- [ ] **Performance Optimizations**
  - Parallel processing for multiple files
  - Incremental formatting (only process changed sections)
  - Caching of rule results

### Low Priority

- [ ] **Additional Rule Types**
  - Image optimization and validation
  - Footnote formatting
  - Citation formatting
  - Math expression formatting

- [ ] **Integration Features**
  - Git pre-commit hook integration
  - VS Code extension
  - CI/CD pipeline integration

## Implementation Notes

### Partial Text Formatting Requirements

- Parse line ranges from command line arguments
- Extract selected text with context
- Apply formatting rules to selection only
- Preserve surrounding content structure
- Handle edge cases (partial headers, lists, tables)
- Support both line-based and character-based selection
- Integration with VS Code's text selection API

### Technical Considerations

- Text range parsing and validation
- Context preservation around selections
- Rule adaptation for partial content
- Error handling for invalid ranges
- Performance optimization for large selections
