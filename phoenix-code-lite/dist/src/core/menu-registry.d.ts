/**---
 * title: [Menu Registry - Core Service Module]
 * tags: [Core, Service, Menu-System, Theming]
 * provides: [MenuRegistry Class, Menu Registration, Skin Loading, Inheritance Resolution, Priority Management]
 * requires: [Menu Types]
 * description: [Central registry for core and skin-provided menus with inheritance and priority resolution used by interactive CLI rendering.]
 * ---*/
import { MenuDefinition, LoadedSkin } from '../types/menu-definitions';
export declare class MenuRegistry {
    private menus;
    private skins;
    private activeSkinsIds;
    /**
     * Register a core menu definition
     */
    registerMenu(menu: MenuDefinition): void;
    /**
     * Get menu definition with skin inheritance support
     */
    getMenu(menuId: string): MenuDefinition;
    /**
     * Load and activate a skin
     */
    loadSkin(skin: LoadedSkin): void;
    /**
     * Unload a skin
     */
    unloadSkin(skinName: string): boolean;
    /**
     * Get all available menu IDs
     */
    getAvailableMenuIds(): string[];
    /**
     * Get active skins information
     */
    getActiveSkins(): Array<{
        name: string;
        displayName: string;
        version?: string;
    }>;
    /**
     * Set skin priority order
     */
    setSkinPriority(skinIds: string[]): void;
    /**
     * Clear all registrations (for testing)
     */
    clear(): void;
    /**
     * Resolve menu inheritance from base menus and skin overrides
     */
    private resolveMenuInheritance;
    /**
     * Validate menu definition structure
     */
    private validateMenuDefinition;
    /**
     * Register menu with validation
     */
    registerMenuSafe(menu: MenuDefinition): void;
}
//# sourceMappingURL=menu-registry.d.ts.map