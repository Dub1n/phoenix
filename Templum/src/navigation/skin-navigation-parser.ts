/**
---
date: 2025-09-13T103229Z
name: skin-navigation-parser
TASK-ID: [TASK-MCP-009]
category: dynamic-routing
status: [T]
patterns: [dynamic-routing, skin-definition-parsing, navigation-optimization]
components: [SkinNavigationParser, RoutingCache, NavigationMetrics]
dependencies: [universal-skin-definition, performance-optimization, navigation-algorithms]
tags: [navigation, skin-definition, dynamic-routing, performance, cli-redesign]
---
*/

import {
  UniversalSkinDefinition,
  MenuDefinition,
  MenuItemDefinition,
  SkinCommands,
  CommandDefinition,
  NavigationDefinition,
} from '../types/universal-skin-definition';
import { TypeGuards, TypeValidators } from '../utils/type-guards';
import { createLogger, normalizeLoggerError } from '../utils/logger';

/**
 * TODO: [TASK-MCP-009-001] Pattern: skin-navigation-parsing | Complexity: 8 | Dependencies: skin-definition,performance-optimization
 * Context: Dynamic routing system that extracts navigation patterns from skin definitions with optimization heuristics
 * Validation-Required: navigation-correctness, performance-metrics, compatibility-verification
 * Pattern-Info: { approach: "skin-definition-driven-routing", alternatives: "hardcoded-navigation", trade-offs: "flexibility-vs-predictability" }
 */

export interface NavigationRoute {
  id: string;
  path: string[];
  action?: string;
  command?: string;
  type: 'menu' | 'command' | 'workflow' | 'external';
  weight: number; // For optimization
  dependencies?: string[];
  accessPatterns?: AccessPattern[];
  performanceHints?: RoutePerformanceHints;
}

export interface AccessPattern {
  frequency: number;
  averageExecutionTime: number;
  lastAccessed: number;
  userPreference: number; // 0-1 scale
}

export interface RoutePerformanceHints {
  loadingStrategy: 'eager' | 'lazy' | 'progressive';
  preloadDependencies: string[];
  cacheStrategy: 'memory' | 'disk' | 'none';
  criticalPath: boolean;
  estimatedExecutionTime?: number;
}

export interface NavigationGraph {
  routes: Map<string, NavigationRoute>;
  shortcuts: Map<string, string>; // key -> routeId mapping
  dependencies: Map<string, string[]>; // routeId -> dependencies
  optimizedPaths: Map<string, string[]>; // Common navigation patterns
  accessMetrics: Map<string, AccessPattern>;
}

export interface NavigationOptimization {
  frequentlyUsedRoutes: string[];
  suggestedPreloads: string[];
  optimizedShortcuts: Map<string, string>;
  performanceRecommendations: string[];
}

/**
 * TODO: [TASK-MCP-009-002] Pattern: performance-metrics-tracking | Complexity: 6 | Dependencies: metrics-collection,navigation-analysis
 * Context: Performance tracking and optimization for navigation routing with usage analytics
 * Validation-Required: metrics-accuracy, performance-impact, storage-efficiency
 * Pattern-Info: { approach: "real-time-metrics-collection", alternatives: "batch-analytics", trade-offs: "realtime-vs-overhead" }
 */
export class NavigationMetrics {
  private routeMetrics = new Map<string, AccessPattern>();
  private performanceHistory: { timestamp: number; routeId: string; executionTime: number }[] = [];
  private maxHistorySize = 1000;

  recordAccess(routeId: string, executionTime: number): void {
    const existing = this.routeMetrics.get(routeId) || {
      frequency: 0,
      averageExecutionTime: 0,
      lastAccessed: 0,
      userPreference: 0.5
    };

    // Update metrics with weighted averages
    existing.frequency += 1;
    existing.averageExecutionTime = (existing.averageExecutionTime * 0.8) + (executionTime * 0.2);
    existing.lastAccessed = Date.now();
    
    // Update user preference based on recent usage patterns
    const recentUsage = this.getRecentUsageScore(routeId);
    existing.userPreference = Math.min(1, existing.userPreference + (recentUsage * 0.1));

    this.routeMetrics.set(routeId, existing);

    // Add to performance history
    this.performanceHistory.push({ timestamp: Date.now(), routeId, executionTime });
    
    // Trim history if needed
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }
  }

  private getRecentUsageScore(routeId: string): number {
    const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes
    const recentAccesses = this.performanceHistory.filter(
      entry => entry.routeId === routeId && entry.timestamp > recentThreshold
    );
    
    return Math.min(1, recentAccesses.length / 10); // Normalize to 0-1
  }

  getOptimizationRecommendations(): NavigationOptimization {
    const routes = Array.from(this.routeMetrics.entries());
    
    // Sort by combined score of frequency and preference
    const frequentlyUsed = routes
      .map(([routeId, metrics]) => ({
        routeId,
        score: (metrics.frequency * 0.6) + (metrics.userPreference * 0.4)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.routeId);

    // Identify routes that should be preloaded
    const suggestedPreloads = routes
      .filter(([_, metrics]) => 
        metrics.frequency > 5 && 
        metrics.averageExecutionTime > 100 &&
        metrics.userPreference > 0.7
      )
      .map(([routeId]) => routeId)
      .slice(0, 5);

    // Generate optimized shortcuts
    const optimizedShortcuts = new Map<string, string>();
    frequentlyUsed.forEach((routeId, index) => {
      if (index < 9) { // 1-9 keys
        optimizedShortcuts.set((index + 1).toString(), routeId);
      }
    });

    // Performance recommendations
    const recommendations: string[] = [];
    const slowRoutes = routes.filter(([_, metrics]) => metrics.averageExecutionTime > 500);
    if (slowRoutes.length > 0) {
      recommendations.push(`Consider optimizing ${slowRoutes.length} slow routes (>500ms execution time)`);
    }

    const underusedRoutes = routes.filter(([_, metrics]) => metrics.frequency < 2 && metrics.userPreference < 0.3);
    if (underusedRoutes.length > 0) {
      recommendations.push(`${underusedRoutes.length} routes appear underutilized - consider reorganizing navigation`);
    }

    return {
      frequentlyUsedRoutes: frequentlyUsed,
      suggestedPreloads,
      optimizedShortcuts,
      performanceRecommendations: recommendations
    };
  }

  getMetrics(routeId: string): AccessPattern | undefined {
    return this.routeMetrics.get(routeId);
  }

  getGlobalMetrics(): { totalRoutes: number; totalAccesses: number; averageExecutionTime: number } {
    const totalRoutes = this.routeMetrics.size;
    const totalAccesses = Array.from(this.routeMetrics.values()).reduce((sum, metrics) => sum + metrics.frequency, 0);
    const averageExecutionTime = Array.from(this.routeMetrics.values())
      .reduce((sum, metrics) => sum + metrics.averageExecutionTime, 0) / Math.max(1, totalRoutes);

    return { totalRoutes, totalAccesses, averageExecutionTime };
  }
}

/**
 * TODO: [TASK-MCP-009-003] Pattern: route-caching-system | Complexity: 7 | Dependencies: performance-optimization,memory-management
 * Context: Intelligent caching system for navigation routes with LRU eviction and performance tracking
 * Validation-Required: cache-hit-rate, memory-usage, eviction-accuracy
 * Pattern-Info: { approach: "lru-cache-with-metrics", alternatives: "simple-map-cache", trade-offs: "performance-vs-memory" }
 */
export class RoutingCache {
  private cache = new Map<string, { route: NavigationRoute; timestamp: number; accessCount: number }>();
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): NavigationRoute | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update access metrics
      entry.accessCount++;
      entry.timestamp = Date.now();
      this.hitCount++;
      return entry.route;
    }
    
    this.missCount++;
    return undefined;
  }

  set(key: string, route: NavigationRoute): void {
    // Remove least recently used item if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      route,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getCacheStats(): { hitRate: number; size: number; maxSize: number } {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    
    return {
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

/**
 * Main parser class for extracting navigation routes from skin definitions
 * TODO: [TASK-MCP-009-004] Pattern: skin-definition-parsing-engine | Complexity: 9 | Dependencies: skin-definition,navigation-algorithms
 * Context: Core parsing engine that transforms skin definitions into navigable route structures with optimization
 * Validation-Required: parsing-accuracy, route-completeness, performance-verification
 * Pattern-Info: { approach: "comprehensive-skin-parsing", alternatives: "selective-parsing", trade-offs: "completeness-vs-performance" }
 */
export class SkinNavigationParser {
  private metrics: NavigationMetrics;
  private cache: RoutingCache;
  private compatibilityMode: boolean;
  private readonly logger = createLogger('skin-navigation-parser');

  constructor(options: { cacheSize?: number; compatibilityMode?: boolean } = {}) {
    this.metrics = new NavigationMetrics();
    this.cache = new RoutingCache(options.cacheSize || 100);
    this.compatibilityMode = options.compatibilityMode ?? true;
  }

  /**
   * Parse skin definition and extract navigation graph
   * TODO: [TASK-MCP-009-005] Pattern: navigation-graph-construction | Complexity: 8 | Dependencies: graph-algorithms,skin-parsing
   * Context: Build navigable graph structure from skin definition with optimization and dependency tracking
   * Validation-Required: graph-correctness, dependency-resolution, cycle-detection
   * Pattern-Info: { approach: "hierarchical-graph-construction", alternatives: "flat-route-mapping", trade-offs: "structure-vs-simplicity" }
   */
  parseSkinNavigation(skinDefinition: UniversalSkinDefinition): NavigationGraph {
    const cacheKey = `${skinDefinition.id}-${skinDefinition.version}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return this.buildNavigationGraphFromRoute(cached);
    }

    const startTime = Date.now();
    const graph: NavigationGraph = {
      routes: new Map(),
      shortcuts: new Map(),
      dependencies: new Map(),
      optimizedPaths: new Map(),
      accessMetrics: new Map()
    };

    try {
      // Parse menu-based navigation
      if (skinDefinition.menus) {
        this.parseMenuNavigation(skinDefinition.menus, graph, []);
      }

      // Parse command-based navigation
      if (skinDefinition.commands) {
        this.parseCommandNavigation(skinDefinition.commands, graph);
      }

      // Parse workflow navigation
      if (skinDefinition.workflows) {
        this.parseWorkflowNavigation(skinDefinition.workflows, graph);
      }

      // Parse shortcuts from skin definition
      if (skinDefinition.shortcuts) {
        this.parseShortcuts(skinDefinition.shortcuts, graph);
      }

      // Apply performance optimizations
      this.optimizeNavigationGraph(graph, skinDefinition);

      // Add backward compatibility routes if enabled
      if (this.compatibilityMode) {
        this.addCompatibilityRoutes(graph);
      }

      // Record parsing performance
      const executionTime = Date.now() - startTime;
      this.metrics.recordAccess(cacheKey, executionTime);

      return graph;

    } catch (error) {
      const { error: normalizedError, data } = normalizeLoggerError(error);
      const metadata: Record<string, unknown> = {
        skinId: skinDefinition.id,
        skinVersion: skinDefinition.version
      };

      if (normalizedError) {
        metadata.error = {
          name: normalizedError.name,
          message: normalizedError.message,
          stack: normalizedError.stack
        };
      }

      if (data !== undefined) {
        metadata.originalData = data;
      }

      this.logger.warn('Failed to parse skin navigation', metadata);
      
      // Return minimal navigation graph on error
      return this.createFallbackNavigationGraph();
    }
  }

  /**
   * Parse menu structure recursively
   */
  private parseMenuNavigation(
    menus: any, 
    graph: NavigationGraph, 
    parentPath: string[]
  ): void {
    if (!TypeGuards.isPlainObject(menus)) {
      return;
    }

    // Handle main menu
    const mainMenu = this.coerceMenuDefinition(menus.main);
    if (mainMenu) {
      this.parseMenu(mainMenu, graph, parentPath, 'main');
    }

    // Handle submenus
    if (menus.submenus && TypeGuards.isPlainObject(menus.submenus)) {
      for (const [menuId, menuDef] of Object.entries(menus.submenus as Record<string, unknown>)) {
        const submenu = this.coerceMenuDefinition(menuDef);
        if (submenu) {
          this.parseMenu(submenu, graph, [...parentPath, menuId], menuId);
        }
      }
    }

    // Handle legacy object-style menus
    for (const [key, value] of Object.entries(menus)) {
      if (key !== 'main' && key !== 'submenus' && key !== 'contexts') {
        const menuDef = this.coerceMenuDefinition(value);
        if (menuDef) {
          this.parseMenu(menuDef, graph, [...parentPath, key], key);
        }
      }
    }
  }

  /**
   * Parse individual menu definition
   */
  private parseMenu(
    menu: MenuDefinition, 
    graph: NavigationGraph, 
    parentPath: string[], 
    menuId: string
  ): void {
    if (!TypeGuards.isPlainObject(menu)) {
      return;
    }

    const menuPath = [...parentPath, menuId];
    
    // Create route for the menu itself
    const menuRoute: NavigationRoute = {
      id: `menu:${menuPath.join(':')}`,
      path: menuPath,
      type: 'menu',
      weight: this.calculateMenuWeight(menu),
      performanceHints: this.extractPerformanceHints(menu)
    };

    graph.routes.set(menuRoute.id, menuRoute);

    // Parse menu items
    if (
      menu.items &&
      TypeValidators.isArrayOf(menu.items, (item): item is MenuItemDefinition => TypeGuards.isPlainObject(item))
    ) {
      (menu.items as MenuItemDefinition[]).forEach((item, index) => {
        this.parseMenuItem(item, graph, menuPath, index);
      });
    }

    // Parse navigation definition if present
    if (menu.navigation) {
      this.parseNavigationDefinition(menu.navigation, graph, menuPath);
    }
  }

  /**
   * Parse navigation definition for menu
   */
  private parseNavigationDefinition(navigation: any, graph: NavigationGraph, menuPath: string[]): void {
    if (!TypeGuards.isPlainObject(navigation)) return;

    // Handle navigation shortcuts
    if (navigation.shortcuts) {
      Object.entries(navigation.shortcuts).forEach(([key, target]: [string, any]) => {
        const targetId = this.resolveTargetId(target);
        if (targetId) {
          graph.shortcuts.set(key, targetId);
        }
      });
    }

    // Handle navigation paths optimization
    if (navigation.optimizedPaths) {
      Object.entries(navigation.optimizedPaths).forEach(([pathKey, pathValue]: [string, any]) => {
        const optimizedPathId = `path:${menuPath.join(':')}:${pathKey}`;
        const coercedPath = TypeValidators.isArrayOf(pathValue, (entry): entry is string => TypeGuards.isString(entry))
          ? (pathValue as string[])
          : TypeGuards.isString(pathValue)
            ? [pathValue]
            : [];

        if (coercedPath.length > 0) {
          graph.optimizedPaths.set(optimizedPathId, coercedPath);
        }
      });
    }
  }

  private resolveTargetId(target: unknown): string | null {
    if (TypeGuards.isNonEmptyString(target)) {
      return target;
    }

    if (TypeGuards.isPlainObject(target)) {
      const candidate = target as Record<string, unknown>;
      const idValue = candidate['id'];
      if (TypeGuards.isNonEmptyString(idValue)) {
        return idValue;
      }

      const commandValue = candidate['command'];
      if (TypeGuards.isNonEmptyString(commandValue)) {
        return commandValue;
      }
    }

    return null;
  }

  /**
   * Parse individual menu item
   */
  private parseMenuItem(
    item: MenuItemDefinition, 
    graph: NavigationGraph, 
    parentPath: string[], 
    index: number
  ): void {
    if (!TypeGuards.isPlainObject(item)) {
      return;
    }

    const itemId = item.id || `item-${index}`;
    const itemPath = [...parentPath, itemId];

    const route: NavigationRoute = {
      id: `item:${itemPath.join(':')}`,
      path: itemPath,
      action: item.action,
      command: item.command,
      type: this.determineItemType(item),
      weight: this.calculateItemWeight(item, index),
      dependencies: this.extractDependencies(item),
      performanceHints: this.extractItemPerformanceHints(item)
    };

    graph.routes.set(route.id, route);

    // Handle shortcuts
    if (item.shortcuts) {
      item.shortcuts.forEach(shortcut => {
        graph.shortcuts.set(shortcut, route.id);
      });
    }
    if (item.shortcut) {
      graph.shortcuts.set(item.shortcut, route.id);
    }

    // Parse submenu if present
    if (item.submenu) {
      if (TypeGuards.isNonEmptyString(item.submenu)) {
        // Reference to another menu
        route.dependencies = route.dependencies || [];
        route.dependencies.push(item.submenu);
      } else if (TypeValidators.isArrayOf(item.submenu, (entry): entry is MenuItemDefinition => TypeGuards.isPlainObject(entry))) {
        // Inline submenu items
        (item.submenu as MenuItemDefinition[]).forEach((subItem, subIndex) => {
          this.parseMenuItem(subItem, graph, itemPath, subIndex);
        });
      }
    }
  }

  /**
   * Parse command definitions
   */
  private parseCommandNavigation(commands: SkinCommands, graph: NavigationGraph): void {
    // Parse primary commands
    if (commands.primary) {
      commands.primary.forEach((cmd, index) => {
        this.parseCommand(cmd, graph, ['commands'], index);
      });
    }

    // Parse command aliases
    if (commands.aliases) {
      for (const [alias, target] of Object.entries(commands.aliases)) {
        const aliasRoute: NavigationRoute = {
          id: `alias:${alias}`,
          path: ['commands', alias],
          command: target,
          type: 'command',
          weight: 50 // Medium priority for aliases
        };
        graph.routes.set(aliasRoute.id, aliasRoute);
        graph.shortcuts.set(alias, aliasRoute.id);
      }
    }

    // Parse legacy object-style commands
    for (const [key, value] of Object.entries(commands)) {
      if (key !== 'primary' && key !== 'aliases' && key !== 'help' && key !== 'completions') {
        if (this.isCommandDefinition(value)) {
          this.parseCommand(value as CommandDefinition, graph, ['commands', key], 0);
        } else if (TypeValidators.isArrayOf(value, (entry): entry is CommandDefinition => this.isCommandDefinition(entry))) {
          (value as CommandDefinition[]).forEach((cmd, index) => {
            this.parseCommand(cmd, graph, ['commands', key], index);
          });
        }
      }
    }
  }

  /**
   * Parse individual command definition
   */
  private parseCommand(
    cmd: CommandDefinition, 
    graph: NavigationGraph, 
    parentPath: string[], 
    index: number
  ): void {
    const cmdId = cmd.id || cmd.name || `cmd-${index}`;
    const cmdPath = [...parentPath, cmdId];

    const route: NavigationRoute = {
      id: `command:${cmdPath.join(':')}`,
      path: cmdPath,
      command: cmd.command || cmd.handler,
      type: 'command',
      weight: this.calculateCommandWeight(cmd),
      dependencies: this.extractCommandDependencies(cmd),
      performanceHints: this.extractCommandPerformanceHints(cmd)
    };

    graph.routes.set(route.id, route);

    // Handle command shortcuts
    if (cmd.shortcuts) {
      cmd.shortcuts.forEach(shortcut => {
        graph.shortcuts.set(shortcut, route.id);
      });
    }
  }

  /**
   * Parse workflow definitions
   */
  private parseWorkflowNavigation(workflows: any, graph: NavigationGraph): void {
    if (workflows.workflows) {
      workflows.workflows.forEach((workflow: any, index: number) => {
        this.parseWorkflow(workflow, graph, ['workflows'], index);
      });
    }

    // Parse legacy object-style workflows
    for (const [key, value] of Object.entries(workflows)) {
      if (key !== 'workflows' && key !== 'templates') {
        if (this.isWorkflowDefinition(value)) {
          this.parseWorkflow(value, graph, ['workflows', key], 0);
        }
      }
    }
  }

  /**
   * Parse individual workflow definition
   */
  private parseWorkflow(workflow: any, graph: NavigationGraph, parentPath: string[], index: number): void {
    const workflowId = workflow.id || workflow.name || `workflow-${index}`;
    const workflowPath = [...parentPath, workflowId];

    const route: NavigationRoute = {
      id: `workflow:${workflowPath.join(':')}`,
      path: workflowPath,
      type: 'workflow',
      weight: this.calculateWorkflowWeight(workflow),
      dependencies: this.extractWorkflowDependencies(workflow),
      performanceHints: {
        loadingStrategy: 'progressive',
        preloadDependencies: [],
        cacheStrategy: 'memory',
        criticalPath: false,
        estimatedExecutionTime: this.estimateWorkflowExecutionTime(workflow)
      }
    };

    graph.routes.set(route.id, route);
  }

  /**
   * Parse shortcuts from skin definition
   */
  private parseShortcuts(shortcuts: Record<string, string>, graph: NavigationGraph): void {
    for (const [key, command] of Object.entries(shortcuts)) {
      // Find existing route for the command, or create a new one
      let targetRouteId: string | undefined;
      
      for (const [routeId, route] of graph.routes.entries()) {
        if (route.command === command || route.action === command) {
          targetRouteId = routeId;
          break;
        }
      }

      if (!targetRouteId) {
        // Create new route for shortcut
        const shortcutRoute: NavigationRoute = {
          id: `shortcut:${key}`,
          path: ['shortcuts', key],
          command,
          type: 'command',
          weight: 75 // High priority for shortcuts
        };
        graph.routes.set(shortcutRoute.id, shortcutRoute);
        targetRouteId = shortcutRoute.id;
      }

      graph.shortcuts.set(key, targetRouteId);
    }
  }

  /**
   * Apply performance optimizations to the navigation graph
   */
  private optimizeNavigationGraph(graph: NavigationGraph, skinDefinition: UniversalSkinDefinition): void {
    // Get optimization recommendations from metrics
    const optimization = this.metrics.getOptimizationRecommendations();

    // Create optimized paths for frequently used routes
    optimization.frequentlyUsedRoutes.forEach((routeId, index) => {
      const route = graph.routes.get(routeId);
      if (route) {
        graph.optimizedPaths.set(`quick-${index + 1}`, route.path);
      }
    });

    // Apply performance hints from skin definition
    if (skinDefinition.performance) {
      this.applyGlobalPerformanceHints(graph, skinDefinition.performance);
    }

    // Optimize dependencies
    this.optimizeDependencies(graph);

    // Update route weights based on metrics
    this.updateRouteWeights(graph, optimization);
  }

  /**
   * Add backward compatibility routes for hardcoded CLI commands
   */
  private addCompatibilityRoutes(graph: NavigationGraph): void {
    const compatibilityCommands = [
      { key: 'help', command: 'help', weight: 90 },
      { key: 'refresh', command: 'refresh', weight: 70 },
      { key: 'back', command: 'back', weight: 85 },
      { key: 'home', command: 'home', weight: 80 },
      { key: 'status', command: 'status', weight: 75 },
      { key: 'quit', command: 'quit', weight: 95 },
      { key: 'exit', command: 'exit', weight: 95 }
    ];

    compatibilityCommands.forEach(compat => {
      const routeId = `compat:${compat.key}`;
      
      // Only add if not already defined in skin
      if (!graph.routes.has(routeId) && !graph.shortcuts.has(compat.key)) {
        const route: NavigationRoute = {
          id: routeId,
          path: ['compatibility', compat.key],
          command: compat.command,
          type: 'command',
          weight: compat.weight,
          performanceHints: {
            loadingStrategy: 'eager',
            preloadDependencies: [],
            cacheStrategy: 'memory',
            criticalPath: true
          }
        };

        graph.routes.set(routeId, route);
        graph.shortcuts.set(compat.key, routeId);
      }
    });
  }

  /**
   * Create fallback navigation graph for error cases
   */
  private createFallbackNavigationGraph(): NavigationGraph {
    const graph: NavigationGraph = {
      routes: new Map(),
      shortcuts: new Map(),
      dependencies: new Map(),
      optimizedPaths: new Map(),
      accessMetrics: new Map()
    };

    this.addCompatibilityRoutes(graph);
    return graph;
  }

  // Helper methods for type checking and calculations
  private isMenuDefinition(value: unknown): value is MenuDefinition {
    if (!TypeGuards.isPlainObject(value)) {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      TypeGuards.isNonEmptyString(candidate.title) ||
      TypeValidators.isArrayOf(candidate.items, (item): item is MenuItemDefinition => TypeGuards.isPlainObject(item))
    );
  }

  private coerceMenuDefinition(value: unknown): MenuDefinition | null {
    return this.isMenuDefinition(value) ? (value as MenuDefinition) : null;
  }

  private isCommandDefinition(value: unknown): value is CommandDefinition {
    if (!TypeGuards.isPlainObject(value)) {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      TypeGuards.isNonEmptyString(candidate.title) ||
      TypeGuards.isNonEmptyString(candidate.command) ||
      TypeGuards.isFunction(candidate.handler)
    );
  }

  private isWorkflowDefinition(value: unknown): boolean {
    if (!TypeGuards.isPlainObject(value)) {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return TypeGuards.isNonEmptyString(candidate.title) ||
      TypeValidators.isArrayOf(candidate.steps, (step): step is Record<string, unknown> => TypeGuards.isPlainObject(step));
  }

  private calculateMenuWeight(menu: MenuDefinition): number {
    let weight = 50; // Base weight
    
    if (menu.items) {
      weight += menu.items.length * 5; // More items = higher weight
    }
    
    if (menu.title === 'Main' || menu.id === 'main') {
      weight += 20; // Main menu priority
    }
    
    return Math.min(100, weight);
  }

  private calculateItemWeight(item: MenuItemDefinition, index: number): number {
    let weight = 50 - (index * 2); // Earlier items have higher weight
    
    if (item.type === 'action' || item.type === 'command') {
      weight += 10;
    }
    
    if (item.shortcuts || item.shortcut) {
      weight += 15; // Items with shortcuts are more important
    }
    
    return Math.max(1, Math.min(100, weight));
  }

  private calculateCommandWeight(cmd: CommandDefinition): number {
    let weight = 60; // Commands generally have higher priority
    
    if (cmd.shortcuts) {
      weight += cmd.shortcuts.length * 5;
    }
    
    if (cmd.category === 'core' || cmd.category === 'system') {
      weight += 15;
    }
    
    return Math.min(100, weight);
  }

  private calculateWorkflowWeight(workflow: any): number {
    let weight = 40; // Workflows generally lower priority than direct commands
    
    if (workflow.steps) {
      weight += Math.min(20, workflow.steps.length * 2);
    }
    
    return Math.min(100, weight);
  }

  private determineItemType(item: MenuItemDefinition): 'menu' | 'command' | 'workflow' | 'external' {
    if (item.type === 'workflow') return 'workflow';
    if (item.submenu) return 'menu';
    if (item.command || item.action) return 'command';
    return 'external';
  }

  private extractDependencies(item: MenuItemDefinition): string[] | undefined {
    const deps: string[] = [];
    
    if (TypeGuards.isNonEmptyString(item.submenu)) {
      deps.push(item.submenu);
    }
    
    return deps.length > 0 ? deps : undefined;
  }

  private extractCommandDependencies(cmd: CommandDefinition): string[] | undefined {
    const deps: string[] = [];
    
    if (cmd.workflow?.steps) {
      cmd.workflow.steps.forEach(step => {
        if (step.command) {
          deps.push(step.command);
        }
      });
    }
    
    return deps.length > 0 ? deps : undefined;
  }

  private extractWorkflowDependencies(workflow: any): string[] | undefined {
    const deps: string[] = [];
    
    if (workflow.steps) {
      workflow.steps.forEach((step: any) => {
        if (step.command) {
          deps.push(step.command);
        }
      });
    }
    
    return deps.length > 0 ? deps : undefined;
  }

  private extractPerformanceHints(menu: MenuDefinition): RoutePerformanceHints {
    return {
      loadingStrategy: 'eager',
      preloadDependencies: [],
      cacheStrategy: 'memory',
      criticalPath: false
    };
  }

  private extractItemPerformanceHints(item: MenuItemDefinition): RoutePerformanceHints {
    return {
      loadingStrategy: item.type === 'workflow' ? 'progressive' : 'eager',
      preloadDependencies: [],
      cacheStrategy: 'memory',
      criticalPath: Boolean(item.shortcuts || item.shortcut)
    };
  }

  private extractCommandPerformanceHints(cmd: CommandDefinition): RoutePerformanceHints {
    return {
      loadingStrategy: cmd.workflow ? 'progressive' : 'eager',
      preloadDependencies: [],
      cacheStrategy: 'memory',
      criticalPath: Boolean(cmd.shortcuts)
    };
  }

  private estimateWorkflowExecutionTime(workflow: any): number {
    if (workflow.steps) {
      return workflow.steps.length * 500; // Estimate 500ms per step
    }
    return 1000; // Default estimate
  }

  private applyGlobalPerformanceHints(graph: NavigationGraph, performance: any): void {
    if (performance.criticalPath) {
      performance.criticalPath.forEach((path: string) => {
        for (const [routeId, route] of graph.routes.entries()) {
          if (route.path.join(':').includes(path)) {
            route.performanceHints = route.performanceHints || {} as RoutePerformanceHints;
            route.performanceHints.criticalPath = true;
            route.weight = Math.min(100, route.weight + 10);
          }
        }
      });
    }
  }

  private optimizeDependencies(graph: NavigationGraph): void {
    for (const [routeId, route] of graph.routes.entries()) {
      if (route.dependencies) {
        graph.dependencies.set(routeId, route.dependencies);
      }
    }
  }

  private updateRouteWeights(graph: NavigationGraph, optimization: NavigationOptimization): void {
    optimization.frequentlyUsedRoutes.forEach((routeId, index) => {
      const route = graph.routes.get(routeId);
      if (route) {
        const boost = Math.max(5, 20 - index * 2);
        route.weight = Math.min(100, route.weight + boost);
      }
    });
  }

  private buildNavigationGraphFromRoute(route: NavigationRoute): NavigationGraph {
    // This is a simplified version - in a real implementation,
    // you'd need to reconstruct the full graph from cached data
    const graph: NavigationGraph = {
      routes: new Map([[route.id, route]]),
      shortcuts: new Map(),
      dependencies: new Map(),
      optimizedPaths: new Map(),
      accessMetrics: new Map()
    };
    
    return graph;
  }

  // Public methods for metrics and optimization
  getMetrics(): NavigationMetrics {
    return this.metrics;
  }

  getCacheStats(): { hitRate: number; size: number; maxSize: number } {
    return this.cache.getCacheStats();
  }

  clearCache(): void {
    this.cache.clear();
  }

  recordRouteAccess(routeId: string, executionTime: number): void {
    this.metrics.recordAccess(routeId, executionTime);
  }
}
