"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCLI = setupCLI;
const commander_1 = require("commander");
function setupCLI() {
    const program = new commander_1.Command();
    program
        .name('phoenix-code-lite')
        .description('TDD workflow orchestrator for Claude Code')
        .version('1.0.0');
    program
        .command('generate')
        .description('Generate code using the TDD workflow')
        .requiredOption('-t, --task <description>', 'Task description')
        .option('-p, --project-path <path>', 'Project path', process.cwd())
        .option('-l, --language <lang>', 'Programming language')
        .option('-f, --framework <framework>', 'Framework to use')
        .option('-v, --verbose', 'Verbose output', false)
        .option('--skip-docs', 'Skip documentation generation', false)
        .option('--max-attempts <number>', 'Maximum implementation attempts', '3')
        .action(async (options) => {
        const { generateCommand } = await Promise.resolve().then(() => __importStar(require('./commands')));
        await generateCommand(options);
    });
    program
        .command('init')
        .description('Initialize Phoenix-Code-Lite in current directory')
        .option('-f, --force', 'Overwrite existing configuration')
        .option('--template <name>', 'Apply configuration template (starter|enterprise|performance)')
        .action(async (options) => {
        const { initCommand } = await Promise.resolve().then(() => __importStar(require('./commands')));
        await initCommand(options);
    });
    program
        .command('config')
        .description('Manage Phoenix-Code-Lite configuration')
        .option('--show', 'Show current configuration')
        .option('--reset', 'Reset to default configuration')
        .option('--template <name>', 'Apply configuration template (starter|enterprise|performance)')
        .action(async (options) => {
        const { configCommand } = await Promise.resolve().then(() => __importStar(require('./commands')));
        await configCommand(options);
    });
    return program;
}
//# sourceMappingURL=args.js.map