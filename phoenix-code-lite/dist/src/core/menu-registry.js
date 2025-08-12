"use strict";
/**
 * Menu Registry Implementation
 * Created: 2025-01-06-175700
 *
 * Centralized registry for menu definitions with skin support.
 * Manages menu inheritance, skin priority, and fallback mechanisms.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuRegistry = void 0;
class MenuRegistry {
    constructor() {
        this.menus = new Map();
        this.skins = new Map();
        this.activeSkinsIds = [];
    }
    /**
     * Register a core menu definition
     */
    registerMenu(menu) {
        if (!menu.id) {
            throw new Error('Menu definition must have an id');
        }
        this.menus.set(menu.id, menu);
    }
    /**
     * Get menu definition with skin inheritance support
     */
    getMenu(menuId) {
        // Check active skins in priority order (last loaded = highest priority)
        for (let i = this.activeSkinsIds.length - 1; i >= 0; i--) {
            const skinId = this.activeSkinsIds[i];
            const skin = this.skins.get(skinId);
            const menu = skin?.menus[menuId];
            if (menu) {
                return this.resolveMenuInheritance(menu, skin);
            }
        }
        // Fallback to core menus
        const coreMenu = this.menus.get(menuId);
        if (!coreMenu) {
            throw new Error(`Menu not found: ${menuId}`);
        }
        return coreMenu;
    }
    /**
     * Load and activate a skin
     */
    loadSkin(skin) {
        if (!skin.metadata?.name) {
            throw new Error('Skin must have metadata with name');
        }
        this.skins.set(skin.metadata.name, skin);
        // Add to active skins if not already present
        if (!this.activeSkinsIds.includes(skin.metadata.name)) {
            this.activeSkinsIds.push(skin.metadata.name);
        }
    }
    /**
     * Unload a skin
     */
    unloadSkin(skinName) {
        const removed = this.skins.delete(skinName);
        this.activeSkinsIds = this.activeSkinsIds.filter(id => id !== skinName);
        return removed;
    }
    /**
     * Get all available menu IDs
     */
    getAvailableMenuIds() {
        const menuIds = new Set();
        // Add core menu IDs
        for (const menuId of this.menus.keys()) {
            menuIds.add(menuId);
        }
        // Add skin menu IDs
        for (const skinId of this.activeSkinsIds) {
            const skin = this.skins.get(skinId);
            if (skin?.menus) {
                for (const menuId of Object.keys(skin.menus)) {
                    menuIds.add(menuId);
                }
            }
        }
        return Array.from(menuIds);
    }
    /**
     * Get active skins information
     */
    getActiveSkins() {
        return this.activeSkinsIds.map(skinId => {
            const skin = this.skins.get(skinId);
            return skin ? {
                name: skin.metadata.name,
                displayName: skin.metadata.displayName,
                version: skin.metadata.version
            } : { name: skinId, displayName: skinId };
        });
    }
    /**
     * Set skin priority order
     */
    setSkinPriority(skinIds) {
        // Validate all skins exist
        const invalidSkins = skinIds.filter(id => !this.skins.has(id));
        if (invalidSkins.length > 0) {
            throw new Error(`Invalid skin IDs: ${invalidSkins.join(', ')}`);
        }
        this.activeSkinsIds = [...skinIds];
    }
    /**
     * Clear all registrations (for testing)
     */
    clear() {
        this.menus.clear();
        this.skins.clear();
        this.activeSkinsIds = [];
    }
    /**
     * Resolve menu inheritance from base menus and skin overrides
     */
    resolveMenuInheritance(menu, skin) {
        // For now, return the menu as-is
        // Future enhancement: implement inheritance resolution
        // - Merge sections from base menu
        // - Override specific items
        // - Apply skin-specific themes
        return {
            ...menu,
            metadata: {
                contextLevel: menu.metadata?.contextLevel || menu.id,
                allowBack: menu.metadata?.allowBack !== undefined ? menu.metadata.allowBack : true,
                ...menu.metadata,
                // Mark as skin-provided
                skinName: skin.metadata.name
            }
        };
    }
    /**
     * Validate menu definition structure
     */
    validateMenuDefinition(menu) {
        if (!menu.id) {
            throw new Error('Menu definition must have an id');
        }
        if (!menu.title) {
            throw new Error('Menu definition must have a title');
        }
        if (!Array.isArray(menu.sections)) {
            throw new Error('Menu definition must have sections array');
        }
        // Validate sections
        for (const section of menu.sections) {
            if (!section.id) {
                throw new Error(`Section in menu ${menu.id} must have an id`);
            }
            if (!section.heading) {
                throw new Error(`Section ${section.id} in menu ${menu.id} must have a heading`);
            }
            if (!Array.isArray(section.items)) {
                throw new Error(`Section ${section.id} in menu ${menu.id} must have items array`);
            }
            // Validate items
            for (const item of section.items) {
                if (!item.id) {
                    throw new Error(`Item in section ${section.id} must have an id`);
                }
                if (!item.label) {
                    throw new Error(`Item ${item.id} must have a label`);
                }
                if (!item.action || !item.action.type) {
                    throw new Error(`Item ${item.id} must have a valid action`);
                }
            }
        }
    }
    /**
     * Register menu with validation
     */
    registerMenuSafe(menu) {
        this.validateMenuDefinition(menu);
        this.registerMenu(menu);
    }
}
exports.MenuRegistry = MenuRegistry;
//# sourceMappingURL=menu-registry.js.map