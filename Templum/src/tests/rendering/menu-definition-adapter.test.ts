import { buildSkinMenuFromUniversalDefinition } from '../../rendering/menu-definition-adapter';
import type { UniversalMenuDefinition } from '../../menus/universal-menu-registry';

describe('menu-definition-adapter', () => {
  const baseMenu: UniversalMenuDefinition = {
    id: 'main',
    title: 'Main Menu',
    subtitle: 'Pick an option',
    sections: [
      {
        id: 'primary',
        heading: 'Primary Actions',
        order: 1,
        items: [
          {
            id: 'start',
            label: 'Start',
            description: 'Start the orchestrator',
            action: { type: 'command', target: 'templum.start' }
          },
          {
            id: 'settings',
            label: 'Settings',
            description: 'Open settings submenu',
            action: { type: 'submenu', target: 'settings' }
          }
        ]
      }
    ]
  };

  it('converts universal menu definition to skin menu for CLI interface', () => {
    const skinDefinition = buildSkinMenuFromUniversalDefinition(baseMenu, 'cli');

    expect(skinDefinition.title).toBe('Main Menu');
    expect(skinDefinition.interfaces).toEqual(['cli']);
    expect(skinDefinition.items).toHaveLength(2);
    expect(skinDefinition.items[0]).toEqual(
      expect.objectContaining({ id: 'start', type: 'command', command: 'templum.start' })
    );
    expect(skinDefinition.interfaceConfig?.cli).toEqual(
      expect.objectContaining({ interactive: true, colorEnabled: true })
    );
  });

  it('preserves submenu intent when mapping to skin menu items', () => {
    const skinDefinition = buildSkinMenuFromUniversalDefinition(baseMenu, 'cli');

    const submenu = skinDefinition.items.find(item => item.id === 'settings');
    expect(submenu).toBeDefined();
    expect(submenu?.type).toBe('submenu');
    expect(submenu?.command).toBe('settings');
  });

  it('falls back to action type when menu action is navigation or external', () => {
    const navigationMenu: UniversalMenuDefinition = {
      ...baseMenu,
      sections: [
        {
          id: 'navigation',
          heading: 'Navigate',
          items: [
            {
              id: 'docs',
              label: 'Docs',
              action: { type: 'external', target: 'https://templum.dev/docs' }
            },
            {
              id: 'home',
              label: 'Home',
              action: { type: 'navigation', target: 'home' }
            }
          ]
        }
      ]
    };

    const skinDefinition = buildSkinMenuFromUniversalDefinition(navigationMenu, 'cli');

    expect(skinDefinition.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'docs', type: 'action', command: 'https://templum.dev/docs' }),
        expect.objectContaining({ id: 'home', type: 'action', command: 'home' })
      ])
    );
  });
});
