import { SkinRenderResult } from '../../types/universal-skin-engine-types';
import { UniversalSkinDefinition } from '../../types/templum-types';

export interface CliSkinPresentation {
  output: string;
  menuId?: string;
  menuTitle?: string;
  items: Array<{ id: string; label: string; command?: string }>;
}

interface RenderOptions {
  width?: number;
}

const DEFAULT_WIDTH = 80;

export function renderCliSkin(
  renderResult: SkinRenderResult,
  skinDefinition: UniversalSkinDefinition,
  options: RenderOptions = {}
): CliSkinPresentation {
  const menu = skinDefinition.menus?.main;
  const width = Math.max(20, Math.min(options.width ?? DEFAULT_WIDTH, 120));
  const labels = menu?.items?.map((item) => item.label) ?? [];

  if (renderResult.renderedContent?.cli) {
    return {
      output: renderResult.renderedContent.cli,
      menuId: menu?.id,
      menuTitle: menu?.title,
      items: menu?.items?.map((item) => ({ id: item.id, label: item.label, command: item.command })) ?? [],
    };
  }

  if (!menu) {
    const fallback = buildSimpleTable('Skin has no CLI menus', ['Please provide `menus.main` in the skin payload.']);
    return {
      output: fallback,
      items: [],
    };
  }

  const header = `${menu.title ?? 'Menu'} (${skinDefinition.name})`;
  const underline = '-'.repeat(Math.min(header.length, width));
  const itemLines = menu.items.map((item, index) => {
    const position = String(index + 1).padStart(2, ' ');
    return `${position}. ${item.label}`;
  });

  const output = [header, underline, ...itemLines].join('\n');

  return {
    output,
    menuId: menu.id,
    menuTitle: menu.title,
    items: menu.items.map((item) => ({ id: item.id, label: item.label, command: item.command })),
  };
}

function buildSimpleTable(title: string, bodyLines: string[]): string {
  const width = Math.max(title.length, ...bodyLines.map((line) => line.length), 20);
  const top = '┌' + '─'.repeat(width + 2) + '┐';
  const bottom = '└' + '─'.repeat(width + 2) + '┘';
  const titleLine = `│ ${title.padEnd(width)} │`;
  const rows = bodyLines.map((line) => `│ ${line.padEnd(width)} │`);
  return [top, titleLine, ...rows, bottom].join('\n');
}
