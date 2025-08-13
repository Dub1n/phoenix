"use strict";
/**---
 * title: [Mock Claude Client - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockClaudeClient]
 * requires: []
 * description: [Mock implementation of IClaudeClient for unit and integration tests.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockClaudeClient = void 0;
class MockClaudeClient {
    constructor() {
        this.connected = false;
        this.messages = [];
    }
    async sendMessage(message, context) {
        this.messages.push({ message, context });
        return {
            content: `Mock response for: ${message.slice(0, 50)}...`,
            usage: { inputTokens: 100, outputTokens: 50 },
            metadata: { model: 'claude-mock', timestamp: new Date().toISOString() }
        };
    }
    isConnected() {
        return this.connected;
    }
    async connect() {
        this.connected = true;
    }
    async disconnect() {
        this.connected = false;
    }
    getMessageHistory() {
        return this.messages;
    }
    clearMessageHistory() {
        this.messages = [];
    }
}
exports.MockClaudeClient = MockClaudeClient;
//# sourceMappingURL=mock-claude-client.js.map