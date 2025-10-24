import { DefaultColorThemes, type TerminalColorTheme } from './terminal-ui-theme';
import type {
  UniversalSkinDefinition,
  MenuDefinition as SkinMenuDefinition,
  MenuItemDefinition as SkinMenuItemDefinition,
  CommandDefinition as SkinCommandDefinition,
  ParameterDefinition as SkinParameterDefinition,
  RenderingConfiguration,
  SkinTheme,
} from '../types/universal-skin-definition';
import type {
  LoadedSkin,
  UniversalMenuDefinition,
  MenuSection,
  MenuItem,
  MenuAction,
} from '../menus/universal-menu-registry';

/**
 * CLI keyboard shortcut description derived from skin metadata.
 */
export interface CLIShortcutDefinition {
  key: string;
  command: string;
  description?: string;
  menuId?: string;
  menuItemId?: string;
  source: 'menu' | 'command' | 'shortcutMap';
}

/**
 * CLI command binding derived from skin metadata.
 */
export interface CLICommandBinding {
  commandId: string;
  title?: string;
  description?: string;
  handler?: string;
  parameters?: SkinParameterDefinition[];
  menuPaths: Array<{ menuId: string; itemId: string; label: string }>;
  shortcuts: string[];
  sources: Array<'menu' | 'command' | 'shortcutMap'>;
}

/**
 * Aggregated CLI menu model for downstream consumers.
 */
export interface CLIMenuModel {
  skinId: string;
  skinName: string;
  defaultMenuId: string;
  loadedSkin: LoadedSkin;
  menuGraph: Record<string, string[]>;
  shortcuts: CLIShortcutDefinition[];
  commandBindings: CLICommandBinding[];
  theme: TerminalColorTheme | null;
}

/**
 * Build the CLI menu model (menus, navigation graph, shortcuts, bindings) from a universal skin definition.
 */
export function buildCLIMenuModel(skin: UniversalSkinDefinition): CLIMenuModel {
  const { menus, metadata } = skin;

  if (!menus || (!menus.main && !menus.submenus)) {
    throw new Error(`Skin '${skin.id}' does not expose CLI menus in metadata.`);
  }

  const flatMenus = flattenMenus(menus);
  const defaultMenuId = resolveDefaultMenuId(flatMenus, menus.main);
  const menuDefinitions: Record<string, UniversalMenuDefinition> = {};
  const menuGraph: Record<string, string[]> = {};

  for (const [menuId, menuDefinition] of flatMenus.entries()) {
    const universalMenu = convertToUniversalMenu(menuDefinition, menuId, skin);
    menuDefinitions[menuId] = universalMenu;
    menuGraph[menuId] = computeSubmenuTargets(menuDefinition);
  }

  const commandDictionary = indexCommands(skin.commands);
  const globalShortcuts = normalizeGlobalShortcuts(skin.shortcuts);
  const bindingAggregator = createBindingAggregator(commandDictionary, globalShortcuts);

  for (const [menuId, menuDefinition] of flatMenus.entries()) {
    ingestMenuBindings(menuDefinition, menuId, bindingAggregator, globalShortcuts);
  }

  ingestOrphanShortcuts(globalShortcuts, bindingAggregator);

  const commandBindings = bindingAggregator.toArray();
  const shortcuts = bindingAggregator.collectShortcuts();
  const theme = resolveTheme(skin);

  const loadedSkin: LoadedSkin = {
    metadata: {
      name: metadata?.name ?? skin.name,
      displayName: skin.name ?? metadata?.name ?? skin.id,
      version: metadata?.version ?? skin.version,
      author: metadata?.author,
      description: skin.description ?? metadata?.description,
      supportedInterfaces: metadata?.compatibleInterfaces ?? metadata?.supportedInterfaces ?? ['cli'],
    },
    menus: menuDefinitions,
    theme: theme
      ? {
          primaryColor: theme.name,
          accentColor: theme.name,
        }
      : undefined,
    config: {
      defaultInterface: 'cli',
    },
  };

  return {
    skinId: metadata?.id ?? skin.id,
    skinName: metadata?.name ?? skin.name,
    defaultMenuId,
    loadedSkin,
    menuGraph,
    shortcuts,
    commandBindings,
    theme,
  };
}

/**
 * Convenience helper to retrieve command bindings directly.
 */
export function buildCLICommandBindings(skin: UniversalSkinDefinition): CLICommandBinding[] {
  return buildCLIMenuModel(skin).commandBindings;
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function flattenMenus(menus: NonNullable<UniversalSkinDefinition['menus']>): Map<string, SkinMenuDefinition> {
  const result = new Map<string, SkinMenuDefinition>();
  const queue: Array<{ id: string; menu: SkinMenuDefinition }> = [];

  if (menus.main) {
    queue.push({ id: resolveMenuId(menus.main, 'main'), menu: menus.main });
  }

  if (menus.submenus) {
    for (const [rawId, submenu] of Object.entries(menus.submenus)) {
      const resolvedId = resolveMenuId(submenu, rawId);
      queue.push({ id: resolvedId, menu: submenu });
    }
  }

  while (queue.length > 0) {
    const { id, menu } = queue.shift()!;
    result.set(id, { ...menu, id });

    for (const item of menu.items ?? []) {
      if (Array.isArray(item.submenu) && item.submenu.length > 0) {
        const syntheticId = `${id}.${item.id}`;
        const syntheticMenu: SkinMenuDefinition = {
          id: syntheticId,
          title: item.label ?? syntheticId,
          items: item.submenu,
          subtitle: menu.subtitle,
          description: menu.description,
        };

        if (!result.has(syntheticId)) {
          queue.push({ id: syntheticId, menu: syntheticMenu });
        }
      }
    }
  }

  return result;
}

function resolveMenuId(menu: SkinMenuDefinition, fallback: string): string {
  return menu.id && menu.id.trim().length > 0 ? menu.id : fallback;
}

function resolveDefaultMenuId(flatMenus: Map<string, SkinMenuDefinition>, main?: SkinMenuDefinition): string {
  const fallback = main ? resolveMenuId(main, 'main') : 'main';
  return flatMenus.has(fallback) ? fallback : Array.from(flatMenus.keys())[0];
}

function convertToUniversalMenu(
  menu: SkinMenuDefinition,
  menuId: string,
  skin: UniversalSkinDefinition,
): UniversalMenuDefinition {
  const sections: MenuSection[] = [];

  const primarySection: MenuSection = {
    id: `${menuId}-primary`,
    heading: menu.title ?? capitalize(menuId),
    items: [],
  };

  for (const [index, item] of (menu.items ?? []).entries()) {
    const converted = convertMenuItem(item, menuId, index);
    if (converted) {
      primarySection.items.push(converted);
    }
  }

  sections.push(primarySection);

  return {
    id: menuId,
    title: menu.title ?? capitalize(menuId),
    subtitle: menu.subtitle,
    sections,
    metadata: {
      skinName: skin.name,
      allowBack: menu.navigation?.canGoBack ?? true,
      version: skin.version,
    },
    interfaceSupport: skin.metadata?.compatibleInterfaces ?? ['cli'],
  };
}

function convertMenuItem(
  item: SkinMenuItemDefinition,
  menuId: string,
  index: number,
): MenuItem | null {
  if (item.type === 'separator') {
    return null;
  }

  const id = item.id && item.id.trim().length > 0 ? item.id : `${menuId}-item-${index + 1}`;
  const label = item.label ?? capitalize(id);
  const hotkey = extractPrimaryShortcut(item);
  const action: MenuAction = resolveMenuAction(item);

  return {
    id,
    label,
    description: item.description,
    action,
    hotkey: hotkey ?? undefined,
    enabled: item.enabled ?? true,
  };
}

function resolveMenuAction(item: SkinMenuItemDefinition): MenuAction {
  if (typeof item.command === 'string' && item.command.trim().length > 0) {
    return {
      type: 'command',
      target: item.command.trim(),
    };
  }

  if (typeof item.action === 'string' && item.action.trim().length > 0) {
    return {
      type: 'command',
      target: item.action.trim(),
    };
  }

  if (typeof item.submenu === 'string' && item.submenu.trim().length > 0) {
    return {
      type: 'submenu',
      target: item.submenu.trim(),
    };
  }

  if (Array.isArray(item.submenu) && item.submenu.length > 0) {
    return {
      type: 'submenu',
      target: undefined,
      parameters: {
        inline: true,
      },
    };
  }

  return { type: 'command' };
}

function extractPrimaryShortcut(item: SkinMenuItemDefinition): string | null {
  if (typeof item.shortcut === 'string' && item.shortcut.trim().length > 0) {
    return normalizeShortcut(item.shortcut);
  }

  if (Array.isArray(item.shortcuts) && item.shortcuts.length > 0) {
    const first = item.shortcuts.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
    return first ? normalizeShortcut(first) : null;
  }

  return null;
}

function computeSubmenuTargets(menu: SkinMenuDefinition): string[] {
  const targets: string[] = [];
  for (const item of menu.items ?? []) {
    if (typeof item.submenu === 'string' && item.submenu.trim().length > 0) {
      targets.push(item.submenu.trim());
    }

    if (Array.isArray(item.submenu) && item.submenu.length > 0) {
      targets.push(`${resolveMenuId(menu, 'menu')}.${item.id}`);
    }
  }
  return targets;
}

function indexCommands(commands: UniversalSkinDefinition['commands']): Map<string, SkinCommandDefinition> {
  const dictionary = new Map<string, SkinCommandDefinition>();

  if (!commands) {
    return dictionary;
  }

  const ingest = (definition: SkinCommandDefinition) => {
    const identifier = resolveCommandId(definition);
    if (identifier && !dictionary.has(identifier)) {
      dictionary.set(identifier, definition);
    }
  };

  for (const value of Object.values(commands)) {
    if (Array.isArray(value)) {
      value.filter(isSkinCommandDefinition).forEach(ingest);
    } else if (isSkinCommandDefinition(value)) {
      ingest(value);
    }
  }

  return dictionary;
}

function resolveCommandId(definition: SkinCommandDefinition): string | null {
  if (definition.id && definition.id.trim().length > 0) {
    return definition.id.trim();
  }

  if (definition.command && definition.command.trim().length > 0) {
    return definition.command.trim();
  }

  if (definition.name && definition.name.trim().length > 0) {
    return definition.name.trim();
  }

  return null;
}

function normalizeGlobalShortcuts(shortcuts: UniversalSkinDefinition['shortcuts']): Map<string, string> {
  const result = new Map<string, string>();
  if (!shortcuts) {
    return result;
  }

  for (const [rawKey, rawCommand] of Object.entries(shortcuts)) {
    if (typeof rawKey === 'string' && typeof rawCommand === 'string') {
      const key = normalizeShortcut(rawKey);
      const command = rawCommand.trim();
      if (key && command.length > 0) {
        result.set(key, command);
      }
    }
  }

  return result;
}

function normalizeShortcut(shortcut: string): string | null {
  const trimmed = shortcut.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ingestMenuBindings(
  menu: SkinMenuDefinition,
  menuId: string,
  aggregator: ReturnType<typeof createBindingAggregator>,
  globalShortcuts: Map<string, string>,
): void {
  for (const item of menu.items ?? []) {
    const commandId = resolveMenuCommand(item);
    if (!commandId) {
      continue;
    }

    const shortcutCandidates = collectItemShortcuts(item, globalShortcuts);
    aggregator.addFromMenu(commandId, {
      menuId,
      itemId: item.id,
      label: item.label ?? item.id,
      shortcuts: shortcutCandidates,
    });
  }
}

function ingestOrphanShortcuts(
  globalShortcuts: Map<string, string>,
  aggregator: ReturnType<typeof createBindingAggregator>,
): void {
  for (const [shortcut, commandId] of globalShortcuts.entries()) {
    aggregator.addFromShortcutMap(commandId, shortcut);
  }
}

function resolveMenuCommand(item: SkinMenuItemDefinition): string | null {
  if (typeof item.command === 'string' && item.command.trim().length > 0) {
    return item.command.trim();
  }

  if (typeof item.action === 'string' && item.action.trim().length > 0) {
    return item.action.trim();
  }

  return null;
}

function collectItemShortcuts(
  item: SkinMenuItemDefinition,
  globalShortcuts: Map<string, string>,
): string[] {
  const results = new Set<string>();

  if (item.shortcut) {
    const normalized = normalizeShortcut(item.shortcut);
    if (normalized) {
      results.add(normalized);
    }
  }

  if (Array.isArray(item.shortcuts)) {
    for (const shortcut of item.shortcuts) {
      const normalized = typeof shortcut === 'string' ? normalizeShortcut(shortcut) : null;
      if (normalized) {
        results.add(normalized);
      }
    }
  }

  for (const [shortcut, command] of globalShortcuts.entries()) {
    const resolvedCommand = resolveMenuCommand(item);
    if (resolvedCommand && command === resolvedCommand) {
      results.add(shortcut);
    }
  }

  return Array.from(results);
}

function createBindingAggregator(
  commandDictionary: Map<string, SkinCommandDefinition>,
  globalShortcuts: Map<string, string>,
) {
  const bindings = new Map<string, CLICommandBinding>();

  const upsertBinding = (commandId: string): CLICommandBinding => {
    const existing = bindings.get(commandId);
    if (existing) {
      return existing;
    }

    const commandDefinition = commandDictionary.get(commandId);
    const binding: CLICommandBinding = {
      commandId,
      title: commandDefinition?.title ?? commandDefinition?.name,
      description: commandDefinition?.description,
      handler: commandDefinition?.handler,
      parameters: commandDefinition?.parameters,
      menuPaths: [],
      shortcuts: [],
      sources: [],
    };

    bindings.set(commandId, binding);
    return binding;
  };

  return {
    addFromMenu(
      commandId: string,
      payload: { menuId: string; itemId?: string; label: string; shortcuts: string[] },
    ) {
      const binding = upsertBinding(commandId);

      binding.menuPaths.push({
        menuId: payload.menuId,
        itemId: payload.itemId ?? payload.label,
        label: payload.label,
      });

      payload.shortcuts.forEach((shortcut) => {
        if (!binding.shortcuts.includes(shortcut)) {
          binding.shortcuts.push(shortcut);
        }
      });

      if (!binding.sources.includes('menu')) {
        binding.sources.push('menu');
      }
    },

    addFromShortcutMap(commandId: string, shortcut: string) {
      const binding = upsertBinding(commandId);

      if (!binding.shortcuts.includes(shortcut)) {
        binding.shortcuts.push(shortcut);
      }

      if (!binding.sources.includes('shortcutMap')) {
        binding.sources.push('shortcutMap');
      }

      if (!binding.menuPaths.length && !binding.sources.includes('command')) {
        binding.sources.push('command');
      }
    },

    toArray(): CLICommandBinding[] {
      return Array.from(bindings.values()).map((binding) => ({
        ...binding,
        shortcuts: binding.shortcuts.sort(),
        menuPaths: binding.menuPaths,
        sources: binding.sources,
      }));
    },

    collectShortcuts(): CLIShortcutDefinition[] {
      const entries: CLIShortcutDefinition[] = [];
      const seen = new Set<string>();

      for (const binding of bindings.values()) {
        for (const shortcut of binding.shortcuts) {
          const key = `${shortcut}::${binding.commandId}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);

          const path = binding.menuPaths[0];
          entries.push({
            key: shortcut,
            command: binding.commandId,
            description: binding.title ?? binding.description,
            menuId: path?.menuId,
            menuItemId: path?.itemId,
            source: binding.sources.includes('menu') ? 'menu' : 'shortcutMap',
          });
        }
      }

      for (const [shortcut, command] of globalShortcuts.entries()) {
        const key = `${shortcut}::${command}`;
        if (!seen.has(key)) {
          entries.push({
            key: shortcut,
            command,
            source: 'shortcutMap',
          });
        }
      }

      return entries.sort((a, b) => a.key.localeCompare(b.key));
    },
  };
}

function isSkinCommandDefinition(value: unknown): value is SkinCommandDefinition {
  return Boolean(
    value &&
      typeof value === 'object' &&
      ('title' in (value as Record<string, unknown>) || 'description' in (value as Record<string, unknown>)),
  );
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type RenderingConfigWithThemePreset = RenderingConfiguration & {
  themePreset?: string;
};

type LegacySkinThemeWithName = SkinTheme & {
  name?: string;
};

function resolveTheme(skin: UniversalSkinDefinition): TerminalColorTheme | null {
  const renderingThemePreset =
    (skin.rendering as RenderingConfigWithThemePreset | undefined)?.themePreset;
  const taggedTheme = skin.metadata?.tags
    ?.find((tag) => tag.startsWith('theme:'))
    ?.split(':')[1];
  const legacyThemeName = (skin.theme as LegacySkinThemeWithName | undefined)?.name;

  const candidate = renderingThemePreset ?? taggedTheme ?? legacyThemeName ?? 'default';

  if (typeof candidate === 'string' && candidate in DefaultColorThemes) {
    return DefaultColorThemes[candidate];
  }

  return DefaultColorThemes.default ?? null;
}
