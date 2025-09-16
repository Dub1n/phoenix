---
date-created: 2025-09-15T100000Z
last-updated: 2025-09-15T100000Z
name: window-utils
description: Centralized window utilities to consolidate scattered border rendering, window layout logic, and general window management across CLI components.
status: proposed
category: display-ui
use-when:
  - Consolidating redundant border rendering and window layout logic.
  - Needing consistent window management across various terminal UI components.
  - Implementing chainable APIs for defining and rendering window properties.
  - Requiring standardized handling of window dimensions and content placement.
keywords:
  - window-utilities
  - ui-consistency
  - border-rendering
  - layout-management
  - terminal-ui
prerequisites:
  - logger
  - terminal-formatter
related-patterns:
  - display-utils
  - terminal-ui-components
---

### Window Utils Utility Consolidation Pattern

**Problem**: Border rendering and window layout logic are duplicated across various CLI components, leading to inconsistent UI presentation and increased maintenance overhead. Components like `src/rendering/content-layout-system.ts` and `src/interfaces/terminal-ui-components.ts` contain repetitive code for drawing borders, calculating window dimensions, and managing content placement.

**Current State Examples**:

```typescript
// In content-layout-system.ts or similar
class BorderRenderer {
  renderBorder(width: number, height: number, title: string, borderStyle: string): string {
    // Manual border drawing logic with character arrays
  }
}

class WindowLayout {
  calculateContentArea(windowWidth: number, windowHeight: number): { x: number; y: number; width: number; height: number } {
    // Manual calculation of inner content area considering borders and padding
  }
}

// In terminal-ui-components.ts
function drawModal(content: string[], title: string): string {
  const terminalWidth = process.stdout.columns || 80;
  const modalWidth = Math.min(terminalWidth - 10, content[0].length + 4);
  const borderChar = '#'; // Inconsistent border character
  // ... manual border and content placement ...
}
```

**Solution**: Centralized `WindowUtils` with a fluent, chainable API for defining and rendering window elements, ensuring minimal usage footprint and consistent window management across all UI components. This utility integrates with existing logging and formatting utilities to provide a robust and easy-to-use solution.

#### Window Utils Implementation

**Core WindowUtils Class** (Minimal Usage Design):

```typescript
import { createLogger } from '../core/logger';
import { SemanticFormatter } from '../display/terminal-formatter';
import { DisplayUtils } from '../display/display-utils';

export class WindowUtils {
  private static logger = createLogger('window-utils');
  private static formatter = new SemanticFormatter(); // Using SemanticFormatter

  // Fluent API for window creation and rendering
  static builder(): WindowBuilder {
    return new WindowBuilder();
  }

  // Helper for quick border rendering
  static renderBorder(options: BorderOptions): string {
    const { width, height, title = '', style = 'single', padding = 1 } = options;
    const { borderChars, corners } = this.getBorderStyle(style);
    
    const topBottom = corners.topLeft + borderChars.horizontal.repeat(width - 2) + corners.topRight;
    const middle = borderChars.vertical + ' '.repeat(width - 2) + borderChars.vertical;
    
    let result = [topBottom];
    for (let i = 0; i < height - 2; i++) {
      result.push(middle);
    }
    result.push(topBottom.replace(corners.topLeft, corners.bottomLeft).replace(corners.topRight, corners.bottomRight)); // Bottom border
    
    // Add title if present
    if (title) {
      const titleText = ` ${title} `;
      const titleStart = Math.floor((width - titleText.length) / 2);
      result[0] = result[0].substring(0, titleStart) + titleText + result[0].substring(titleStart + titleText.length);
    }

    this.logger.debug('Rendered border', { width, height, title });
    return result.join('\n');
  }

  private static getBorderStyle(style: string) {
    switch (style) {
      case 'double':
        return {
          borderChars: { horizontal: '═', vertical: '║' },
          corners: { topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝' },
        };
      case 'rounded':
        return {
          borderChars: { horizontal: '─', vertical: '│' },
          corners: { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯' },
        };
      case 'single':
      default:
        return {
          borderChars: { horizontal: '─', vertical: '│' },
          corners: { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘' },
        };
    }
  }
}

// Fluent Window Builder API
class WindowBuilder {
  private _width: number = 0;
  private _height: number = 0;
  private _title: string = '';
  private _content: string[] = [];
  private _borderStyle: BorderStyle = 'single';
  private _padding: number = 1;

  width(w: number): this {
    this._width = w;
    return this;
  }

  height(h: number): this {
    this._height = h;
    return this;
  }

  title(t: string): this {
    this._title = t;
    return this;
  }

  content(c: string | string[]): this {
    this._content = Array.isArray(c) ? c : [c];
    return this;
  }

  border(style: BorderStyle): this {
    this._borderStyle = style;
    return this;
  }

  padding(p: number): this {
    this._padding = p;
    return this;
  }

  render(): string {
    // Determine effective width and height, potentially from terminal
    const actualWidth = this._width || DisplayUtils.standards.terminalWidth - (this._padding * 2);
    const actualHeight = this._height || this._content.length + (this._padding * 2) + 2; // +2 for borders

    const border = WindowUtils.renderBorder({
      width: actualWidth,
      height: actualHeight,
      title: this._title,
      style: this._borderStyle,
      padding: this._padding,
    });

    // Overlay content onto the border
    const borderLines = border.split('\n');
    const contentStartY = 1 + this._padding; // After top border and top padding
    const contentStartX = 1 + this._padding; // After left border and left padding

    for (let i = 0; i < this._content.length; i++) {
      if (contentStartY + i < actualHeight - (1 + this._padding)) { // Ensure content fits within bottom border and padding
        const line = this._content[i];
        const strippedLine = DisplayUtils.stripAnsi(line);
        const paddedLine = strippedLine.padEnd(actualWidth - (contentStartX * 2), ' '); // Pad content to fit
        
        const lineToModify = borderLines[contentStartY + i];
        if (lineToModify) {
            borderLines[contentStartY + i] = 
              lineToModify.substring(0, contentStartX) + 
              paddedLine.substring(0, actualWidth - (contentStartX * 2)) + // Ensure content doesn't overflow
              lineToModify.substring(actualWidth - contentStartX);
        }
      }
    }

    return borderLines.join('\n');
  }
}

// Types
type BorderStyle = 'single' | 'double' | 'rounded';

interface BorderOptions {
  width: number;
  height: number;
  title?: string;
  style?: BorderStyle;
  padding?: number;
}

// Convenience exports
export const { builder: windowBuilder, renderBorder } = WindowUtils;
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered approach):

```typescript
// In content-layout-system.ts (multiple files affected)
const renderer = new BorderRenderer();
const borderBox = renderer.renderBorder(80, 10, 'My Window', 'double');

// In terminal-ui-components.ts
const terminalWidth = process.stdout.columns || 80;
const title = 'System Status';
const content = ['CPU: 45%', 'RAM: 60%'];
let windowContent = '';
// ... complex manual calculations for border, padding, and content positioning ...
```

**After** (One-line consolidated):

```typescript
// Simple border rendering
const simpleBorder = windowBuilder().width(60).height(5).title('Alert!').border('single').render();
console.log(simpleBorder);

// Window with content
const windowWithContent = windowBuilder()
  .autoWidth()
  .height(10)
  .title('Application Log')
  .border('double')
  .content([
    'Line 1: Initializing...',
    'Line 2: Loading modules...',
    'Line 3: Connection established.',
  ])
  .padding(2)
  .render();
console.log(windowWithContent);

// Complex window layout
const menuItems = ['Option A', 'Option B', 'Option C'];
const menuWindow = windowBuilder()
  .width(40)
  .height(menuItems.length + 4) // Content lines + padding + borders
  .title('Main Menu')
  .border('rounded')
  .content(DisplayUtils.formatItems(menuItems, { numbered: true, width: 30 }))
  .render();
console.log(menuWindow);
```

#### Files Using This Pattern

**Rendering and UI Components**:

- [ ] `src/rendering/content-layout-system.ts` → Replace `BorderRenderer` and `WindowLayout` with `WindowUtils.builder()`
- [ ] `src/interfaces/terminal-ui-components.ts` → Consolidate manual window and modal drawing logic with `WindowUtils.builder()`
- [ ] `src/interfaces/interactive-menu-renderer.ts` → Use `WindowUtils` for consistent menu framing and borders
- [ ] Any other CLI components with manual border drawing or window layout logic.

**Impact**: ~15 files, ~300 lines reduction, consistent window management.

#### Expected Impact

**Quantitative Benefits**:

- **Files Affected**: ~15 files with duplicated window and border logic.
- **Lines Reduced**: ~300 lines of manual border drawing and layout calculation code.
- **Components Unified**: BorderRenderer, WindowLayout, and scattered modal/window drawing functions.
- **Consistency**: 100% consistent window borders, titles, and content placement across all CLI components.

**Qualitative Benefits**:

- **Fluent API**: Chainable window builder simplifies complex UI element creation.
- **Standardized Appearance**: Ensures a uniform look and feel for all terminal windows and dialogs.
- **Reduced Boilerplate**: Eliminates repetitive border drawing and layout calculations.
- **Improved Maintainability**: Centralized logic for easier updates and bug fixes.
- **Developer Experience**: Intuitive API reduces the learning curve for new UI development.

#### Integration with Other Utilities

**Display Utils Integration**:

```typescript
// WindowUtils leverages DisplayUtils for width calculations and content formatting
const window = windowBuilder()
  .autoWidth()
  .content(DisplayUtils.formatItems(someData, { numbered: true }))
  .render();
```

**Logger Integration**:

```typescript
// Automatic logging of window rendering decisions or errors.
WindowUtils.builder().title('Error').content('Something went wrong!').render(); // Logs rendering process
```

**Terminal Formatter Integration**:

```typescript
// Window content can be pre-formatted using TerminalFormatter
const formattedContent = WindowUtils.formatter.status.error('Critical Error: Disk full!'); // Using SemanticFormatter's API
const errorWindow = windowBuilder().title('System Alert').content([formattedContent]).render();
```

#### Implementation Validation

**Before Migration**:

- [ ] Catalog all instances of manual border drawing and window layout logic.
- [ ] Identify components responsible for modal and dialog rendering.
- [ ] Map all disparate implementations of terminal window management.

**During Migration**:

- [ ] Replace custom `BorderRenderer` and `WindowLayout` classes with `WindowUtils.builder()`.
- [ ] Convert manual modal/dialog drawing functions to use the `WindowUtils` API.
- [ ] Standardize all window titles, border styles, and padding using the fluent API.

**After Migration**:

- [ ] Verify consistent border rendering and window layouts across all CLI components.
- [ ] Confirm proper content placement and padding within rendered windows.
- [ ] Test window responsiveness to different terminal sizes.

#### Anti-Patterns

- **X** Don't manually draw borders with character arrays; use `WindowUtils.renderBorder()` or `WindowUtils.builder().border()`.
- **X** Don't manually calculate content areas within windows; leverage `WindowUtils.builder()` for automatic layout.
- **X** Don't use inconsistent border characters or styles; standardize with `WindowUtils` presets.
- **X** Avoid ad-hoc title placement logic; use `WindowUtils.builder().title()` for centralized handling.

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation
**Implementation Priority**: HIGH (UI consistency critical)
**Dependencies**: Logger Utility (for debug logging), Terminal Formatter Utility (for integration), Display Utils Utility (for width calculations and formatting)
**Integration Points**: All CLI interface components, terminal rendering, interactive menus, modal dialogs.
**Migration Complexity**: Medium (requires refactoring existing UI rendering logic).
**Performance Impact**: Positive (eliminates redundant calculations, streamlined rendering).
