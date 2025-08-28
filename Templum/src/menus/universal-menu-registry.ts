/**
 * Universal Menu Registry
 * 
 * Extended from Phoenix Code Lite for multi-backend menu loading and cross-interface synchronization.
 * Integrates with SessionContextFoundation and StateSyncFoundation for menu state consistency.
 * 
 * Dependencies: SessionContextFoundation, StateSyncFoundation
 * Features: Backend-specific menu loading, cross-interface synchronization, skin inheritance
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';
import { SessionContextFoundation, SessionContext } from '../session/session-context-foundation';
import { StateSyncFoundation } from '../state/state-sync-foundation';

// Extended interfaces for multi-backend and multi-interface support
export interface UniversalMenuDefinition extends MenuDefinition {
  backendId?: string;
  interfaceSupport?: InterfaceType[];
  inheritance?: MenuInheritance;
  crossInterfaceSync?: boolean;
}

export interface MenuDefinition {
  id: string;
  title: string;
  subtitle?: string;
  sections: MenuSection[];
  metadata?: MenuMetadata;
}

export interface MenuSection {
  id: string;
  heading: string;
  items: MenuItem[];
  order?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  action: MenuAction;
  icon?: string;
  hotkey?: string;
  enabled?: boolean;
}

export interface MenuAction {
  type: 'command' | 'submenu' | 'navigation' | 'external';
  target?: string;
  parameters?: Record<string, any>;
  confirmation?: boolean;
}

export interface MenuMetadata {
  contextLevel?: string;
  allowBack?: boolean;
  skinName?: string;
  category?: string;
  version?: string;
  interfaceAdapted?: InterfaceType;
  resolvedAt?: Date;
}

export interface MenuInheritance {
  inheritsFrom?: string;
  overrides?: Partial<MenuDefinition>;
  extensionStrategy?: 'merge' | 'replace' | 'append';
}

export interface LoadedSkin {
  metadata: SkinMetadata;
  menus: Record<string, UniversalMenuDefinition>;
  theme?: SkinTheme;
  config?: SkinConfig;
}

export interface SkinMetadata {
  name: string;
  displayName: string;
  version?: string;
  author?: string;
  description?: string;
  supportedInterfaces?: InterfaceType[];
}

export interface SkinTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface SkinConfig {
  defaultInterface?: InterfaceType;
  enableAnimations?: boolean;
  compactMode?: boolean;
}

export interface MenuState {
  activeMenu: string;
  navigationHistory: string[];
  customization?: Record<string, any>;
  syncLatency?: number;
}

export interface BackendMenuConfiguration {
  backendId: string;
  menuPaths: string[];
  loadStrategy: 'eager' | 'lazy' | 'ondemand';
  cachingEnabled: boolean;
  syncInterval?: number;
}

export type InterfaceType = 'vscode' | 'cli' | 'command';

/**
 * Universal Menu Registry with Multi-Backend and Cross-Interface Support
 * Extends PCL menu registry for backend-specific menu loading and cross-interface state synchronization
 */
export class UniversalMenuRegistry extends EventEmitter {
  private menus = new Map<string, UniversalMenuDefinition>();
  private skins = new Map<string, LoadedSkin>();
  private activeSkinsIds: string[] = [];
  private backendMenus = new Map<string, Map<string, UniversalMenuDefinition>>();
  private interfaceMenuStates = new Map<InterfaceType, MenuState>();
  private sessionContext: SessionContextFoundation;
  private stateSync: StateSyncFoundation;
  private backendConfigurations = new Map<string, BackendMenuConfiguration>();
  private menuCache = new Map<string, { menu: UniversalMenuDefinition; timestamp: Date }>();
  private syncInProgress = false;

  constructor(
    sessionContext: SessionContextFoundation,
    stateSync: StateSyncFoundation
  ) {
    super();
    this.sessionContext = sessionContext;
    this.stateSync = stateSync;
    this.setupEventHandlers();
    this.initializeDefaultMenuStates();
  }

  /**
   * Load menus from multiple sources
   */
  async loadMenus(sources: string[]): Promise<void> {
    const loadPromises = sources.map(source => this.loadMenusFromSource(source));
    await Promise.all(loadPromises);
    this.emit('menusLoaded', sources);
  }

  /**
   * Load menus from a specific source (backend or skin)
   */
  private async loadMenusFromSource(source: string): Promise<void> {
    // Determine if source is a backend ID or menu name
    if (this.isBackendId(source)) {
      await this.loadBackendMenus(source);
    } else {
      await this.loadCoreMenu(source);
    }
  }

  /**
   * Load backend-specific menus
   */
  private async loadBackendMenus(backendId: string): Promise<void> {
    if (!this.backendMenus.has(backendId)) {
      this.backendMenus.set(backendId, new Map());
    }

    const backendMenuRegistry = this.backendMenus.get(backendId)!;
    const menus = await this.discoverBackendMenus(backendId);

    for (const menu of menus) {
      const universalMenu: UniversalMenuDefinition = {
        ...menu,
        backendId,
        interfaceSupport: (menu as UniversalMenuDefinition).interfaceSupport || ['cli', 'command'],
        crossInterfaceSync: true
      };

      backendMenuRegistry.set(menu.id, universalMenu);
      
      // Register in universal registry with backend prefix
      const universalId = `${backendId}.${menu.id}`;
      this.menus.set(universalId, universalMenu);
    }

    this.emit('backendMenusLoaded', backendId, menus.length);
  }

  /**
   * Load core menu
   */
  private async loadCoreMenu(menuName: string): Promise<void> {
    // For core menus, create basic definition
    const coreMenu: UniversalMenuDefinition = {
      id: menuName,
      title: this.getMenuDisplayTitle(menuName),
      sections: await this.generateMenuSections(menuName),
      interfaceSupport: ['vscode', 'cli', 'command'],
      crossInterfaceSync: true
    };

    this.menus.set(menuName, coreMenu);
    this.emit('coreMenuLoaded', menuName);
  }

  /**
   * Update menu state for a specific interface
   */
  async updateMenuState(interfaceType: InterfaceType, updates: Partial<MenuState>): Promise<void> {
    const currentState = this.interfaceMenuStates.get(interfaceType) || this.createDefaultMenuState();
    const newState = { ...currentState, ...updates };
    
    this.interfaceMenuStates.set(interfaceType, newState);

    // Sync state across interfaces using StateSyncFoundation
    if (newState.syncLatency !== undefined || updates.activeMenu) {
      await this.stateSync.updateState(interfaceType, {
        menuState: newState
      });
    }

    this.emit('menuStateUpdated', interfaceType, newState);
  }

  /**
   * Get menu state for specific interface
   */
  async getMenuState(interfaceType: InterfaceType): Promise<MenuState> {
    // Check if we need to sync from other interfaces
    if (!this.syncInProgress) {
      await this.syncMenuStateFromOtherInterfaces(interfaceType);
    }

    return this.interfaceMenuStates.get(interfaceType) || this.createDefaultMenuState();
  }

  /**
   * Load and activate a skin with multi-interface support
   */
  async loadSkin(skin: LoadedSkin): Promise<void> {
    if (!skin.metadata?.name) {
      throw new Error('Skin must have metadata with name');
    }
    
    // Validate interface support
    const supportedInterfaces = skin.metadata.supportedInterfaces || ['cli'];
    if (supportedInterfaces.length === 0) {
      throw new Error('Skin must support at least one interface');
    }

    this.skins.set(skin.metadata.name, skin);
    
    // Add to active skins if not already present
    if (!this.activeSkinsIds.includes(skin.metadata.name)) {
      this.activeSkinsIds.push(skin.metadata.name);
    }

    // Load skin menus into universal registry
    for (const [menuId, menuDef] of Object.entries(skin.menus)) {
      const universalMenu: UniversalMenuDefinition = {
        ...menuDef,
        interfaceSupport: supportedInterfaces,
        crossInterfaceSync: true,
        metadata: {
          ...menuDef.metadata,
          skinName: skin.metadata.name
        }
      };

      this.menus.set(`${skin.metadata.name}.${menuId}`, universalMenu);
    }

    // Sync skin loading across interfaces
    await this.syncSkinLoadingAcrossInterfaces(skin.metadata.name);

    this.emit('skinLoaded', skin.metadata.name, supportedInterfaces);
  }

  /**
   * Get menu definition with inheritance and interface support
   */
  async getMenu(menuId: string, interfaceType: InterfaceType = 'cli'): Promise<UniversalMenuDefinition> {
    // Check cache first
    const cached = this.menuCache.get(`${menuId}.${interfaceType}`);
    if (cached && (Date.now() - cached.timestamp.getTime()) < 30000) { // 30s cache
      return cached.menu;
    }

    // Check active skins in priority order
    for (let i = this.activeSkinsIds.length - 1; i >= 0; i--) {
      const skinId = this.activeSkinsIds[i];
      const skin = this.skins.get(skinId);
      const menu = skin?.menus[menuId];
      
      if (menu && this.supportsInterface(menu, interfaceType)) {
        const resolvedMenu = await this.resolveMenuInheritance(menu, skin, interfaceType);
        this.cacheMenu(menuId, interfaceType, resolvedMenu);
        return resolvedMenu;
      }
    }
    
    // Check backend menus
    for (const [backendId, backendRegistry] of this.backendMenus) {
      const backendMenu = backendRegistry.get(menuId);
      if (backendMenu && this.supportsInterface(backendMenu, interfaceType)) {
        const resolvedMenu = await this.adaptMenuForInterface(backendMenu, interfaceType);
        this.cacheMenu(menuId, interfaceType, resolvedMenu);
        return resolvedMenu;
      }
    }
    
    // Fallback to core menus
    const coreMenu = this.menus.get(menuId);
    if (!coreMenu) {
      throw new Error(`Menu not found: ${menuId}`);
    }

    if (!this.supportsInterface(coreMenu, interfaceType)) {
      throw new Error(`Menu ${menuId} does not support ${interfaceType} interface`);
    }
    
    const adaptedMenu = await this.adaptMenuForInterface(coreMenu, interfaceType);
    this.cacheMenu(menuId, interfaceType, adaptedMenu);
    return adaptedMenu;
  }

  /**
   * Check if state synchronization is available
   */
  hasStateSync(): boolean {
    return this.stateSync.isInitialized();
  }

  /**
   * Get available menu IDs with interface filtering
   */
  getAvailableMenuIds(interfaceType?: InterfaceType): string[] {
    const menuIds = new Set<string>();
    
    // Add core menu IDs
    for (const [menuId, menu] of this.menus) {
      if (!interfaceType || this.supportsInterface(menu, interfaceType)) {
        menuIds.add(menuId);
      }
    }
    
    // Add skin menu IDs
    for (const skinId of this.activeSkinsIds) {
      const skin = this.skins.get(skinId);
      if (skin?.menus) {
        for (const [menuId, menu] of Object.entries(skin.menus)) {
          if (!interfaceType || this.supportsInterface(menu, interfaceType)) {
            menuIds.add(menuId);
          }
        }
      }
    }

    // Add backend menu IDs
    for (const [backendId, backendRegistry] of this.backendMenus) {
      for (const [menuId, menu] of backendRegistry) {
        if (!interfaceType || this.supportsInterface(menu, interfaceType)) {
          menuIds.add(`${backendId}.${menuId}`);
        }
      }
    }
    
    return Array.from(menuIds);
  }

  /**
   * Sync menu state from other interfaces
   */
  private async syncMenuStateFromOtherInterfaces(targetInterface: InterfaceType): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      // Get synchronized state from StateSyncFoundation
      const syncedState = await this.stateSync.getSynchronizedState();
      
      if (syncedState.state.menuState) {
        const menuState = syncedState.state.menuState as MenuState;
        menuState.syncLatency = syncedState.syncLatency;
        this.interfaceMenuStates.set(targetInterface, menuState);
      }

      const syncTime = Date.now() - startTime;
      this.emit('menuStateSynced', targetInterface, syncTime);

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync skin loading across all active interfaces
   */
  private async syncSkinLoadingAcrossInterfaces(skinName: string): Promise<void> {
    const activeInterfaces = Array.from(this.interfaceMenuStates.keys());
    
    for (const interfaceType of activeInterfaces) {
      await this.stateSync.updateState(interfaceType, {
        activeSkins: this.activeSkinsIds,
        lastSkinLoaded: skinName,
        timestamp: new Date()
      });
    }
  }

  /**
   * Resolve menu inheritance with interface-specific adaptations
   */
  private async resolveMenuInheritance(
    menu: UniversalMenuDefinition,
    skin: LoadedSkin,
    interfaceType: InterfaceType
  ): Promise<UniversalMenuDefinition> {
    let resolvedMenu = { ...menu };

    // Apply inheritance if specified
    if (menu.inheritance?.inheritsFrom) {
      const baseMenu = await this.getMenu(menu.inheritance.inheritsFrom, interfaceType);
      resolvedMenu = this.mergeMenuDefinitions(baseMenu, menu);
    }

    // Apply interface-specific adaptations
    resolvedMenu = await this.adaptMenuForInterface(resolvedMenu, interfaceType);

    // Mark as skin-provided and add inheritance metadata
    resolvedMenu.metadata = {
      ...resolvedMenu.metadata,
      skinName: skin.metadata.name,
      interfaceAdapted: interfaceType,
      resolvedAt: new Date()
    };

    return resolvedMenu;
  }

  /**
   * Adapt menu for specific interface
   */
  private async adaptMenuForInterface(
    menu: UniversalMenuDefinition,
    interfaceType: InterfaceType
  ): Promise<UniversalMenuDefinition> {
    const adaptedMenu = { ...menu };

    switch (interfaceType) {
      case 'vscode':
        adaptedMenu.sections = menu.sections.map(section => ({
          ...section,
          items: section.items.map(item => ({
            ...item,
            // Add VSCode-specific properties
            icon: item.icon || this.getDefaultVSCodeIcon(item.action.type),
            action: {
              ...item.action,
              // Convert commands to VSCode command format
              target: item.action.target?.startsWith('vscode.') 
                ? item.action.target 
                : `templum.${item.action.target}`
            }
          }))
        }));
        break;

      case 'cli':
        // CLI interface uses original format (PCL compatibility)
        break;

      case 'command':
        adaptedMenu.sections = menu.sections.map(section => ({
          ...section,
          items: section.items.filter(item => 
            item.action.type === 'command' || item.action.type === 'external'
          )
        }));
        break;
    }

    return adaptedMenu;
  }

  /**
   * Check if menu supports specific interface
   */
  private supportsInterface(menu: UniversalMenuDefinition, interfaceType: InterfaceType): boolean {
    if (!menu.interfaceSupport) return true; // Default: support all interfaces
    return menu.interfaceSupport.includes(interfaceType);
  }

  /**
   * Merge menu definitions for inheritance
   */
  private mergeMenuDefinitions(
    baseMenu: UniversalMenuDefinition,
    overrideMenu: UniversalMenuDefinition
  ): UniversalMenuDefinition {
    const strategy = overrideMenu.inheritance?.extensionStrategy || 'merge';

    switch (strategy) {
      case 'replace':
        return overrideMenu;
      
      case 'append':
        return {
          ...baseMenu,
          sections: [...baseMenu.sections, ...overrideMenu.sections]
        };
      
      case 'merge':
      default:
        return {
          ...baseMenu,
          ...overrideMenu,
          sections: this.mergeSections(baseMenu.sections, overrideMenu.sections),
          metadata: { ...baseMenu.metadata, ...overrideMenu.metadata }
        };
    }
  }

  /**
   * Merge menu sections intelligently
   */
  private mergeSections(baseSections: MenuSection[], overrideSections: MenuSection[]): MenuSection[] {
    const merged = [...baseSections];
    
    for (const overrideSection of overrideSections) {
      const existingIndex = merged.findIndex(section => section.id === overrideSection.id);
      
      if (existingIndex >= 0) {
        // Merge with existing section
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...overrideSection,
          items: [...merged[existingIndex].items, ...overrideSection.items]
        };
      } else {
        // Add new section
        merged.push(overrideSection);
      }
    }
    
    // Sort by order if specified
    return merged.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Cache menu for performance optimization
   */
  private cacheMenu(menuId: string, interfaceType: InterfaceType, menu: UniversalMenuDefinition): void {
    const cacheKey = `${menuId}.${interfaceType}`;
    this.menuCache.set(cacheKey, {
      menu: { ...menu },
      timestamp: new Date()
    });

    // Clean old cache entries
    if (this.menuCache.size > 100) {
      this.cleanupOldCacheEntries();
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanupOldCacheEntries(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [key, cached] of this.menuCache) {
      if (cached.timestamp < oneHourAgo) {
        this.menuCache.delete(key);
      }
    }
  }

  /**
   * Initialize default menu states for all interfaces
   */
  private initializeDefaultMenuStates(): void {
    const interfaces: InterfaceType[] = ['vscode', 'cli', 'command'];
    
    for (const interfaceType of interfaces) {
      this.interfaceMenuStates.set(interfaceType, this.createDefaultMenuState());
    }
  }

  /**
   * Create default menu state
   */
  private createDefaultMenuState(): MenuState {
    return {
      activeMenu: 'main',
      navigationHistory: [],
      customization: {},
      syncLatency: 0 // Default sync latency
    };
  }

  /**
   * Setup event handlers for cross-component coordination
   */
  private setupEventHandlers(): void {
    // Listen for session context changes
    this.sessionContext.on('activeSessionChanged', async (sessionId) => {
      await this.updateSessionMenuContext(sessionId);
    });

    // Listen for state synchronization events
    this.stateSync.on('stateUpdated', async (key, value, interfaceId) => {
      if (key === 'menuState') {
        await this.handleCrossInterfaceMenuStateUpdate(interfaceId, value);
      }
    });

    // Performance monitoring
    this.on('menuStateUpdated', (interfaceType, state) => {
      if (state.syncLatency && state.syncLatency > 150) {
        console.warn(`Menu state sync exceeded 150ms baseline: ${state.syncLatency}ms for ${interfaceType}`);
      }
    });
  }

  /**
   * Handle cross-interface menu state updates
   */
  private async handleCrossInterfaceMenuStateUpdate(sourceInterfaceId: string, menuState: MenuState): Promise<void> {
    // Update all other interfaces with the new state
    for (const [interfaceType, currentState] of this.interfaceMenuStates) {
      if (interfaceType !== sourceInterfaceId) {
        const updatedState = { ...currentState, ...menuState };
        this.interfaceMenuStates.set(interfaceType, updatedState);
      }
    }
  }

  /**
   * Update session menu context when session changes
   */
  private async updateSessionMenuContext(sessionId: string): Promise<void> {
    const session = this.sessionContext.getSession(sessionId);
    if (session) {
      // Update session with current menu states
      const menuStates = Object.fromEntries(this.interfaceMenuStates);
      this.sessionContext.updateSessionState(sessionId, { menuStates });
    }
  }

  // Backend discovery and helper methods
  private isBackendId(source: string): boolean {
    const knownBackends = ['pcl', 'haruspex', 'templum'];
    return knownBackends.includes(source);
  }

  private async discoverBackendMenus(backendId: string): Promise<MenuDefinition[]> {
    // Simulated backend menu discovery
    switch (backendId) {
      case 'pcl':
        return this.getPCLMenus();
      case 'haruspex':
        return this.getHaruspexMenus();
      default:
        return [];
    }
  }

  private getPCLMenus(): MenuDefinition[] {
    return [
      {
        id: 'main',
        title: 'Phoenix Code Lite',
        sections: [
          {
            id: 'analysis',
            heading: 'Code Analysis',
            items: [
              {
                id: 'analyze',
                label: 'Analyze Code',
                description: 'Analyze codebase patterns',
                action: { type: 'command', target: 'pcl.analyze' }
              }
            ]
          }
        ]
      }
    ];
  }

  private getHaruspexMenus(): MenuDefinition[] {
    return [
      {
        id: 'predictions',
        title: 'Haruspex Predictions',
        sections: [
          {
            id: 'predict',
            heading: 'Analysis Predictions',
            items: [
              {
                id: 'predict',
                label: 'Predict Outcomes',
                description: 'Predict analysis outcomes',
                action: { type: 'command', target: 'haruspex.predict' }
              }
            ]
          }
        ]
      }
    ];
  }

  private getMenuDisplayTitle(menuName: string): string {
    const titles: Record<string, string> = {
      'main': 'Main Menu',
      'settings': 'Settings',
      'analysis': 'Analysis Tools',
      'qms': 'QMS Compliance'
    };
    return titles[menuName] || menuName;
  }

  private async generateMenuSections(menuName: string): Promise<MenuSection[]> {
    // Generate basic sections for core menus
    switch (menuName) {
      case 'main':
        return [
          {
            id: 'core',
            heading: 'Core Functions',
            items: [
              {
                id: 'status',
                label: 'System Status',
                action: { type: 'command', target: 'system.status' }
              }
            ]
          }
        ];
      default:
        return [];
    }
  }

  private getDefaultVSCodeIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'command': 'play',
      'submenu': 'folder',
      'navigation': 'arrow-right',
      'external': 'link-external'
    };
    return icons[actionType] || 'circle-outline';
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.menus.clear();
    this.skins.clear();
    this.activeSkinsIds = [];
    this.backendMenus.clear();
    this.interfaceMenuStates.clear();
    this.backendConfigurations.clear();
    this.menuCache.clear();
    this.removeAllListeners();
  }
}