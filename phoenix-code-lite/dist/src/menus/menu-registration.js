"use strict";
/**---
 * title: [Menu Registration - Unified Architecture]
 * tags: [Unified, Menus, Registration]
 * provides: [Menu Registration]
 * requires: [core-menus]
 * description: [Registers core menus into the unified menu registry for integrated CLI.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCoreMenus = registerCoreMenus;
exports.getCoreMenuIds = getCoreMenuIds;
exports.validateCoreMenus = validateCoreMenus;
const core_menus_1 = require("./core-menus");
/**
 * Register all core menu definitions
 */
function registerCoreMenus(menuRegistry) {
    try {
        // Register all core menus with validation
        menuRegistry.registerMenuSafe(core_menus_1.MainMenuDefinition);
        menuRegistry.registerMenuSafe(core_menus_1.ConfigMenuDefinition);
        menuRegistry.registerMenuSafe(core_menus_1.TemplatesMenuDefinition);
        menuRegistry.registerMenuSafe(core_menus_1.GenerateMenuDefinition);
        menuRegistry.registerMenuSafe(core_menus_1.AdvancedMenuDefinition);
        menuRegistry.registerMenuSafe(core_menus_1.SettingsMenuDefinition);
        console.log('✓ All core menus registered successfully');
    }
    catch (error) {
        console.error('✗ Failed to register core menus:', error);
        throw error;
    }
}
/**
 * Get list of all core menu IDs
 */
function getCoreMenuIds() {
    return [
        'main',
        'config',
        'templates',
        'generate',
        'advanced',
        'settings'
    ];
}
/**
 * Validate all core menu definitions
 */
function validateCoreMenus() {
    const menus = [
        core_menus_1.MainMenuDefinition,
        core_menus_1.ConfigMenuDefinition,
        core_menus_1.TemplatesMenuDefinition,
        core_menus_1.GenerateMenuDefinition,
        core_menus_1.AdvancedMenuDefinition,
        core_menus_1.SettingsMenuDefinition
    ];
    try {
        for (const menu of menus) {
            validateMenuStructure(menu);
        }
        return true;
    }
    catch (error) {
        console.error('✗ Menu validation failed:', error);
        return false;
    }
}
/**
 * Basic menu structure validation
 */
function validateMenuStructure(menu) {
    if (!menu.id) {
        throw new Error('Menu must have an id');
    }
    if (!menu.title) {
        throw new Error(`Menu ${menu.id} must have a title`);
    }
    if (!Array.isArray(menu.sections)) {
        throw new Error(`Menu ${menu.id} must have sections array`);
    }
    for (const section of menu.sections) {
        if (!section.id) {
            throw new Error(`Section in menu ${menu.id} must have an id`);
        }
        if (!Array.isArray(section.items)) {
            throw new Error(`Section ${section.id} must have items array`);
        }
        for (const item of section.items) {
            if (!item.id) {
                throw new Error(`Item in section ${section.id} must have an id`);
            }
            if (!item.action || !item.action.type) {
                throw new Error(`Item ${item.id} must have a valid action`);
            }
        }
    }
}
//# sourceMappingURL=menu-registration.js.map