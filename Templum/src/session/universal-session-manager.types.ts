import type { BackendType, InterfaceAdapter, InterfaceType } from '../types/templum-types';
import type { SessionContext } from './session-context-foundation';
import type { ITemplumOrchestrator } from '../interfaces/templum-orchestrator-interface';

export interface InterfaceStateData {
  currentView?: string;
  navigationStack?: string[];
  userPreferences?: Record<string, any>;
  temporaryData?: Record<string, any>;
  activeCommands?: string[];
  lastActivity?: Date;
}

export interface InterfaceStateTransferData {
  sessionId: string;
  fromInterface: InterfaceType;
  toInterface: InterfaceType;
  timestamp: number;
  sessionMetrics?: TemplumSessionMetrics;
  navigationHistory?: string[];
  loadedSkins?: string[];
  activeBackends?: BackendType[];
  preservedState?: InterfaceStateData;
}

export interface SessionCompletionInfo {
  completed: boolean;
  completedAt?: Date;
  completionReason?: 'user-initiated' | 'cleanup' | 'error' | 'timeout' | 'system-shutdown';
  finalMetrics?: {
    totalDuration: number;
    interfaceSwitchCount: number;
    commandExecutionCount: number;
    skinLoadCount: number;
    backendInteractionCount: number;
  };
}

export interface TemplumSessionMetrics {
  interfaceSwitches: number;
  backendInteractions: number;
  commandsExecuted: number;
  sessionsCreated: number;
  totalSkinLoads: number;
  averageSwitchTime: number;
  completion: SessionCompletionInfo;
}

export interface TemplumSessionState {
  sessionId: string;
  userId?: string;
  startTime: Date;
  activeInterface: InterfaceType;
  preferences: Record<string, any>;
  capabilities: string[];
  activeBackends: BackendType[];
  loadedSkins: string[];
  interfaceHistory: InterfaceType[];
  sessionMetrics: TemplumSessionMetrics;
  lastActivity: Date;
  navigationHistory: string[];
  currentMenu?: string;
  interactionMode: 'menu' | 'command';
  commandHistory: string[];
}

export interface SessionStateUpdate {
  sessionId: string;
  interfaceType: InterfaceType;
  state: Partial<InterfaceStateData> & {
    currentMenu?: string;
    interactionMode?: 'menu' | 'command';
    commandHistory?: string[];
  };
}

export interface TemplumSessionManagerContract {
  initialize(): Promise<void>;
  attachOrchestrator(orchestrator: ITemplumOrchestrator): void;
  ensureSessionForInterface(interfaceType: InterfaceType, context?: Partial<SessionContext>): Promise<string>;
  getActiveSessionId(): string | null;
  getSessionSnapshot(sessionId?: string): TemplumSessionState | null;
  updateSessionState(update: SessionStateUpdate): Promise<void>;
  registerInterfaceAdapter(interfaceType: InterfaceType, adapter: InterfaceAdapter): Promise<void>;
  syncInterfaces(fromInterface: InterfaceType, toInterface: InterfaceType): Promise<void>;
  notifyInterfaceDisconnect(interfaceType: InterfaceType, reason: string): void;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
}
