"use strict";
/**
 * Skin Menu Renderer - PCL-Skins Architecture Integration
 *
 * Provides the UI Abstraction Layer for the PCL-Skins plugin architecture.
 * Integrates with the unified layout engine to render JSON-driven menu definitions
 * with theme support, consistent positioning, and extensible skin loading.
 *
 * This class represents the future architecture where menus are defined in JSON
 * skin files and rendered through a unified, theme-aware system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageExamples = exports.skinMenuRenderer = exports.SkinMenuRenderer = void 0;
exports.quickRenderSkinMenu = quickRenderSkinMenu;
exports.renderLegacyWithUnified = renderLegacyWithUnified;
const unified_layout_engine_1 = require("./unified-layout-engine");
const menu_content_converter_1 = require("./menu-content-converter");
/**
 * Main SkinMenuRenderer class - Core of PCL-Skins UI Abstraction Layer
 */
class SkinMenuRenderer {
    constructor(options) {
        this.renderingMetrics = new Map();
        this.skinLoader = options?.skinLoader;
        this.defaultLayoutConstraints = {
            minHeight: 25, // Changed to minHeight to prevent content truncation
            minWidth: 30,
            maxWidth: 30,
            textboxLines: 3,
            paddingLines: 2,
            enforceConsistentHeight: true,
            ...options?.defaultConstraints
        };
    }
    /**
     * Primary rendering method for PCL-Skins architecture
     * Loads menu definition from skin JSON and renders with unified layout engine
     */
    renderMenu(skinId, menuId, context) {
        const startTime = performance.now();
        try {
            // Build complete context
            const fullContext = {
                skinId,
                level: menuId,
                ...context
            };
            // Load menu definition from skin (fallback to example if no loader)
            const skinMenuDefinition = this.loadMenuDefinition(skinId, menuId);
            if (!skinMenuDefinition) {
                throw new Error(`Menu definition not found: ${skinId}:${menuId}`);
            }
            // Get layout constraints from skin preferences
            const layoutConstraints = this.getLayoutConstraints(skinId);
            // Use unified layout engine
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinMenuDefinition, layoutConstraints);
            // Render with unified system
            (0, unified_layout_engine_1.renderMenuWithLayout)(skinMenuDefinition, layout, fullContext);
            const renderTime = performance.now() - startTime;
            this.recordMetrics(skinId, menuId, renderTime);
            return {
                layout,
                skinDefinition: skinMenuDefinition,
                context: fullContext,
                renderTime,
                success: true
            };
        }
        catch (error) {
            const renderTime = performance.now() - startTime;
            return {
                layout: {},
                skinDefinition: {},
                context: { skinId, level: menuId },
                renderTime,
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown render error']
            };
        }
    }
    /**
     * Render legacy MenuContent using unified layout engine
     * Bridge method for gradual migration from current system
     */
    renderLegacyMenu(content, context, skinId = 'legacy') {
        const startTime = performance.now();
        try {
            // Convert legacy format to SkinMenuDefinition
            const skinDefinition = (0, menu_content_converter_1.convertMenuContentToSkinDefinition)(content, context);
            // Validate conversion
            const validation = (0, menu_content_converter_1.validateConversion)(content, skinDefinition);
            if (!validation.isValid) {
                console.warn('Menu conversion issues:', validation.issues);
            }
            // Get layout constraints
            const layoutConstraints = this.defaultLayoutConstraints;
            // Render with unified system
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, layoutConstraints);
            (0, unified_layout_engine_1.renderMenuWithLayout)(skinDefinition, layout, {
                skinId,
                level: context.level
            });
            const renderTime = performance.now() - startTime;
            this.recordMetrics(skinId, context.level, renderTime);
            return {
                layout,
                skinDefinition,
                context: { skinId, level: context.level },
                renderTime,
                success: true
            };
        }
        catch (error) {
            const renderTime = performance.now() - startTime;
            return {
                layout: {},
                skinDefinition: {},
                context: { skinId, level: context.level },
                renderTime,
                success: false,
                errors: [error instanceof Error ? error.message : 'Legacy render error']
            };
        }
    }
    /**
     * Batch render multiple menus (useful for testing and validation)
     */
    renderMultipleMenus(requests) {
        return requests.map(request => this.renderMenu(request.skinId, request.menuId, request.context));
    }
    /**
     * Preview mode - calculate layout without rendering
     * Useful for testing and validation
     */
    previewLayout(skinId, menuId, constraints) {
        const skinDefinition = this.loadMenuDefinition(skinId, menuId);
        if (!skinDefinition)
            return null;
        const layoutConstraints = {
            ...this.getLayoutConstraints(skinId),
            ...constraints
        };
        return (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, layoutConstraints);
    }
    /**
     * Get rendering performance metrics
     */
    getMetrics() {
        return Object.fromEntries(this.renderingMetrics);
    }
    /**
     * Clear performance metrics
     */
    clearMetrics() {
        this.renderingMetrics.clear();
    }
    /**
     * Update default layout constraints
     */
    updateDefaultConstraints(constraints) {
        Object.assign(this.defaultLayoutConstraints, constraints);
    }
    /**
     * Register a skin loader for JSON skin definitions
     */
    setSkinLoader(loader) {
        this.skinLoader = loader;
    }
    // Private helper methods
    loadMenuDefinition(skinId, menuId) {
        // Use skin loader if available
        if (this.skinLoader) {
            return this.skinLoader.getSkinMenuDefinition(skinId, menuId);
        }
        // Fallback to built-in example definitions
        return this.getBuiltInMenuDefinition(skinId, menuId);
    }
    getLayoutConstraints(skinId) {
        if (this.skinLoader) {
            const skinPreferences = this.skinLoader.getLayoutPreferences(skinId);
            return { ...this.defaultLayoutConstraints, ...skinPreferences };
        }
        return this.defaultLayoutConstraints;
    }
    recordMetrics(skinId, menuId, renderTime) {
        const key = `${skinId}:${menuId}`;
        this.renderingMetrics.set(key, renderTime);
    }
    getBuiltInMenuDefinition(skinId, menuId) {
        // Built-in example definitions for testing and demonstration
        const definitions = {
            'qms-medical-device': {
                main: {
                    title: '🏥 QMS Medical Device Compliance',
                    subtitle: 'EN 62304 & AAMI TIR45 compliant workflows',
                    items: [
                        {
                            id: 'doc-processing',
                            label: 'Document Processing',
                            description: 'Convert regulatory PDFs to structured format',
                            type: 'submenu',
                            command: 'qms:process-document'
                        },
                        {
                            id: 'compliance-check',
                            label: 'Compliance Validation',
                            description: 'Validate against regulatory standards',
                            type: 'command',
                            command: 'qms:validate-compliance'
                        },
                        {
                            id: 'traceability',
                            label: 'Traceability Matrix',
                            description: 'Generate requirement traceability documentation',
                            type: 'command',
                            command: 'qms:generate-traceability'
                        },
                        {
                            id: 'audit-trail',
                            label: 'Audit Trail',
                            description: 'Review compliance audit logs and evidence',
                            type: 'submenu',
                            command: 'qms:audit-trail'
                        }
                    ],
                    theme: {
                        primaryColor: 'blue',
                        accentColor: 'cyan',
                        separatorChar: '═',
                        useIcons: true
                    }
                }
            },
            'phoenix-code-lite': {
                main: {
                    title: '🔥 Phoenix Code Lite',
                    subtitle: 'Advanced development workflow automation',
                    items: [
                        {
                            id: 'config',
                            label: 'Configuration',
                            description: 'Manage settings and preferences',
                            type: 'submenu',
                            command: 'config'
                        },
                        {
                            id: 'templates',
                            label: 'Templates',
                            description: 'Browse and apply project templates',
                            type: 'submenu',
                            command: 'templates'
                        },
                        {
                            id: 'workflow',
                            label: 'Workflow',
                            description: 'TDD workflow automation',
                            type: 'submenu',
                            command: 'workflow'
                        },
                        {
                            id: 'help',
                            label: 'Help',
                            description: 'Documentation and command reference',
                            type: 'command',
                            command: 'help'
                        }
                    ],
                    theme: {
                        primaryColor: 'red',
                        accentColor: 'cyan',
                        separatorChar: '═',
                        useIcons: true
                    }
                }
            }
        };
        return definitions[skinId]?.[menuId] || null;
    }
}
exports.SkinMenuRenderer = SkinMenuRenderer;
/**
 * Convenience functions and exports
 */
// Default renderer instance 
exports.skinMenuRenderer = new SkinMenuRenderer();
/**
 * Quick render function for immediate use
 * Single function that replaces menuComposer.compose()
 */
function quickRenderSkinMenu(skinId, menuId, context) {
    const result = exports.skinMenuRenderer.renderMenu(skinId, menuId, context);
    return result.success;
}
/**
 * Migration helper - render legacy menu with unified engine
 */
function renderLegacyWithUnified(content, context) {
    const result = exports.skinMenuRenderer.renderLegacyMenu(content, context);
    return result.success;
}
/**
 * Example usage patterns for PCL-Skins integration
 */
exports.usageExamples = {
    // Direct skin menu rendering
    renderQMSMenu: () => {
        return quickRenderSkinMenu('qms-medical-device', 'main', {
            level: 'main',
            breadcrumb: ['QMS Hub']
        });
    },
    // Legacy menu migration
    migrateLegacyMenu: (content, context) => {
        return renderLegacyWithUnified(content, context);
    },
    // Performance testing
    performanceTest: () => {
        const startTime = performance.now();
        // Render multiple menus
        exports.skinMenuRenderer.renderMultipleMenus([
            { skinId: 'phoenix-code-lite', menuId: 'main' },
            { skinId: 'qms-medical-device', menuId: 'main' }
        ]);
        const totalTime = performance.now() - startTime;
        const metrics = exports.skinMenuRenderer.getMetrics();
        return { totalTime, individualMetrics: metrics };
    }
};
//# sourceMappingURL=skin-menu-renderer.js.map