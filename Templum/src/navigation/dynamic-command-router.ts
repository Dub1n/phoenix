/**
---
date: 2025-09-13T103229Z
name: dynamic-command-router
TASK-ID: [TASK-MCP-009]
category: dynamic-routing
status: [T]
patterns: [dynamic-command-routing, speed-heuristics, dependency-optimization]
components: [DynamicCommandRouter, RouteResolver, CommandOptimizer]
dependencies: [skin-navigation-parser, performance-optimization, command-execution]
tags: [command-routing, optimization, speed-heuristics, dynamic-resolution]
---
*/

import { 
  SkinNavigationParser, 
  NavigationGraph, 
  NavigationRoute, 
  NavigationOptimization 
} from './skin-navigation-parser';
import { createLogger, normalizeLoggerError } from '../utils/logger';
import { UniversalSkinDefinition } from '../types/universal-skin-definition';

/**
 * TODO: [TASK-MCP-009-006] Pattern: dynamic-command-resolution | Complexity: 9 | Dependencies: navigation-graph,command-execution
 * Context: Dynamic command routing system that resolves commands through skin-defined navigation with speed optimization
 * Validation-Required: resolution-accuracy, performance-benchmarks, fallback-reliability
 * Pattern-Info: { approach: "graph-based-command-resolution", alternatives: "hash-table-lookup", trade-offs: "flexibility-vs-speed" }
 */

export interface CommandResolutionContext {
  skinDefinition?: UniversalSkinDefinition;
  currentPath?: string[];
  sessionHistory?: string[];
  userPreferences?: UserPreferences;
  performanceConstraints?: PerformanceConstraints;
}

export interface UserPreferences {
  preferredShortcuts: Map<string, string>;
  frequentCommands: string[];
  interactionStyle: 'beginner' | 'intermediate' | 'expert';
  speedPriority: 'accuracy' | 'speed' | 'balanced';
}

export interface PerformanceConstraints {
  maxResolutionTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  requireCaching: boolean;
  allowFallback: boolean;
}

export interface CommandResolutionResult {
  success: boolean;
  resolvedCommand?: string;
  resolvedAction?: string;
  route?: NavigationRoute;
  executionTime: number;
  method: 'direct' | 'fuzzy' | 'shortcut' | 'fallback' | 'cached';
  confidence: number; // 0-1
  alternatives?: string[];
  optimizationHints?: string[];
}

export interface SpeedHeuristics {
  shortcutPriorityMap: Map<string, number>;
  frequencyBasedWeights: Map<string, number>;
  contextualRelevance: Map<string, number>;
  executionTimeEstimates: Map<string, number>;
}

/**
 * TODO: [TASK-MCP-009-007] Pattern: intelligent-fuzzy-matching | Complexity: 7 | Dependencies: string-algorithms,performance-optimization
 * Context: Fuzzy matching system for command resolution with intelligent ranking and performance constraints
 * Validation-Required: matching-accuracy, ranking-quality, performance-boundaries
 * Pattern-Info: { approach: "levenshtein-with-context", alternatives: "soundex-matching", trade-offs: "accuracy-vs-speed" }
 */
export class FuzzyCommandMatcher {
  private maxEditDistance: number;
  private minConfidenceThreshold: number;

  constructor(maxEditDistance = 3, minConfidenceThreshold = 0.3) {
    this.maxEditDistance = maxEditDistance;
    this.minConfidenceThreshold = minConfidenceThreshold;
  }

  findMatches(input: string, candidates: string[]): Array<{ candidate: string; confidence: number; distance: number }> {
    const matches: Array<{ candidate: string; confidence: number; distance: number }> = [];
    const inputLower = input.toLowerCase().trim();

    for (const candidate of candidates) {
      const candidateLower = candidate.toLowerCase();
      
      // Exact match gets highest priority
      if (inputLower === candidateLower) {
        matches.push({ candidate, confidence: 1.0, distance: 0 });
        continue;
      }

      // Prefix match gets high priority
      if (candidateLower.startsWith(inputLower)) {
        const confidence = Math.max(0.8, inputLower.length / candidateLower.length);
        matches.push({ candidate, confidence, distance: 0 });
        continue;
      }

      // Contains match gets medium priority
      if (candidateLower.includes(inputLower)) {
        const confidence = Math.max(0.6, inputLower.length / candidateLower.length);
        matches.push({ candidate, confidence, distance: 1 });
        continue;
      }

      // Levenshtein distance for fuzzy matching
      const distance = this.levenshteinDistance(inputLower, candidateLower);
      if (distance <= this.maxEditDistance) {
        const maxLen = Math.max(inputLower.length, candidateLower.length);
        const confidence = Math.max(0, (maxLen - distance) / maxLen);
        
        if (confidence >= this.minConfidenceThreshold) {
          matches.push({ candidate, confidence, distance });
        }
      }
    }

    // Sort by confidence (descending) then by distance (ascending)
    return matches
      .sort((a, b) => {
        if (Math.abs(a.confidence - b.confidence) < 0.01) {
          return a.distance - b.distance;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Return top 10 matches
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize first row and column
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}

/**
 * TODO: [TASK-MCP-009-008] Pattern: route-resolution-engine | Complexity: 8 | Dependencies: navigation-graph,fuzzy-matching
 * Context: Core route resolution engine that finds optimal navigation paths with contextual awareness
 * Validation-Required: path-optimality, context-sensitivity, resolution-speed
 * Pattern-Info: { approach: "contextual-path-resolution", alternatives: "simple-lookup", trade-offs: "intelligence-vs-performance" }
 */
export class RouteResolver {
  private fuzzyMatcher: FuzzyCommandMatcher;
  private resolutionCache = new Map<string, { result: CommandResolutionResult; timestamp: number }>();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.fuzzyMatcher = new FuzzyCommandMatcher();
  }

  resolveRoute(
    input: string, 
    graph: NavigationGraph, 
    context: CommandResolutionContext = {}
  ): CommandResolutionResult {
    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(input, context);

    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      cached.executionTime = Date.now() - startTime;
      cached.method = 'cached';
      return cached;
    }

    try {
      // 1. Direct shortcut resolution (fastest)
      const shortcutResult = this.resolveShortcut(input, graph, context);
      if (shortcutResult.success) {
        shortcutResult.executionTime = Date.now() - startTime;
        this.cacheResult(cacheKey, shortcutResult);
        return shortcutResult;
      }

      // 2. Direct route lookup
      const directResult = this.resolveDirectRoute(input, graph, context);
      if (directResult.success) {
        directResult.executionTime = Date.now() - startTime;
        this.cacheResult(cacheKey, directResult);
        return directResult;
      }

      // 3. Fuzzy matching with context awareness
      const fuzzyResult = this.resolveFuzzyRoute(input, graph, context);
      if (fuzzyResult.success) {
        fuzzyResult.executionTime = Date.now() - startTime;
        this.cacheResult(cacheKey, fuzzyResult);
        return fuzzyResult;
      }

      // 4. Fallback resolution
      const fallbackResult = this.resolveFallbackRoute(input, graph, context);
      fallbackResult.executionTime = Date.now() - startTime;
      this.cacheResult(cacheKey, fallbackResult);
      return fallbackResult;

    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        method: 'fallback',
        confidence: 0,
        alternatives: ['help', 'status', 'refresh']
      };
    }
  }

  private resolveShortcut(
    input: string, 
    graph: NavigationGraph, 
    context: CommandResolutionContext
  ): CommandResolutionResult {
    const routeId = graph.shortcuts.get(input.trim());
    if (!routeId) {
      return { success: false, executionTime: 0, method: 'shortcut', confidence: 0 };
    }

    const route = graph.routes.get(routeId);
    if (!route) {
      return { success: false, executionTime: 0, method: 'shortcut', confidence: 0 };
    }

    // Apply user preferences to shortcut resolution
    let confidence = 0.95;
    if (context.userPreferences?.preferredShortcuts?.has(input)) {
      confidence = 1.0;
    }

    return {
      success: true,
      resolvedCommand: route.command,
      resolvedAction: route.action,
      route,
      executionTime: 0,
      method: 'shortcut',
      confidence,
      optimizationHints: ['shortcut-resolution-optimal']
    };
  }

  private resolveDirectRoute(
    input: string, 
    graph: NavigationGraph, 
    context: CommandResolutionContext
  ): CommandResolutionResult {
    const inputTrimmed = input.trim().toLowerCase();

    // Search through routes for direct matches
    for (const [routeId, route] of graph.routes.entries()) {
      // Check command match
      if (route.command && route.command.toLowerCase() === inputTrimmed) {
        return {
          success: true,
          resolvedCommand: route.command,
          resolvedAction: route.action,
          route,
          executionTime: 0,
          method: 'direct',
          confidence: 1.0,
          optimizationHints: ['direct-resolution-optimal']
        };
      }

      // Check action match
      if (route.action && route.action.toLowerCase() === inputTrimmed) {
        return {
          success: true,
          resolvedCommand: route.command,
          resolvedAction: route.action,
          route,
          executionTime: 0,
          method: 'direct',
          confidence: 1.0
        };
      }

      // Check path component match
      const lastPathComponent = route.path[route.path.length - 1]?.toLowerCase();
      if (lastPathComponent === inputTrimmed) {
        return {
          success: true,
          resolvedCommand: route.command,
          resolvedAction: route.action,
          route,
          executionTime: 0,
          method: 'direct',
          confidence: 0.9
        };
      }
    }

    return { success: false, executionTime: 0, method: 'direct', confidence: 0 };
  }

  private resolveFuzzyRoute(
    input: string, 
    graph: NavigationGraph, 
    context: CommandResolutionContext
  ): CommandResolutionResult {
    const candidates: string[] = [];
    const routeMap = new Map<string, NavigationRoute>();

    // Collect all possible candidates
    for (const [routeId, route] of graph.routes.entries()) {
      if (route.command) {
        candidates.push(route.command);
        routeMap.set(route.command, route);
      }
      if (route.action && route.action !== route.command) {
        candidates.push(route.action);
        routeMap.set(route.action, route);
      }
      
      // Include path components as candidates
      const lastPathComponent = route.path[route.path.length - 1];
      if (lastPathComponent && !routeMap.has(lastPathComponent)) {
        candidates.push(lastPathComponent);
        routeMap.set(lastPathComponent, route);
      }
    }

    // Add shortcut keys as candidates
    for (const shortcutKey of graph.shortcuts.keys()) {
      if (!candidates.includes(shortcutKey)) {
        candidates.push(shortcutKey);
        const routeId = graph.shortcuts.get(shortcutKey);
        const route = routeId ? graph.routes.get(routeId) : undefined;
        if (route) {
          routeMap.set(shortcutKey, route);
        }
      }
    }

    // Find fuzzy matches
    const matches = this.fuzzyMatcher.findMatches(input, candidates);
    
    if (matches.length === 0) {
      return { success: false, executionTime: 0, method: 'fuzzy', confidence: 0 };
    }

    // Apply contextual scoring
    const scoredMatches = matches.map(match => {
      const route = routeMap.get(match.candidate);
      let contextScore = match.confidence;

      if (route && context.userPreferences) {
        // Boost frequently used commands
        if (context.userPreferences.frequentCommands.includes(match.candidate)) {
          contextScore *= 1.2;
        }

        // Apply interaction style preferences
        if (context.userPreferences.interactionStyle === 'expert' && route.performanceHints?.criticalPath) {
          contextScore *= 1.1;
        }
      }

      return { ...match, contextScore, route };
    }).sort((a, b) => b.contextScore - a.contextScore);

    const bestMatch = scoredMatches[0];
    const alternatives = scoredMatches.slice(1, 4).map(m => m.candidate);

    return {
      success: true,
      resolvedCommand: bestMatch.route?.command,
      resolvedAction: bestMatch.route?.action,
      route: bestMatch.route,
      executionTime: 0,
      method: 'fuzzy',
      confidence: bestMatch.contextScore,
      alternatives,
      optimizationHints: bestMatch.contextScore < 0.8 ? ['consider-using-shortcuts'] : []
    };
  }

  private resolveFallbackRoute(
    input: string, 
    graph: NavigationGraph, 
    context: CommandResolutionContext
  ): CommandResolutionResult {
    // Look for compatibility routes first
    for (const [routeId, route] of graph.routes.entries()) {
      if (routeId.startsWith('compat:') && route.command === input.trim()) {
        return {
          success: true,
          resolvedCommand: route.command,
          resolvedAction: route.action,
          route,
          executionTime: 0,
          method: 'fallback',
          confidence: 0.8,
          optimizationHints: ['using-compatibility-mode']
        };
      }
    }

    // Generic fallback suggestions
    const suggestions = ['help', 'status', 'refresh'];
    return {
      success: false,
      executionTime: 0,
      method: 'fallback',
      confidence: 0,
      alternatives: suggestions,
      optimizationHints: ['command-not-found-consider-help']
    };
  }

  private buildCacheKey(input: string, context: CommandResolutionContext): string {
    const contextKeys = [
      context.currentPath?.join(':') || '',
      context.userPreferences?.interactionStyle || '',
      context.skinDefinition?.id || ''
    ].join('|');
    
    return `${input.trim().toLowerCase()}::${contextKeys}`;
  }

  private getCachedResult(cacheKey: string): CommandResolutionResult | null {
    const cached = this.resolutionCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.cacheExpiryMs) {
      this.resolutionCache.delete(cacheKey);
      return null;
    }

    return { ...cached.result }; // Return a copy
  }

  private cacheResult(cacheKey: string, result: CommandResolutionResult): void {
    // Don't cache failed resolutions or low-confidence results
    if (!result.success || result.confidence < 0.5) {
      return;
    }

    this.resolutionCache.set(cacheKey, {
      result: { ...result },
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.resolutionCache.size > 1000) {
      const oldestKeys = Array.from(this.resolutionCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 200)
        .map(([key]) => key);
      
      oldestKeys.forEach(key => this.resolutionCache.delete(key));
    }
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    // This would require additional tracking in a real implementation
    return {
      size: this.resolutionCache.size,
      maxSize: 1000,
      hitRate: 0 // Would need to track hits vs misses
    };
  }

  clearCache(): void {
    this.resolutionCache.clear();
  }
}

/**
 * Main dynamic command router class
 * TODO: [TASK-MCP-009-009] Pattern: dynamic-command-router-orchestration | Complexity: 9 | Dependencies: all-navigation-components
 * Context: Primary orchestration component that coordinates all dynamic routing functionality with optimization
 * Validation-Required: end-to-end-functionality, performance-benchmarks, reliability-testing
 * Pattern-Info: { approach: "comprehensive-routing-orchestration", alternatives: "simple-command-lookup", trade-offs: "capability-vs-complexity" }
 */
export class DynamicCommandRouter {
  private parser: SkinNavigationParser;
  private resolver: RouteResolver;
  private navigationGraphs = new Map<string, NavigationGraph>();
  private speedHeuristics = new Map<string, SpeedHeuristics>();
  private isInitialized = false;
  private readonly logger = createLogger('dynamic-command-router');

  constructor() {
    this.parser = new SkinNavigationParser({ compatibilityMode: true });
    this.resolver = new RouteResolver();
  }

  /**
   * Initialize the router with a skin definition
   */
  async initialize(skinDefinition: UniversalSkinDefinition): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Parse navigation from skin definition
      const navigationGraph = this.parser.parseSkinNavigation(skinDefinition);
      this.navigationGraphs.set(skinDefinition.id, navigationGraph);

      // Build speed heuristics for this skin
      const heuristics = this.buildSpeedHeuristics(navigationGraph);
      this.speedHeuristics.set(skinDefinition.id, heuristics);

      this.isInitialized = true;

      const initTime = Date.now() - startTime;
      this.logger.info('Dynamic command router initialized', {
        skinId: skinDefinition.id,
        initializationTimeMs: initTime,
        routeCount: navigationGraph.routes.size,
        shortcutCount: navigationGraph.shortcuts.size,
        optimizedPathCount: navigationGraph.optimizedPaths.size
      });

    } catch (error) {
      const { error: normalizedError, data } = normalizeLoggerError(error);
      const metadata: Record<string, unknown> = {
        skinId: skinDefinition.id
      };

      if (data !== undefined) {
        metadata.originalData = data;
      }

      this.logger.error('Dynamic command router initialization failed', normalizedError ?? undefined, metadata);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Resolve a command input to actionable result
   */
  resolveCommand(
    input: string, 
    skinId: string, 
    context: CommandResolutionContext = {}
  ): CommandResolutionResult {
    if (!this.isInitialized) {
      return {
        success: false,
        executionTime: 0,
        method: 'fallback',
        confidence: 0,
        alternatives: ['Router not initialized']
      };
    }

    const navigationGraph = this.navigationGraphs.get(skinId);
    if (!navigationGraph) {
      return {
        success: false,
        executionTime: 0,
        method: 'fallback',
        confidence: 0,
        alternatives: ['Skin not found']
      };
    }

    // Apply speed heuristics to context
    const optimizedContext = this.applySpeedHeuristics(context, skinId);

    // Resolve using the route resolver
    const result = this.resolver.resolveRoute(input, navigationGraph, optimizedContext);

    // Record metrics
    if (result.route) {
      this.parser.recordRouteAccess(result.route.id, result.executionTime);
    }

    return result;
  }

  /**
   * Check if a command should be handled locally vs forwarded to backend
   */
  isLocalCommand(input: string, skinId: string): boolean {
    const result = this.resolveCommand(input, skinId);
    
    if (!result.success || !result.route) {
      return false;
    }

    // Check if route is marked as local/compatibility command
    return result.route.id.startsWith('compat:') || 
           result.route.path.includes('compatibility') ||
           result.route.performanceHints?.criticalPath === true;
  }

  /**
   * Get suggested shortcuts for a skin
   */
  getSuggestedShortcuts(skinId: string, maxSuggestions = 10): Map<string, string> {
    const optimization = this.parser.getMetrics().getOptimizationRecommendations();
    const suggestions = new Map<string, string>();

    let index = 1;
    for (const routeId of optimization.frequentlyUsedRoutes) {
      if (index > maxSuggestions) break;
      
      const graph = this.navigationGraphs.get(skinId);
      const route = graph?.routes.get(routeId);
      
      if (route && route.command) {
        suggestions.set(index.toString(), route.command);
        index++;
      }
    }

    return suggestions;
  }

  /**
   * Get navigation paths for breadcrumb display
   */
  getNavigationPaths(skinId: string): Map<string, string[]> {
    const graph = this.navigationGraphs.get(skinId);
    if (!graph) return new Map();

    return new Map(graph.optimizedPaths);
  }

  /**
   * Get performance metrics for the router
   */
  getPerformanceMetrics(skinId?: string): any {
    const globalMetrics = this.parser.getMetrics().getGlobalMetrics();
    const cacheStats = this.resolver.getCacheStats();
    const parserCacheStats = this.parser.getCacheStats();

    const result: any = {
      global: globalMetrics,
      cache: {
        resolver: cacheStats,
        parser: parserCacheStats
      },
      initialized: this.isInitialized,
      skinCount: this.navigationGraphs.size
    };

    if (skinId) {
      const graph = this.navigationGraphs.get(skinId);
      if (graph) {
        result['skinSpecific'] = {
          routes: graph.routes.size,
          shortcuts: graph.shortcuts.size,
          optimizedPaths: graph.optimizedPaths.size
        };
      }
    }

    return result;
  }

  /**
   * Update router with new skin definition
   */
  async updateSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    await this.initialize(skinDefinition);
  }

  /**
   * Build speed heuristics for a navigation graph
   */
  private buildSpeedHeuristics(graph: NavigationGraph): SpeedHeuristics {
    const heuristics: SpeedHeuristics = {
      shortcutPriorityMap: new Map(),
      frequencyBasedWeights: new Map(),
      contextualRelevance: new Map(),
      executionTimeEstimates: new Map()
    };

    // Build shortcut priority map
    for (const [shortcut, routeId] of graph.shortcuts.entries()) {
      const route = graph.routes.get(routeId);
      if (route) {
        heuristics.shortcutPriorityMap.set(shortcut, route.weight);
      }
    }

    // Build frequency-based weights from metrics
    const optimization = this.parser.getMetrics().getOptimizationRecommendations();
    optimization.frequentlyUsedRoutes.forEach((routeId, index) => {
      const weight = Math.max(10, 100 - (index * 10));
      heuristics.frequencyBasedWeights.set(routeId, weight);
    });

    // Build execution time estimates
    for (const [routeId, route] of graph.routes.entries()) {
      let estimatedTime = 100; // Default 100ms
      
      if (route.performanceHints?.estimatedExecutionTime) {
        estimatedTime = route.performanceHints.estimatedExecutionTime;
      } else if (route.type === 'workflow') {
        estimatedTime = 1000; // Workflows generally take longer
      } else if (route.performanceHints?.criticalPath) {
        estimatedTime = 50; // Critical path routes should be faster
      }

      heuristics.executionTimeEstimates.set(routeId, estimatedTime);
    }

    return heuristics;
  }

  /**
   * Apply speed heuristics to resolution context
   */
  private applySpeedHeuristics(
    context: CommandResolutionContext, 
    skinId: string
  ): CommandResolutionContext {
    const heuristics = this.speedHeuristics.get(skinId);
    if (!heuristics) return context;

    // Create optimized context with speed preferences
    const optimizedContext: CommandResolutionContext = {
      ...context,
      performanceConstraints: {
        maxResolutionTime: 50, // Target 50ms resolution time
        maxMemoryUsage: 10, // 10MB limit
        requireCaching: true,
        allowFallback: true,
        ...context.performanceConstraints
      }
    };

    // Apply user preferences if not set
    if (!optimizedContext.userPreferences) {
      optimizedContext.userPreferences = {
        preferredShortcuts: new Map(),
        frequentCommands: [],
        interactionStyle: 'intermediate' as const,
        speedPriority: 'balanced' as const
      };
    }

    return optimizedContext;
  }

  /**
   * Dispose resources and cleanup
   */
  dispose(): void {
    this.navigationGraphs.clear();
    this.speedHeuristics.clear();
    this.parser.clearCache();
    this.resolver.clearCache();
    this.isInitialized = false;
  }
}
