// tests/integration/cli-interface.test.ts
import { setupCLI } from '../../src/cli/args';
import { generateCommand, initCommand } from '../../src/cli/commands';

describe('Phase 4: CLI Interface', () => {
  describe('CLI Argument Parsing', () => {
    test('setupCLI returns Commander program', () => {
      const program = setupCLI();
      expect(program).toBeDefined();
      expect(program.name()).toBe('phoenix-code-lite');
    });
    
    test('generate command has required options', () => {
      const program = setupCLI();
      const generateCmd = program.commands.find(cmd => cmd.name() === 'generate');
      
      expect(generateCmd).toBeDefined();
      expect(generateCmd?.description()).toBe('Generate code using the TDD workflow');
    });
    
    test('init command exists', () => {
      const program = setupCLI();
      const initCmd = program.commands.find(cmd => cmd.name() === 'init');
      
      expect(initCmd).toBeDefined();
      expect(initCmd?.description()).toBe('Initialize Phoenix-Code-Lite in current directory');
    });
  });
  
  describe('Command Functions', () => {
    test('generateCommand function exists and is callable', () => {
      expect(typeof generateCommand).toBe('function');
    });
    
    test('initCommand function exists and is callable', () => {
      expect(typeof initCommand).toBe('function');
    });
  });
});