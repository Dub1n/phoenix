/**---
 * title: [Interaction Modes - Schemas and Types]
 * tags: [Types, CLI, Interaction, Zod]
 * provides: [MenuModeConfigSchema, CommandModeConfigSchema, InteractionModeConfigSchema, Types]
 * requires: [zod]
 * description: [Zod schemas and related types describing CLI interaction modes and options.]
 * ---*/

import { z } from 'zod';

// Interaction Mode Configuration Schemas
export const MenuModeConfigSchema = z.object({
  showNumbers: z.boolean().default(true),
  allowArrowNavigation: z.boolean().default(true),
  showDescriptions: z.boolean().default(true),
  compactMode: z.boolean().default(false),
});

export const CommandModeConfigSchema = z.object({
  promptSymbol: z.string().default('Phoenix> '),
  showCommandList: z.boolean().default(true),
  autoComplete: z.boolean().default(true),
  historyEnabled: z.boolean().default(true),
});

export const InteractionModeConfigSchema = z.object({
  currentMode: z.enum(['menu', 'command']).default('menu'),
  menuConfig: MenuModeConfigSchema.default({
    showNumbers: true,
    allowArrowNavigation: true,
    showDescriptions: true,
    compactMode: false
  }),
  commandConfig: CommandModeConfigSchema.default({
    promptSymbol: 'Phoenix> ',
    showCommandList: true,
    autoComplete: true,
    historyEnabled: true
  }),
  allowModeSwitch: z.boolean().default(true),
});

// Type definitions
export type MenuModeConfig = z.infer<typeof MenuModeConfigSchema>;
export type CommandModeConfig = z.infer<typeof CommandModeConfigSchema>;
export type InteractionModeConfig = z.infer<typeof InteractionModeConfigSchema>;

// Menu option interface
export interface MenuOption {
  label: string;
  value: string;
  description?: string;
  shortcut?: string;
  enabled?: boolean;
}

// Command information interface
export interface CommandInfo {
  name: string;
  description: string;
  aliases?: string[];
  category?: string;
  arguments?: string[];
}

// Navigation item for back navigation
export interface NavigationItem {
  screen: string;
  context?: any;
  timestamp: number;
}

// Session context enhancement for dual mode support
export interface SessionContext {
  mode: 'menu' | 'command';
  location: string;
  user?: any;
  config?: any;
  navigationStack?: NavigationItem[];
  interactionHistory?: string[];
}

// Input handling results
export interface InputResult {
  action: 'navigate' | 'execute' | 'switch_mode' | 'back' | 'quit';
  target?: string;
  data?: any;
  newMode?: 'menu' | 'command';
  success: boolean;
  message?: string;
}

// Display mode interface
export interface DisplayMode {
  mode: 'menu' | 'command';
  display: string;
  prompt?: string;
  options?: MenuOption[];
  commands?: CommandInfo[];
}
