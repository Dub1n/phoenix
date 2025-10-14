import { ContentLayoutSystem } from '../../src/rendering/content-layout-system';
import { UniversalSkinDefinition } from '../../src/types/templum-types';

describe('ContentLayoutSystem procedural windows', () => {
  const skinFixture: UniversalSkinDefinition = {
    id: 'fixture-skin',
    name: 'Fixture Skin',
    version: '1.0.0',
    metadata: {
      id: 'fixture-skin',
      name: 'Fixture Skin',
      version: '1.0.0',
      backend: 'haruspex',
      backendService: 'haruspex-service',
      compatibleInterfaces: ['cli'],
    },
    description: 'Fixture skin for procedural layout tests',
    menus: {
      main: {
        id: 'main-menu',
        title: 'Fixture Console',
        subtitle: 'Command Surface',
        items: [
          { id: 'start', label: 'Launch Workflow', description: 'Kick off orchestration', type: 'command' },
          { id: 'inspect', label: 'Inspect Assets', description: 'Review current assets', type: 'submenu', submenu: 'inspect-menu' },
          { id: 'settings', label: 'Settings', description: 'Adjust preferences', type: 'command' },
        ],
        navigation: {
          canGoBack: false,
          breadcrumbs: ['Fixture Console'],
        },
      },
      submenus: {
        'inspect-menu': {
          id: 'inspect-menu',
          title: 'Inspect Assets',
          subtitle: 'Asset Explorer',
          items: [
            { id: 'open', label: 'Open Asset', description: 'Open selected asset detail', type: 'command' },
            { id: 'history', label: 'View History', description: 'Show recent activity', type: 'command' },
          ],
          navigation: {
            canGoBack: true,
            breadcrumbs: ['Fixture Console', 'Inspect Assets'],
          },
        },
      },
    },
    views: {
      panels: [
        { id: 'summary', name: 'Summary', type: 'webview', showOnStartup: true },
        { id: 'logs', name: 'Live Logs', type: 'webview', showOnStartup: false },
      ],
      treeViews: [
        { id: 'resources', name: 'Resources', dataProvider: 'templum.resources' },
      ],
    },
  };

  test('builds window content from skin descriptors', () => {
    const layoutSystem = new ContentLayoutSystem();
    const composition = layoutSystem.composeWindow({
      skin: skinFixture,
      menuId: 'main-menu',
      navigationHistory: [],
    });

    expect(composition.menuId).toBe('main-menu');
    expect(composition.content.title).toBe('Fixture Console');
    expect(composition.content.sections.length).toBeGreaterThanOrEqual(2);
    expect(composition.content.sections[0].items[0].label).toContain('Launch Workflow');

    const { output } = layoutSystem.renderContent(composition.content);
    expect(output).toContain('┌');
    expect(output).toContain('Fixture Console');
    expect(output).toContain('1. Launch Workflow');
    expect(output).toContain('Panels');
  });

  test('degrades to ASCII borders when terminal lacks unicode support', () => {
    const layoutSystem = new ContentLayoutSystem();
    layoutSystem.forceTerminalCapabilities({
      supportsUnicode: false,
      supportsBoxDrawing: false,
      supportsColor: false,
      width: 60,
      height: 24,
    });

    const composition = layoutSystem.composeWindow({
      skin: skinFixture,
      menuId: 'main-menu',
      navigationHistory: ['home'],
    });

    const { output } = layoutSystem.renderContent(composition.content);
    expect(output).toContain('+');
    expect(output).toContain('|');
    expect(output).toContain('Fixture Console');
  });
});
