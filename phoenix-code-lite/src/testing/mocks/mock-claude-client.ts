/**---
 * title: [Mock Claude Client - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockClaudeClient]
 * requires: []
 * description: [Mock implementation of IClaudeClient for unit and integration tests.]
 * ---*/

import { IClaudeClient } from '../../cli/interfaces/claude-client';
import { TaskContext, LLMResponse } from '../../types/workflow';

export class MockClaudeClient implements IClaudeClient {
  private connected: boolean = false;
  private messages: Array<{message: string, context?: TaskContext}> = [];

  async sendMessage(message: string, context?: TaskContext): Promise<LLMResponse> {
    this.messages.push({message, context});
    
    return {
      content: `Mock response for: ${message.slice(0, 50)}...`,
      usage: { inputTokens: 100, outputTokens: 50 },
      metadata: { model: 'claude-mock', timestamp: new Date().toISOString() }
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  getMessageHistory() {
    return this.messages;
  }

  clearMessageHistory() {
    this.messages = [];
  }
} 
