import fs from 'fs';
import path from 'path';
import { PhoenixCodeLiteConfig, PhoenixCodeLiteConfigData } from './settings';
import { ConfigurationTemplates, TemplateMetadata } from './templates';

export interface TemplateManagerOptions {
  templatesDir?: string;
  createDirIfNotExists?: boolean;
}

export class TemplateManager {
  private templatesDir: string;
  private customTemplates: Map<string, { template: Partial<PhoenixCodeLiteConfigData>; metadata: TemplateMetadata }> = new Map();

  constructor(options: TemplateManagerOptions = {}) {
    this.templatesDir = options.templatesDir || path.join(process.cwd(), '.phoenix', 'templates');
    
    if (options.createDirIfNotExists !== false) {
      this.ensureTemplatesDirectory();
    }
    
    this.loadCustomTemplates();
  }

  private ensureTemplatesDirectory(): void {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  private loadCustomTemplates(): void {
    if (!fs.existsSync(this.templatesDir)) {
      return;
    }

    const files = fs.readdirSync(this.templatesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const filePath = path.join(this.templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { template, metadata } = ConfigurationTemplates.importTemplate(content);
        
        this.customTemplates.set(metadata.name, { template, metadata });
      } catch (error) {
        console.warn(`Failed to load template ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  getAllTemplates(): TemplateMetadata[] {
    const builtIn = ConfigurationTemplates.getTemplateList();
    const custom = Array.from(this.customTemplates.values()).map(t => t.metadata);
    
    return [...builtIn, ...custom];
  }

  getTemplateByName(name: string): { template: Partial<PhoenixCodeLiteConfigData>; metadata: TemplateMetadata } | null {
    // Check built-in templates first
    const builtInTemplate = ConfigurationTemplates.getTemplateByName(name);
    if (builtInTemplate) {
      const metadata = ConfigurationTemplates.getTemplateMetadata(name);
      if (metadata) {
        return { template: builtInTemplate, metadata };
      }
    }

    // Check custom templates
    return this.customTemplates.get(name.toLowerCase()) || null;
  }

  async createTemplate(
    name: string,
    baseTemplate: string,
    customizations: Partial<PhoenixCodeLiteConfigData> = {},
    description?: string
  ): Promise<TemplateMetadata> {
    const result = ConfigurationTemplates.createCustomTemplate(name, baseTemplate, customizations);
    if (!result) {
      throw new Error(`Base template '${baseTemplate}' not found`);
    }

    const { template, metadata } = result;
    
    // Override description if provided
    if (description) {
      metadata.description = description;
    }

    // Save to file
    const filePath = path.join(this.templatesDir, `${name.toLowerCase()}.json`);
    const exportData = ConfigurationTemplates.exportTemplate(name, template, metadata);
    
    fs.writeFileSync(filePath, exportData, 'utf-8');
    
    // Update in-memory cache
    this.customTemplates.set(metadata.name, { template, metadata });
    
    return metadata;
  }

  async updateTemplate(
    name: string,
    updates: Partial<PhoenixCodeLiteConfigData>,
    description?: string
  ): Promise<TemplateMetadata> {
    const existing = this.getTemplateByName(name);
    if (!existing) {
      throw new Error(`Template '${name}' not found`);
    }

    // Can't update built-in templates
    if (!this.customTemplates.has(name.toLowerCase())) {
      throw new Error(`Cannot update built-in template '${name}'. Create a custom template instead.`);
    }

    const merged = ConfigurationTemplates.mergeTemplates(existing.template, updates);
    const validation = ConfigurationTemplates.validateTemplate(merged);
    
    if (!validation.valid) {
      throw new Error(`Invalid template updates: ${validation.errors.join(', ')}`);
    }

    const metadata = { ...existing.metadata };
    if (description) {
      metadata.description = description;
    }

    // Save updated template
    const filePath = path.join(this.templatesDir, `${name.toLowerCase()}.json`);
    const exportData = ConfigurationTemplates.exportTemplate(name, merged, metadata);
    
    fs.writeFileSync(filePath, exportData, 'utf-8');
    
    // Update in-memory cache
    this.customTemplates.set(metadata.name, { template: merged, metadata });
    
    return metadata;
  }

  async deleteTemplate(name: string): Promise<boolean> {
    const lowerName = name.toLowerCase();
    
    // Can't delete built-in templates
    if (!this.customTemplates.has(lowerName)) {
      throw new Error(`Cannot delete built-in template '${name}' or template not found`);
    }

    // Remove file
    const filePath = path.join(this.templatesDir, `${lowerName}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from memory
    this.customTemplates.delete(lowerName);
    
    return true;
  }

  async duplicateTemplate(sourceName: string, newName: string, description?: string): Promise<TemplateMetadata> {
    const source = this.getTemplateByName(sourceName);
    if (!source) {
      throw new Error(`Source template '${sourceName}' not found`);
    }

    // Check if target name already exists
    if (this.getTemplateByName(newName)) {
      throw new Error(`Template '${newName}' already exists`);
    }

    const metadata: TemplateMetadata = {
      ...source.metadata,
      name: newName.toLowerCase(),
      displayName: newName,
      description: description || `Copy of ${source.metadata.displayName}`,
      category: 'custom',
      recommended: false,
    };

    // Save as new template
    const filePath = path.join(this.templatesDir, `${newName.toLowerCase()}.json`);
    const exportData = ConfigurationTemplates.exportTemplate(newName, source.template, metadata);
    
    fs.writeFileSync(filePath, exportData, 'utf-8');
    
    // Update in-memory cache
    this.customTemplates.set(metadata.name, { template: source.template, metadata });
    
    return metadata;
  }

  async resetTemplate(name: string): Promise<TemplateMetadata | null> {
    // Only works for built-in templates
    const builtInTemplate = ConfigurationTemplates.getTemplateByName(name);
    const builtInMetadata = ConfigurationTemplates.getTemplateMetadata(name);
    
    if (!builtInTemplate || !builtInMetadata) {
      throw new Error(`Built-in template '${name}' not found`);
    }

    // If it's a custom template with the same name, delete it to reveal the built-in
    if (this.customTemplates.has(name.toLowerCase())) {
      await this.deleteTemplate(name);
    }

    return builtInMetadata;
  }

  async applyTemplate(templateName: string, config?: PhoenixCodeLiteConfig): Promise<PhoenixCodeLiteConfig> {
    const templateData = this.getTemplateByName(templateName);
    if (!templateData) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const targetConfig = config || await PhoenixCodeLiteConfig.load();
    
    // Apply template configuration
    const merged = ConfigurationTemplates.mergeTemplates(targetConfig.export(), templateData.template);
    
    // Create new config with merged data
    const newConfig = new PhoenixCodeLiteConfig(merged as PhoenixCodeLiteConfigData, targetConfig['configPath'] || process.cwd());
    
    return newConfig;
  }

  exportTemplate(name: string): string {
    const templateData = this.getTemplateByName(name);
    if (!templateData) {
      throw new Error(`Template '${name}' not found`);
    }

    return ConfigurationTemplates.exportTemplate(name, templateData.template, templateData.metadata);
  }

  async importTemplate(jsonData: string, overwrite: boolean = false): Promise<TemplateMetadata> {
    const { template, metadata } = ConfigurationTemplates.importTemplate(jsonData);
    
    // Check if template already exists
    if (!overwrite && this.getTemplateByName(metadata.name)) {
      throw new Error(`Template '${metadata.name}' already exists. Use overwrite=true to replace it.`);
    }

    // Save imported template
    const filePath = path.join(this.templatesDir, `${metadata.name.toLowerCase()}.json`);
    const exportData = ConfigurationTemplates.exportTemplate(metadata.name, template, metadata);
    
    fs.writeFileSync(filePath, exportData, 'utf-8');
    
    // Update in-memory cache
    this.customTemplates.set(metadata.name, { template, metadata });
    
    return metadata;
  }

  getTemplatePreview(name: string): string {
    const templateData = this.getTemplateByName(name);
    if (!templateData) {
      throw new Error(`Template '${name}' not found`);
    }

    const { template, metadata } = templateData;
    
    const lines = [
      `Template: ${metadata.displayName}`,
      `Description: ${metadata.description}`,
      `Category: ${metadata.category}`,
      `Test Coverage: ${(metadata.testCoverage * 100).toFixed(0)}%`,
      `Quality Level: ${metadata.qualityLevel}`,
      '',
      'Configuration Preview:',
    ];

    if (template.claude) {
      lines.push(`• Claude Max Turns: ${template.claude.maxTurns}`);
      lines.push(`• Claude Timeout: ${template.claude.timeout}ms`);
    }

    if (template.quality) {
      lines.push(`• Min Test Coverage: ${(template.quality.minTestCoverage || 0) * 100}%`);
      lines.push(`• Max Complexity: ${template.quality.maxComplexity}`);
    }

    if (template.tdd?.qualityGates) {
      lines.push(`• Quality Gates: ${template.tdd.qualityGates.enabled ? 'Enabled' : 'Disabled'}`);
      lines.push(`• Strict Mode: ${template.tdd.qualityGates.strictMode ? 'Yes' : 'No'}`);
    }

    return lines.join('\n');
  }
}