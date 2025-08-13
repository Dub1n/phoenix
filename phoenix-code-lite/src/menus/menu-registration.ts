/**---
 * title: [Menu Registration - Unified Architecture]
 * tags: [Unified, Menus, Registration]
 * provides: [Menu Registration]
 * requires: [core-menus]
 * description: [Registers core menus into the unified menu registry for integrated CLI.]
 * ---*/

import { MenuRegistry } from '../core/menu-registry';
import { 
  MainMenuDefinition,
  ConfigMenuDefinition,
  TemplatesMenuDefinition,
  GenerateMenuDefinition,
  AdvancedMenuDefinition,
  SettingsMenuDefinition
} from './core-menus';

/**
 * Register all core menu definitions
 */
export function registerCoreMenus(menuRegistry: MenuRegistry): void {
  try {
    // Register all core menus with validation
    menuRegistry.registerMenuSafe(MainMenuDefinition);
    menuRegistry.registerMenuSafe(ConfigMenuDefinition);
    menuRegistry.registerMenuSafe(TemplatesMenuDefinition);
    menuRegistry.registerMenuSafe(GenerateMenuDefinition);
    menuRegistry.registerMenuSafe(AdvancedMenuDefinition);
    menuRegistry.registerMenuSafe(SettingsMenuDefinition);
    
    console.log('✓ All core menus registered successfully');
  } catch (error) {
    console.error('✗ Failed to register core menus:', error);
    throw error;
  }
}

/**
 * Get list of all core menu IDs
 */
export function getCoreMenuIds(): string[] {
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
export function validateCoreMenus(): boolean {
  const menus = [
    MainMenuDefinition,
    ConfigMenuDefinition, 
    TemplatesMenuDefinition,
    GenerateMenuDefinition,
    AdvancedMenuDefinition,
    SettingsMenuDefinition
  ];
  
  try {
    for (const menu of menus) {
      validateMenuStructure(menu);
    }
    return true;
  } catch (error) {
    console.error('✗ Menu validation failed:', error);
    return false;
  }
}

/**
 * Basic menu structure validation
 */
function validateMenuStructure(menu: any): void {
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
