import { z } from 'zod';
export declare const MenuModeConfigSchema: z.ZodObject<{
    showNumbers: z.ZodDefault<z.ZodBoolean>;
    allowArrowNavigation: z.ZodDefault<z.ZodBoolean>;
    showDescriptions: z.ZodDefault<z.ZodBoolean>;
    compactMode: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const CommandModeConfigSchema: z.ZodObject<{
    promptSymbol: z.ZodDefault<z.ZodString>;
    showCommandList: z.ZodDefault<z.ZodBoolean>;
    autoComplete: z.ZodDefault<z.ZodBoolean>;
    historyEnabled: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const InteractionModeConfigSchema: z.ZodObject<{
    currentMode: z.ZodDefault<z.ZodEnum<{
        menu: "menu";
        command: "command";
    }>>;
    menuConfig: z.ZodDefault<z.ZodObject<{
        showNumbers: z.ZodDefault<z.ZodBoolean>;
        allowArrowNavigation: z.ZodDefault<z.ZodBoolean>;
        showDescriptions: z.ZodDefault<z.ZodBoolean>;
        compactMode: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    commandConfig: z.ZodDefault<z.ZodObject<{
        promptSymbol: z.ZodDefault<z.ZodString>;
        showCommandList: z.ZodDefault<z.ZodBoolean>;
        autoComplete: z.ZodDefault<z.ZodBoolean>;
        historyEnabled: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    allowModeSwitch: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type MenuModeConfig = z.infer<typeof MenuModeConfigSchema>;
export type CommandModeConfig = z.infer<typeof CommandModeConfigSchema>;
export type InteractionModeConfig = z.infer<typeof InteractionModeConfigSchema>;
export interface MenuOption {
    label: string;
    value: string;
    description?: string;
    shortcut?: string;
    enabled?: boolean;
}
export interface CommandInfo {
    name: string;
    description: string;
    aliases?: string[];
    category?: string;
    arguments?: string[];
}
export interface NavigationItem {
    screen: string;
    context?: any;
    timestamp: number;
}
export interface SessionContext {
    mode: 'menu' | 'command';
    location: string;
    user?: any;
    config?: any;
    navigationStack?: NavigationItem[];
    interactionHistory?: string[];
}
export interface InputResult {
    action: 'navigate' | 'execute' | 'switch_mode' | 'back' | 'quit';
    target?: string;
    data?: any;
    newMode?: 'menu' | 'command';
    success: boolean;
    message?: string;
}
export interface DisplayMode {
    mode: 'menu' | 'command';
    display: string;
    prompt?: string;
    options?: MenuOption[];
    commands?: CommandInfo[];
}
//# sourceMappingURL=interaction-modes.d.ts.map