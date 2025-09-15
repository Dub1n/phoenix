---
date-created: 2025-09-14T182000Z
last-updated: 2025-09-14T182000Z
name: display-utils-utility-consolidation-pattern
description: Centralized display utilities to consolidate scattered UI calculations, display standards, and service ordering patterns across interface components
status: established
category: display-ui
use-when:
  - Consolidating display consistency calculations scattered across CLI components
  - Need for unified service ordering and display standards
  - Terminal width calculations and layout constraints required
  - Consistent UI element sizing and positioning needed
keywords:
  - display-utilities
  - ui-consistency
  - service-ordering
  - layout-calculations
  - terminal-standards
prerequisites:
  - logger-utility
  - terminal-formatter-utility
related-patterns:
  - window-utils-utility
  - terminal-formatter-utility
  - terminal-ui-components
---

### Display Utils Utility Consolidation Pattern

**Problem**: Display consistency calculations are scattered across multiple CLI components with DisplayStandardsCalculator, CLIDisplayConsistencyEngine, ServiceOrderingManager, and layout calculations repeated in different places.

**Current State Examples**:

```typescript
// In cli-display-consistency-engine.ts
class CLIDisplayConsistencyEngine {
  calculateDisplayWidth(content: string): number {
    // Manual width calculation logic
  }
  
  enforceConsistency(items: MenuItem[]): MenuItem[] {
    // Manual consistency enforcement
  }
}

// In service-ordering-manager.ts  
class ServiceOrderingManager {
  orderServices(services: BackendService[]): BackendService[] {
    const connected = services.filter(s => s.status === 'connected');
    const disconnected = services.filter(s => s.status !== 'connected');
    return [...connected.sort(), ...disconnected.sort()];
  }
}

// Repeated layout calculations
const terminalWidth = process.stdout.columns || 80;
const contentWidth = terminalWidth - 4; // Manual padding calculation
```

**Solution**: Centralized DisplayUtils with fluent API for layout calculations, service ordering, display standards, and minimal usage footprint for all UI consistency needs.

#### Display Utils Implementation

**Core DisplayUtils Class** (Minimal Usage Design):

```typescript
import { createLogger } from '../core/logger-utility';
import { SemanticFormatter } from './terminal-formatter-utility-pattern'; // Changed import

export class DisplayUtils {
  private static logger = createLogger('display-utils');
  private static formatter = new SemanticFormatter(); // Changed instantiation
  
  // Fluent display calculation API
  static calculate(): DisplayCalculator {
    return new DisplayCalculator();
  }
  
  // One-line service ordering
  static orderServices<T extends { status: string; name: string }>(
    services: T[], 
    options: ServiceOrderOptions = {}
  ): T[] {
    const { connectedFirst = true, alphabetical = true } = options;
    
    if (!connectedFirst && !alphabetical) {
      return services;
    }
    
    let result = [...services];
    
    if (connectedFirst) {
      const connected = result.filter(s => 
        s.status === 'connected' || s.status === 'healthy' || s.status === 'active'
      );
      const disconnected = result.filter(s => 
        s.status !== 'connected' && s.status !== 'healthy' && s.status !== 'active'
      );
      
      result = [
        ...(alphabetical ? connected.sort((a, b) => a.name.localeCompare(b.name)) : connected),
        ...(alphabetical ? disconnected.sort((a, b) => a.name.localeCompare(b.name)) : disconnected)
      ];
    } else if (alphabetical) {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    this.logger.debug('Ordered services', { 
      total: services.length, 
      connected: result.filter(s => s.status === 'connected').length 
    });
    
    return result;
  }
  
  // Standard display measurements
  static get standards(): DisplayStandards {
    return {
      terminalWidth: process.stdout.columns || 80,
      minWidth: 40,
      maxWidth: 120,
      defaultPadding: 2,
      borderWidth: 2,
      separatorLength: 40
    };
  }
  
  // Responsive width calculation
  static responsiveWidth(content: string | string[], options: ResponsiveOptions = {}): number {
    const { minWidth, maxWidth, padding = 2 } = options;
    const standards = this.standards;
    
    let contentWidth: number;
    
    if (Array.isArray(content)) {
      contentWidth = Math.max(...content.map(item => this.stripAnsi(item).length));
    } else {
      contentWidth = this.stripAnsi(content).length;
    }
    
    // Calculate ideal width with padding
    const idealWidth = contentWidth + (padding * 2);
    
    // Apply constraints
    const finalWidth = Math.max(
      minWidth || standards.minWidth,
      Math.min(
        maxWidth || Math.min(standards.terminalWidth - 4, standards.maxWidth),
        idealWidth
      )
    );
    
    return finalWidth;
  }
  
  // Consistent item formatting with numbering
  static formatItems(items: string[], options: ItemFormatOptions = {}): string[] {
    const { 
      numbered = true, 
      prefix = '', 
      suffix = '',
      width = 0,
      alignment = 'left'
    } = options;
    
    const processedItems = items.map((item, index) => {
      let formatted = item;
      
      if (numbered) {
        const number = (index + 1).toString().padStart(2, ' ');
        formatted = `${number}. ${formatted}`;
      }
      
      if (prefix) {
        formatted = `${prefix}${formatted}`;
      }
      
      if (suffix) {
        formatted = `${formatted}${suffix}`;
      }
      
      // Apply width and alignment if specified
      if (width > 0) {
        const stripped = this.stripAnsi(formatted);
        const currentLength = stripped.length;
        
        if (currentLength < width) {
          const padding = width - currentLength;
          switch (alignment) {
            case 'center':
              const leftPad = Math.floor(padding / 2);
              const rightPad = padding - leftPad;
              formatted = ' '.repeat(leftPad) + formatted + ' '.repeat(rightPad);
              break;
            case 'right':
              formatted = ' '.repeat(padding) + formatted;
              break;
            default: // 'left'
              formatted = formatted + ' '.repeat(padding);
          }
        } else if (currentLength > width) {
          // Truncate with ellipsis
          const truncateLength = width - 3;
          formatted = this.stripAnsi(formatted).substring(0, truncateLength) + '...';
        }
      }
      
      return formatted;
    });
    
    return processedItems;
  }
  
  private static stripAnsi(text: string): string {
    // Remove ANSI escape codes for accurate length calculation
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }
}

// Fluent display calculator for complex layouts
class DisplayCalculator {
  private width: number = 0;
  private height: number = 0;
  private padding: number = 2;
  private ordering: 'connected-first' | 'alphabetical' | 'none' = 'connected-first';
  
  // Chainable width calculation
  width(w: number): this {
    this.width = w;
    return this;
  }
  
  // Auto-calculate width from terminal
  autoWidth(): this {
    this.width = DisplayUtils.standards.terminalWidth;
    return this;
  }
  
  // Set content padding
  padding(p: number): this {
    this.padding = p;
    return this;
  }
  
  // Service ordering strategy
  order(strategy: 'connected-first' | 'alphabetical' | 'none'): this {
    this.ordering = strategy;
    return this;
  }
  
  // Calculate final layout
  layout(): DisplayLayout {
    const contentWidth = Math.max(this.width - (this.padding * 2), 20);
    
    return {
      totalWidth: this.width || DisplayUtils.standards.terminalWidth,
      contentWidth,
      padding: this.padding,
      maxItemLength: contentWidth - 6, // Account for numbering "99. "
      ordering: this.ordering,
      separatorLength: contentWidth
    };
  }
}

// Types
interface ServiceOrderOptions {
  connectedFirst?: boolean;
  alphabetical?: boolean;
}

interface ResponsiveOptions {
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
}

interface ItemFormatOptions {
  numbered?: boolean;
  prefix?: string;
  suffix?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
}

interface DisplayStandards {
  terminalWidth: number;
  minWidth: number;
  maxWidth: number;
  defaultPadding: number;
  borderWidth: number;
  separatorLength: number;
}

interface DisplayLayout {
  totalWidth: number;
  contentWidth: number;
  padding: number;
  maxItemLength: number;
  ordering: string;
  separatorLength: number;
}

// Convenience exports
export const { 
  calculate, 
  orderServices, 
  responsiveWidth, 
  formatItems,
  standards: displayStandards
} = DisplayUtils;
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered approach):

```typescript
// In cli-display-consistency-engine.ts (25+ files affected)
const engine = new CLIDisplayConsistencyEngine();
const width = engine.calculateDisplayWidth(content);
const consistent = engine.enforceConsistency(items);

// In service-ordering-manager.ts  
const manager = new ServiceOrderingManager();
const ordered = manager.orderServices(services);

// Manual layout calculations scattered everywhere
const terminalWidth = process.stdout.columns || 80;
const contentWidth = terminalWidth - 4;
const items = menuItems.map((item, index) => `${index + 1}. ${item}`);
```

**After** (One-line consolidated):

```typescript
// Fluent display calculation API
const layout = calculate()
  .autoWidth()
  .padding(2)
  .order('connected-first')
  .layout();

// One-line service ordering with consistent criteria
const orderedServices = orderServices(services); // Default: connected-first + alphabetical

// One-line item formatting with numbering
const formattedItems = formatItems(menuItems, { 
  numbered: true, 
  width: layout.maxItemLength 
});

// Responsive width calculation
const idealWidth = responsiveWidth(content, { minWidth: 40, padding: 2 });
```

**Complex Layout Example**:

```typescript
// Before: Multiple manual calculations
const termWidth = process.stdout.columns || 80;
const padding = 2;
const borderWidth = 2;
const contentWidth = termWidth - padding * 2 - borderWidth * 2;
const services = allServices.filter(s => s.status === 'connected').sort((a,b) => a.name.localeCompare(b.name))
  .concat(allServices.filter(s => s.status !== 'connected').sort((a,b) => a.name.localeCompare(b.name)));
const numberedItems = services.map((s, i) => `${(i+1).toString().padStart(2, ' ')}. ${s.name}`);

// After: Fluent API with automatic calculations  
const layout = calculate().autoWidth().padding(2).order('connected-first').layout();
const orderedServices = orderServices(allServices);
const displayItems = formatItems(
  orderedServices.map(s => s.name), 
  { numbered: true, width: layout.maxItemLength }
);
```

#### Files Using This Pattern

**CLI Display Components**:

- [ ] `src/interfaces/cli-display-consistency-engine.ts` → Replace with DisplayUtils.calculate()
- [ ] `src/interfaces/service-ordering-manager.ts` → Replace with DisplayUtils.orderServices()
- [ ] `src/rendering/universal-layout-engine.ts` → Integrate width calculations with DisplayUtils
- [ ] `src/interfaces/interactive-menu-renderer.ts` → Use formatItems() for consistent menu display

**Interface Components Using Display Logic**:

- [ ] `src/interfaces/cli-adapter.ts` → Use display calculations for menu rendering
- [ ] `src/interfaces/cli-adapter-abstracted.ts` → Consistent display standards
- [ ] `src/interfaces/terminal-ui-components.ts` → Width calculations and item formatting

**Layout and Rendering Components**:

- [ ] Components with manual terminal width detection
- [ ] Components with service list display logic
- [ ] Components with item numbering and formatting

#### Expected Impact

**Quantitative Benefits**:

- **Files Affected**: ~25 files with display consistency logic
- **Lines Reduced**: ~400 lines of manual calculation and ordering code
- **Components Unified**: DisplayStandardsCalculator, ServiceOrderingManager, layout calculations
- **Consistency**: 100% consistent display standards across all CLI components

**Qualitative Benefits**:

- **Fluent API**: Chainable display calculations reduce boilerplate
- **Responsive Design**: Automatic terminal width adaptation
- **Service Ordering**: Consistent connected-first, alphabetical ordering
- **Item Formatting**: Standardized numbering and alignment
- **Terminal Compatibility**: Proper ANSI stripping for width calculations

#### Integration with Other Utilities

**Terminal Formatter Integration**:

```typescript
// DisplayUtils works with TerminalFormatter for complete UI solution
const layout = calculate().autoWidth().layout();
const items = formatItems(services.map(s => DisplayUtils.formatter.status.success(s.name))); // Explicitly use DisplayUtils.formatter
```

**Logger Integration**:

```typescript
// Automatic logging of display decisions
orderServices(services); // Logs ordering results automatically
```

#### Implementation Validation

**Before Migration**:

- [ ] Catalog all display consistency components and their usage
- [ ] Identify service ordering patterns across components
- [ ] Map manual layout calculation instances

**During Migration**:

- [ ] Replace DisplayStandardsCalculator with DisplayUtils.calculate()
- [ ] Convert ServiceOrderingManager usage to orderServices()
- [ ] Migrate manual width calculations to responsiveWidth()
- [ ] Standardize item formatting with formatItems()

**After Migration**:

- [ ] Verify consistent display standards across all CLI components
- [ ] Confirm service ordering follows connected-first + alphabetical pattern
- [ ] Test responsive width calculations on different terminal sizes
- [ ] Validate item formatting consistency

#### Anti-Patterns

- **X** Don't manually calculate terminal width - use DisplayUtils.standards
- **X** Don't manually order services - use orderServices() with consistent criteria
- **X** Don't manually format menu items - use formatItems() for consistency
- **X** Don't strip ANSI codes manually - use built-in stripAnsi method

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation  
**Implementation Priority**: HIGH (UI consistency critical)  
**Dependencies**: Logger Utility (for debug logging), Terminal Formatter Utility (for integration)  
**Integration Points**: All CLI interface components, menu rendering, service display  
**Migration Complexity**: Medium (requires consolidating multiple scattered components)  
**Performance Impact**: Positive (eliminates redundant calculations, consistent caching)
