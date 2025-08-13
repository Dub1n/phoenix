/**---
 * title: [Menu Registry - Core Service Module]
 * tags: [Core, Service, Menu-System, Theming]
 * provides: [MenuRegistry Class, Menu Registration, Skin Loading, Inheritance Resolution, Priority Management]
 * requires: [Menu Types]
 * description: [Central registry for core and skin-provided menus with inheritance and priority resolution used by interactive CLI rendering.]
 * ---*/

import { MenuDefinition, LoadedSkin, MenuContext } from '../types/menu-definitions';

export class MenuRegistry {
  private menus = new Map<string, MenuDefinition>();
  private skins = new Map<string, LoadedSkin>();
  private activeSkinsIds: string[] = [];

  /**
   * Register a core menu definition
   */
  registerMenu(menu: MenuDefinition): void {
    if (!menu.id) {
      throw new Error('Menu definition must have an id');
    }
    this.menus.set(menu.id, menu);
  }

  /**
   * Get menu definition with skin inheritance support
   */
  getMenu(menuId: string): MenuDefinition {
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
  loadSkin(skin: LoadedSkin): void {
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
  unloadSkin(skinName: string): boolean {
    const removed = this.skins.delete(skinName);
    this.activeSkinsIds = this.activeSkinsIds.filter(id => id !== skinName);
    return removed;
  }

  /**
   * Get all available menu IDs
   */
  getAvailableMenuIds(): string[] {
    const menuIds = new Set<string>();
    
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
  getActiveSkins(): Array<{ name: string; displayName: string; version?: string }> {
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
  setSkinPriority(skinIds: string[]): void {
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
  clear(): void {
    this.menus.clear();
    this.skins.clear();
    this.activeSkinsIds = [];
  }

  /**
   * Resolve menu inheritance from base menus and skin overrides
   */
  private resolveMenuInheritance(menu: MenuDefinition, skin: LoadedSkin): MenuDefinition {
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
  private validateMenuDefinition(menu: MenuDefinition): void {
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
  registerMenuSafe(menu: MenuDefinition): void {
    this.validateMenuDefinition(menu);
    this.registerMenu(menu);
  }
}
