"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const settings_1 = require("./settings");
const templates_1 = require("./templates");
class TemplateManager {
    constructor(options = {}) {
        this.customTemplates = new Map();
        this.templatesDir = options.templatesDir || path_1.default.join(process.cwd(), '.phoenix', 'templates');
        if (options.createDirIfNotExists !== false) {
            this.ensureTemplatesDirectory();
        }
        this.loadCustomTemplates();
    }
    ensureTemplatesDirectory() {
        if (!fs_1.default.existsSync(this.templatesDir)) {
            fs_1.default.mkdirSync(this.templatesDir, { recursive: true });
        }
    }
    loadCustomTemplates() {
        if (!fs_1.default.existsSync(this.templatesDir)) {
            return;
        }
        const files = fs_1.default.readdirSync(this.templatesDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const filePath = path_1.default.join(this.templatesDir, file);
                const content = fs_1.default.readFileSync(filePath, 'utf-8');
                const { template, metadata } = templates_1.ConfigurationTemplates.importTemplate(content);
                this.customTemplates.set(metadata.name, { template, metadata });
            }
            catch (error) {
                console.warn(`Failed to load template ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    getAllTemplates() {
        const builtIn = templates_1.ConfigurationTemplates.getTemplateList();
        const custom = Array.from(this.customTemplates.values()).map(t => t.metadata);
        return [...builtIn, ...custom];
    }
    getTemplateByName(name) {
        // Check built-in templates first
        const builtInTemplate = templates_1.ConfigurationTemplates.getTemplateByName(name);
        if (builtInTemplate) {
            const metadata = templates_1.ConfigurationTemplates.getTemplateMetadata(name);
            if (metadata) {
                return { template: builtInTemplate, metadata };
            }
        }
        // Check custom templates
        return this.customTemplates.get(name.toLowerCase()) || null;
    }
    async createTemplate(name, baseTemplate, customizations = {}, description) {
        const result = templates_1.ConfigurationTemplates.createCustomTemplate(name, baseTemplate, customizations);
        if (!result) {
            throw new Error(`Base template '${baseTemplate}' not found`);
        }
        const { template, metadata } = result;
        // Override description if provided
        if (description) {
            metadata.description = description;
        }
        // Save to file
        const filePath = path_1.default.join(this.templatesDir, `${name.toLowerCase()}.json`);
        const exportData = templates_1.ConfigurationTemplates.exportTemplate(name, template, metadata);
        fs_1.default.writeFileSync(filePath, exportData, 'utf-8');
        // Update in-memory cache
        this.customTemplates.set(metadata.name, { template, metadata });
        return metadata;
    }
    async updateTemplate(name, updates, description) {
        const existing = this.getTemplateByName(name);
        if (!existing) {
            throw new Error(`Template '${name}' not found`);
        }
        // Can't update built-in templates
        if (!this.customTemplates.has(name.toLowerCase())) {
            throw new Error(`Cannot update built-in template '${name}'. Create a custom template instead.`);
        }
        const merged = templates_1.ConfigurationTemplates.mergeTemplates(existing.template, updates);
        const validation = templates_1.ConfigurationTemplates.validateTemplate(merged);
        if (!validation.valid) {
            throw new Error(`Invalid template updates: ${validation.errors.join(', ')}`);
        }
        const metadata = { ...existing.metadata };
        if (description) {
            metadata.description = description;
        }
        // Save updated template
        const filePath = path_1.default.join(this.templatesDir, `${name.toLowerCase()}.json`);
        const exportData = templates_1.ConfigurationTemplates.exportTemplate(name, merged, metadata);
        fs_1.default.writeFileSync(filePath, exportData, 'utf-8');
        // Update in-memory cache
        this.customTemplates.set(metadata.name, { template: merged, metadata });
        return metadata;
    }
    async deleteTemplate(name) {
        const lowerName = name.toLowerCase();
        // Can't delete built-in templates
        if (!this.customTemplates.has(lowerName)) {
            throw new Error(`Cannot delete built-in template '${name}' or template not found`);
        }
        // Remove file
        const filePath = path_1.default.join(this.templatesDir, `${lowerName}.json`);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Remove from memory
        this.customTemplates.delete(lowerName);
        return true;
    }
    async duplicateTemplate(sourceName, newName, description) {
        const source = this.getTemplateByName(sourceName);
        if (!source) {
            throw new Error(`Source template '${sourceName}' not found`);
        }
        // Check if target name already exists
        if (this.getTemplateByName(newName)) {
            throw new Error(`Template '${newName}' already exists`);
        }
        const metadata = {
            ...source.metadata,
            name: newName.toLowerCase(),
            displayName: newName,
            description: description || `Copy of ${source.metadata.displayName}`,
            category: 'custom',
            recommended: false,
        };
        // Save as new template
        const filePath = path_1.default.join(this.templatesDir, `${newName.toLowerCase()}.json`);
        const exportData = templates_1.ConfigurationTemplates.exportTemplate(newName, source.template, metadata);
        fs_1.default.writeFileSync(filePath, exportData, 'utf-8');
        // Update in-memory cache
        this.customTemplates.set(metadata.name, { template: source.template, metadata });
        return metadata;
    }
    async resetTemplate(name) {
        // Only works for built-in templates
        const builtInTemplate = templates_1.ConfigurationTemplates.getTemplateByName(name);
        const builtInMetadata = templates_1.ConfigurationTemplates.getTemplateMetadata(name);
        if (!builtInTemplate || !builtInMetadata) {
            throw new Error(`Built-in template '${name}' not found`);
        }
        // If it's a custom template with the same name, delete it to reveal the built-in
        if (this.customTemplates.has(name.toLowerCase())) {
            await this.deleteTemplate(name);
        }
        return builtInMetadata;
    }
    async applyTemplate(templateName, config) {
        const templateData = this.getTemplateByName(templateName);
        if (!templateData) {
            throw new Error(`Template '${templateName}' not found`);
        }
        const targetConfig = config || await settings_1.PhoenixCodeLiteConfig.load();
        // Apply template configuration
        const merged = templates_1.ConfigurationTemplates.mergeTemplates(targetConfig.export(), templateData.template);
        // Create new config with merged data
        const newConfig = new settings_1.PhoenixCodeLiteConfig(merged, targetConfig['configPath'] || process.cwd());
        return newConfig;
    }
    exportTemplate(name) {
        const templateData = this.getTemplateByName(name);
        if (!templateData) {
            throw new Error(`Template '${name}' not found`);
        }
        return templates_1.ConfigurationTemplates.exportTemplate(name, templateData.template, templateData.metadata);
    }
    async importTemplate(jsonData, overwrite = false) {
        const { template, metadata } = templates_1.ConfigurationTemplates.importTemplate(jsonData);
        // Check if template already exists
        if (!overwrite && this.getTemplateByName(metadata.name)) {
            throw new Error(`Template '${metadata.name}' already exists. Use overwrite=true to replace it.`);
        }
        // Save imported template
        const filePath = path_1.default.join(this.templatesDir, `${metadata.name.toLowerCase()}.json`);
        const exportData = templates_1.ConfigurationTemplates.exportTemplate(metadata.name, template, metadata);
        fs_1.default.writeFileSync(filePath, exportData, 'utf-8');
        // Update in-memory cache
        this.customTemplates.set(metadata.name, { template, metadata });
        return metadata;
    }
    getTemplatePreview(name) {
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
exports.TemplateManager = TemplateManager;
//# sourceMappingURL=template-manager.js.map