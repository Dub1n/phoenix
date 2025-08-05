import { NavigationItem } from '../types/interaction-modes';
export interface SessionContext {
    level: 'main' | 'config' | 'templates' | 'advanced' | 'generate';
    history: string[];
    currentItem?: string;
    breadcrumb: string[];
    data?: Record<string, any>;
    mode?: 'menu' | 'command';
    navigationStack?: NavigationItem[];
}
export interface MenuAction {
    type: 'navigate' | 'execute' | 'exit' | 'back';
    target?: string;
    data?: any;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
export interface InputValidator {
    validate(input: string, context: SessionContext): ValidationResult;
    suggest?(input: string, context: SessionContext): string[];
}
export declare class CLISession {
    private currentContext;
    private running;
    private readline;
    private menuSystem;
    private interactionManager;
    private inputValidator;
    private errorHandler;
    constructor();
    start(): Promise<void>;
    private clearInputBuffer;
    private displayWelcome;
    private displayMainMenu;
    private handleInteractionResult;
    private switchMode;
    private cleanup;
    private promptForInput;
    private generatePrompt;
    private getContextColor;
    private getContextLabel;
    private processCommand;
    private handleGlobalCommands;
    private handleContextCommands;
    private navigateToContext;
    private navigateBack;
    private navigateToMain;
    private executeAction;
    private getContextDisplayName;
    private getContextLevelFromDisplayName;
    private showHeader;
    private showHelp;
    private confirmExit;
    private waitForEnter;
    getCurrentContext(): SessionContext;
    updateContext(updates: Partial<SessionContext>): void;
    setInputValidator(validator: InputValidator): void;
    setErrorHandler(handler: ErrorHandler): void;
}
declare class ErrorHandler {
    handleError(error: unknown, context: SessionContext, operation?: string): Promise<void>;
    private categorizeError;
    private getRecoveryActions;
}
export {};
//# sourceMappingURL=session.d.ts.map