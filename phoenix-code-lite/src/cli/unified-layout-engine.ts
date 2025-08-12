/**
 * Unified Layout Engine for PCL-Skins Architecture
 * 
 * Combines width (separator length) and height (consistent positioning) management
 * into a single function that works with JSON skin definitions.
 * 
 * This replaces the separate MenuComposer + MenuLayoutManager approach
 * with a unified system designed for the PCL-Skins plugin architecture.
 */

import chalk from 'chalk';

// Types for PCL-Skins JSON menu definitions (from architecture document)
export interface SkinMenuDefinition {
  title: string;
  subtitle?: string;
  items: SkinMenuItem[];
  theme?: SkinTheme;
}

export interface SkinMenuItem {
  id: string;
  label: string;
  description?: string;
  type: 'command' | 'submenu' | 'action';
  command?: string;
  items?: SkinMenuItem[];
}

export interface SkinTheme {
  primaryColor: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
  accentColor: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
  separatorChar: string;
  useIcons: boolean;
}

export interface LayoutConstraints {
  minHeight: number;  // Changed from fixedHeight to minHeight to prevent truncation
  minWidth: number;
  maxWidth: number;
  textboxLines: number;
  paddingLines: number;
  enforceConsistentHeight: boolean;
}

export interface CalculatedLayout {
  // Width measurements
  separatorLength: number;
  menuWidth: number;
  
  // Height measurements  
  totalLines: number;
  contentLines: number;
  textboxAreaLines: number;
  paddingLinesNeeded: number;
  
  // Rendering info
  needsTruncation: boolean;
  theme: ResolvedTheme;
  separatorChar: string;
}

export interface ResolvedTheme {
  titleStyle: (text: string) => string;
  headingStyle: (text: string) => string;
  itemStyle: (text: string) => string;
  descriptionStyle: (text: string) => string;
  separatorColor: (text: string) => string;
}

/**
 * Main layout calculation function
 * Combines width and height calculations with theme-aware rendering
 * 
 * @param skinDefinition JSON menu definition with theme
 * @param constraints Layout constraints (required - no defaults)
 * @returns Complete layout information for rendering
 */
export function calculateMenuLayout(
  skinDefinition: SkinMenuDefinition,
  constraints: LayoutConstraints
): CalculatedLayout {
  // Measure content dimensions
  const measurements = measureMenuContent(skinDefinition);
  
  // Calculate width (separator length)
  const separatorLength = calculateOptimalWidth(measurements, constraints);
  
  // Calculate height (consistent positioning)
  const heightLayout = calculateConsistentHeight(measurements, constraints);
  
  // Resolve theme styling
  const theme = resolveTheme(skinDefinition.theme);

  return {
    // Width
    separatorLength,
    menuWidth: separatorLength,
    
    // Height  
    totalLines: heightLayout.totalLines,
    contentLines: heightLayout.contentLines,
    textboxAreaLines: constraints.textboxLines,
    paddingLinesNeeded: heightLayout.paddingNeeded,
    
    // Rendering
    needsTruncation: heightLayout.needsTruncation,
    theme,
    separatorChar: skinDefinition.theme?.separatorChar || '═'
  };
}

/**
 * Render menu with calculated layout
 * Single function that handles both width and height rendering
 */
export function renderMenuWithLayout(
  skinMenuDefinition: SkinMenuDefinition, 
  layout: CalculatedLayout,
  context?: { skinId?: string; level?: string }
): void {
  
  let renderedLines = 0;
  const maxContentLines = layout.contentLines;
  
  // Clear screen for consistent positioning (optional)
  if (layout.totalLines > 0) {
    process.stdout.write('\x1b[2J\x1b[H');
  }
  
  // Render title
  if (renderedLines < maxContentLines) {
    console.log(layout.theme.titleStyle(skinMenuDefinition.title));
    renderedLines++;
  }
  
  // Render separator with calculated width
  if (renderedLines < maxContentLines) {
    console.log(layout.theme.separatorColor(layout.separatorChar.repeat(layout.separatorLength)));
    renderedLines++;
  }
  
  // Render subtitle if present
  if (skinMenuDefinition.subtitle && renderedLines < maxContentLines) {
    console.log(layout.theme.descriptionStyle(skinMenuDefinition.subtitle));
    renderedLines++;
  }
  
  // Blank line
  if (renderedLines < maxContentLines) {
    console.log();
    renderedLines++;
  }
  
  // Render menu items within height constraints
  let itemNumber = 1;
  for (const item of skinMenuDefinition.items) {
    if (renderedLines >= maxContentLines) break;
    
    // Always generate numbers procedurally
    const displayLabel = `${itemNumber}. ${item.label}`;
    
    const label = layout.theme.itemStyle(`  ${displayLabel}`);
    const description = item.description ? layout.theme.descriptionStyle(` - ${item.description}`) : '';
    
    console.log(`${label}${description}`);
    renderedLines++;
    itemNumber++;
  }
  
  // Show truncation indicator if needed
  if (layout.needsTruncation && renderedLines < maxContentLines) {
    console.log(layout.theme.descriptionStyle('  ... more options available'));
    renderedLines++;
  }
  
  // Add padding to maintain consistent height
  for (let i = 0; i < layout.paddingLinesNeeded; i++) {
    console.log();
  }
  
  // Render static textbox area
  console.log(layout.theme.separatorColor('─'.repeat(layout.separatorLength)));
  console.log(chalk.blue('💡 ') + layout.theme.descriptionStyle(generateHint(context)));
  console.log(); // Space for command prompt
}

/**
 * Core measurement functions
 */
function measureMenuContent(menuDef: SkinMenuDefinition): {
  titleLength: number;
  longestItemLength: number;
  totalItems: number;
  estimatedLines: number;
} {
  const titleLength = stripAnsi(menuDef.title).length;
  const subtitleLength = menuDef.subtitle ? stripAnsi(menuDef.subtitle).length : 0;
  
  let longestItemLength = 0;
  let totalItems = 0;
  
  for (const item of menuDef.items) {
    totalItems++;
    // Always account for procedural numbering
    const displayLabel = `${totalItems}. ${item.label}`;
    const itemText = `  ${displayLabel}${item.description ? ` - ${item.description}` : ''}`;
    longestItemLength = Math.max(longestItemLength, stripAnsi(itemText).length);
  }
  
  const estimatedLines = 4 + totalItems + (menuDef.subtitle ? 1 : 0); // title + separator + subtitle + blank + items
  
  return {
    titleLength: Math.max(titleLength, subtitleLength),
    longestItemLength,
    totalItems,
    estimatedLines
  };
}

function calculateOptimalWidth(measurements: any, constraints: LayoutConstraints): number {
  const contentWidth = Math.max(measurements.titleLength, measurements.longestItemLength);
  const calculatedWidth = Math.floor(contentWidth * 1.1) + 5; // 10% padding + 5 chars buffer
  
  return Math.max(
    constraints.minWidth,
    Math.min(constraints.maxWidth, calculatedWidth)
  );
}

function calculateConsistentHeight(measurements: any, constraints: LayoutConstraints): {
  totalLines: number;
  contentLines: number; 
  paddingNeeded: number;
  needsTruncation: boolean;
} {
  const minRequiredLines = constraints.minHeight - constraints.textboxLines - constraints.paddingLines;
  const actualContentLines = Math.max(measurements.estimatedLines, minRequiredLines);
  const totalLines = actualContentLines + constraints.textboxLines + constraints.paddingLines;
  const needsTruncation = false; // Never truncate with minHeight approach
  const paddingNeeded = Math.max(0, minRequiredLines - measurements.estimatedLines);
  
  return {
    totalLines,
    contentLines: actualContentLines,
    paddingNeeded,
    needsTruncation
  };
}

function resolveTheme(skinTheme?: SkinTheme): ResolvedTheme {
  const primaryColor = skinTheme?.primaryColor || 'red';
  const accentColor = skinTheme?.accentColor || 'gray';
  
  return {
    titleStyle: chalk[primaryColor].bold,
    headingStyle: chalk[accentColor].bold,
    itemStyle: chalk.green,
    descriptionStyle: chalk.gray,
    separatorColor: chalk.gray
  };
}

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

function generateHint(context?: { skinId?: string; level?: string }): string {
  const hints = [];
  if (context?.level !== 'main') hints.push('"back" to return');
  hints.push('"help" for commands', '"quit" to exit');
  return hints.join(', ');
}

/**
 * PCL-Skins Integration Function
 * This is how the unified layout engine integrates with the PCL-Skins architecture
 */
export function renderSkinMenu(
  skinMenuDefinition: SkinMenuDefinition,
  skinContext: { skinId: string; level: string },
  layoutConstraints: LayoutConstraints  // Now required - no defaults in core engine
): void {
  // Pure function - no defaults, just calculation and rendering
  const layout = calculateMenuLayout(skinMenuDefinition, layoutConstraints);
  renderMenuWithLayout(skinMenuDefinition, layout, skinContext);
}

/**
 * Example usage with PCL-Skins JSON definition
 */
export const exampleUsage = {
  // This would come from loaded skin JSON
  qmsMenuDefinition: {
    title: '🏥 QMS Medical Device Compliance',
    subtitle: 'EN 62304 & AAMI TIR45 compliant workflows',
    items: [
      {
        id: 'doc-processing',
        label: 'Document Processing',
        description: 'Convert regulatory PDFs to structured format',
        type: 'submenu' as const,
        command: 'qms:process-document'
      },
      {
        id: 'compliance-check', 
        label: 'Compliance Validation',
        description: 'Validate against regulatory standards',
        type: 'command' as const,
        command: 'qms:validate-compliance'
      }
    ],
    theme: {
      primaryColor: 'blue' as const,
      accentColor: 'cyan' as const, 
      separatorChar: '═',
      useIcons: true
    }
  } satisfies SkinMenuDefinition,

  // Single function call replaces MenuComposer + MenuLayoutManager
  render() {
    // Note: In real usage, constraints come from the integration layer
    const exampleConstraints: LayoutConstraints = {
      minHeight: 15, minWidth: 40, maxWidth: 100, 
      textboxLines: 3, paddingLines: 2, enforceConsistentHeight: true
    };
    renderSkinMenu(this.qmsMenuDefinition, { 
      skinId: 'qms-medical-device',
      level: 'main'
    }, exampleConstraints);
    
    // Result: QMS menu with:
    // - Calculated separator width based on content (≈65 chars)
    // - Fixed height with textbox at line 22
    // - Blue/cyan theme from skin definition
    // - Professional medical device terminology
  }
};
