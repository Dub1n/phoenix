"use strict";
/**---
 * title: [Document Configuration Editor - Template-Aware Docs Management]
 * tags: [CLI, Configuration, Documents, Templates]
 * provides: [DocumentConfigurationEditor Class, Interactive Editing, Preview Rendering]
 * requires: [DocumentManager, chalk, Document Types]
 * description: [Interactive editor for per-template document activation and preview, integrating with the document management system.]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentConfigurationEditor = void 0;
const chalk_1 = __importDefault(require("chalk"));
const document_manager_1 = require("../config/document-manager");
class DocumentConfigurationEditor {
    constructor() {
        this.documentManager = new document_manager_1.DocumentManager();
    }
    async editTemplateDocuments(templateName, options = {}) {
        const inventory = await this.documentManager.getAvailableDocuments();
        const currentConfig = await this.documentManager.getTemplateDocumentConfiguration(templateName);
        console.log(chalk_1.default.cyan(`\n═ Document Configuration - ${templateName} Template`));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        if (options.showPreview !== false) {
            await this.showCurrentConfiguration(currentConfig, inventory);
        }
        if (options.interactive !== false) {
            await this.runInteractiveEditor(templateName, currentConfig, inventory);
        }
    }
    async showCurrentConfiguration(config, inventory) {
        console.log(chalk_1.default.yellow('\n⋇ Current Document Configuration:'));
        console.log(chalk_1.default.gray('─'.repeat(40)));
        // Show global documents
        console.log(chalk_1.default.cyan('\n🌐 Global Documents:'));
        if (inventory.global.length === 0) {
            console.log(chalk_1.default.gray('   No global documents available'));
        }
        else {
            inventory.global.forEach(doc => {
                const isEnabled = config.global[doc.filename] || false;
                const status = isEnabled ? chalk_1.default.green('✓ ENABLED') : chalk_1.default.gray('○ DISABLED');
                console.log(`   ${status} ${doc.name}`);
                console.log(`     ${chalk_1.default.gray(doc.description)}`);
            });
        }
        // Show agent-specific documents
        const agentNames = {
            'planning-analyst': 'Planning Analyst',
            'implementation-engineer': 'Implementation Engineer',
            'quality-reviewer': 'Quality Reviewer'
        };
        for (const [agentKey, agentTitle] of Object.entries(agentNames)) {
            console.log(chalk_1.default.cyan(`\n🤖 ${agentTitle} Documents:`));
            const agentDocs = inventory.agents[agentKey];
            if (agentDocs.length === 0) {
                console.log(chalk_1.default.gray('   No agent-specific documents available'));
            }
            else {
                agentDocs.forEach(doc => {
                    const isEnabled = config.agents[agentKey][doc.filename] || false;
                    const status = isEnabled ? chalk_1.default.green('✓ ENABLED') : chalk_1.default.gray('○ DISABLED');
                    console.log(`   ${status} ${doc.name}`);
                    console.log(`     ${chalk_1.default.gray(doc.description)}`);
                });
            }
        }
    }
    async runInteractiveEditor(templateName, config, inventory) {
        console.log(chalk_1.default.yellow('\n◦ Interactive Document Editor'));
        console.log(chalk_1.default.gray('─'.repeat(40)));
        console.log(chalk_1.default.gray('Type document numbers to toggle, "save" to save changes, "quit" to exit'));
        let hasChanges = false;
        const workingConfig = JSON.parse(JSON.stringify(config)); // Deep copy
        while (true) {
            console.log(chalk_1.default.cyan('\n⋇ Available Actions:'));
            console.log('1. Toggle Global Documents');
            console.log('2. Toggle Planning Analyst Documents');
            console.log('3. Toggle Implementation Engineer Documents');
            console.log('4. Toggle Quality Reviewer Documents');
            console.log('5. Preview Current Configuration');
            console.log('6. Save Configuration');
            console.log('7. Discard Changes and Exit');
            const choice = await this.promptUser('\nSelect action (1-7): ');
            switch (choice) {
                case '1':
                    hasChanges = await this.toggleDocumentCategory('Global', inventory.global, workingConfig.global) || hasChanges;
                    break;
                case '2':
                    hasChanges = await this.toggleDocumentCategory('Planning Analyst', inventory.agents['planning-analyst'], workingConfig.agents['planning-analyst']) || hasChanges;
                    break;
                case '3':
                    hasChanges = await this.toggleDocumentCategory('Implementation Engineer', inventory.agents['implementation-engineer'], workingConfig.agents['implementation-engineer']) || hasChanges;
                    break;
                case '4':
                    hasChanges = await this.toggleDocumentCategory('Quality Reviewer', inventory.agents['quality-reviewer'], workingConfig.agents['quality-reviewer']) || hasChanges;
                    break;
                case '5':
                    await this.showCurrentConfiguration(workingConfig, inventory);
                    break;
                case '6':
                    if (hasChanges) {
                        await this.saveConfiguration(templateName, workingConfig);
                        console.log(chalk_1.default.green('\n✓ Configuration saved successfully!'));
                    }
                    else {
                        console.log(chalk_1.default.yellow('\n ℹ No changes to save.'));
                    }
                    return;
                case '7':
                    if (hasChanges) {
                        const confirm = await this.promptUser('You have unsaved changes. Are you sure you want to exit? (y/N): ');
                        if (confirm.toLowerCase() !== 'y') {
                            continue;
                        }
                    }
                    console.log(chalk_1.default.gray('\n👋 Exiting without saving.'));
                    return;
                default:
                    console.log(chalk_1.default.red('\n✗ Invalid choice. Please select 1-7.'));
            }
        }
    }
    async toggleDocumentCategory(categoryName, documents, configSection) {
        if (documents.length === 0) {
            console.log(chalk_1.default.yellow(`\n⚠ No documents available in ${categoryName} category.`));
            return false;
        }
        console.log(chalk_1.default.cyan(`\n▪ ${categoryName} Documents:`));
        documents.forEach((doc, index) => {
            const isEnabled = configSection[doc.filename] || false;
            const status = isEnabled ? chalk_1.default.green('✓ ON ') : chalk_1.default.gray('○ OFF');
            console.log(`${(index + 1).toString().padStart(2)}. ${status} ${doc.name}`);
            console.log(`    ${chalk_1.default.gray(doc.description)}`);
        });
        console.log(chalk_1.default.gray('\nType document numbers (space-separated) to toggle, or "back" to return:'));
        const input = await this.promptUser('> ');
        if (input.toLowerCase() === 'back') {
            return false;
        }
        const numbers = input.split(/\s+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        let hasChanges = false;
        for (const num of numbers) {
            if (num >= 1 && num <= documents.length) {
                const doc = documents[num - 1];
                const currentState = configSection[doc.filename] || false;
                configSection[doc.filename] = !currentState;
                const newStatus = !currentState ? chalk_1.default.green('ENABLED') : chalk_1.default.gray('DISABLED');
                console.log(`   ${newStatus}: ${doc.name}`);
                hasChanges = true;
            }
            else {
                console.log(chalk_1.default.red(`   ✗ Invalid number: ${num}`));
            }
        }
        return hasChanges;
    }
    async saveConfiguration(templateName, config) {
        const result = await this.documentManager.updateTemplateDocumentConfiguration(templateName, config);
        if (!result.success) {
            console.log(chalk_1.default.red(`\n✗ Failed to save configuration: ${result.message}`));
            if (result.errors) {
                result.errors.forEach(error => console.log(chalk_1.default.red(`   • ${error}`)));
            }
        }
    }
    async initializeDocumentSystem() {
        console.log(chalk_1.default.blue('\n^ Initializing Document Management System...'));
        const result = await this.documentManager.initializeDocumentSystem();
        if (result.success) {
            console.log(chalk_1.default.green('\n✓ Document system initialized successfully!'));
            console.log(chalk_1.default.gray('\n▫ Created directories:'));
            result.affectedDocuments?.forEach(dir => {
                console.log(chalk_1.default.gray(`   • ${dir}`));
            });
            console.log(chalk_1.default.cyan('\n□ Default documents created in each category.'));
            console.log(chalk_1.default.gray('You can now configure which documents are active for each template.'));
        }
        else {
            console.log(chalk_1.default.red('\n✗ Failed to initialize document system:'));
            console.log(chalk_1.default.red(`   ${result.message}`));
            if (result.errors) {
                result.errors.forEach(error => console.log(chalk_1.default.red(`   • ${error}`)));
            }
        }
        return result;
    }
    async showDocumentInventory() {
        console.log(chalk_1.default.blue('\n📚 Document Inventory'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const inventory = await this.documentManager.getAvailableDocuments();
        // Show statistics
        const totalDocs = inventory.global.length +
            Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0);
        console.log(chalk_1.default.cyan(`\n◊ Summary: ${totalDocs} total documents`));
        console.log(`   🌐 Global: ${inventory.global.length}`);
        console.log(`   🤖 Agent-specific: ${Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0)}`);
        // Show detailed inventory
        await this.showCurrentConfiguration({
            global: {},
            agents: {
                'planning-analyst': {},
                'implementation-engineer': {},
                'quality-reviewer': {}
            }
        }, inventory);
    }
    async promptUser(message) {
        // This is a simplified prompt - in a full implementation, you'd use a proper input library
        process.stdout.write(chalk_1.default.gray(message));
        return new Promise((resolve) => {
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            const handleInput = (data) => {
                process.stdin.removeListener('data', handleInput);
                process.stdin.pause();
                resolve(data.toString().trim());
            };
            process.stdin.once('data', handleInput);
        });
    }
}
exports.DocumentConfigurationEditor = DocumentConfigurationEditor;
//# sourceMappingURL=document-configuration-editor.js.map