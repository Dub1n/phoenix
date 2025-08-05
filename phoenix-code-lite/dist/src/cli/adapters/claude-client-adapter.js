"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeClientAdapter = void 0;
class ClaudeClientAdapter {
    constructor(client) {
        this.client = client;
    }
    async sendMessage(message, context) {
        return await this.client.query(message, context);
    }
    isConnected() {
        // For now, assume always connected since the real client doesn't have this method
        return true;
    }
    async connect() {
        // The real client doesn't have explicit connect/disconnect
        // This is a no-op for compatibility
    }
    async disconnect() {
        // The real client doesn't have explicit connect/disconnect
        // This is a no-op for compatibility
    }
}
exports.ClaudeClientAdapter = ClaudeClientAdapter;
//# sourceMappingURL=claude-client-adapter.js.map