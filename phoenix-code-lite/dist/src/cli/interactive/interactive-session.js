"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveSession = void 0;
class InteractiveSession {
    constructor(commandFactory, auditLogger, configManager) {
        this.commandFactory = commandFactory;
        this.auditLogger = auditLogger;
        this.configManager = configManager;
    }
    async start() {
        this.auditLogger.log('info', 'Interactive session started');
        console.log('🔥 Phoenix Code Lite Interactive CLI');
        console.log('Type "help" for available commands or "quit" to exit');
        await this.showMainMenu();
    }
    async showMainMenu() {
        const menu = [
            '1. Generate Code',
            '2. Configuration',
            '3. Help',
            '4. Version',
            '5. Quit'
        ];
        console.log('\nMain Menu:');
        menu.forEach(item => console.log(`  ${item}`));
        // For now, we'll just show the menu
        // In a real implementation, this would handle user input and menu selection
        console.log('\nInteractive mode is not fully implemented yet.');
        console.log('Use the command line interface instead.');
    }
    async handleMenuSelection(choice) {
        switch (choice) {
            case '1':
                const generateCmd = this.commandFactory.createGenerateCommand();
                // Note: This would need options in a real implementation
                console.log('Generate command selected');
                break;
            case '2':
                const configCmd = this.commandFactory.createConfigCommand();
                await configCmd.execute(['--show']);
                break;
            case '3':
                const helpCmd = this.commandFactory.createHelpCommand();
                await helpCmd.execute([]);
                break;
            case '4':
                const versionCmd = this.commandFactory.createVersionCommand();
                await versionCmd.execute([]);
                break;
            case '5':
                console.log('Goodbye!');
                return;
            default:
                console.log('Invalid choice. Please try again.');
        }
    }
}
exports.InteractiveSession = InteractiveSession;
//# sourceMappingURL=interactive-session.js.map