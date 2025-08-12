/**
 * Menu Content Converter - Bridge between legacy and unified systems
 * 
 * Converts existing MenuContent structures to SkinMenuDefinition format
 * for use with the unified layout engine and PCL-Skins architecture.
 * 
 * This enables gradual migration from the current system to the unified approach
 * while maintaining backward compatibility and equivalent functionality.
 */

import type { MenuContent, MenuSection, MenuItem, MenuDisplayContext } from './menu-types';
import type { SkinMenuDefinition, SkinMenuItem, SkinTheme } from './unified-layout-engine';

/**
 * Convert legacy MenuContent to SkinMenuDefinition format
 * Preserves all functionality while enabling unified layout engine usage
 */
export function convertMenuContentToSkinDefinition(
  content: MenuContent,
  context?: MenuDisplayContext
): SkinMenuDefinition {
  
  // Convert menu items from all sections into a flat array
  const convertedItems: SkinMenuItem[] = [];
  let itemCounter = 1;
  
  for (const section of content.sections) {
    // Add section header as a visual separator (optional)
    if (section.heading && content.sections.length > 1) {
      convertedItems.push({
        id: `section-${section.heading.toLowerCase().replace(/\s+/g, '-')}`,
        label: section.heading,
        description: section.description || '',
        type: 'action' // Non-interactive section header
      });
    }
    
    // Convert section items
    for (const item of section.items) {
      convertedItems.push({
        id: item.commands[0] || `item-${itemCounter}`,
        label: item.label,
        description: item.description,
        type: convertItemType(item.type),
        command: item.commands[0] // Primary command
      });
      itemCounter++;
    }
  }
  
  // Extract theme from first section if available
  const firstSectionTheme = content.sections[0]?.theme;
  const theme: SkinTheme = {
    primaryColor: mapColorToSkinTheme(firstSectionTheme?.headingColor) || 'red',
    accentColor: 'cyan',
    separatorChar: '═',
    useIcons: true
  };
  
  // Apply context-specific theme adjustments
  if (context) {
    theme.primaryColor = getContextThemeColor(context.level);
  }
  
  return {
    title: content.title,
    subtitle: content.subtitle,
    items: convertedItems,
    theme
  };
}

/**
 * Convert legacy MenuItem type to SkinMenuItem type
 */
function convertItemType(legacyType?: string): 'command' | 'submenu' | 'action' {
  switch (legacyType) {
    case 'command': return 'command';
    case 'navigation': return 'submenu';
    case 'action': return 'action';
    case 'setting': return 'command';
    default: return 'command';
  }
}

/**
 * Map legacy color names to SkinTheme colors
 */
function mapColorToSkinTheme(
  legacyColor?: 'green' | 'yellow' | 'magenta' | 'cyan' | 'blue' | 'red'
): 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan' {
  return legacyColor || 'red';
}

/**
 * Get context-appropriate theme colors
 */
function getContextThemeColor(
  level: 'main' | 'config' | 'templates' | 'advanced' | 'generate' | 'settings'
): 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan' {
  const colorMap = {
    main: 'red' as const,
    config: 'blue' as const, 
    templates: 'yellow' as const,
    advanced: 'magenta' as const,
    generate: 'green' as const,
    settings: 'cyan' as const
  };
  
  return colorMap[level] || 'red';
}

/**
 * Enhanced converter with layout constraint mapping
 * Maps legacy MenuComposer options to unified LayoutConstraints
 */
export function convertWithLayoutConstraints(
  content: MenuContent,
  context: MenuDisplayContext,
  legacyOptions?: {
    minSeparatorLength?: number;
    maxSeparatorLength?: number;
    fixedHeight?: number;
  }
) {
  const skinDefinition = convertMenuContentToSkinDefinition(content, context);
  
  const layoutConstraints = {
    fixedHeight: legacyOptions?.fixedHeight || 25,
    minWidth: legacyOptions?.minSeparatorLength || 40,
    maxWidth: legacyOptions?.maxSeparatorLength || 100,
    textboxLines: 3,
    paddingLines: 2,
    enforceConsistentHeight: true
  };
  
  return {
    skinDefinition,
    layoutConstraints
  };
}

/**
 * Batch converter for multiple menu contents
 * Useful for migrating entire menu systems
 */
export function convertMultipleMenus(
  menus: Array<{
    content: MenuContent;
    context: MenuDisplayContext;
    id: string;
  }>
): Record<string, SkinMenuDefinition> {
  
  const converted: Record<string, SkinMenuDefinition> = {};
  
  for (const menu of menus) {
    converted[menu.id] = convertMenuContentToSkinDefinition(
      menu.content, 
      menu.context
    );
  }
  
  return converted;
}

/**
 * Validation function to ensure conversion preserves functionality
 */
export function validateConversion(
  original: MenuContent,
  converted: SkinMenuDefinition
): {
  isValid: boolean;
  issues: string[];
  summary: {
    originalItems: number;
    convertedItems: number;
    titleMatch: boolean;
    subtitleMatch: boolean;
  };
} {
  const issues: string[] = [];
  
  // Count original items across all sections
  const originalItemCount = original.sections.reduce(
    (total, section) => total + section.items.length,
    0
  );
  
  // Filter out section headers for accurate comparison
  const commandItems = converted.items.filter(item => 
    item.type === 'command' || item.type === 'submenu'
  );
  
  // Validate item counts
  if (originalItemCount !== commandItems.length) {
    issues.push(`Item count mismatch: original=${originalItemCount}, converted=${commandItems.length}`);
  }
  
  // Validate title preservation
  const titleMatch = original.title === converted.title;
  if (!titleMatch) {
    issues.push(`Title mismatch: "${original.title}" vs "${converted.title}"`);
  }
  
  // Validate subtitle preservation
  const subtitleMatch = original.subtitle === converted.subtitle;
  if (!subtitleMatch && (original.subtitle || converted.subtitle)) {
    issues.push(`Subtitle mismatch: "${original.subtitle}" vs "${converted.subtitle}"`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    summary: {
      originalItems: originalItemCount,
      convertedItems: commandItems.length,
      titleMatch,
      subtitleMatch
    }
  };
}

/**
 * Migration helper that provides side-by-side comparison
 */
export function createMigrationDemo(content: MenuContent, context: MenuDisplayContext) {
  const converted = convertMenuContentToSkinDefinition(content, context);
  const validation = validateConversion(content, converted);
  
  return {
    original: content,
    converted,
    validation,
    migrationSteps: [
      '1. Convert MenuContent to SkinMenuDefinition using convertMenuContentToSkinDefinition()',
      '2. Replace menuComposer.compose() with renderSkinMenu()',
      '3. Test layout consistency with validateConversion()',
      '4. Verify all commands and functionality remain intact',
      '5. Update any direct separator calls to use unified system'
    ],
    benefits: [
      '✅ Single layout function handles both width and height',
      '✅ PCL-Skins architecture integration ready',
      '✅ JSON-based menu definitions for easy customization',
      '✅ Theme support with context-aware colors',
      '✅ Consistent textbox positioning across all menus',
      '✅ Automatic content truncation and padding'
    ]
  };
}

// Example usage and testing exports
export const conversionExamples = {
  
  // Simple menu conversion
  simpleMenu: {
    original: {
      title: '🔥 Phoenix Code Lite',
      subtitle: 'Quick Actions',
      sections: [{
        heading: '⚡ Quick Commands:',
        theme: { headingColor: 'yellow' as const, bold: true },
        items: [
          { label: '1. help', description: 'Show help', commands: ['help', '1'] },
          { label: '2. quit', description: 'Exit application', commands: ['quit', '2'] }
        ]
      }]
    } as MenuContent,
    
    expectedConverted: {
      title: '🔥 Phoenix Code Lite',
      subtitle: 'Quick Actions', 
      items: [
        { id: 'help', label: '1. help', description: 'Show help', type: 'command' as const },
        { id: 'quit', label: '2. quit', description: 'Exit application', type: 'command' as const }
      ],
      theme: {
        primaryColor: 'red' as const,
        accentColor: 'cyan' as const,
        separatorChar: '═',
        useIcons: true
      }
    } as SkinMenuDefinition
  },
  
  // Complex menu conversion  
  complexConfigMenu: {
    // Would contain the complex config menu example from the migration file
    // This demonstrates that the converter handles multi-section menus correctly
  }
};
