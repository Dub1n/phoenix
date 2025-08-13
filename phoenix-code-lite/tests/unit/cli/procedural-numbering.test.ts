import { renderLegacyWithUnified } from '../../../src/cli/skin-menu-renderer';
import { calculateMenuLayout, renderMenuWithLayout } from '../../../src/cli/unified-layout-engine';
import type { MenuContent, MenuDisplayContext } from '../../../src/cli/menu-types';
import type { SkinMenuDefinition, LayoutConstraints } from '../../../src/cli/unified-layout-engine';

describe('Procedural Numbering', () => {
  
  const createTestMenuContent = (): MenuContent => ({
    title: '□ Template Management Center',
    subtitle: 'Choose from Starter, Enterprise, Performance, or create custom templates',
    sections: [{
      heading: '⌺ Template Commands:',
      theme: { headingColor: 'yellow', bold: true },
      items: [
        {
          label: 'list',
          description: 'Show all available configuration templates',
          commands: ['list'],
          type: 'command'
        },
        {
          label: 'use',
          description: 'Apply template to current project',
          commands: ['use'],
          type: 'command'
        },
        {
          label: 'preview',
          description: 'Preview template settings before applying them',
          commands: ['preview'],
          type: 'command'
        },
        {
          label: 'create',
          description: 'Build custom template from current configuration',
          commands: ['create'],
          type: 'command'
        },
        {
          label: 'edit',
          description: 'Modify existing template settings',
          commands: ['edit'],
          type: 'command'
        },
        {
          label: 'reset',
          description: 'Restore template to original defaults',
          commands: ['reset'],
          type: 'command'
        }
      ]
    }],
    footerHints: [
      'Popular Templates: starter, enterprise, performance',
      'Navigation: command name, number, "back" to return'
    ],
    metadata: {
      menuType: 'sub',
      complexityLevel: 'moderate',
      priority: 'normal',
      autoSize: true
    }
  });

  const createTestContext = (): MenuDisplayContext => ({
    level: 'templates',
    parentMenu: 'main',
    currentItem: undefined,
    breadcrumb: ['Phoenix Code Lite', 'Templates']
  });

  test('should generate procedural numbers correctly', async () => {
    const menuContent = createTestMenuContent();
    const context = createTestContext();
    
    let capturedOutput = '';
    const originalConsoleLog = console.log;
    console.log = jest.fn((...args) => {
      capturedOutput += args.join(' ') + '\n';
    });

    try {
      renderLegacyWithUnified(menuContent, context);
      
      // Verify procedural numbering is applied
      expect(capturedOutput).toContain('1. list');
      expect(capturedOutput).toContain('2. use');
      expect(capturedOutput).toContain('3. preview');
      expect(capturedOutput).toContain('4. create');
      expect(capturedOutput).toContain('5. edit');
      expect(capturedOutput).toContain('6. reset');
      
      // Verify no duplicate numbers
      expect(capturedOutput).not.toContain('1. 1.');
      expect(capturedOutput).not.toContain('2. 2.');
      expect(capturedOutput).not.toContain('3. 3.');
      
    } finally {
      console.log = originalConsoleLog;
    }
  });

  test('should handle menu items without hardcoded numbers', () => {
    const skinMenuDefinition: SkinMenuDefinition = {
      title: 'Test Menu',
      subtitle: 'Test subtitle',
      items: [
        {
          id: 'item1',
          label: 'First Item',
          description: 'First item description',
          type: 'command',
          command: 'first'
        },
        {
          id: 'item2',
          label: 'Second Item',
          description: 'Second item description',
          type: 'command',
          command: 'second'
        },
        {
          id: 'item3',
          label: 'Third Item',
          description: 'Third item description',
          type: 'command',
          command: 'third'
        }
      ],
      theme: {
        primaryColor: 'blue',
        accentColor: 'cyan',
        separatorChar: '═',
        useIcons: true
      }
    };

    const constraints: LayoutConstraints = {
      minHeight: 25,
      minWidth: 40,
      maxWidth: 100,
      textboxLines: 3,
      paddingLines: 2,
      enforceConsistentHeight: true
    };

    let capturedOutput = '';
    const originalConsoleLog = console.log;
    console.log = jest.fn((...args) => {
      capturedOutput += args.join(' ') + '\n';
    });

    try {
      const layout = calculateMenuLayout(skinMenuDefinition, constraints);
      renderMenuWithLayout(skinMenuDefinition, layout, { skinId: 'test', level: 'test' });
      
      // Verify procedural numbering
      expect(capturedOutput).toContain('1. First Item');
      expect(capturedOutput).toContain('2. Second Item');
      expect(capturedOutput).toContain('3. Third Item');
      
    } finally {
      console.log = originalConsoleLog;
    }
  });

  test('should calculate layout correctly with procedural numbering', () => {
    const skinMenuDefinition: SkinMenuDefinition = {
      title: 'Test Menu',
      items: [
        {
          id: 'item1',
          label: 'Short Item',
          type: 'command',
          command: 'short'
        },
        {
          id: 'item2',
          label: 'Very Long Item Name That Should Be Accounted For',
          type: 'command',
          command: 'long'
        }
      ],
      theme: {
        primaryColor: 'blue',
        accentColor: 'cyan',
        separatorChar: '═',
        useIcons: true
      }
    };

    const constraints: LayoutConstraints = {
      minHeight: 25,
      minWidth: 40,
      maxWidth: 100,
      textboxLines: 3,
      paddingLines: 2,
      enforceConsistentHeight: true
    };

    const layout = calculateMenuLayout(skinMenuDefinition, constraints);
    
    // Verify layout accounts for procedural numbering
    expect(layout.separatorLength).toBeGreaterThan(0);
    expect(layout.menuWidth).toBeGreaterThan(0);
    expect(layout.totalLines).toBeGreaterThan(0);
  });

  test('should handle empty menu gracefully', () => {
    const skinMenuDefinition: SkinMenuDefinition = {
      title: 'Empty Menu',
      items: [],
      theme: {
        primaryColor: 'blue',
        accentColor: 'cyan',
        separatorChar: '═',
        useIcons: true
      }
    };

    const constraints: LayoutConstraints = {
      minHeight: 25,
      minWidth: 40,
      maxWidth: 100,
      textboxLines: 3,
      paddingLines: 2,
      enforceConsistentHeight: true
    };

    let capturedOutput = '';
    const originalConsoleLog = console.log;
    console.log = jest.fn((...args) => {
      capturedOutput += args.join(' ') + '\n';
    });

    try {
      const layout = calculateMenuLayout(skinMenuDefinition, constraints);
      renderMenuWithLayout(skinMenuDefinition, layout, { skinId: 'test', level: 'test' });
      
      // Should render title and separator even with no items
      expect(capturedOutput).toContain('Empty Menu');
      expect(capturedOutput).toContain('═');
      
      // Should not contain any numbered items
      expect(capturedOutput).not.toMatch(/\d+\.\s/);
      
    } finally {
      console.log = originalConsoleLog;
    }
  });

  test('should maintain consistent numbering across different menu types', () => {
    const testCases = [
      {
        name: 'Main Menu',
        items: [
          { id: 'config', label: 'Configuration', type: 'command' as const, command: 'config' },
          { id: 'templates', label: 'Templates', type: 'command' as const, command: 'templates' },
          { id: 'generate', label: 'Generate', type: 'command' as const, command: 'generate' }
        ]
      },
      {
        name: 'Config Menu',
        items: [
          { id: 'show', label: 'show', type: 'command' as const, command: 'show' },
          { id: 'edit', label: 'edit', type: 'command' as const, command: 'edit' },
          { id: 'templates', label: 'templates', type: 'command' as const, command: 'templates' }
        ]
      }
    ];

    testCases.forEach(({ name, items }) => {
      const skinMenuDefinition: SkinMenuDefinition = {
        title: name,
        items,
        theme: {
          primaryColor: 'blue',
          accentColor: 'cyan',
          separatorChar: '═',
          useIcons: true
        }
      };

      const constraints: LayoutConstraints = {
        minHeight: 25,
        minWidth: 40,
        maxWidth: 100,
        textboxLines: 3,
        paddingLines: 2,
        enforceConsistentHeight: true
      };

      let capturedOutput = '';
      const originalConsoleLog = console.log;
      console.log = jest.fn((...args) => {
        capturedOutput += args.join(' ') + '\n';
      });

      try {
        const layout = calculateMenuLayout(skinMenuDefinition, constraints);
        renderMenuWithLayout(skinMenuDefinition, layout, { skinId: 'test', level: 'test' });
        
        // Verify each item has correct procedural numbering
        items.forEach((item, index) => {
          const expectedNumber = index + 1;
          expect(capturedOutput).toContain(`${expectedNumber}. ${item.label}`);
        });
        
      } finally {
        console.log = originalConsoleLog;
      }
    });
  });
}); 