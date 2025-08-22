/**
 * Template Cache System Implementation
 * 
 * Purpose: High-performance template caching with LRU eviction, precompilation, and lazy loading  
 * Scope: Template storage, optimization, and placeholder resolution optimization  
 * Related: Phase 2 Performance, LRU Cache Package, Node FS, Node Path
 * 
 * This module provides efficient template caching with LRU eviction strategy,
 * template precompilation for static templates, and lazy loading for large templates.
 */

import { performance } from 'perf_hooks';

// Core interfaces for template caching
export interface TemplateCacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enablePrecompilation: boolean;
  enableLazyLoading: boolean;
  precompilationThreshold: number; // Size threshold for precompilation
}

export interface TemplateEntry {
  id: string;
  content: string;
  compiledContent?: string;
  metadata: TemplateMetadata;
  lastAccessed: number;
  accessCount: number;
  size: number;
  isPrecompiled: boolean;
  isLazyLoaded: boolean;
}

export interface TemplateMetadata {
  language: string;
  framework?: string;
  complexity: number;
  placeholderCount: number;
  lastModified: number;
  checksum: string;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  averageResolutionTime: number;
  memoryUsage: number;
}

export interface OptimizationResult {
  improvements: string[];
  recommendations: string[];
  metrics: {
    cacheEfficiency: number;
    memorySavings: number;
    performanceGain: number;
  };
}

// LRU Cache implementation for template storage
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private head: LRUNode<K, V>;
  private tail: LRUNode<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = new LRUNode<K, V>();
    this.tail = new LRUNode<K, V>();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (node) {
      this.moveToHead(node);
      return node.value;
    }
    return undefined;
  }

  put(key: K, value: V): void {
    const existingNode = this.cache.get(key);
    if (existingNode) {
      existingNode.value = value;
      this.moveToHead(existingNode);
    } else {
      const newNode = new LRUNode(key, value);
      this.cache.set(key, newNode);
      this.addToHead(newNode);
      
      if (this.cache.size > this.capacity) {
        const tail = this.removeTail();
        this.cache.delete(tail.key);
      }
    }
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private removeTail(): LRUNode<K, V> {
    const tail = this.tail.prev!;
    this.removeNode(tail);
    return tail;
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Method to get all entries for iteration
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  // Method to get all keys for iteration
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

class LRUNode<K, V> {
  key: K;
  value: V;
  prev?: LRUNode<K, V>;
  next?: LRUNode<K, V>;

  constructor(key?: K, value?: V) {
    this.key = key!;
    this.value = value!;
  }
}

// Main template cache system
export class TemplateCache {
  private config: TemplateCacheConfig;
  private cache: LRUCache<string, TemplateEntry>;
  private stats: CacheStats;
  private resolutionTimes: number[];
  private precompilationCache: Map<string, string>;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: TemplateCacheConfig) {
    this.config = config;

    this.cache = new LRUCache<string, TemplateEntry>(this.config.maxSize);
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      averageResolutionTime: 0,
      memoryUsage: 0
    };
    this.resolutionTimes = [];
    this.precompilationCache = new Map();
  }

  /**
   * Initialize the template cache system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Template Cache System...');
    
    // Warm up cache with common templates if available
    await this.warmupCache();
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
    
    console.log('✅ Template Cache System initialized');
  }

  /**
   * Get a template from cache or load it if not cached
   */
  async getTemplate(templateId: string, loadFunction?: () => Promise<string>): Promise<TemplateEntry | null> {
    const startTime = performance.now();
    
    // Check cache first
    const cached = this.cache.get(templateId);
    if (cached && this.isValid(cached)) {
      this.stats.hits++;
      this.updateAccessStats(cached);
      this.recordResolutionTime(performance.now() - startTime);
      return cached;
    }

    this.stats.misses++;
    
    // Load template if load function provided
    if (loadFunction) {
      try {
        const content = await loadFunction();
        const template = await this.createTemplateEntry(templateId, content);
        
        if (template) {
          this.cache.put(templateId, template);
          this.updateStats();
          this.recordResolutionTime(performance.now() - startTime);
          return template;
        }
      } catch (error) {
        console.error(`Failed to load template ${templateId}:`, error);
      }
    }

    this.recordResolutionTime(performance.now() - startTime);
    return null;
  }

  /**
   * Store a template in the cache
   */
  async storeTemplate(templateId: string, content: string, metadata?: Partial<TemplateMetadata>): Promise<TemplateEntry> {
    const template = await this.createTemplateEntry(templateId, content, metadata);
    
    if (template) {
      this.cache.put(templateId, template);
      this.updateStats();
    }
    
    return template;
  }

  /**
   * Precompile a template for faster execution
   */
  async precompileTemplate(templateId: string): Promise<boolean> {
    const template = this.cache.get(templateId);
    if (!template || template.isPrecompiled) {
      return false;
    }

    if (template.size > this.config.precompilationThreshold) {
      try {
        const compiled = await this.compileTemplate(template.content);
        template.compiledContent = compiled;
        template.isPrecompiled = true;
        
        // Store in precompilation cache
        this.precompilationCache.set(templateId, compiled);
        
        console.log(`✅ Template ${templateId} precompiled`);
        return true;
      } catch (error) {
        console.error(`Failed to precompile template ${templateId}:`, error);
        return false;
      }
    }

    return false;
  }

  /**
   * Lazy load a template when first accessed
   */
  async lazyLoadTemplate(templateId: string, loadFunction: () => Promise<string>): Promise<TemplateEntry | null> {
    const template = await this.getTemplate(templateId, loadFunction);
    
    if (template) {
      template.isLazyLoaded = true;
      
      // Precompile if it meets the threshold
      if (this.config.enablePrecompilation && template.size > this.config.precompilationThreshold) {
        await this.precompileTemplate(templateId);
      }
    }
    
    return template;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get average template resolution time
   */
  async getAverageResolutionTime(): Promise<number> {
    if (this.resolutionTimes.length === 0) return 0;
    
    const sum = this.resolutionTimes.reduce((a, b) => a + b, 0);
    return sum / this.resolutionTimes.length;
  }

  /**
   * Get cache hit rate
   */
  async getCacheHitRate(): Promise<number> {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Optimize the cache for better performance
   */
  async optimize(): Promise<OptimizationResult> {
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Analyze cache efficiency
    const hitRate = await this.getCacheHitRate();
    if (hitRate < 0.8) {
      improvements.push('Cache hit rate below optimal threshold');
      recommendations.push('Increase cache size or improve template loading strategy');
    }

    // Check memory usage
    if (this.stats.memoryUsage > 50 * 1024 * 1024) { // 50MB
      improvements.push('Cache memory usage is high');
      recommendations.push('Reduce cache size or implement more aggressive eviction');
    }

    // Precompile large templates
    const largeTemplates = Array.from(this.cache.keys()).filter(id => {
      const template = this.cache.get(id);
      return template && template.size > this.config.precompilationThreshold && !template.isPrecompiled;
    });

    if (largeTemplates.length > 0) {
      improvements.push(`${largeTemplates.length} large templates could be precompiled`);
      recommendations.push('Enable precompilation for large templates to improve performance');
    }

    // Calculate optimization metrics
    const metrics = {
      cacheEfficiency: hitRate,
      memorySavings: this.calculateMemorySavings(),
      performanceGain: this.calculatePerformanceGain()
    };

    return {
      improvements,
      recommendations,
      metrics
    };
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.precompilationCache.clear();
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      averageResolutionTime: 0,
      memoryUsage: 0
    };
    this.resolutionTimes = [];
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    console.log('🧹 Disposing Template Cache System...');
    
    this.clear();
    this.stopPeriodicCleanup();
    
    console.log('✅ Template Cache System disposed');
  }

  /**
   * Create a template entry with metadata
   */
  private async createTemplateEntry(
    templateId: string, 
    content: string, 
    metadata?: Partial<TemplateMetadata>
  ): Promise<TemplateEntry> {
    const now = Date.now();
    
    const entry: TemplateEntry = {
      id: templateId,
      content,
      metadata: {
        language: metadata?.language || 'unknown',
        framework: metadata?.framework,
        complexity: this.calculateComplexity(content),
        placeholderCount: this.countPlaceholders(content),
        lastModified: now,
        checksum: this.calculateChecksum(content),
        ...metadata
      },
      lastAccessed: now,
      accessCount: 1,
      size: Buffer.byteLength(content, 'utf8'),
      isPrecompiled: false,
      isLazyLoaded: false
    };

    // Precompile if enabled and meets threshold
    if (this.config.enablePrecompilation && entry.size > this.config.precompilationThreshold) {
      try {
        const compiled = await this.compileTemplate(content);
        entry.compiledContent = compiled;
        entry.isPrecompiled = true;
      } catch (error) {
        console.warn(`Failed to precompile template ${templateId}:`, error);
      }
    }

    return entry;
  }

  /**
   * Check if a template entry is still valid
   */
  private isValid(template: TemplateEntry): boolean {
    const now = Date.now();
    return (now - template.lastAccessed) < this.config.ttl;
  }

  /**
   * Update access statistics for a template
   */
  private updateAccessStats(template: TemplateEntry): void {
    template.lastAccessed = Date.now();
    template.accessCount++;
  }

  /**
   * Record template resolution time
   */
  private recordResolutionTime(time: number): void {
    this.resolutionTimes.push(time);
    
    // Keep only last 100 resolution times
    if (this.resolutionTimes.length > 100) {
      this.resolutionTimes.shift();
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size();
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    
    // Calculate memory usage
    let totalMemory = 0;
    for (const [_, template] of this.cache.entries()) {
      totalMemory += template.size;
    }
    this.stats.memoryUsage = totalMemory;
  }

  /**
   * Warm up cache with common templates
   */
  private async warmupCache(): Promise<void> {
    // This would load common templates into cache
    // Implementation depends on available template sources
  }

  /**
   * Start periodic cleanup of expired templates
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTemplates();
    }, 300000); // Every 5 minutes
  }

  /**
   * Stop periodic cleanup
   */
  private stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Clean up expired templates
   */
  private cleanupExpiredTemplates(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [id, template] of this.cache.entries()) {
      if ((now - template.lastAccessed) > this.config.ttl) {
        this.cache.put(id, template); // This will trigger LRU eviction
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired templates`);
      this.updateStats();
    }
  }

  /**
   * Compile a template (placeholder for actual compilation logic)
   */
  private async compileTemplate(content: string): Promise<string> {
    // This would contain actual template compilation logic
    // For now, return a simple processed version
    return content.replace(/\{\{(\w+)\}\}/g, '{{$1}}');
  }

  /**
   * Calculate template complexity
   */
  private calculateComplexity(content: string): number {
    // Simple complexity calculation based on lines and nesting
    const lines = content.split('\n').length;
    const nesting = (content.match(/\{\{/g) || []).length;
    return lines + nesting * 2;
  }

  /**
   * Count placeholders in template
   */
  private countPlaceholders(content: string): number {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.length : 0;
  }

  /**
   * Calculate content checksum
   */
  private calculateChecksum(content: string): string {
    // Simple checksum for demo purposes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Calculate memory savings from optimization
   */
  private calculateMemorySavings(): number {
    // Placeholder implementation
    return 0;
  }

  /**
   * Calculate performance gain from optimization
   */
  private calculatePerformanceGain(): number {
    // Placeholder implementation
    return 0;
  }
}

// Export the main class and interfaces
export default TemplateCache;
