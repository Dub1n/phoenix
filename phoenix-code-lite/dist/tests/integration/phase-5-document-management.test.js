"use strict";
/**
 * Phase 5: Advanced Features - Per-Agent Document Management Tests
 * Tests the document management system with template-level activation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const document_manager_1 = require("../../src/config/document-manager");
const document_configuration_editor_1 = require("../../src/cli/document-configuration-editor");
const templates_1 = require("../../src/config/templates");
const fs_1 = require("fs");
const path_1 = require("path");
(0, globals_1.describe)('Phase 5: Advanced Features - Document Management', () => {
    let documentManager;
    let editor;
    let testDocumentsPath;
    let mockSecurityManager;
    (0, globals_1.beforeEach)(async () => {
        // Create a temporary directory for test documents
        testDocumentsPath = (0, path_1.join)(__dirname, '..', 'temp', `test-docs-${Date.now()}`);
        // Create simple mock SecurityGuardrailsManager that allows all operations for testing
        // Following TDD-STANDARDS.md: mock external dependencies instead of configuring them
        mockSecurityManager = {
            validateFileAccess: globals_1.jest.fn(async () => ({
                allowed: true,
                violations: []
            })),
            validateCommandExecution: globals_1.jest.fn(async () => ({
                allowed: true,
                violations: []
            })),
            secureFileRead: globals_1.jest.fn(async () => 'mock content'),
            secureFileWrite: globals_1.jest.fn(async () => undefined),
            secureCommandExecution: globals_1.jest.fn(async () => undefined)
        };
        // Use dependency injection with mocked security manager
        documentManager = new document_manager_1.DocumentManager(testDocumentsPath, mockSecurityManager);
        editor = new document_configuration_editor_1.DocumentConfigurationEditor();
    });
    (0, globals_1.afterEach)(async () => {
        // Cleanup test directory
        try {
            await fs_1.promises.rm(testDocumentsPath, { recursive: true, force: true });
        }
        catch (error) {
            console.warn('Cleanup warning:', error);
        }
    });
    (0, globals_1.describe)('Issue #17: Per-Agent Document Management', () => {
        (0, globals_1.it)('should initialize document system with correct directory structure', async () => {
            const result = await documentManager.initializeDocumentSystem();
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.affectedDocuments).toEqual([
                'global',
                'agents/planning-analyst',
                'agents/implementation-engineer',
                'agents/quality-reviewer'
            ]);
            // Verify directories were created
            const globalDir = (0, path_1.join)(testDocumentsPath, 'global');
            const planningDir = (0, path_1.join)(testDocumentsPath, 'agents/planning-analyst');
            const implementationDir = (0, path_1.join)(testDocumentsPath, 'agents/implementation-engineer');
            const reviewerDir = (0, path_1.join)(testDocumentsPath, 'agents/quality-reviewer');
            await (0, globals_1.expect)(fs_1.promises.access(globalDir)).resolves.not.toThrow();
            await (0, globals_1.expect)(fs_1.promises.access(planningDir)).resolves.not.toThrow();
            await (0, globals_1.expect)(fs_1.promises.access(implementationDir)).resolves.not.toThrow();
            await (0, globals_1.expect)(fs_1.promises.access(reviewerDir)).resolves.not.toThrow();
        });
        (0, globals_1.it)('should create default documents during initialization', async () => {
            await documentManager.initializeDocumentSystem();
            const inventory = await documentManager.getAvailableDocuments();
            // Should have global documents
            (0, globals_1.expect)(inventory.global.length).toBeGreaterThan(0);
            (0, globals_1.expect)(inventory.global.some(doc => doc.filename === 'project-context.md')).toBe(true);
            // Should have agent-specific documents
            (0, globals_1.expect)(inventory.agents['planning-analyst'].length).toBeGreaterThan(0);
            (0, globals_1.expect)(inventory.agents['implementation-engineer'].length).toBeGreaterThan(0);
            (0, globals_1.expect)(inventory.agents['quality-reviewer'].length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should scan and categorize documents correctly', async () => {
            await documentManager.initializeDocumentSystem();
            const inventory = await documentManager.getAvailableDocuments();
            // Verify document structure
            (0, globals_1.expect)(inventory).toHaveProperty('global');
            (0, globals_1.expect)(inventory).toHaveProperty('agents');
            (0, globals_1.expect)(inventory.agents).toHaveProperty('planning-analyst');
            (0, globals_1.expect)(inventory.agents).toHaveProperty('implementation-engineer');
            (0, globals_1.expect)(inventory.agents).toHaveProperty('quality-reviewer');
            // Verify document information includes required fields
            const allDocuments = [
                ...inventory.global,
                ...inventory.agents['planning-analyst'],
                ...inventory.agents['implementation-engineer'],
                ...inventory.agents['quality-reviewer']
            ];
            allDocuments.forEach(doc => {
                (0, globals_1.expect)(doc).toHaveProperty('filename');
                (0, globals_1.expect)(doc).toHaveProperty('name');
                (0, globals_1.expect)(doc).toHaveProperty('description');
                (0, globals_1.expect)(doc).toHaveProperty('path');
                (0, globals_1.expect)(doc).toHaveProperty('size');
                (0, globals_1.expect)(doc).toHaveProperty('lastModified');
                (0, globals_1.expect)(doc).toHaveProperty('type');
            });
        });
        (0, globals_1.it)('should handle template document configuration', async () => {
            await documentManager.initializeDocumentSystem();
            const templateName = 'starter';
            // Get default configuration
            const defaultConfig = await documentManager.getTemplateDocumentConfiguration(templateName);
            (0, globals_1.expect)(defaultConfig).toHaveProperty('global');
            (0, globals_1.expect)(defaultConfig).toHaveProperty('agents');
            // Update configuration
            const newConfig = {
                global: {
                    'project-context.md': true
                },
                agents: {
                    'planning-analyst': {
                        'planning-guidelines.md': true
                    },
                    'implementation-engineer': {
                        'implementation-standards.md': false
                    },
                    'quality-reviewer': {
                        'review-checklist.md': true
                    }
                }
            };
            const updateResult = await documentManager.updateTemplateDocumentConfiguration(templateName, newConfig);
            (0, globals_1.expect)(updateResult.success).toBe(true);
            // Verify configuration was updated
            const updatedConfig = await documentManager.getTemplateDocumentConfiguration(templateName);
            (0, globals_1.expect)(updatedConfig.global['project-context.md']).toBe(true);
            (0, globals_1.expect)(updatedConfig.agents['planning-analyst']['planning-guidelines.md']).toBe(true);
            (0, globals_1.expect)(updatedConfig.agents['implementation-engineer']['implementation-standards.md']).toBe(false);
            (0, globals_1.expect)(updatedConfig.agents['quality-reviewer']['review-checklist.md']).toBe(true);
        });
        (0, globals_1.it)('should support document search functionality', async () => {
            await documentManager.initializeDocumentSystem();
            // Search global documents
            const globalSearch = await documentManager.searchDocuments({
                category: 'global',
                fileType: 'markdown'
            });
            (0, globals_1.expect)(globalSearch.documents.every(doc => doc.type === 'markdown')).toBe(true);
            (0, globals_1.expect)(globalSearch.totalCount).toBeGreaterThan(0);
            // Search agent-specific documents
            const agentSearch = await documentManager.searchDocuments({
                category: 'agents',
                agentType: 'planning-analyst'
            });
            (0, globals_1.expect)(agentSearch.documents.length).toBeGreaterThan(0);
            // Search with term
            const termSearch = await documentManager.searchDocuments({
                searchTerm: 'planning'
            });
            (0, globals_1.expect)(termSearch.documents.some(doc => doc.name.toLowerCase().includes('planning') ||
                doc.description.toLowerCase().includes('planning'))).toBe(true);
        });
        (0, globals_1.it)('should handle document creation from templates', async () => {
            await documentManager.initializeDocumentSystem();
            const template = {
                name: 'custom-guide',
                description: 'Custom guidance document',
                content: '# Custom Guide\n\nThis is a custom guidance document.',
                type: 'markdown',
                category: 'agent-specific',
                agentType: 'planning-analyst'
            };
            const result = await documentManager.createDocumentFromTemplate(template, 'agents/planning-analyst');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.affectedDocuments?.length).toBe(1);
            // Verify document was created
            const inventory = await documentManager.getAvailableDocuments();
            const createdDoc = inventory.agents['planning-analyst'].find(doc => doc.filename === 'custom-guide.md');
            (0, globals_1.expect)(createdDoc).toBeDefined();
            (0, globals_1.expect)(createdDoc?.name).toBe('Custom Guide');
        });
    });
    (0, globals_1.describe)('Template Integration', () => {
        (0, globals_1.it)('should integrate with configuration templates system', () => {
            // Test that template metadata supports document configuration
            const templates = templates_1.ConfigurationTemplates.getTemplateList();
            templates.forEach(template => {
                (0, globals_1.expect)(template).toHaveProperty('name');
                (0, globals_1.expect)(template).toHaveProperty('displayName');
                // documents property should be optional
                if (template.documents) {
                    (0, globals_1.expect)(template.documents).toHaveProperty('global');
                    (0, globals_1.expect)(template.documents).toHaveProperty('agents');
                }
            });
        });
        (0, globals_1.it)('should initialize default document configurations', () => {
            templates_1.ConfigurationTemplates.initializeDefaultDocumentConfigurations();
            const templates = templates_1.ConfigurationTemplates.getTemplateList();
            // At least some templates should have document configurations after initialization
            const templatesWithDocs = templates.filter(t => t.documents);
            (0, globals_1.expect)(templatesWithDocs.length).toBeGreaterThan(0);
            // Verify structure of initialized configurations
            templatesWithDocs.forEach(template => {
                const docs = template.documents;
                (0, globals_1.expect)(docs.global).toBeDefined();
                (0, globals_1.expect)(docs.agents).toBeDefined();
                (0, globals_1.expect)(docs.agents['planning-analyst']).toBeDefined();
                (0, globals_1.expect)(docs.agents['implementation-engineer']).toBeDefined();
                (0, globals_1.expect)(docs.agents['quality-reviewer']).toBeDefined();
            });
        });
        (0, globals_1.it)('should support template document updates', () => {
            const templateName = 'starter';
            const testConfig = {
                global: {
                    'test-doc.md': true
                },
                agents: {
                    'planning-analyst': {},
                    'implementation-engineer': {},
                    'quality-reviewer': {}
                }
            };
            const result = templates_1.ConfigurationTemplates.updateTemplateDocuments(templateName, testConfig);
            (0, globals_1.expect)(result).toBe(true);
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle missing template gracefully', async () => {
            const config = await documentManager.getTemplateDocumentConfiguration('nonexistent-template');
            // Should return default empty configuration
            (0, globals_1.expect)(config.global).toEqual({});
            (0, globals_1.expect)(config.agents['planning-analyst']).toEqual({});
            (0, globals_1.expect)(config.agents['implementation-engineer']).toEqual({});
            (0, globals_1.expect)(config.agents['quality-reviewer']).toEqual({});
        });
        (0, globals_1.it)('should handle file system errors gracefully', async () => {
            // Test with invalid path
            const invalidDocumentManager = new document_manager_1.DocumentManager('/invalid/path/that/does/not/exist');
            const inventory = await invalidDocumentManager.getAvailableDocuments();
            // Should return empty inventory without throwing
            (0, globals_1.expect)(inventory.global).toEqual([]);
            (0, globals_1.expect)(inventory.agents['planning-analyst']).toEqual([]);
            (0, globals_1.expect)(inventory.agents['implementation-engineer']).toEqual([]);
            (0, globals_1.expect)(inventory.agents['quality-reviewer']).toEqual([]);
        });
        (0, globals_1.it)('should validate file types and sizes', async () => {
            await documentManager.initializeDocumentSystem();
            // Create a test file with invalid extension
            const invalidFile = (0, path_1.join)(testDocumentsPath, 'global', 'test.exe');
            await fs_1.promises.writeFile(invalidFile, 'test content');
            const inventory = await documentManager.getAvailableDocuments();
            // Should not include files with invalid extensions
            const hasInvalidFile = inventory.global.some(doc => doc.filename === 'test.exe');
            (0, globals_1.expect)(hasInvalidFile).toBe(false);
        });
    });
    (0, globals_1.describe)('Performance and Security', () => {
        (0, globals_1.it)('should handle large numbers of documents efficiently', async () => {
            await documentManager.initializeDocumentSystem();
            // Create multiple test documents
            const startTime = Date.now();
            for (let i = 0; i < 10; i++) {
                const content = `# Test Document ${i}\nContent for test document ${i}`;
                await fs_1.promises.writeFile((0, path_1.join)(testDocumentsPath, 'global', `test-doc-${i}.md`), content);
            }
            const inventory = await documentManager.getAvailableDocuments();
            const endTime = Date.now();
            (0, globals_1.expect)(inventory.global.length).toBeGreaterThanOrEqual(10);
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
        (0, globals_1.it)('should properly sanitize file paths', async () => {
            await documentManager.initializeDocumentSystem();
            // Test that relative path attacks are prevented by filename sanitization
            const template = {
                name: '../../../malicious',
                description: 'Test document',
                content: 'content',
                type: 'text',
                category: 'global'
            };
            const result = await documentManager.createDocumentFromTemplate(template, 'global');
            // Should succeed but with sanitized filename (DocumentManager.sanitizeFilename handles this)
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.affectedDocuments?.[0]).toContain(testDocumentsPath);
            (0, globals_1.expect)(result.affectedDocuments?.[0]).toContain('malicious.txt'); // Should strip path traversal characters
            (0, globals_1.expect)(result.affectedDocuments?.[0]).not.toContain('../'); // Path traversal removed
            // Verify security manager was consulted for validation
            (0, globals_1.expect)(mockSecurityManager.validateFileAccess).toHaveBeenCalled();
        });
        (0, globals_1.it)('should handle security validation failures', async () => {
            await documentManager.initializeDocumentSystem();
            // Configure mock to simulate security failure for one call
            mockSecurityManager.validateFileAccess.mockResolvedValueOnce({
                allowed: false,
                violations: [{
                        type: 'path_violation',
                        severity: 'high',
                        description: 'Access to non-whitelisted path',
                        requestedAction: 'file_write',
                        policy: 'allowedPaths',
                        timestamp: new Date()
                    }]
            });
            const template = {
                name: 'test-doc',
                description: 'Test document',
                content: 'content',
                type: 'text',
                category: 'global'
            };
            const result = await documentManager.createDocumentFromTemplate(template, 'global');
            // Should fail due to security validation
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.message).toContain('Security validation failed');
            (0, globals_1.expect)(result.errors).toContain('Access to non-whitelisted path');
        });
    });
});
//# sourceMappingURL=phase-5-document-management.test.js.map