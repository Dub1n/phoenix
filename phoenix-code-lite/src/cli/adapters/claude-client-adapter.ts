/**---
 * title: [Claude Client Adapter - CLI Integration]
 * tags: [CLI, Adapter, Integration]
 * provides: [Adapter Functions, Client Wiring]
 * requires: [ClaudeCodeClient, IClaudeClient]
 * description: [Adapter layer to bridge CLI abstractions with the Claude client implementation.]
 * ---*/

import { IClaudeClient } from '../interfaces/claude-client';
import { ClaudeCodeClient } from '../../claude/client';
import { TaskContext, LLMResponse } from '../../types/workflow';

export class ClaudeClientAdapter implements IClaudeClient {
  private client: ClaudeCodeClient;

  constructor(client: ClaudeCodeClient) {
    this.client = client;
  }

  async sendMessage(message: string, context?: TaskContext): Promise<LLMResponse> {
    return await this.client.query(message, context);
  }

  isConnected(): boolean {
    // For now, assume always connected since the real client doesn't have this method
    return true;
  }

  async connect(): Promise<void> {
    // The real client doesn't have explicit connect/disconnect
    // This is a no-op for compatibility
  }

  async disconnect(): Promise<void> {
    // The real client doesn't have explicit connect/disconnect
    // This is a no-op for compatibility
  }
} 
