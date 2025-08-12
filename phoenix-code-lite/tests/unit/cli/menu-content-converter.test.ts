import { 
  convertMenuContentToSkinDefinition,
  convertWithLayoutConstraints,
  validateConversion
} from '../../../src/cli/menu-content-converter';
import type { MenuContent, MenuDisplayContext } from '../../../src/cli/menu-types';
import type { SkinMenuDefinition } from '../../../src/cli/unified-layout-engine';

describe('Menu Content Converter', () => {
  
  const createTestMenuContent = (): MenuContent => ({
    title: 'Test Menu',
    subtitle: 'Test subtitle',
    sections: [{
      heading: 'Test Section',
      theme: { headingColor: 'yellow', bold: true },
      items: [
        {
          label: 'First Item',
          description: 'First item description',
          commands: ['first'],
          type: 'command'
        },
        {
          label: 'Second Item',
          description: 'Second item description',
          commands: ['second'],
          type: 'navigation'
        },
        {
          label: 'Third Item',
          description: 'Third item description',
          commands: ['third'],
          type: 'action'
        }
      ]
    }],
    footerHints: ['Hint 1', 'Hint 2'],
    metadata: {
      menuType: 'main',
      complexityLevel: 'simple',
      priority: 'normal',
      autoSize: true
    }
  });

  const createTestContext = (): MenuDisplayContext => ({
    level: 'main',
    parentMenu: undefined,
    currentItem: undefined,
    breadcrumb: ['Test']
  });

  describe('convertMenuContentToSkinDefinition', () => {
    test('should convert menu content to skin definition', () => {
      const menuContent = createTestMenuContent();
      const context = createTestContext();
      
      const result = convertMenuContentToSkinDefinition(menuContent, context);
      
      expect(result.title).toBe('Test Menu');
      expect(result.subtitle).toBe('Test subtitle');
      expect(result.items).toHaveLength(3);
      expect(result.theme).toBeDefined();
      expect(result.theme?.primaryColor).toBe('yellow');
    });

    test('should convert item types correctly', () => {
      const menuContent = createTestMenuContent();
      const context = createTestContext();
      
      const result = convertMenuContentToSkinDefinition(menuContent, context);
      
      expect(result.items[0].type).toBe('command');
      expect(result.items[1].type).toBe('submenu'); // navigation -> submenu
      expect(result.items[2].type).toBe('action');
    });

    test('should handle multiple sections', () => {
      const menuContent: MenuContent = {
        title: 'Multi-Section Menu',
        sections: [
          {
            heading: 'Section 1',
            theme: { headingColor: 'blue', bold: true },
            items: [
              {
                label: 'Item 1',
                description: 'Item 1 description',
                commands: ['item1'],
                type: 'command'
              }
            ]
          },
          {
            heading: 'Section 2',
            theme: { headingColor: 'red', bold: false },
            items: [
              {
                label: 'Item 2',
                description: 'Item 2 description',
                commands: ['item2'],
                type: 'command'
              }
            ]
          }
        ],
        metadata: {
          menuType: 'main',
          complexityLevel: 'simple',
          priority: 'normal',
          autoSize: true
        }
      };
      const context = createTestContext();
      
      const result = convertMenuContentToSkinDefinition(menuContent, context);
      
      // Should include section headers and items
      expect(result.items.length).toBeGreaterThan(2);
      expect(result.items.some(item => item.label === 'Section 1')).toBe(true);
      expect(result.items.some(item => item.label === 'Section 2')).toBe(true);
    });

    test('should use context theme color', () => {
      const menuContent = createTestMenuContent();
      const context: MenuDisplayContext = {
        level: 'config',
        parentMenu: 'main',
        currentItem: undefined,
        breadcrumb: ['Test']
      };
      
      const result = convertMenuContentToSkinDefinition(menuContent, context);
      
      // Should use context-appropriate theme color
      expect(result.theme?.primaryColor).toBe('yellow'); // config level color
    });

    test('should handle missing theme gracefully', () => {
      const menuContent: MenuContent = {
        title: 'No Theme Menu',
        sections: [{
          heading: 'Section',
          items: [
            {
              label: 'Item',
              description: 'Item description',
              commands: ['item'],
              type: 'command'
            }
          ]
        }],
        metadata: {
          menuType: 'main',
          complexityLevel: 'simple',
          priority: 'normal',
          autoSize: true
        }
      };
      const context = createTestContext();
      
      const result = convertMenuContentToSkinDefinition(menuContent, context);
      
      expect(result.theme?.primaryColor).toBe('red'); // default color
    });
  });

  describe('convertWithLayoutConstraints', () => {
    test('should convert with layout constraints', () => {
      const menuContent = createTestMenuContent();
      const context = createTestContext();
      const legacyOptions = {
        minSeparatorLength: 50,
        maxSeparatorLength: 80,
        fixedHeight: 20
      };
      
      const result = convertWithLayoutConstraints(menuContent, context, legacyOptions);
      
      expect(result.skinDefinition).toBeDefined();
      expect(result.layoutConstraints).toBeDefined();
      expect(result.layoutConstraints.minWidth).toBe(50);
      expect(result.layoutConstraints.maxWidth).toBe(80);
      expect(result.layoutConstraints.fixedHeight).toBe(20);
    });

    test('should use default constraints when not provided', () => {
      const menuContent = createTestMenuContent();
      const context = createTestContext();
      
      const result = convertWithLayoutConstraints(menuContent, context);
      
      expect(result.layoutConstraints.minWidth).toBe(40);
      expect(result.layoutConstraints.maxWidth).toBe(100);
      expect(result.layoutConstraints.fixedHeight).toBe(25);
    });
  });

  describe('validateConversion', () => {
    test('should validate successful conversion', () => {
      const original = createTestMenuContent();
      const converted: SkinMenuDefinition = {
        title: 'Test Menu',
        subtitle: 'Test subtitle',
        items: [
          {
            id: 'first',
            label: 'First Item',
            description: 'First item description',
            type: 'command',
            command: 'first'
          },
          {
            id: 'second',
            label: 'Second Item',
            description: 'Second item description',
            type: 'submenu',
            command: 'second'
          }
        ],
        theme: {
          primaryColor: 'yellow',
          accentColor: 'cyan',
          separatorChar: '═',
          useIcons: true
        }
      };
      
      const validation = validateConversion(original, converted);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.summary.originalItems).toBe(3);
      expect(validation.summary.convertedItems).toBe(2);
      expect(validation.summary.titleMatch).toBe(true);
      expect(validation.summary.subtitleMatch).toBe(true);
    });

    test('should detect conversion issues', () => {
      const original = createTestMenuContent();
      const converted: SkinMenuDefinition = {
        title: 'Different Title', // Different title
        items: [], // No items
        theme: {
          primaryColor: 'blue',
          accentColor: 'cyan',
          separatorChar: '═',
          useIcons: true
        }
      };
      
      const validation = validateConversion(original, converted);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.summary.titleMatch).toBe(false);
      expect(validation.summary.originalItems).toBe(3);
      expect(validation.summary.convertedItems).toBe(0);
    });

    test('should handle empty original content', () => {
      const original: MenuContent = {
        title: 'Empty Menu',
        sections: [],
        metadata: {
          menuType: 'main',
          complexityLevel: 'simple',
          priority: 'normal',
          autoSize: true
        }
      };
      const converted: SkinMenuDefinition = {
        title: 'Empty Menu',
        items: [],
        theme: {
          primaryColor: 'red',
          accentColor: 'cyan',
          separatorChar: '═',
          useIcons: true
        }
      };
      
      const validation = validateConversion(original, converted);
      
      expect(validation.isValid).toBe(true);
      expect(validation.summary.originalItems).toBe(0);
      expect(validation.summary.convertedItems).toBe(0);
    });
  });
}); 
