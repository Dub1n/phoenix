"use strict";
/**---
 * title: [Core Menus - Unified Architecture]
 * tags: [Unified, Menus]
 * provides: [Core Menu Definitions]
 * requires: []
 * description: [Core menu definitions used by the unified CLI system.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsMenuDefinition = exports.AdvancedMenuDefinition = exports.GenerateMenuDefinition = exports.TemplatesMenuDefinition = exports.ConfigMenuDefinition = exports.MainMenuDefinition = void 0;
exports.MainMenuDefinition = {
    id: 'main',
    title: '* Phoenix Code Lite • TDD Workflow Orchestrator',
    description: 'Transform natural language into production-ready code through TDD',
    sections: [{
            id: 'navigation',
            heading: 'Main Navigation',
            theme: { headingColor: 'red', bold: true },
            items: [
                {
                    id: 'config',
                    label: 'Configuration',
                    description: 'Manage project settings and preferences',
                    action: { type: 'navigate', target: 'config' },
                    shortcuts: ['1', 'config', 'configuration']
                },
                {
                    id: 'templates',
                    label: 'Templates',
                    description: 'Starter, Enterprise, Performance configurations',
                    action: { type: 'navigate', target: 'templates' },
                    shortcuts: ['2', 'templates', 'template']
                },
                {
                    id: 'generate',
                    label: 'Generate',
                    description: 'AI-powered TDD code generation',
                    action: { type: 'navigate', target: 'generate' },
                    shortcuts: ['3', 'generate', 'gen'],
                    enabled: (context) => context.sessionContext.projectInitialized !== false
                },
                {
                    id: 'advanced',
                    label: 'Advanced',
                    description: 'Expert settings, metrics, logging',
                    action: { type: 'navigate', target: 'advanced' },
                    shortcuts: ['4', 'advanced', 'adv']
                },
                {
                    id: 'settings',
                    label: 'Settings',
                    description: 'User preferences and interaction modes',
                    action: { type: 'navigate', target: 'settings' },
                    shortcuts: ['5', 'settings', 'set']
                }
            ]
        }],
    metadata: {
        contextLevel: 'main',
        allowBack: false,
        defaultAction: 'config'
    }
};
exports.ConfigMenuDefinition = {
    id: 'config',
    title: '⋇ Configuration Management Hub',
    description: 'Manage Phoenix Code Lite settings and preferences',
    sections: [{
            id: 'settings',
            heading: '◦ Configuration Commands',
            theme: { headingColor: 'yellow', bold: true },
            items: [
                {
                    id: 'show-config',
                    label: 'Show Current Configuration',
                    description: 'Display current configuration with validation status',
                    action: { type: 'execute', handler: 'config:show' },
                    shortcuts: ['1', 'show', 'display']
                },
                {
                    id: 'edit-config',
                    label: 'Edit Configuration',
                    description: 'Interactive configuration editor with guided setup',
                    action: { type: 'execute', handler: 'config:edit' },
                    shortcuts: ['2', 'edit', 'modify']
                },
                {
                    id: 'templates-config',
                    label: 'Configuration Templates',
                    description: 'Browse and apply configuration templates',
                    action: { type: 'execute', handler: 'config:templates' },
                    shortcuts: ['3', 'templates']
                },
                {
                    id: 'framework-config',
                    label: 'Framework Settings',
                    description: 'Framework-specific optimization settings',
                    action: { type: 'execute', handler: 'config:framework' },
                    shortcuts: ['4', 'framework']
                },
                {
                    id: 'quality-config',
                    label: 'Quality Gates',
                    description: 'Quality gates and testing thresholds',
                    action: { type: 'execute', handler: 'config:quality' },
                    shortcuts: ['5', 'quality']
                },
                {
                    id: 'security-config',
                    label: 'Security Policies',
                    description: 'Security policies and guardrails',
                    action: { type: 'execute', handler: 'config:security' },
                    shortcuts: ['6', 'security']
                }
            ]
        }],
    metadata: {
        contextLevel: 'config',
        allowBack: true
    }
};
exports.TemplatesMenuDefinition = {
    id: 'templates',
    title: '□ Template Management Center',
    description: 'Choose from Starter, Enterprise, Performance, or create custom templates',
    sections: [{
            id: 'template-commands',
            heading: '⌺ Template Commands',
            theme: { headingColor: 'yellow', bold: true },
            items: [
                {
                    id: 'list-templates',
                    label: 'List Templates',
                    description: 'Show all available configuration templates',
                    action: { type: 'execute', handler: 'templates:list' },
                    shortcuts: ['1', 'list']
                },
                {
                    id: 'use-template',
                    label: 'Use Template',
                    description: 'Apply template to current project',
                    action: { type: 'execute', handler: 'templates:use' },
                    shortcuts: ['2', 'use']
                },
                {
                    id: 'preview-template',
                    label: 'Preview Template',
                    description: 'Preview template settings before applying',
                    action: { type: 'execute', handler: 'templates:preview' },
                    shortcuts: ['3', 'preview']
                },
                {
                    id: 'create-template',
                    label: 'Create Template',
                    description: 'Build custom template from current configuration',
                    action: { type: 'execute', handler: 'templates:create' },
                    shortcuts: ['4', 'create']
                },
                {
                    id: 'edit-template',
                    label: 'Edit Template',
                    description: 'Modify existing template settings',
                    action: { type: 'execute', handler: 'templates:edit' },
                    shortcuts: ['5', 'edit']
                },
                {
                    id: 'reset-template',
                    label: 'Reset Template',
                    description: 'Restore template to original defaults',
                    action: { type: 'execute', handler: 'templates:reset' },
                    shortcuts: ['6', 'reset']
                }
            ]
        }],
    metadata: {
        contextLevel: 'templates',
        allowBack: true
    }
};
exports.GenerateMenuDefinition = {
    id: 'generate',
    title: '⚡ AI-Powered Code Generation',
    description: 'Transform natural language into tested, production-ready code',
    sections: [{
            id: 'generation-commands',
            heading: '🤖 Generation Commands',
            theme: { headingColor: 'magenta', bold: true },
            items: [
                {
                    id: 'task-generation',
                    label: 'General Task',
                    description: 'Generate code from any task description',
                    action: { type: 'execute', handler: 'generate:task' },
                    shortcuts: ['1', 'task']
                },
                {
                    id: 'component-generation',
                    label: 'UI Component',
                    description: 'Generate UI/React components with tests and styling',
                    action: { type: 'execute', handler: 'generate:component' },
                    shortcuts: ['2', 'component']
                },
                {
                    id: 'api-generation',
                    label: 'API Endpoint',
                    description: 'Generate REST API endpoints with validation and docs',
                    action: { type: 'execute', handler: 'generate:api' },
                    shortcuts: ['3', 'api']
                },
                {
                    id: 'test-generation',
                    label: 'Test Suite',
                    description: 'Generate comprehensive test suites for existing code',
                    action: { type: 'execute', handler: 'generate:test' },
                    shortcuts: ['4', 'test']
                }
            ]
        }],
    metadata: {
        contextLevel: 'generate',
        allowBack: true
    }
};
exports.AdvancedMenuDefinition = {
    id: 'advanced',
    title: '◦ Advanced Configuration Center',
    description: 'Expert settings, debugging tools, and performance monitoring',
    sections: [{
            id: 'advanced-settings',
            heading: '⌘ Advanced Commands',
            theme: { headingColor: 'cyan', bold: true },
            items: [
                {
                    id: 'language-settings',
                    label: 'Language Preferences',
                    description: 'Programming language preferences and optimization',
                    action: { type: 'execute', handler: 'advanced:language' },
                    shortcuts: ['1', 'language']
                },
                {
                    id: 'agents-settings',
                    label: 'AI Agent Configuration',
                    description: 'AI agent configuration and specialization settings',
                    action: { type: 'execute', handler: 'advanced:agents' },
                    shortcuts: ['2', 'agents']
                },
                {
                    id: 'logging-settings',
                    label: 'Audit Logging',
                    description: 'Comprehensive audit logging and session tracking',
                    action: { type: 'execute', handler: 'advanced:logging' },
                    shortcuts: ['3', 'logging']
                },
                {
                    id: 'metrics-settings',
                    label: 'Performance Metrics',
                    description: 'Performance metrics, success rates, and analytics',
                    action: { type: 'execute', handler: 'advanced:metrics' },
                    shortcuts: ['4', 'metrics']
                },
                {
                    id: 'debug-settings',
                    label: 'Debug Mode',
                    description: 'Debug mode, verbose output, and troubleshooting',
                    action: { type: 'execute', handler: 'advanced:debug' },
                    shortcuts: ['5', 'debug']
                }
            ]
        }],
    metadata: {
        contextLevel: 'advanced',
        allowBack: true
    }
};
exports.SettingsMenuDefinition = {
    id: 'settings',
    title: '⌘ User Settings & Preferences',
    description: 'Manage interaction modes, user preferences, and application settings',
    sections: [{
            id: 'user-settings',
            heading: '🎛️ Settings Commands',
            theme: { headingColor: 'blue', bold: true },
            items: [
                {
                    id: 'show-settings',
                    label: 'Show Current Settings',
                    description: 'Display all current user settings and preferences',
                    action: { type: 'execute', handler: 'settings:show' },
                    shortcuts: ['1', 'show', 'display']
                },
                {
                    id: 'change-mode',
                    label: 'Change Interaction Mode',
                    description: 'Switch between Debug, Interactive, and Command modes',
                    action: { type: 'execute', handler: 'settings:mode' },
                    shortcuts: ['2', 'mode', 'switch']
                },
                {
                    id: 'user-preferences',
                    label: 'User Preferences',
                    description: 'Configure welcome messages, color schemes, and timeouts',
                    action: { type: 'execute', handler: 'settings:preferences' },
                    shortcuts: ['3', 'preferences', 'prefs']
                },
                {
                    id: 'reset-settings',
                    label: 'Reset to Defaults',
                    description: 'Reset all settings to default values',
                    action: { type: 'execute', handler: 'settings:reset' },
                    shortcuts: ['4', 'reset', 'defaults']
                }
            ]
        }],
    metadata: {
        contextLevel: 'settings',
        allowBack: true
    }
};
//# sourceMappingURL=core-menus.js.map