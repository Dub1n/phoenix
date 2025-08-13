/**---
 * title: [Help Command - CLI Command]
 * tags: [CLI, Command, Help]
 * provides: [HelpCommand]
 * requires: [IAuditLogger]
 * description: [Displays available commands and guidance for Phoenix Code Lite.]
 * ---*/

import { IAuditLogger } from '../interfaces/audit-logger';

export class HelpCommand {
  constructor(
    private auditLogger: IAuditLogger
  ) {}

  async execute(args: string[]): Promise<void> {
    this.auditLogger.log('info', 'Help command executed', { args });
    
    console.log('Phoenix Code Lite - Available Commands:');
    console.log('');
    console.log('  config --show    Display current configuration');
    console.log('  config --edit    Edit configuration interactively');
    console.log('  help             Show this help message');
    console.log('  version          Show version information');
    console.log('  generate         Generate code using Claude');
    console.log('  init             Initialize Phoenix-Code-Lite in current directory');
    console.log('  wizard           Interactive setup wizard for first-time configuration');
    console.log('  template         Interactive template management');
    console.log('');
    console.log('For more detailed help on a specific command, use:');
    console.log('  phoenix-code-lite help <command>');
  }
} 
