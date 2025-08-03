"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockClaudeServer = void 0;
const http_1 = require("http");
const url_1 = require("url");
class MockClaudeServer {
    constructor() {
        this.server = null;
        this.port = 3001;
        this.responseMode = 'success';
        this.requestCount = 0;
    }
    async start() {
        return new Promise((resolve) => {
            this.server = (0, http_1.createServer)((req, res) => {
                this.handleRequest(req, res);
            });
            this.server.listen(this.port, () => {
                console.log(`Mock Claude server started on port ${this.port}`);
                resolve();
            });
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Mock Claude server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    setResponseMode(mode) {
        this.responseMode = mode;
    }
    handleRequest(req, res) {
        this.requestCount++;
        // Parse request
        const url = new url_1.URL(req.url, `http://localhost:${this.port}`);
        const path = url.pathname;
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        // Handle different response modes
        switch (this.responseMode) {
            case 'failure':
                this.sendFailureResponse(res);
                break;
            case 'intermittent-failure':
                if (this.requestCount % 3 === 0) {
                    this.sendSuccessResponse(res, path);
                }
                else {
                    this.sendFailureResponse(res);
                }
                break;
            case 'slow':
                setTimeout(() => {
                    this.sendSuccessResponse(res, path);
                }, 5000);
                break;
            case 'success':
            default:
                this.sendSuccessResponse(res, path);
                break;
        }
    }
    sendSuccessResponse(res, path) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        let response;
        if (path.includes('/chat') || path.includes('/messages')) {
            response = {
                content: [
                    {
                        type: 'text',
                        text: this.generateMockCode(),
                    },
                ],
                usage: {
                    input_tokens: 100,
                    output_tokens: 200,
                    total_tokens: 300,
                },
            };
        }
        else {
            response = { success: true, message: 'Mock response' };
        }
        res.end(JSON.stringify(response));
    }
    sendFailureResponse(res) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({
            error: 'Mock server error for testing',
            type: 'api_error',
        }));
    }
    generateMockCode() {
        const mockImplementations = [
            `// Calculator function implementation
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

module.exports = { add };`,
            `// Test file for calculator
const { add } = require('./calculator');

describe('Calculator', () => {
  test('should add two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
  
  test('should add negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
  });
  
  test('should throw error for non-numbers', () => {
    expect(() => add('a', 1)).toThrow('Both arguments must be numbers');
  });
});`,
            `// Express API endpoint
const express = require('express');
const router = express.Router();

router.post('/calculate', (req, res) => {
  const { a, b, operation } = req.body;
  
  if (typeof a !== 'number' || typeof b !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  let result;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    default:
      return res.status(400).json({ error: 'Invalid operation' });
  }
  
  res.json({ result });
});

module.exports = router;`,
        ];
        return mockImplementations[this.requestCount % mockImplementations.length];
    }
}
exports.MockClaudeServer = MockClaudeServer;
//# sourceMappingURL=mock-claude.js.map