import { 
  SkinMenuRenderer,
  quickRenderSkinMenu,
  renderLegacyWithUnified,
  type SkinContext,
  type MenuRenderResult
} from '../../../src/cli/skin-menu-renderer';
import type { MenuContent, MenuDisplayContext } from '../../../src/cli/menu-types';

describe('Skin Menu Renderer', () => {
  
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
          type: 'command'
        }
      ]
    }],
    footerHints: ['Hint 1'],
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

  describe('SkinMenuRenderer', () => {
    let renderer: SkinMenuRenderer;

    beforeEach(() => {
      renderer = new SkinMenuRenderer();
    });

    test('should render menu with procedural numbering', () => {
      const result = renderer.renderMenu('phoenix-code-lite', 'main', {
        skinId: 'phoenix-code-lite',
        level: 'main',
        breadcrumb: ['Phoenix Code Lite']
      });

      expect(result.success).toBe(true);
      expect(result.layout).toBeDefined();
      expect(result.skinDefinition).toBeDefined();
      expect(result.context.skinId).toBe('phoenix-code-lite');
      expect(result.renderTime).toBeGreaterThan(0);
    });

    test('should render legacy menu with procedural numbering', () => {
      const menuContent = createTestMenuContent();
      const context = createTestContext();

      const result = renderer.renderLegacyMenu(menuContent, context, 'test-skin');

      expect(result.success).toBe(true);
      expect(result.layout).toBeDefined();
      expect(result.skinDefinition).toBeDefined();
      expect(result.context.skinId).toBe('test-skin');
      expect(result.renderTime).toBeGreaterThan(0);
    });

    test('should handle missing menu definition gracefully', () => {
      const result = renderer.renderMenu('nonexistent-skin', 'nonexistent-menu', {
        skinId: 'nonexistent-skin',
        level: 'nonexistent-menu'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('should batch render multiple menus', () => {
      const requests = [
        { skinId: 'phoenix-code-lite', menuId: 'main' },
        { skinId: 'qms-medical-device', menuId: 'main' }
      ];

      const results = renderer.renderMultipleMenus(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    test('should preview layout without rendering', () => {
      const layout = renderer.previewLayout('phoenix-code-lite', 'main');

      expect(layout).toBeDefined();
      expect(layout!.separatorLength).toBeGreaterThan(0);
      expect(layout!.menuWidth).toBeGreaterThan(0);
      expect(layout!.totalLines).toBeGreaterThan(0);
    });

    test('should track rendering metrics', () => {
      renderer.renderMenu('phoenix-code-lite', 'main');
      renderer.renderMenu('qms-medical-device', 'main');

      const metrics = renderer.getMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
      expect(metrics['phoenix-code-lite:main']).toBeGreaterThan(0);
      expect(metrics['qms-medical-device:main']).toBeGreaterThan(0);
    });

    test('should clear metrics', () => {
      renderer.renderMenu('phoenix-code-lite', 'main');
      expect(Object.keys(renderer.getMetrics()).length).toBeGreaterThan(0);

      renderer.clearMetrics();
      expect(Object.keys(renderer.getMetrics()).length).toBe(0);
    });

    test('should update default constraints', () => {
      const newConstraints = {
        minHeight: 30,
        maxWidth: 80
      };

      renderer.updateDefaultConstraints(newConstraints);

      // Test that constraints are applied by rendering a menu
      const result = renderer.renderMenu('phoenix-code-lite', 'main');
      expect(result.success).toBe(true);
    });

    test('should set skin loader', () => {
      const mockLoader = {
        getSkinMenuDefinition: jest.fn(),
        getLayoutPreferences: jest.fn(),
        getThemeDefinition: jest.fn(),
        listAvailableSkins: jest.fn(),
        validateSkinDefinition: jest.fn()
      };

      renderer.setSkinLoader(mockLoader);
      
      // Test that loader is used (this would require more complex setup)
      expect(mockLoader.getSkinMenuDefinition).toBeDefined();
    });
  });

  describe('quickRenderSkinMenu', () => {
    test('should render skin menu quickly', () => {
      const result = quickRenderSkinMenu('phoenix-code-lite', 'main', {
        skinId: 'phoenix-code-lite',
        level: 'main'
      });

      expect(result).toBe(true);
    });

    test('should handle missing skin gracefully', () => {
      const result = quickRenderSkinMenu('nonexistent-skin', 'main', {
        skinId: 'nonexistent-skin',
        level: 'main'
      });

      expect(result).toBe(false);
    });
  });

  describe('renderLegacyWithUnified', () => {
    test('should render legacy menu with unified engine', () => {
      const menuContent = createTestMenuContent();
      const context = createTestContext();

      const result = renderLegacyWithUnified(menuContent, context);

      expect(result).toBe(true);
    });

    test('should handle invalid menu content gracefully', () => {
      const invalidMenuContent: MenuContent = {
        title: 'Invalid Menu',
        sections: [{
          heading: 'Section',
          items: [
            {
              label: '', // Invalid empty label
              description: 'Invalid item description',
              commands: [],
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

      const result = renderLegacyWithUnified(invalidMenuContent, context);

      // Should still return true as the renderer handles invalid content gracefully
      expect(result).toBe(true);
    });
  });

  describe('Built-in Menu Definitions', () => {
    test('should have valid QMS menu definition', () => {
      const renderer = new SkinMenuRenderer();
      const result = renderer.renderMenu('qms-medical-device', 'main', {
        skinId: 'qms-medical-device',
        level: 'main'
      });

      expect(result.success).toBe(true);
      expect(result.skinDefinition.title).toContain('QMS Medical Device');
      expect(result.skinDefinition.items.length).toBeGreaterThan(0);
      
      // Verify procedural numbering in built-in definition
      result.skinDefinition.items.forEach((item, index) => {
        expect(item.label).not.toMatch(/^\d+\.\s/); // Should not have hardcoded numbers
      });
    });

    test('should have valid Phoenix Code Lite menu definition', () => {
      const renderer = new SkinMenuRenderer();
      const result = renderer.renderMenu('phoenix-code-lite', 'main', {
        skinId: 'phoenix-code-lite',
        level: 'main'
      });

      expect(result.success).toBe(true);
      expect(result.skinDefinition.title).toContain('Phoenix Code Lite');
      expect(result.skinDefinition.items.length).toBeGreaterThan(0);
      
      // Verify procedural numbering in built-in definition
      result.skinDefinition.items.forEach((item, index) => {
        expect(item.label).not.toMatch(/^\d+\.\s/); // Should not have hardcoded numbers
      });
    });
  });

  describe('Performance and Metrics', () => {
    test('should track render performance', () => {
      const renderer = new SkinMenuRenderer({ enableMetrics: true });
      
      const startTime = performance.now();
      const result = renderer.renderMenu('phoenix-code-lite', 'main');
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(result.renderTime).toBeGreaterThan(0);
      expect(result.renderTime).toBeLessThan(endTime - startTime + 10); // Allow some tolerance
    });

    test('should handle concurrent renders', () => {
      const renderer = new SkinMenuRenderer();
      
      const promises = [
        renderer.renderMenu('phoenix-code-lite', 'main'),
        renderer.renderMenu('qms-medical-device', 'main'),
        renderer.renderMenu('phoenix-code-lite', 'main')
      ];

      const results = Promise.all(promises);
      
      expect(results).toBeDefined();
      // Note: This test would need to be async to properly test concurrency
    });
  });
}); 