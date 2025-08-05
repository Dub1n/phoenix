/**
 * Document Configuration Editor for Phoenix Code Lite
 * Provides CLI interface for managing per-agent and global document configurations
 */

import chalk from 'chalk';
import { DocumentManager } from '../config/document-manager';
import { 
  DocumentInventory, 
  DocumentConfiguration, 
  DocumentInfo,
  DocumentOperationResult 
} from '../types/document-management';

interface DocumentEditOptions {
  templateName: string;
  interactive: boolean;
  showPreview: boolean;
}

export class DocumentConfigurationEditor {
  private documentManager: DocumentManager;

  constructor() {
    this.documentManager = new DocumentManager();
  }

  async editTemplateDocuments(templateName: string, options: Partial<DocumentEditOptions> = {}): Promise<void> {
    const inventory = await this.documentManager.getAvailableDocuments();
    const currentConfig = await this.documentManager.getTemplateDocumentConfiguration(templateName);

    console.log(chalk.cyan(`\n═ Document Configuration - ${templateName} Template`));
    console.log(chalk.gray('═'.repeat(50)));

    if (options.showPreview !== false) {
      await this.showCurrentConfiguration(currentConfig, inventory);
    }

    if (options.interactive !== false) {
      await this.runInteractiveEditor(templateName, currentConfig, inventory);
    }
  }

  private async showCurrentConfiguration(config: DocumentConfiguration, inventory: DocumentInventory): Promise<void> {
    console.log(chalk.yellow('\n📋 Current Document Configuration:'));
    console.log(chalk.gray('─'.repeat(40)));

    // Show global documents
    console.log(chalk.cyan('\n🌐 Global Documents:'));
    if (inventory.global.length === 0) {
      console.log(chalk.gray('   No global documents available'));
    } else {
      inventory.global.forEach(doc => {
        const isEnabled = config.global[doc.filename] || false;
        const status = isEnabled ? chalk.green('✓ ENABLED') : chalk.gray('○ DISABLED');
        console.log(`   ${status} ${doc.name}`);
        console.log(`     ${chalk.gray(doc.description)}`);
      });
    }

    // Show agent-specific documents
    const agentNames = {
      'planning-analyst': 'Planning Analyst',
      'implementation-engineer': 'Implementation Engineer',
      'quality-reviewer': 'Quality Reviewer'
    } as const;

    for (const [agentKey, agentTitle] of Object.entries(agentNames)) {
      console.log(chalk.cyan(`\n🤖 ${agentTitle} Documents:`));
      const agentDocs = inventory.agents[agentKey as keyof typeof inventory.agents];
      
      if (agentDocs.length === 0) {
        console.log(chalk.gray('   No agent-specific documents available'));
      } else {
        agentDocs.forEach(doc => {
          const isEnabled = config.agents[agentKey as keyof typeof config.agents][doc.filename] || false;
          const status = isEnabled ? chalk.green('✓ ENABLED') : chalk.gray('○ DISABLED');
          console.log(`   ${status} ${doc.name}`);
          console.log(`     ${chalk.gray(doc.description)}`);
        });
      }
    }
  }

  private async runInteractiveEditor(
    templateName: string, 
    config: DocumentConfiguration, 
    inventory: DocumentInventory
  ): Promise<void> {
    console.log(chalk.yellow('\n🔧 Interactive Document Editor'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.gray('Type document numbers to toggle, "save" to save changes, "quit" to exit'));

    let hasChanges = false;
    const workingConfig = JSON.parse(JSON.stringify(config)); // Deep copy

    while (true) {
      console.log(chalk.cyan('\n📋 Available Actions:'));
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
            console.log(chalk.green('\n✅ Configuration saved successfully!'));
          } else {
            console.log(chalk.yellow('\n ℹ No changes to save.'));
          }
          return;
        case '7':
          if (hasChanges) {
            const confirm = await this.promptUser('You have unsaved changes. Are you sure you want to exit? (y/N): ');
            if (confirm.toLowerCase() !== 'y') {
              continue;
            }
          }
          console.log(chalk.gray('\n👋 Exiting without saving.'));
          return;
        default:
          console.log(chalk.red('\n❌ Invalid choice. Please select 1-7.'));
      }
    }
  }

  private async toggleDocumentCategory(
    categoryName: string,
    documents: DocumentInfo[],
    configSection: Record<string, boolean>
  ): Promise<boolean> {
    if (documents.length === 0) {
      console.log(chalk.yellow(`\n⚠ No documents available in ${categoryName} category.`));
      return false;
    }

    console.log(chalk.cyan(`\n📂 ${categoryName} Documents:`));
    documents.forEach((doc, index) => {
      const isEnabled = configSection[doc.filename] || false;
      const status = isEnabled ? chalk.green('✓ ON ') : chalk.gray('○ OFF');
      console.log(`${(index + 1).toString().padStart(2)}. ${status} ${doc.name}`);
      console.log(`    ${chalk.gray(doc.description)}`);
    });

    console.log(chalk.gray('\nType document numbers (space-separated) to toggle, or "back" to return:'));
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
        
        const newStatus = !currentState ? chalk.green('ENABLED') : chalk.gray('DISABLED');
        console.log(`   ${newStatus}: ${doc.name}`);
        hasChanges = true;
      } else {
        console.log(chalk.red(`   ❌ Invalid number: ${num}`));
      }
    }

    return hasChanges;
  }

  private async saveConfiguration(templateName: string, config: DocumentConfiguration): Promise<void> {
    const result = await this.documentManager.updateTemplateDocumentConfiguration(templateName, config);
    
    if (!result.success) {
      console.log(chalk.red(`\n❌ Failed to save configuration: ${result.message}`));
      if (result.errors) {
        result.errors.forEach(error => console.log(chalk.red(`   • ${error}`)));
      }
    }
  }

  async initializeDocumentSystem(): Promise<DocumentOperationResult> {
    console.log(chalk.blue('\n🚀 Initializing Document Management System...'));
    
    const result = await this.documentManager.initializeDocumentSystem();
    
    if (result.success) {
      console.log(chalk.green('\n✅ Document system initialized successfully!'));
      console.log(chalk.gray('\n📁 Created directories:'));
      result.affectedDocuments?.forEach(dir => {
        console.log(chalk.gray(`   • ${dir}`));
      });
      
      console.log(chalk.cyan('\n📄 Default documents created in each category.'));
      console.log(chalk.gray('You can now configure which documents are active for each template.'));
    } else {
      console.log(chalk.red('\n❌ Failed to initialize document system:'));
      console.log(chalk.red(`   ${result.message}`));
      if (result.errors) {
        result.errors.forEach(error => console.log(chalk.red(`   • ${error}`)));
      }
    }
    
    return result;
  }

  async showDocumentInventory(): Promise<void> {
    console.log(chalk.blue('\n📚 Document Inventory'));
    console.log(chalk.gray('═'.repeat(50)));

    const inventory = await this.documentManager.getAvailableDocuments();

    // Show statistics
    const totalDocs = inventory.global.length + 
      Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0);
    
    console.log(chalk.cyan(`\n📊 Summary: ${totalDocs} total documents`));
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

  private async promptUser(message: string): Promise<string> {
    // This is a simplified prompt - in a full implementation, you'd use a proper input library
    process.stdout.write(chalk.gray(message));
    
    return new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      const handleInput = (data: string) => {
        process.stdin.removeListener('data', handleInput);
        process.stdin.pause();
        resolve(data.toString().trim());
      };
      
      process.stdin.once('data', handleInput);
    });
  }
}