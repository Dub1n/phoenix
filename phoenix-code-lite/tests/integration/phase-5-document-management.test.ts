/**
 * Phase 5: Advanced Features - Per-Agent Document Management Tests
 * Tests the document management system with template-level activation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DocumentManager } from '../../src/config/document-manager';
import { DocumentConfigurationEditor } from '../../src/cli/document-configuration-editor';
import { ConfigurationTemplates } from '../../src/config/templates';
import { DocumentConfiguration, DocumentOperationResult } from '../../src/types/document-management';
import { SecurityGuardrailsManager, SecurityViolation } from '../../src/security/guardrails';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('Phase 5: Advanced Features - Document Management', () => {
  let documentManager: DocumentManager;
  let editor: DocumentConfigurationEditor;
  let testDocumentsPath: string;
  let mockSecurityManager: any;

  beforeEach(async () => {
    // Create a temporary directory for test documents
    testDocumentsPath = join(__dirname, '..', 'temp', `test-docs-${Date.now()}`);
    
    // Create simple mock SecurityGuardrailsManager that allows all operations for testing
    // Following TDD-STANDARDS.md: mock external dependencies instead of configuring them
    mockSecurityManager = {
      validateFileAccess: jest.fn(async () => ({
        allowed: true,
        violations: []
      })),
      validateCommandExecution: jest.fn(async () => ({
        allowed: true,
        violations: []
      })),
      secureFileRead: jest.fn(async () => 'mock content'),
      secureFileWrite: jest.fn(async () => undefined),
      secureCommandExecution: jest.fn(async () => undefined)
    };

    // Use dependency injection with mocked security manager
    documentManager = new DocumentManager(testDocumentsPath, mockSecurityManager);
    editor = new DocumentConfigurationEditor();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDocumentsPath, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Issue #17: Per-Agent Document Management', () => {
    it('should initialize document system with correct directory structure', async () => {
      const result = await documentManager.initializeDocumentSystem();
      
      expect(result.success).toBe(true);
      expect(result.affectedDocuments).toEqual([
        'global',
        'agents/planning-analyst',
        'agents/implementation-engineer',
        'agents/quality-reviewer'
      ]);

      // Verify directories were created
      const globalDir = join(testDocumentsPath, 'global');
      const planningDir = join(testDocumentsPath, 'agents/planning-analyst');
      const implementationDir = join(testDocumentsPath, 'agents/implementation-engineer');
      const reviewerDir = join(testDocumentsPath, 'agents/quality-reviewer');

      await expect(fs.access(globalDir)).resolves.not.toThrow();
      await expect(fs.access(planningDir)).resolves.not.toThrow();
      await expect(fs.access(implementationDir)).resolves.not.toThrow();
      await expect(fs.access(reviewerDir)).resolves.not.toThrow();
    });

    it('should create default documents during initialization', async () => {
      await documentManager.initializeDocumentSystem();
      
      const inventory = await documentManager.getAvailableDocuments();
      
      // Should have global documents
      expect(inventory.global.length).toBeGreaterThan(0);
      expect(inventory.global.some(doc => doc.filename === 'project-context.md')).toBe(true);

      // Should have agent-specific documents
      expect(inventory.agents['planning-analyst'].length).toBeGreaterThan(0);
      expect(inventory.agents['implementation-engineer'].length).toBeGreaterThan(0);
      expect(inventory.agents['quality-reviewer'].length).toBeGreaterThan(0);
    });

    it('should scan and categorize documents correctly', async () => {
      await documentManager.initializeDocumentSystem();
      
      const inventory = await documentManager.getAvailableDocuments();
      
      // Verify document structure
      expect(inventory).toHaveProperty('global');
      expect(inventory).toHaveProperty('agents');
      expect(inventory.agents).toHaveProperty('planning-analyst');
      expect(inventory.agents).toHaveProperty('implementation-engineer');
      expect(inventory.agents).toHaveProperty('quality-reviewer');

      // Verify document information includes required fields
      const allDocuments = [
        ...inventory.global,
        ...inventory.agents['planning-analyst'],
        ...inventory.agents['implementation-engineer'],
        ...inventory.agents['quality-reviewer']
      ];

      allDocuments.forEach(doc => {
        expect(doc).toHaveProperty('filename');
        expect(doc).toHaveProperty('name');
        expect(doc).toHaveProperty('description');
        expect(doc).toHaveProperty('path');
        expect(doc).toHaveProperty('size');
        expect(doc).toHaveProperty('lastModified');
        expect(doc).toHaveProperty('type');
      });
    });

    it('should handle template document configuration', async () => {
      await documentManager.initializeDocumentSystem();
      
      const templateName = 'starter';
      
      // Get default configuration
      const defaultConfig = await documentManager.getTemplateDocumentConfiguration(templateName);
      expect(defaultConfig).toHaveProperty('global');
      expect(defaultConfig).toHaveProperty('agents');

      // Update configuration
      const newConfig: DocumentConfiguration = {
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
      expect(updateResult.success).toBe(true);

      // Verify configuration was updated
      const updatedConfig = await documentManager.getTemplateDocumentConfiguration(templateName);
      expect(updatedConfig.global['project-context.md']).toBe(true);
      expect(updatedConfig.agents['planning-analyst']['planning-guidelines.md']).toBe(true);
      expect(updatedConfig.agents['implementation-engineer']['implementation-standards.md']).toBe(false);
      expect(updatedConfig.agents['quality-reviewer']['review-checklist.md']).toBe(true);
    });

    it('should support document search functionality', async () => {
      await documentManager.initializeDocumentSystem();
      
      // Search global documents
      const globalSearch = await documentManager.searchDocuments({
        category: 'global',
        fileType: 'markdown'
      });
      
      expect(globalSearch.documents.every(doc => doc.type === 'markdown')).toBe(true);
      expect(globalSearch.totalCount).toBeGreaterThan(0);

      // Search agent-specific documents
      const agentSearch = await documentManager.searchDocuments({
        category: 'agents',
        agentType: 'planning-analyst'
      });
      
      expect(agentSearch.documents.length).toBeGreaterThan(0);

      // Search with term
      const termSearch = await documentManager.searchDocuments({
        searchTerm: 'planning'
      });
      
      expect(termSearch.documents.some(doc => 
        doc.name.toLowerCase().includes('planning') ||
        doc.description.toLowerCase().includes('planning')
      )).toBe(true);
    });

    it('should handle document creation from templates', async () => {
      await documentManager.initializeDocumentSystem();
      
      const template = {
        name: 'custom-guide',
        description: 'Custom guidance document',
        content: '# Custom Guide\n\nThis is a custom guidance document.',
        type: 'markdown' as const,
        category: 'agent-specific' as const,
        agentType: 'planning-analyst' as const
      };

      const result = await documentManager.createDocumentFromTemplate(template, 'agents/planning-analyst');
      
      expect(result.success).toBe(true);
      expect(result.affectedDocuments?.length).toBe(1);

      // Verify document was created
      const inventory = await documentManager.getAvailableDocuments();
      const createdDoc = inventory.agents['planning-analyst'].find(doc => 
        doc.filename === 'custom-guide.md'
      );
      
      expect(createdDoc).toBeDefined();
      expect(createdDoc?.name).toBe('Custom Guide');
    });
  });

  describe('Template Integration', () => {
    it('should integrate with configuration templates system', () => {
      // Test that template metadata supports document configuration
      const templates = ConfigurationTemplates.getTemplateList();
      
      templates.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('displayName');
        // documents property should be optional
        if (template.documents) {
          expect(template.documents).toHaveProperty('global');
          expect(template.documents).toHaveProperty('agents');
        }
      });
    });

    it('should initialize default document configurations', () => {
      ConfigurationTemplates.initializeDefaultDocumentConfigurations();
      
      const templates = ConfigurationTemplates.getTemplateList();
      
      // At least some templates should have document configurations after initialization
      const templatesWithDocs = templates.filter(t => t.documents);
      expect(templatesWithDocs.length).toBeGreaterThan(0);
      
      // Verify structure of initialized configurations
      templatesWithDocs.forEach(template => {
        const docs = template.documents!;
        expect(docs.global).toBeDefined();
        expect(docs.agents).toBeDefined();
        expect(docs.agents['planning-analyst']).toBeDefined();
        expect(docs.agents['implementation-engineer']).toBeDefined();
        expect(docs.agents['quality-reviewer']).toBeDefined();
      });
    });

    it('should support template document updates', () => {
      const templateName = 'starter';
      const testConfig: DocumentConfiguration = {
        global: {
          'test-doc.md': true
        },
        agents: {
          'planning-analyst': {},
          'implementation-engineer': {},
          'quality-reviewer': {}
        }
      };

      const result = ConfigurationTemplates.updateTemplateDocuments(templateName, testConfig);
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing template gracefully', async () => {
      const config = await documentManager.getTemplateDocumentConfiguration('nonexistent-template');
      
      // Should return default empty configuration
      expect(config.global).toEqual({});
      expect(config.agents['planning-analyst']).toEqual({});
      expect(config.agents['implementation-engineer']).toEqual({});
      expect(config.agents['quality-reviewer']).toEqual({});
    });

    it('should handle file system errors gracefully', async () => {
      // Test with invalid path
      const invalidDocumentManager = new DocumentManager('/invalid/path/that/does/not/exist');
      
      const inventory = await invalidDocumentManager.getAvailableDocuments();
      
      // Should return empty inventory without throwing
      expect(inventory.global).toEqual([]);
      expect(inventory.agents['planning-analyst']).toEqual([]);
      expect(inventory.agents['implementation-engineer']).toEqual([]);
      expect(inventory.agents['quality-reviewer']).toEqual([]);
    });

    it('should validate file types and sizes', async () => {
      await documentManager.initializeDocumentSystem();
      
      // Create a test file with invalid extension
      const invalidFile = join(testDocumentsPath, 'global', 'test.exe');
      await fs.writeFile(invalidFile, 'test content');
      
      const inventory = await documentManager.getAvailableDocuments();
      
      // Should not include files with invalid extensions
      const hasInvalidFile = inventory.global.some(doc => doc.filename === 'test.exe');
      expect(hasInvalidFile).toBe(false);
    });
  });

  describe('Performance and Security', () => {
    it('should handle large numbers of documents efficiently', async () => {
      await documentManager.initializeDocumentSystem();
      
      // Create multiple test documents
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const content = `# Test Document ${i}\nContent for test document ${i}`;
        await fs.writeFile(
          join(testDocumentsPath, 'global', `test-doc-${i}.md`),
          content
        );
      }
      
      const inventory = await documentManager.getAvailableDocuments();
      const endTime = Date.now();
      
      expect(inventory.global.length).toBeGreaterThanOrEqual(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should properly sanitize file paths', async () => {
      await documentManager.initializeDocumentSystem();
      
      // Test that relative path attacks are prevented by filename sanitization
      const template = {
        name: '../../../malicious',
        description: 'Test document',
        content: 'content',
        type: 'text' as const,
        category: 'global' as const
      };

      const result = await documentManager.createDocumentFromTemplate(template, 'global');
      
      // Should succeed but with sanitized filename (DocumentManager.sanitizeFilename handles this)
      expect(result.success).toBe(true);
      expect(result.affectedDocuments?.[0]).toContain(testDocumentsPath);
      expect(result.affectedDocuments?.[0]).toContain('malicious.txt'); // Should strip path traversal characters
      expect(result.affectedDocuments?.[0]).not.toContain('../'); // Path traversal removed
      
      // Verify security manager was consulted for validation
      expect(mockSecurityManager.validateFileAccess).toHaveBeenCalled();
    });

    it('should handle security validation failures', async () => {
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
        type: 'text' as const,
        category: 'global' as const
      };

      const result = await documentManager.createDocumentFromTemplate(template, 'global');
      
      // Should fail due to security validation
      expect(result.success).toBe(false);
      expect(result.message).toContain('Security validation failed');
      expect(result.errors).toContain('Access to non-whitelisted path');
    });
  });
});