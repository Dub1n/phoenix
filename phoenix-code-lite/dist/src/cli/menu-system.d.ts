/**---
 * title: [Menu System - Contextual Menu Routing]
 * tags: [CLI, Menu, Navigation, Rendering]
 * provides: [MenuSystem Class, Contextual Menus, Submenu Routing]
 * requires: [SessionContext, SkinMenuRenderer, Menu Types]
 * description: [Renders contextual menus for main sections and routes navigation between them using session state.]
 * ---*/
import { SessionContext, MenuAction } from './session';
export interface MenuContext {
    level: 'main' | 'config' | 'templates' | 'advanced' | 'generate';
    parentMenu?: string;
    currentItem?: string;
    breadcrumb: string[];
}
export declare class MenuSystem {
    showContextualMenu(context: SessionContext): Promise<void>;
    processContextCommand(input: string, context: SessionContext): Promise<MenuAction | null>;
    showContextHelp(context: SessionContext): void;
    private showMainMenu;
    private showConfigMenu;
    private showTemplatesMenu;
    private showGenerateMenu;
    private showAdvancedMenu;
    private processMainCommands;
    private processConfigCommands;
    private processTemplateCommands;
    private processGenerateCommands;
    private processAdvancedCommands;
    private showMainHelp;
    private showConfigHelp;
    private showTemplatesHelp;
    private showGenerateHelp;
    private showAdvancedHelp;
    generateTitle(context: SessionContext): string;
}
//# sourceMappingURL=menu-system.d.ts.map