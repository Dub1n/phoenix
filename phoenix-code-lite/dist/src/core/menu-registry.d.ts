/**
 * Menu Registry Implementation
 * Created: 2025-01-06-175700
 *
 * Centralized registry for menu definitions with skin support.
 * Manages menu inheritance, skin priority, and fallback mechanisms.
 */
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