"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/integration/cli-interface.test.ts
const args_1 = require("../../src/cli/args");
const commands_1 = require("../../src/cli/commands");
describe('Phase 4: CLI Interface', () => {
    describe('CLI Argument Parsing', () => {
        test('setupCLI returns Commander program', () => {
            const program = (0, args_1.setupCLI)();
            expect(program).toBeDefined();
            expect(program.name()).toBe('phoenix-code-lite');
        });
        test('generate command has required options', () => {
            const program = (0, args_1.setupCLI)();
            const generateCmd = program.commands.find(cmd => cmd.name() === 'generate');
            expect(generateCmd).toBeDefined();
            expect(generateCmd?.description()).toBe('Generate code using the TDD workflow');
        });
        test('init command exists', () => {
            const program = (0, args_1.setupCLI)();
            const initCmd = program.commands.find(cmd => cmd.name() === 'init');
            expect(initCmd).toBeDefined();
            expect(initCmd?.description()).toBe('Initialize Phoenix-Code-Lite in current directory');
        });
    });
    describe('Command Functions', () => {
        test('generateCommand function exists and is callable', () => {
            expect(typeof commands_1.generateCommand).toBe('function');
        });
        test('initCommand function exists and is callable', () => {
            expect(typeof commands_1.initCommand).toBe('function');
        });
    });
});
//# sourceMappingURL=cli-interface.test.js.map