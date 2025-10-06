import type { UniversalSkinDefinition } from '../../../types/universal-skin-engine-types';

export class MockBackendConnection {
  public connected = false;
  public readonly skinDefinition: UniversalSkinDefinition;
  public readonly id: string;
  public readonly protocol: 'ipc' | 'http' | 'websocket';
  public readonly endpoint: string;

  constructor(skinDefinition: UniversalSkinDefinition) {
    this.skinDefinition = skinDefinition;
    this.id =
      skinDefinition.backendConfig?.service ||
      skinDefinition.metadata?.backendService ||
      skinDefinition.metadata?.backend ||
      skinDefinition.id;
    this.protocol = skinDefinition.backendConfig?.protocol || 'http';
    this.endpoint = skinDefinition.backendConfig?.endpoint || 'http://localhost:3000';
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

  async getSkinDefinition(): Promise<UniversalSkinDefinition> {
    return this.skinDefinition;
  }

  async executeCommand(command: string, args?: unknown[]): Promise<any> {
    return { success: true, result: `Executed ${command} with args: ${JSON.stringify(args)}` };
  }

  async getCapabilities(): Promise<string[]> {
    return Object.keys(this.skinDefinition.commands || {});
  }

  async getVersion(): Promise<string> {
    return this.skinDefinition.metadata?.version ?? '0.0.0';
  }
}
