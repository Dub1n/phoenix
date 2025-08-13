/**---
 * title: [Menu Definitions - Unified Menu Schema]
 * tags: [Types, CLI, Menu, Definitions]
 * provides: [MenuDefinition, MenuSection, MenuItem, MenuAction, MenuContext, MenuMetadata, SectionTheme]
 * requires: []
 * description: [Core TypeScript interfaces for CLI menu definitions consumed by all interaction modes.]
 * ---*/

export interface MenuDefinition {
  id: string;
  title: string;
  description?: string;
  sections: MenuSection[];
  context?: MenuContext;
  metadata?: MenuMetadata;
}

export interface MenuSection {
  id: string;
  heading: string;
  items: MenuItem[];
  theme?: SectionTheme;
}

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  action: MenuAction;
  enabled?: boolean | ((context: MenuContext) => boolean);
  visible?: boolean | ((context: MenuContext) => boolean);
  shortcuts?: string[]; // ['1', 'config', 'c']
  validation?: ValidationSchema;
}

export interface MenuAction {
  type: 'navigate' | 'execute' | 'exit' | 'back';
  target?: string;
  handler?: string; // Reference to command handler
  data?: any;
  confirmation?: ConfirmationConfig;
}

export interface MenuContext {
  level: string;
  sessionContext: SessionContext;
  parameters?: any;
}

export interface MenuMetadata {
  contextLevel: string;
  allowBack: boolean;
  defaultAction?: string;
  skinName?: string;
}

export interface SectionTheme {
  headingColor?: string;
  bold?: boolean;
  backgroundColor?: string;
}

export interface ValidationSchema {
  type: string;
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  options?: string[];
}

export interface ConfirmationConfig {
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface SessionContext {
  level: string;
  projectInitialized?: boolean;
  currentTemplate?: string;
  debugMode?: boolean;
  [key: string]: any;
}

export interface LoadedSkin {
  metadata: {
    name: string;
    displayName: string;
    version?: string;
  };
  menus: Record<string, MenuDefinition>;
  commands?: Record<string, any>;
}
