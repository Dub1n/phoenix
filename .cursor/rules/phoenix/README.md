# Phoenix Code Lite - Claude Code Maintenance Reference

## 📚 Overview

This directory contains comprehensive maintenance documentation for Claude Code agents working on the Phoenix Code Lite repository. These documents ensure consistent, high-quality development practices while maintaining system integrity and user experience.

## ⊕ Purpose

This reference system enables Claude Code agents to:

- ✓ **Maintain Code Quality**: Follow TDD practices and quality standards
- ✓ **Preserve System Integrity**: Understand context and user workflows
- ✓ **Document Changes**: Create comprehensive change logs automatically
- ✓ **Follow Standards**: Apply industry best practices consistently
- ✓ **Understand Context**: Consider user experience and workflow impact

## ▫ Document Structure

### Core References

- **[TDD-STANDARDS.md](./TDD-STANDARDS.md)** - Test-Driven Development methodology and practices
- **[DEVELOPMENT-WORKFLOW.md](./DEVELOPMENT-WORKFLOW.md)** - Step-by-step development process
- **[CONTEXT-AWARENESS.md](./CONTEXT-AWARENESS.md)** - Understanding user context and workflow impact
- **[CHANGE-DOCUMENTATION.md](./CHANGE-DOCUMENTATION.md)** - Documentation standards for all changes
- **[QUALITY-GATES.md](./QUALITY-GATES.md)** - Quality validation framework and criteria

### Implementation Guides

- **[CODE-STANDARDS.md](./CODE-STANDARDS.md)** - TypeScript coding standards and conventions
- **[TESTING-FRAMEWORK.md](./TESTING-FRAMEWORK.md)** - Testing patterns and utilities
- **[SECURITY-GUIDELINES.md](./SECURITY-GUIDELINES.md)** - Security best practices and validation
- **[ERROR-HANDLING.md](./ERROR-HANDLING.md)** - Error handling patterns and recovery strategies

### System References

- **[ARCHITECTURE-CONTEXT.md](./ARCHITECTURE-CONTEXT.md)** - System architecture and component relationships
- **[CLI-UX-PATTERNS.md](./CLI-UX-PATTERNS.md)** - CLI user experience design patterns
- **[CONFIGURATION-SYSTEM.md](./CONFIGURATION-SYSTEM.md)** - Configuration management and templates

## ^ Quick Start for Agents

### Before Making Changes

1. **Read Context**: Review `CONTEXT-AWARENESS.md` for the specific area you're working on
2. **Check Standards**: Reference `TDD-STANDARDS.md` and `CODE-STANDARDS.md`
3. **Plan Approach**: Follow `DEVELOPMENT-WORKFLOW.md` methodology

### During Development

1. **Write Tests First**: Follow TDD methodology from `TDD-STANDARDS.md`
2. **Maintain Quality**: Apply quality gates from `QUALITY-GATES.md`
3. **Consider UX**: Reference `CLI-UX-PATTERNS.md` for user-facing changes

### After Changes

1. **Document Changes**: Create entry in `../Changes/` following `CHANGE-DOCUMENTATION.md`
2. **Validate Quality**: Run all quality gates and tests
3. **Update Documentation**: Update relevant documentation if APIs or behavior changed

## ◊ Quality Standards

### Code Quality Requirements

- **Test Coverage**: >90% for all new code
- **Type Safety**: 100% TypeScript strict mode compliance
- **Code Quality**: ESLint score >95%, Prettier formatting enforced
- **Documentation**: All public APIs documented with examples
- **Security**: All security guardrails validated

### Documentation Requirements

- **Change Documentation**: Every change requires a documented entry
- **API Documentation**: Public interface changes must update API docs
- **User Documentation**: User-facing changes must update user guides
- **Architecture Documentation**: System changes must update architecture docs

## ⇔ Development Philosophy

### Test-Driven Development (TDD)

1. **Red**: Write failing test that describes desired functionality
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while maintaining test coverage

### Context-Aware Development

1. **User-First**: Consider the user's workflow and experience
2. **System-Aware**: Understand how changes affect the overall system
3. **Integration-Conscious**: Ensure changes work with existing components
4. **Future-Proofing**: Design changes to be maintainable and extensible

### Quality-First Approach

1. **Validation-Driven**: Every change must pass quality gates
2. **Security-Conscious**: Apply security best practices consistently
3. **Performance-Aware**: Consider performance impact of all changes
4. **Documentation-Complete**: Maintain comprehensive documentation

## ⊜ Security Considerations

### Security Guardrails

- **File Access**: Validate all file operations against security policies
- **Command Execution**: Ensure all commands are safe and validated
- **Input Validation**: Validate all user inputs with Zod schemas
- **Error Handling**: Never expose sensitive information in errors

### Audit Requirements

- **Change Tracking**: All changes must be logged and auditable
- **Security Events**: Security-related changes require special documentation
- **Access Control**: Maintain principle of least privilege
- **Data Protection**: Protect sensitive user data and configuration

## ⋰ Success Metrics

### Development Efficiency

- **Time to Implementation**: Target <30 minutes for typical changes
- **Test Coverage**: Maintain >90% coverage across all modules
- **Quality Score**: Maintain >95% ESLint score
- **Documentation Currency**: Keep documentation up-to-date with changes

### System Reliability

- **Regression Prevention**: Zero regressions in existing functionality
- **User Experience**: Maintain or improve user experience
- **Performance**: No performance degradation from changes
- **Security**: Zero security vulnerabilities introduced

## ∞ Related Resources

### Phoenix Code Lite Documentation

- **[API Reference](../../phoenix-code-lite/docs/API-REFERENCE.md)** - Complete API documentation
- **[Architecture Guide](../../phoenix-code-lite/docs/PROJECT-INDEX.md)** - System architecture overview
- **[User Guide](../../phoenix-code-lite/docs/user-guide.md)** - User-facing documentation

### Development Resources

- **[Phase Development Guides](../07-Phoenix-Code-Lite-Dev/)** - Structured development phases
- **[Technical Specifications](../04-Technical-Reference/)** - Detailed technical documentation
- **[Implementation Examples](../05-Examples-and-Templates/)** - Code examples and templates

---

**Remember**: Quality is not optional. Every change should improve the system while maintaining its integrity and user experience. When in doubt, refer to these documents and prioritize user value and system reliability.
