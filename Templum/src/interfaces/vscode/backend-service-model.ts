export type BackendHealthState = 'healthy' | 'degraded' | 'unhealthy' | 'error' | 'unknown';

export interface BackendStatusSnapshot {
  connected: boolean;
  health?: BackendHealthState;
  capabilities?: string[];
  lastCheck?: number;
  responseTime?: number;
  version?: string;
  errorMessage?: string;
}

export interface BackendServiceInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'degraded';
  description?: string;
  capabilities?: string[];
  lastActivity?: number;
  health?: BackendHealthState;
  responseTime?: number;
  version?: string;
  errorMessage?: string;
}
