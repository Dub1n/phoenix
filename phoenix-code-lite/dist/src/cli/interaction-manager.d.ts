import { InteractionModeConfig, MenuOption, CommandInfo, InputResult } from '../types/interaction-modes';
/**
 * Dual Mode Interaction Manager
 * Handles both Menu Mode (arrow navigation) and Command Mode (text commands)
 * Implements Issue #4 from UX Enhancement Guide
 */
export declare class InteractionManager {
    private config;
    private readline;
    private keyboardListener;
    constructor(config: InteractionModeConfig);
    private setupReadline;
    /**
     * Fix Issue #3: Clear input buffer to prevent pre-filled characters
     */
    private clearInputBuffer;
    /**
     * Display Menu Mode interface with numbered options
     * Implements Issue #8: Numbered menu options
     */
    displayMenuMode(options: MenuOption[], title: string): Promise<InputResult>;
    /**
     * Display Command Mode interface with text input
     */
    displayCommandMode(commands: CommandInfo[], title: string): Promise<InputResult>;
    /**
     * Handle menu mode input (numbers, commands, special keys)
     */
    private handleMenuInput;
    /**
     * Handle command mode input (text commands)
     */
    private handleCommandInput;
    /**
     * Handle special commands that work in both modes
     */
    private handleSpecialCommands;
    /**
     * Get user input with proper handling
     */
    private getInput;
    /**
     * Find matching menu option by partial name matching
     */
    private findMatchingOption;
    /**
     * Find matching command by name or alias
     */
    private findMatchingCommand;
    /**
     * Suggest similar commands based on input
     */
    private suggestCommands;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
    /**
     * Switch between menu and command modes
     */
    switchMode(): 'menu' | 'command';
    /**
     * Get current interaction mode
     */
    getCurrentMode(): 'menu' | 'command';
    /**
     * Update interaction configuration
     */
    updateConfig(newConfig: Partial<InteractionModeConfig>): void;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=interaction-manager.d.ts.map