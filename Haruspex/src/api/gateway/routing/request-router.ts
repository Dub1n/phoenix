/**---
 * title: [Request Router - API Request Routing System]
 * tags: [Router, Request-Routing, API, Middleware, Backend]
 * provides: [Request-Router, Route-Configuration, Request-Handling, Policy-Enforcement]
 * requires: [HTTP-Requests, Route-Definitions, Middleware-Support]
 * description: [Request routing system with policy enforcement, timeout handling, and middleware support]
 * ---*/

export interface RouteConfig {
  priority: number;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
}

export interface RequestContext {
  method: string;
  payload: any;
  protocol: string;
  startTime: number;
  attemptCount?: number;
  metadata?: Record<string, any>;
}

export interface RouteHandler {
  (context: RequestContext): Promise<any>;
}

export interface MiddlewareFunction {
  (context: RequestContext, next: () => Promise<any>): Promise<any>;
}

/**
 * Request Router - Complete implementation with middleware support
 * 
 * Provides request routing with policy enforcement, timeout handling,
 * retry logic, and middleware pipeline for API Gateway operations.
 */
export class RequestRouter {
  private routes: Map<string, RouteConfig> = new Map();
  private middleware: MiddlewareFunction[] = [];
  private rateLimitTracking: Map<string, Array<number>> = new Map();

  /**
   * Add route configuration with policies
   */
  addRoute(method: string, config: RouteConfig): void {
    this.routes.set(method, config);
    console.log(`Request Router: Added route ${method} with priority ${config.priority}`);
  }

  /**
   * Get route configuration
   */
  getRoute(method: string): RouteConfig | undefined {
    return this.routes.get(method);
  }

  /**
   * Get all routes
   */
  getAllRoutes(): Map<string, RouteConfig> {
    return new Map(this.routes);
  }

  /**
   * Add middleware to the processing pipeline
   */
  use(middleware: MiddlewareFunction): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute request through routing pipeline with policies
   */
  async executeRequest(context: RequestContext, handler: RouteHandler): Promise<any> {
    const route = this.getRoute(context.method);
    
    if (!route) {
      throw new Error(`No route configuration found for method: ${context.method}`);
    }

    // Apply rate limiting
    await this.applyRateLimit(context, route);

    // Execute with retry logic
    return this.executeWithRetry(context, route, async () => {
      // Execute with timeout
      return this.executeWithTimeout(context, route, async () => {
        // Run through middleware pipeline
        return this.executeMiddlewarePipeline(context, handler);
      });
    });
  }

  /**
   * Check if request should be prioritized based on route priority
   */
  getRoutePriority(method: string): number {
    const route = this.getRoute(method);
    return route ? route.priority : Number.MAX_SAFE_INTEGER;
  }

  /**
   * Apply rate limiting based on route configuration
   */
  private async applyRateLimit(context: RequestContext, route: RouteConfig): Promise<void> {
    const key = `${context.protocol}:${context.method}`;
    const now = Date.now();
    
    // Get current requests for this route
    const requests = this.rateLimitTracking.get(key) || [];
    
    // Remove expired requests (outside window)
    const windowStart = now - route.rateLimit.windowMs;
    const validRequests = requests.filter(time => time > windowStart);
    
    // Check if rate limit exceeded
    if (validRequests.length >= route.rateLimit.requests) {
      throw new Error(`Rate limit exceeded for ${context.method}: ${validRequests.length}/${route.rateLimit.requests} requests in ${route.rateLimit.windowMs}ms window`);
    }
    
    // Add current request
    validRequests.push(now);
    this.rateLimitTracking.set(key, validRequests);
  }

  /**
   * Execute request with timeout policy
   */
  private async executeWithTimeout<T>(
    context: RequestContext, 
    route: RouteConfig, 
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${route.timeout}ms for method: ${context.method}`));
      }, route.timeout);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Execute request with retry policy
   */
  private async executeWithRetry<T>(
    context: RequestContext,
    route: RouteConfig,
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxAttempts = route.retries + 1; // Initial attempt + retries

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        context.attemptCount = attempt;
        
        if (attempt > 1) {
          console.log(`Request Router: Retry attempt ${attempt}/${maxAttempts} for method: ${context.method}`);
          
          // Add exponential backoff delay for retries
          const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await operation();
        
        if (attempt > 1) {
          console.log(`Request Router: Retry succeeded on attempt ${attempt} for method: ${context.method}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          console.error(`Request Router: All ${maxAttempts} attempts failed for method: ${context.method}`, lastError.message);
        } else {
          console.warn(`Request Router: Attempt ${attempt} failed for method: ${context.method}, retrying...`, lastError.message);
        }
      }
    }

    throw lastError || new Error(`All retry attempts failed for method: ${context.method}`);
  }

  /**
   * Execute middleware pipeline
   */
  private async executeMiddlewarePipeline(context: RequestContext, handler: RouteHandler): Promise<any> {
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= this.middleware.length) {
        // End of middleware chain, execute the actual handler
        return await handler(context);
      }

      const middleware = this.middleware[index++];
      return await middleware(context, next);
    };

    return await next();
  }

  /**
   * Get routing statistics
   */
  getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {
      totalRoutes: this.routes.size,
      middlewareCount: this.middleware.length,
      rateLimitTracking: this.rateLimitTracking.size,
      routes: {}
    };

    for (const [method, config] of Array.from(this.routes.entries())) {
      const requestHistory = this.rateLimitTracking.get(`http:${method}`) || [];
      const recentRequests = requestHistory.filter(time => 
        Date.now() - time < config.rateLimit.windowMs
      );

      stats.routes[method] = {
        priority: config.priority,
        timeout: config.timeout,
        retries: config.retries,
        rateLimit: config.rateLimit,
        currentRequests: recentRequests.length,
        rateLimitUtilization: `${recentRequests.length}/${config.rateLimit.requests}`
      };
    }

    return stats;
  }

  /**
   * Clear rate limiting history (useful for testing or maintenance)
   */
  clearRateLimitHistory(): void {
    this.rateLimitTracking.clear();
    console.log('Request Router: Rate limit history cleared');
  }
}