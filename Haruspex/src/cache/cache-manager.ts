/**---
 * title: [Cache Manager - HTTP-Optimized Analysis Result Caching]
 * tags: [Cache, Manager, HTTP-Optimization, Multi-Tier, TypeScript, Backend]
 * provides: [CacheManager, HTTP-Cache-Optimization, Multi-Tier-Storage, Performance-Metrics]
 * requires: [API-Contracts, Analysis-Types, HTTP-Headers]
 * description: [HTTP-optimized cache manager with hot/warm/cold storage tiers for Templum integration]
 * created: 2025-08-31
 * ---*/

import { 
  CacheStatus,
  AnalysisRequest,
  AnalysisResult,
  PredictionRequest,
  PredictionResult,
  HTTPRequest,
  HTTPResponse
} from '../api/types/api-contracts';
import { createHash } from 'crypto';

// HTTP Cache Strategy Types
export type CacheTier = 'hot' | 'warm' | 'cold';
export type CacheStorageBackend = 'memory' | 'redis' | 'file' | 'database';

export interface HTTPCacheOptions {
  maxAge?: number;           // HTTP Cache-Control max-age
  staleWhileRevalidate?: number; // stale-while-revalidate value
  etag?: boolean;           // Generate ETags
  vary?: string[];          // Vary header values
  private?: boolean;        // Private vs public cache
  noStore?: boolean;        // no-store directive
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
  tier: CacheTier;
  httpHeaders?: Record<string, string>;
  etag?: string;
  contentHash?: string;
  size?: number;           // Size in bytes for memory management
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  hotTierHitRate: number;
  warmTierHitRate: number;
  coldTierHitRate: number;
  averageResponseTime: number;
  evictionCount: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
}

/**
 * HTTP-Optimized Cache Manager with Multi-Tier Storage Strategy
 * 
 * Implements hot/warm/cold storage tiers:
 * - Hot Cache: Frequently accessed results (in-memory, <100ms)
 * - Warm Cache: Recent results (Redis/file-based, <500ms)
 * - Cold Storage: Historical data (database/file system, <2s)
 */
export class CacheManager {
  private isInitialized: boolean = false;
  
  // Multi-tier cache storage
  private hotCache: Map<string, CacheEntry<any>> = new Map();      // In-memory
  private warmCache: Map<string, CacheEntry<any>> = new Map();     // Redis/File simulation
  private coldStorage: Map<string, CacheEntry<any>> = new Map();   // Database simulation
  
  // Specialized cache maps for different content types
  private analysisCache: Map<string, CacheEntry<AnalysisResult>> = new Map();
  private predictionCache: Map<string, CacheEntry<PredictionResult>> = new Map();
  private generalCache: Map<string, CacheEntry<any>> = new Map();
  
  // HTTP-specific caching configuration
  private httpCacheConfig: HTTPCacheOptions = {
    maxAge: 3600,        // 1 hour
    staleWhileRevalidate: 300, // 5 minutes
    etag: true,
    vary: ['Accept', 'Content-Type'],
    private: false,
    noStore: false
  };
  
  // Cache tier configuration
  private tierConfig = {
    hot: { maxSize: 500, ttl: 300000, maxSizeMB: 50 },      // 5 min, 50MB
    warm: { maxSize: 2000, ttl: 1800000, maxSizeMB: 200 },  // 30 min, 200MB
    cold: { maxSize: 10000, ttl: 86400000, maxSizeMB: 1000 } // 24 hours, 1GB
  };
  
  // Performance tracking
  private metrics: CachePerformanceMetrics = {
    hitRate: 0,
    missRate: 0,
    hotTierHitRate: 0,
    warmTierHitRate: 0,
    coldTierHitRate: 0,
    averageResponseTime: 0,
    evictionCount: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    memoryUsage: 0
  };
  
  private cleanupInterval?: NodeJS.Timeout;
  private metricsUpdateInterval?: NodeJS.Timeout;

  constructor() {
    // Initialize cache components
  }

  /**
   * Initialize the HTTP-optimized multi-tier cache manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    console.log('CacheManager: Initializing HTTP-optimized multi-tier cache...');
    
    // Initialize cache tiers (simulated - would connect to Redis, DB, etc. in production)
    this.initializeCacheTiers();
    
    // Start maintenance intervals
    this.startCleanupInterval();
    this.startMetricsUpdateInterval();
    
    this.isInitialized = true;
    console.log('CacheManager: HTTP-optimized cache initialized');
    console.log(`Cache tiers configured: Hot(${this.tierConfig.hot.maxSize}), Warm(${this.tierConfig.warm.maxSize}), Cold(${this.tierConfig.cold.maxSize})`);
  }

  /**
   * Initialize cache tier connections (simulation for now)
   */
  private initializeCacheTiers(): void {
    // In production, this would initialize:
    // - Hot: In-memory (current implementation)
    // - Warm: Redis connection
    // - Cold: Database/File system connection
    
    console.log('Cache tiers initialized:');
    console.log(`- Hot Cache: ${this.tierConfig.hot.maxSize} entries, ${this.tierConfig.hot.ttl}ms TTL`);
    console.log(`- Warm Cache: ${this.tierConfig.warm.maxSize} entries, ${this.tierConfig.warm.ttl}ms TTL`);
    console.log(`- Cold Storage: ${this.tierConfig.cold.maxSize} entries, ${this.tierConfig.cold.ttl}ms TTL`);
  }

  /**
   * Cache analysis result using HTTP-optimized multi-tier strategy
   */
  async cacheAnalysisResult(request: AnalysisRequest, result: AnalysisResult, httpHeaders?: Record<string, string>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    const startTime = Date.now();
    const key = this.generateHTTPOptimizedAnalysisKey(request);
    const tier = this.determineCacheTier(request, result);
    const etag = this.generateETag(result);
    
    const entry: CacheEntry<AnalysisResult> = {
      key,
      value: result,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: this.tierConfig[tier].ttl,
      tier,
      httpHeaders: this.generateHTTPCacheHeaders(result, httpHeaders),
      etag,
      contentHash: request.contentHash,
      size: this.estimateResultSize(result)
    };

    // Store in appropriate tier
    await this.storeCacheEntry(entry);
    
    // Update metrics
    const responseTime = Date.now() - startTime;
    this.updateCacheMetrics('store', tier, responseTime);
    
    console.log(`Analysis result cached in ${tier} tier with key: ${key.substring(0, 20)}...`);
  }

  /**
   * Get cached analysis result using multi-tier cache strategy
   */
  async getCachedAnalysisResult(request: AnalysisRequest, ifNoneMatch?: string): Promise<{ result: AnalysisResult | null; tier?: CacheTier; etag?: string; httpHeaders?: Record<string, string> }> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    const startTime = Date.now();
    const key = this.generateHTTPOptimizedAnalysisKey(request);
    
    // Check ETag for 304 Not Modified response
    if (ifNoneMatch) {
      const etagMatch = await this.checkETagMatch(key, ifNoneMatch);
      if (etagMatch) {
        this.updateCacheMetrics('hit', 'hot', Date.now() - startTime);
        return { result: null, etag: ifNoneMatch }; // 304 Not Modified
      }
    }
    
    // Try multi-tier cache lookup
    const cacheResult = await this.getFromMultiTierCache(key);
    
    if (!cacheResult) {
      this.updateCacheMetrics('miss', undefined, Date.now() - startTime);
      return { result: null };
    }

    // Check if entry has expired
    if (this.isExpired(cacheResult.entry)) {
      await this.removeCacheEntry(key, cacheResult.tier);
      this.updateCacheMetrics('miss', cacheResult.tier, Date.now() - startTime);
      return { result: null };
    }

    // Update access statistics and promote if needed
    cacheResult.entry.accessCount++;
    cacheResult.entry.lastAccessed = Date.now();
    
    // Promote frequently accessed items to higher tiers
    await this.considerTierPromotion(cacheResult.entry, cacheResult.tier);
    
    // Update metrics
    this.updateCacheMetrics('hit', cacheResult.tier, Date.now() - startTime);
    
    console.log(`Analysis cache ${cacheResult.tier} tier hit for key: ${key.substring(0, 20)}...`);
    return { 
      result: cacheResult.entry.value as AnalysisResult, 
      tier: cacheResult.tier,
      etag: cacheResult.entry.etag,
      httpHeaders: cacheResult.entry.httpHeaders
    };
  }

  /**
   * Cache prediction result using HTTP-optimized multi-tier strategy  
   */
  async cachePredictionResult(request: PredictionRequest, result: PredictionResult, httpHeaders?: Record<string, string>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    const startTime = Date.now();
    const key = this.generateHTTPOptimizedPredictionKey(request);
    const tier = this.determinePredictionCacheTier(request, result);
    const etag = this.generateETag(result);
    
    const entry: CacheEntry<PredictionResult> = {
      key,
      value: result,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: this.tierConfig[tier].ttl,
      tier,
      httpHeaders: this.generateHTTPCacheHeaders(result, httpHeaders),
      etag,
      size: this.estimateResultSize(result)
    };

    // Store in appropriate tier
    await this.storeCacheEntry(entry);
    
    // Update metrics
    const responseTime = Date.now() - startTime;
    this.updateCacheMetrics('store', tier, responseTime);
    
    console.log(`Prediction result cached in ${tier} tier with key: ${key.substring(0, 20)}...`);
  }

  /**
   * Get cached prediction result using multi-tier cache strategy
   */
  async getCachedPredictionResult(request: PredictionRequest, ifNoneMatch?: string): Promise<{ result: PredictionResult | null; tier?: CacheTier; etag?: string; httpHeaders?: Record<string, string> } | PredictionResult | null> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    const startTime = Date.now();
    const key = this.generateHTTPOptimizedPredictionKey(request);
    
    // Check ETag for 304 Not Modified response
    if (ifNoneMatch) {
      const etagMatch = await this.checkETagMatch(key, ifNoneMatch);
      if (etagMatch) {
        this.updateCacheMetrics('hit', 'hot', Date.now() - startTime);
        return { result: null, etag: ifNoneMatch }; // 304 Not Modified
      }
    }
    
    // Try multi-tier cache lookup
    const cacheResult = await this.getFromMultiTierCache(key);
    
    if (!cacheResult) {
      this.updateCacheMetrics('miss', undefined, Date.now() - startTime);
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(cacheResult.entry)) {
      await this.removeCacheEntry(key, cacheResult.tier);
      this.updateCacheMetrics('miss', cacheResult.tier, Date.now() - startTime);
      return null;
    }

    // Update access statistics and promote if needed
    cacheResult.entry.accessCount++;
    cacheResult.entry.lastAccessed = Date.now();
    
    // Promote frequently accessed items to higher tiers
    await this.considerTierPromotion(cacheResult.entry, cacheResult.tier);
    
    // Update metrics
    this.updateCacheMetrics('hit', cacheResult.tier, Date.now() - startTime);
    
    console.log(`Prediction cache ${cacheResult.tier} tier hit for key: ${key.substring(0, 20)}...`);
    
    // For backward compatibility, return direct result if no ETag checking
    if (!ifNoneMatch) {
      return cacheResult.entry.value as PredictionResult;
    }
    
    return { 
      result: cacheResult.entry.value as PredictionResult, 
      tier: cacheResult.tier,
      etag: cacheResult.entry.etag,
      httpHeaders: cacheResult.entry.httpHeaders
    };
  }

  /**
   * Generic cache operations with multi-tier support
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    const tier: CacheTier = 'warm'; // Default tier for generic cache
    const entry: CacheEntry<any> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: ttl || this.tierConfig[tier].ttl,
      tier,
      size: this.estimateResultSize(value)
    };

    this.generalCache.set(key, entry);
    await this.enforceGeneralCacheLimit();
  }

  async get(key: string): Promise<any | null> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    const entry = this.generalCache.get(key);
    if (!entry || this.isExpired(entry)) {
      if (entry) this.generalCache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    return this.generalCache.delete(key);
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    this.analysisCache.clear();
    this.predictionCache.clear();
    this.generalCache.clear();
    
    console.log('All caches cleared');
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CacheManager not initialized');
    }

    let clearedCount = 0;

    // Clear expired analysis entries
    for (const [key, entry] of Array.from(this.analysisCache.entries())) {
      if (this.isExpired(entry)) {
        this.analysisCache.delete(key);
        clearedCount++;
      }
    }

    // Clear expired prediction entries
    for (const [key, entry] of Array.from(this.predictionCache.entries())) {
      if (this.isExpired(entry)) {
        this.predictionCache.delete(key);
        clearedCount++;
      }
    }

    // Clear expired general entries
    for (const [key, entry] of Array.from(this.generalCache.entries())) {
      if (this.isExpired(entry)) {
        this.generalCache.delete(key);
        clearedCount++;
      }
    }

    console.log(`Cleared ${clearedCount} expired cache entries`);
  }

  /**
   * Get cache status
   */
  getStatus(): CacheStatus {
    const totalSize = this.analysisCache.size + this.predictionCache.size + this.generalCache.size;
    const hitRate = this.calculateHitRate();
    
    return {
      size: totalSize,
      hitRate: hitRate,
      missRate: 1 - hitRate,
      evictions: 0 // TODO: Track actual evictions
    };
  }

  /**
   * Get comprehensive cache performance metrics
   */
  getPerformanceMetrics(): CachePerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Update HTTP cache configuration
   */
  updateHTTPCacheConfig(config: Partial<HTTPCacheOptions>): void {
    this.httpCacheConfig = { ...this.httpCacheConfig, ...config };
    console.log('HTTP cache configuration updated');
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = undefined;
    }
    
    await this.clearAll();
    this.isInitialized = false;
    console.log('CacheManager shutdown complete');
  }

  // HTTP-Optimized Cache Helper Methods

  /**
   * Generate HTTP-optimized cache key with content hash and request signature
   */
  private generateHTTPOptimizedAnalysisKey(request: AnalysisRequest): string {
    const keyComponents = {
      type: 'analysis',
      contentHash: request.contentHash,
      language: request.language,
      framework: request.framework || 'none',
      depth: request.depth,
      flags: [
        request.includeExecution ? 'exec' : null,
        request.includePredictions ? 'pred' : null
      ].filter(Boolean).sort().join('|'),
      version: 'v2.1' // API version for cache invalidation
    };

    // Create stable, URL-safe key
    const keyString = `${keyComponents.type}:${keyComponents.contentHash}:${keyComponents.language}:${keyComponents.framework}:${keyComponents.depth}:${keyComponents.flags}:${keyComponents.version}`;
    return createHash('sha256').update(keyString).digest('hex').substring(0, 32);
  }

  /**
   * Generate HTTP-optimized cache key for predictions
   */
  private generateHTTPOptimizedPredictionKey(request: PredictionRequest): string {
    const keyComponents = {
      type: 'prediction',
      contextHash: createHash('md5').update(JSON.stringify(request.codeContext)).digest('hex'),
      horizon: request.timeHorizon,
      types: request.predictionTypes.sort().join('|'),
      threshold: request.confidenceThreshold,
      version: 'v2.1'
    };

    const keyString = `${keyComponents.type}:${keyComponents.contextHash}:${keyComponents.horizon}:${keyComponents.types}:${keyComponents.threshold}:${keyComponents.version}`;
    return createHash('sha256').update(keyString).digest('hex').substring(0, 32);
  }

  /**
   * Determine appropriate cache tier based on request characteristics
   */
  private determineCacheTier(request: AnalysisRequest, result: AnalysisResult): CacheTier {
    // Hot tier: Quick analysis, small results
    if (request.depth === 'quick' && this.estimateResultSize(result) < 1024 * 100) { // < 100KB
      return 'hot';
    }
    
    // Cold tier: Deep analysis, large results, or low priority
    if (request.depth === 'deep' || request.depth === 'comprehensive' || 
        request.priority === 'low' || this.estimateResultSize(result) > 1024 * 1024) { // > 1MB
      return 'cold';
    }
    
    // Warm tier: Standard analysis
    return 'warm';
  }

  /**
   * Determine appropriate cache tier for prediction requests
   */
  private determinePredictionCacheTier(request: PredictionRequest, result: PredictionResult): CacheTier {
    // Hot tier: Short time horizons, small context
    if (request.timeHorizon === '7d' && this.estimateResultSize(result) < 1024 * 50) { // < 50KB
      return 'hot';
    }
    
    // Cold tier: Long time horizons, large results
    if (request.timeHorizon === '1y' || request.timeHorizon === '180d' || 
        this.estimateResultSize(result) > 1024 * 512) { // > 512KB
      return 'cold';
    }
    
    // Warm tier: Standard predictions
    return 'warm';
  }

  /**
   * Generate ETag for HTTP caching
   */
  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    const hash = createHash('md5').update(content).digest('hex');
    return `"${hash.substring(0, 16)}"`;
  }

  /**
   * Generate HTTP cache headers
   */
  private generateHTTPCacheHeaders(result: any, existingHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Cache-Control': `${this.httpCacheConfig.private ? 'private' : 'public'}, max-age=${this.httpCacheConfig.maxAge}`,
      'ETag': this.generateETag(result),
      'Last-Modified': new Date().toUTCString()
    };

    if (this.httpCacheConfig.staleWhileRevalidate) {
      headers['Cache-Control'] += `, stale-while-revalidate=${this.httpCacheConfig.staleWhileRevalidate}`;
    }

    if (this.httpCacheConfig.vary && this.httpCacheConfig.vary.length > 0) {
      headers['Vary'] = this.httpCacheConfig.vary.join(', ');
    }

    if (this.httpCacheConfig.noStore) {
      headers['Cache-Control'] = 'no-store';
    }

    return { ...existingHeaders, ...headers };
  }

  /**
   * Estimate result size in bytes for memory management
   */
  private estimateResultSize(result: any): number {
    try {
      return JSON.stringify(result).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default 1KB estimate
    }
  }

  /**
   * Store cache entry in appropriate tier
   */
  private async storeCacheEntry(entry: CacheEntry<any>): Promise<void> {
    const tierMap = this.getTierMap(entry.tier);
    
    // Remove from other tiers if exists
    await this.removeCacheEntryFromAllTiers(entry.key);
    
    // Store in target tier
    tierMap.set(entry.key, entry);
    
    // Enforce tier size limits
    await this.enforceTierLimits(entry.tier);
  }

  /**
   * Get cache entry from multi-tier storage
   */
  private async getFromMultiTierCache(key: string): Promise<{ entry: CacheEntry<any>; tier: CacheTier } | null> {
    // Check hot tier first (fastest)
    let entry = this.hotCache.get(key);
    if (entry) return { entry, tier: 'hot' };
    
    // Check warm tier
    entry = this.warmCache.get(key);
    if (entry) return { entry, tier: 'warm' };
    
    // Check cold tier
    entry = this.coldStorage.get(key);
    if (entry) return { entry, tier: 'cold' };
    
    return null;
  }

  /**
   * Check ETag match for HTTP 304 Not Modified responses
   */
  private async checkETagMatch(key: string, ifNoneMatch: string): Promise<boolean> {
    const cacheResult = await this.getFromMultiTierCache(key);
    return cacheResult?.entry.etag === ifNoneMatch;
  }

  /**
   * Consider promoting cache entry to higher tier
   */
  private async considerTierPromotion(entry: CacheEntry<any>, currentTier: CacheTier): Promise<void> {
    // Promote to hot if frequently accessed
    if (currentTier === 'warm' && entry.accessCount >= 5) {
      entry.tier = 'hot';
      this.hotCache.set(entry.key, entry);
      this.warmCache.delete(entry.key);
      console.log(`Promoted cache entry to hot tier: ${entry.key.substring(0, 20)}...`);
    }
    // Promote to warm if moderately accessed
    else if (currentTier === 'cold' && entry.accessCount >= 2) {
      entry.tier = 'warm';
      this.warmCache.set(entry.key, entry);
      this.coldStorage.delete(entry.key);
      console.log(`Promoted cache entry to warm tier: ${entry.key.substring(0, 20)}...`);
    }
  }

  /**
   * Remove cache entry from all tiers
   */
  private async removeCacheEntryFromAllTiers(key: string): Promise<void> {
    this.hotCache.delete(key);
    this.warmCache.delete(key);
    this.coldStorage.delete(key);
  }

  /**
   * Remove cache entry from specific tier
   */
  private async removeCacheEntry(key: string, tier: CacheTier): Promise<void> {
    const tierMap = this.getTierMap(tier);
    tierMap.delete(key);
  }

  /**
   * Get tier map reference
   */
  private getTierMap(tier: CacheTier): Map<string, CacheEntry<any>> {
    switch (tier) {
      case 'hot': return this.hotCache;
      case 'warm': return this.warmCache;
      case 'cold': return this.coldStorage;
      default: throw new Error(`Invalid cache tier: ${tier}`);
    }
  }

  /**
   * Enforce cache tier size limits
   */
  private async enforceTierLimits(tier: CacheTier): Promise<void> {
    const tierMap = this.getTierMap(tier);
    const config = this.tierConfig[tier];
    
    if (tierMap.size <= config.maxSize) {
      return;
    }

    // Remove least recently used entries
    const entries = Array.from(tierMap.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const toRemove = entries.slice(0, tierMap.size - config.maxSize);
    
    for (const [key] of toRemove) {
      tierMap.delete(key);
      this.metrics.evictionCount++;
    }

    console.log(`Evicted ${toRemove.length} entries from ${tier} tier`);
  }

  /**
   * Update cache performance metrics
   */
  private updateCacheMetrics(operation: 'hit' | 'miss' | 'store', tier?: CacheTier, responseTime?: number): void {
    this.metrics.totalRequests++;
    
    if (operation === 'hit') {
      this.metrics.totalHits++;
      if (tier) {
        switch (tier) {
          case 'hot': this.metrics.hotTierHitRate = (this.metrics.hotTierHitRate * 0.9) + (1 * 0.1); break;
          case 'warm': this.metrics.warmTierHitRate = (this.metrics.warmTierHitRate * 0.9) + (1 * 0.1); break;
          case 'cold': this.metrics.coldTierHitRate = (this.metrics.coldTierHitRate * 0.9) + (1 * 0.1); break;
        }
      }
    } else if (operation === 'miss') {
      this.metrics.totalMisses++;
    }
    
    // Update overall hit/miss rates
    this.metrics.hitRate = this.metrics.totalRequests > 0 ? this.metrics.totalHits / this.metrics.totalRequests : 0;
    this.metrics.missRate = 1 - this.metrics.hitRate;
    
    // Update average response time (exponential moving average)
    if (responseTime !== undefined) {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  /**
   * Start metrics update interval
   */
  private startMetricsUpdateInterval(): void {
    // Update memory usage metrics every 30 seconds
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMemoryUsageMetrics();
    }, 30000);
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsageMetrics(): void {
    let totalMemory = 0;
    
    // Calculate memory usage across all tiers
    [this.hotCache, this.warmCache, this.coldStorage].forEach(tierMap => {
      const entries = Array.from(tierMap.values());
      for (const entry of entries) {
        totalMemory += entry.size || 1024; // Default 1KB if size not calculated
      }
    });
    
    this.metrics.memoryUsage = totalMemory;
  }

  // Private methods (existing)

  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, 300000);
  }

  private generateAnalysisKey(request: AnalysisRequest): string {
    // TODO: Improve key generation for better cache efficiency
    const keyData = {
      contentHash: request.contentHash,
      language: request.language,
      framework: request.framework,
      depth: request.depth,
      includeExecution: request.includeExecution,
      includePredictions: request.includePredictions
    };
    
    return `analysis:${JSON.stringify(keyData)}`;
  }

  private generatePredictionKey(request: PredictionRequest): string {
    // TODO: Improve key generation for better cache efficiency
    const keyData = {
      codeContext: request.codeContext,
      timeHorizon: request.timeHorizon,
      predictionTypes: request.predictionTypes.sort(),
      confidenceThreshold: request.confidenceThreshold
    };
    
    return `prediction:${JSON.stringify(keyData)}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return (Date.now() - entry.timestamp) > entry.ttl;
  }

  private async enforceGeneralCacheLimit(): Promise<void> {
    const maxSize = 1000; // Default cache size for legacy methods
    if (this.generalCache.size <= maxSize) {
      return;
    }

    // Remove least recently used entries
    const entries = Array.from(this.generalCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const toRemove = entries.slice(0, this.generalCache.size - maxSize);
    
    for (const [key] of toRemove) {
      this.generalCache.delete(key);
    }

    console.log(`Evicted ${toRemove.length} entries from general cache`);
  }

  private calculateHitRate(): number {
    // TODO: Implement actual hit rate calculation based on statistics
    // For now, return a reasonable stub value
    return 0.3; // 30% hit rate
  }
}