"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionModeConfigSchema = exports.CommandModeConfigSchema = exports.MenuModeConfigSchema = void 0;
const zod_1 = require("zod");
// Interaction Mode Configuration Schemas
exports.MenuModeConfigSchema = zod_1.z.object({
    showNumbers: zod_1.z.boolean().default(true),
    allowArrowNavigation: zod_1.z.boolean().default(true),
    showDescriptions: zod_1.z.boolean().default(true),
    compactMode: zod_1.z.boolean().default(false),
});
exports.CommandModeConfigSchema = zod_1.z.object({
    promptSymbol: zod_1.z.string().default('Phoenix> '),
    showCommandList: zod_1.z.boolean().default(true),
    autoComplete: zod_1.z.boolean().default(true),
    historyEnabled: zod_1.z.boolean().default(true),
});
exports.InteractionModeConfigSchema = zod_1.z.object({
    currentMode: zod_1.z.enum(['menu', 'command']).default('menu'),
    menuConfig: exports.MenuModeConfigSchema.default({
        showNumbers: true,
        allowArrowNavigation: true,
        showDescriptions: true,
        compactMode: false
    }),
    commandConfig: exports.CommandModeConfigSchema.default({
        promptSymbol: 'Phoenix> ',
        showCommandList: true,
        autoComplete: true,
        historyEnabled: true
    }),
    allowModeSwitch: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=interaction-modes.js.map