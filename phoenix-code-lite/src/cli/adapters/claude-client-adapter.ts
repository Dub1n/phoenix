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