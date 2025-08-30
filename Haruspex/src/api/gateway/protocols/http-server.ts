/**---
 * title: [HTTP Server Protocol - Express.js Implementation]
 * tags: [HTTP, Server, Protocol, Express, Backend, API]
 * provides: [HTTP-Server-Protocol, Express-Integration, Request-Handling]
 * requires: [Express.js, HTTP-Config, Request-Response-Types]
 * description: [HTTP server protocol implementation using Express.js for Templum 2.1 compatibility]
 * ---*/

import { EventEmitter } from 'events';
import express = require('express');
import { HTTPRequest, HTTPResponse } from '../../types/api-contracts';

export interface HTTPServerConfig {
  port: number;
  cors: boolean;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
}

export interface HTTPRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: (req: HTTPRequest) => Promise<HTTPResponse>;
}

/**
 * HTTP Server Protocol Implementation
 * 
 * Provides Express.js-based HTTP server with:
 * - Templum-compatible endpoints (/getSkinDefinition, /executeCommand, /health)
 * - Standard REST API endpoints
 * - Middleware support for authentication, rate limiting, CORS
 * - Request/response transformation for API Gateway integration
 */
export class HTTPServer extends EventEmitter {
  private app: express.Application;
  private server?: any;
  private config: HTTPServerConfig;
  private routes: HTTPRoute[] = [];
  private middlewares: express.RequestHandler[] = [];
  private running = false;
  private activeRequestCount = 0;

  constructor(config: HTTPServerConfig) {
    super();
    this.config = config;
    this.app = express();
    this.setupMiddleware();
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('HTTP Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        // Apply all registered middleware
        this.middlewares.forEach(middleware => {
          this.app.use(middleware);
        });

        // Start the server
        this.server = this.app.listen(this.config.port, () => {
          this.running = true;
          console.log(`HTTP Server: Started on port ${this.config.port}`);
          this.emit('started', { port: this.config.port });
          resolve();
        });

        this.server.on('error', (error: Error) => {
          this.running = false;
          this.emit('error', error);
          reject(error);
        });

        // Track active requests
        this.server.on('request', () => {
          this.activeRequestCount++;
        });

        this.server.on('close', () => {
          this.activeRequestCount = Math.max(0, this.activeRequestCount - 1);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (!this.running || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.running = false;
        console.log('HTTP Server: Stopped');
        this.emit('stopped');
        resolve();
      });
    });
  }

  /**
   * Add middleware to the HTTP server
   */
  use(middleware: express.RequestHandler): void {
    if (this.running) {
      // If server is running, apply middleware immediately
      this.app.use(middleware);
    } else {
      // If server not running, store middleware for later application
      this.middlewares.push(middleware);
    }
  }

  /**
   * Register GET route
   */
  get(path: string, handler: (req: HTTPRequest) => Promise<HTTPResponse>): void {
    this.registerRoute('GET', path, handler);
  }

  /**
   * Register POST route
   */
  post(path: string, handler: (req: HTTPRequest) => Promise<HTTPResponse>): void {
    this.registerRoute('POST', path, handler);
  }

  /**
   * Register PUT route
   */
  put(path: string, handler: (req: HTTPRequest) => Promise<HTTPResponse>): void {
    this.registerRoute('PUT', path, handler);
  }

  /**
   * Register DELETE route
   */
  delete(path: string, handler: (req: HTTPRequest) => Promise<HTTPResponse>): void {
    this.registerRoute('DELETE', path, handler);
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get current active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequestCount;
  }

  /**
   * Get server configuration
   */
  getConfig(): HTTPServerConfig {
    return { ...this.config };
  }

  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS middleware if enabled
    if (this.config.cors) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`HTTP Server: ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });

    // Error handling middleware
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('HTTP Server: Error handling request:', err);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An internal server error occurred',
            details: err.message
          },
          timestamp: Date.now()
        });
      }
      
      this.emit('error', err);
    });
  }

  private registerRoute(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, handler: (req: HTTPRequest) => Promise<HTTPResponse>): void {
    const route: HTTPRoute = { method, path, handler };
    this.routes.push(route);

    // Convert Express request/response to our API contracts
    const expressHandler = async (req: express.Request, res: express.Response) => {
      try {
        this.activeRequestCount++;

        // Transform Express request to HTTPRequest
        const httpRequest: HTTPRequest = {
          method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
          path: req.path,
          headers: req.headers as Record<string, string>,
          body: req.body,
          query: req.query as Record<string, string>
        };

        // Call the handler
        const httpResponse: HTTPResponse = await handler(httpRequest);

        // Transform HTTPResponse to Express response
        res.status(httpResponse.status);
        
        // Set headers
        Object.entries(httpResponse.headers).forEach(([key, value]) => {
          res.header(key, value);
        });

        // Send response
        res.send(httpResponse.body);

      } catch (error) {
        console.error(`HTTP Server: Error in ${method} ${path}:`, error);
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'HANDLER_ERROR',
              message: 'Error processing request',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            timestamp: Date.now()
          });
        }

        this.emit('error', error);
      } finally {
        this.activeRequestCount = Math.max(0, this.activeRequestCount - 1);
      }
    };

    // Register with Express
    switch (method) {
      case 'GET':
        this.app.get(path, expressHandler);
        break;
      case 'POST':
        this.app.post(path, expressHandler);
        break;
      case 'PUT':
        this.app.put(path, expressHandler);
        break;
      case 'DELETE':
        this.app.delete(path, expressHandler);
        break;
    }

    console.log(`HTTP Server: Registered ${method} ${path}`);
  }
}