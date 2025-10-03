import { TypeGuards, TypeValidators } from '../utils/type-guards';
import type { InterfaceType } from '../types/templum-types';
import type {
  MenuAction,
  MenuItem,
  MenuSection,
  UniversalMenuDefinition,
  MenuMetadata,
  MenuInheritance
} from '../menus/universal-menu-registry';
import type {
  UniversalSkinMenuDefinition,
  SkinMenuItem,
  CLIInterfaceConfig,
  VSCodeInterfaceConfig,
  CommandInterfaceConfig
} from './universal-layout-engine';

const VALID_INTERFACE_TYPES: InterfaceType[] = ['vscode', 'cli', 'command'];

const INTERFACE_CONFIG_PRESETS: Record<InterfaceType, UniversalSkinMenuDefinition['interfaceConfig']> = {
  cli: {
    cli: {
      interactive: true,
      colorEnabled: true,
      keyboardShortcuts: true,
      clearScreen: true
    } satisfies CLIInterfaceConfig
  },
  vscode: {
    vscode: {
      treeViewProvider: true,
      webViewPanel: true,
      commandPalette: true,
      statusBar: true
    } satisfies VSCodeInterfaceConfig
  },
  command: {
    command: {
      directExecution: true,
      outputFormat: 'text',
      verbosityLevel: 'normal'
    } satisfies CommandInterfaceConfig
  }
};

const ACTION_TYPE_MAP: Record<MenuAction['type'], SkinMenuItem['type']> = {
  command: 'command',
  submenu: 'submenu',
  navigation: 'action',
  external: 'action'
};

export interface CoerceMenuOptions {
  fallbackId?: string;
  fallbackTitle?: string;
}

export function coerceUniversalMenuDefinition(
  menuData: unknown,
  options: CoerceMenuOptions = {}
): UniversalMenuDefinition {
  if (isUniversalMenuDefinition(menuData)) {
    return menuData;
  }

  if (!TypeGuards.isPlainObject(menuData)) {
    return {
      id: options.fallbackId ?? 'menu',
      title: options.fallbackTitle ?? 'Menu',
      sections: []
    };
  }

  const record = menuData as Record<string, unknown>;
  const sections = parseSections(record.sections);

  return {
    id: resolveString(record.id, options.fallbackId ?? 'menu'),
    title: resolveString(record.title, options.fallbackTitle ?? 'Menu'),
    subtitle: resolveOptionalString(record.subtitle),
    sections,
    metadata: parseMetadata(record.metadata),
    interfaceSupport: parseInterfaceSupport(record.interfaceSupport),
    backendId: resolveOptionalString(record.backendId),
    crossInterfaceSync: typeof record.crossInterfaceSync === 'boolean' ? record.crossInterfaceSync : undefined,
    inheritance: parseInheritance(record.inheritance)
  };
}

export function buildSkinMenuFromUniversalDefinition(
  menu: UniversalMenuDefinition,
  interfaceType: InterfaceType
): UniversalSkinMenuDefinition {
  const interfaces = computeInterfaceList(menu.interfaceSupport, interfaceType);
  const items = convertMenuSectionsToItems(menu.sections);
  const interfaceConfig = INTERFACE_CONFIG_PRESETS[interfaceType];

  return {
    title: menu.title,
    subtitle: menu.subtitle,
    items,
    interfaces,
    interfaceConfig
  };
}

export function convertMenuSectionsToItems(
  sections: ReadonlyArray<MenuSection>
): SkinMenuItem[] {
  const aggregated: SkinMenuItem[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      aggregated.push(convertMenuItem(item));
    }
  }

  return aggregated;
}

function convertMenuItem(item: MenuItem): SkinMenuItem {
  const action = item.action;
  const type = ACTION_TYPE_MAP[action.type] ?? 'action';
  const command = typeof action.target === 'string' ? action.target : undefined;

  const converted: SkinMenuItem = {
    id: item.id,
    label: item.label,
    description: item.description,
    type,
    command
  };

  if (Array.isArray((item as unknown as { items?: MenuItem[] }).items)) {
    converted.items = ((item as unknown as { items?: MenuItem[] }).items || []).map(convertMenuItem);
  }

  return converted;
}

function parseSections(value: unknown): MenuSection[] {
  if (
    !TypeValidators.isArrayOf(
      value,
      (section): section is Record<string, unknown> => TypeGuards.isPlainObject(section)
    )
  ) {
    return [];
  }

  return value.map((sectionRecord, sectionIndex) => {
    const id = resolveString(sectionRecord.id, `section-${sectionIndex + 1}`);
    const heading = resolveString(sectionRecord.heading, `Section ${sectionIndex + 1}`);
    const order = typeof sectionRecord.order === 'number' ? sectionRecord.order : undefined;
    const items = parseMenuItems(sectionRecord.items, id);

    return {
      id,
      heading,
      items,
      order
    };
  });
}

function parseMenuItems(value: unknown, sectionId: string): MenuItem[] {
  if (
    !TypeValidators.isArrayOf(
      value,
      (candidate): candidate is Record<string, unknown> => TypeGuards.isPlainObject(candidate)
    )
  ) {
    return [];
  }

  return value.map((itemRecord, itemIndex) => {
    const id = resolveString(itemRecord.id, `${sectionId}-item-${itemIndex + 1}`);
    const label = resolveString(itemRecord.label, id);
    const description = resolveOptionalString(itemRecord.description);
    const icon = resolveOptionalString(itemRecord.icon);
    const hotkey = resolveOptionalString(itemRecord.hotkey);
    const enabled = typeof itemRecord.enabled === 'boolean' ? itemRecord.enabled : undefined;
    const action = parseMenuAction(itemRecord.action);

    return {
      id,
      label,
      description,
      icon,
      hotkey,
      enabled,
      action
    };
  });
}

function parseMenuAction(value: unknown): MenuAction {
  if (!TypeGuards.isPlainObject(value)) {
    return { type: 'command' };
  }

  const actionType = resolveActionType(value.type);
  const target = resolveOptionalString(value.target);
  const parameters = TypeGuards.isPlainObject(value.parameters)
    ? (value.parameters as Record<string, unknown>)
    : undefined;
  const confirmation = typeof value.confirmation === 'boolean' ? value.confirmation : undefined;

  return {
    type: actionType,
    target,
    parameters,
    confirmation
  };
}

function parseMetadata(value: unknown): MenuMetadata | undefined {
  if (!TypeGuards.isPlainObject(value)) {
    return undefined;
  }
  return value as MenuMetadata;
}

function parseInheritance(value: unknown): MenuInheritance | undefined {
  if (!TypeGuards.isPlainObject(value)) {
    return undefined;
  }
  return value as MenuInheritance;
}

function parseInterfaceSupport(value: unknown): InterfaceType[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const filtered = value
    .filter((entry): entry is InterfaceType => VALID_INTERFACE_TYPES.includes(entry as InterfaceType));

  if (filtered.length === 0) {
    return undefined;
  }

  return Array.from(new Set(filtered));
}

function computeInterfaceList(
  interfaceSupport: InterfaceType[] | undefined,
  interfaceType: InterfaceType
): InterfaceType[] {
  const candidates = new Set<InterfaceType>([interfaceType]);

  for (const value of interfaceSupport ?? []) {
    if (VALID_INTERFACE_TYPES.includes(value)) {
      candidates.add(value);
    }
  }

  return Array.from(candidates);
}

function resolveString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function resolveOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function resolveActionType(value: unknown): MenuAction['type'] {
  if (typeof value === 'string') {
    if ((['command', 'submenu', 'navigation', 'external'] as const).includes(value as MenuAction['type'])) {
      return value as MenuAction['type'];
    }
  }
  return 'command';
}

function isUniversalMenuDefinition(value: unknown): value is UniversalMenuDefinition {
  if (!TypeGuards.isPlainObject(value)) {
    return false;
  }

  return (
    TypeGuards.isNonEmptyString((value as Record<string, unknown>).id) &&
    TypeGuards.isNonEmptyString((value as Record<string, unknown>).title) &&
    TypeValidators.isArrayOf(
      (value as Record<string, unknown>).sections,
      (section): section is MenuSection => TypeGuards.isPlainObject(section)
    )
  );
}
