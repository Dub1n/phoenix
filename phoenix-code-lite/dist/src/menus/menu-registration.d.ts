/**---
 * title: [Menu Registration - Unified Architecture]
 * tags: [Unified, Menus, Registration]
 * provides: [Menu Registration]
 * requires: [core-menus]
 * description: [Registers core menus into the unified menu registry for integrated CLI.]
 * ---*/
import { MenuRegistry } from '../core/menu-registry';
/**
 * Register all core menu definitions
 */
export declare function registerCoreMenus(menuRegistry: MenuRegistry): void;
/**
 * Get list of all core menu IDs
 */
export declare function getCoreMenuIds(): string[];
/**
 * Validate all core menu definitions
 */
export declare function validateCoreMenus(): boolean;
//# sourceMappingURL=menu-registration.d.ts.map