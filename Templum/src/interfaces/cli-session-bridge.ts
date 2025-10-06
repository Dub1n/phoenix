import type { TemplumSessionManagerContract, TemplumSessionState } from '../session/universal-session-manager.types';
import type { InterfaceType } from '../types/templum-types';

const CLI_INTERFACE: InterfaceType = 'cli';

export interface CLISessionSnapshot {
  sessionId: string;
  currentMenu: string;
  navigationHistory: string[];
  interactionMode: 'menu' | 'command';
  preferences: {
    theme: string;
    autoSave: boolean;
    lastBackend?: string;
  };
  commandHistory: string[];
  lastActivity: number;
  created: number;
  version: string;
}

export class CLISessionBridge {
  private readonly sessionManager: TemplumSessionManagerContract;
  private sessionId: string | null = null;
  private navigationHistory: string[] = [];
  private currentMenu = 'main';
  private interactionMode: 'menu' | 'command' = 'menu';
  private preferences: CLISessionSnapshot['preferences'] = {
    theme: 'dark',
    autoSave: true,
  };
  private commandHistory: string[] = [];
  private created = Date.now();
  private version = '1.0';
  private lastActivity = Date.now();

  constructor({ sessionManager }: { sessionManager: TemplumSessionManagerContract }) {
    this.sessionManager = sessionManager;
  }

  async initialize(): Promise<void> {
    this.sessionId = await this.sessionManager.ensureSessionForInterface(CLI_INTERFACE);
    const snapshot = this.sessionManager.getSessionSnapshot(this.sessionId);

    if (snapshot) {
      this.applySnapshot(snapshot);
    }

    this.persistState();
  }

  getCurrentSession(): CLISessionSnapshot {
    const sessionId = this.ensureSessionId();

    return {
      sessionId,
      currentMenu: this.currentMenu,
      navigationHistory: [...this.navigationHistory],
      interactionMode: this.interactionMode,
      preferences: { ...this.preferences },
      commandHistory: [...this.commandHistory],
      lastActivity: this.lastActivity,
      created: this.created,
      version: this.version,
    };
  }

  navigateToMenu(menuId: string, addToHistory: boolean): void {
    if (addToHistory && this.currentMenu !== menuId) {
      this.navigationHistory.push(this.currentMenu);
      if (this.navigationHistory.length > 20) {
        this.navigationHistory = this.navigationHistory.slice(-20);
      }
    }

    this.currentMenu = menuId;
    this.touch();
    this.persistState();
  }

  navigateBack(): string | null {
    if (this.navigationHistory.length === 0) {
      return null;
    }

    const previousMenu = this.navigationHistory.pop() ?? null;
    if (previousMenu) {
      this.currentMenu = previousMenu;
      this.touch();
      this.persistState();
    }
    return previousMenu;
  }

  switchInteractionMode(mode: 'menu' | 'command'): void {
    this.interactionMode = mode;
    this.touch();
    this.persistState();
  }

  addCommandToHistory(command: string): void {
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 100) {
      this.commandHistory = this.commandHistory.slice(0, 100);
    }
    this.touch();
    this.persistState();
  }

  updatePreferences(updates: Partial<CLISessionSnapshot['preferences']>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.touch();
    this.persistState();
  }

  async dispose(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    this.sessionManager.notifyInterfaceDisconnect(CLI_INTERFACE, 'cli-adapter-dispose');
  }

  private applySnapshot(snapshot: TemplumSessionState): void {
    this.navigationHistory = [...snapshot.navigationHistory];
    this.currentMenu = snapshot.currentMenu ?? this.currentMenu;
    this.interactionMode = snapshot.interactionMode ?? this.interactionMode;
    this.preferences = {
      ...this.preferences,
      ...snapshot.preferences,
    };
    this.commandHistory = [...(snapshot.commandHistory ?? [])];
    this.lastActivity = snapshot.lastActivity.getTime();
    this.created = snapshot.startTime.getTime();
  }

  private ensureSessionId(): string {
    if (!this.sessionId) {
      throw new Error('CLI session has not been initialized');
    }
    return this.sessionId;
  }

  private touch(): void {
    this.lastActivity = Date.now();
  }

  private persistState(): void {
    if (!this.sessionId) {
      return;
    }

    this.sessionManager
      .updateSessionState({
        sessionId: this.sessionId,
        interfaceType: CLI_INTERFACE,
        state: {
          navigationStack: [...this.navigationHistory],
          userPreferences: { ...this.preferences },
          currentMenu: this.currentMenu,
          interactionMode: this.interactionMode,
          commandHistory: [...this.commandHistory],
        },
      })
      .catch((error) => {
        console.warn('CLI session bridge failed to persist state', error);
      });
  }
}
