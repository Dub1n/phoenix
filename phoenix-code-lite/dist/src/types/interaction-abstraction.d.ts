/**
 * Interaction Abstraction Types
 * Created: 2025-01-06-175700
 *
 * Abstract interaction patterns so any mode can consume menu definitions.
 * Supports multiple interaction modes: Interactive (arrow keys), Command (text), and future modes.
 */
import { MenuDefinition, MenuContext, MenuItem, MenuAction } from './menu-definitions';
export interface InteractionRenderer {
    readonly mode: InteractionMode;
    renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void>;
    handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult>;
    dispose(): void;
}
export interface InteractionResult {
    action: MenuAction;
    selectedItem?: MenuItem;
    inputValue?: string;
    success: boolean;
    message?: string;
}
export interface InteractionMode {
    name: string;
    displayName: string;
    capabilities: ModeCapabilities;
    configuration: ModeConfiguration;
}
export interface ModeCapabilities {
    supportsArrowNavigation: boolean;
    supportsTextInput: boolean;
    supportsKeyboardShortcuts: boolean;
    supportsRealTimeValidation: boolean;
}
export interface ModeConfiguration {
    inputTimeout?: number;
    validationRules?: ValidationRule[];
    displayOptions?: DisplayOptions;
}
export interface ValidationRule {
    type: string;
    pattern?: RegExp;
    message?: string;
}
export interface DisplayOptions {
    showNumbers?: boolean;
    showShortcuts?: boolean;
    compactMode?: boolean;
    maxWidth?: number;
    colorScheme?: ColorScheme;
}
export interface ColorScheme {
    primary?: string;
    secondary?: string;
    accent?: string;
    error?: string;
    warning?: string;
    success?: string;
}
export type InteractionModeType = 'interactive' | 'command' | 'voice' | 'api';
//# sourceMappingURL=interaction-abstraction.d.ts.map