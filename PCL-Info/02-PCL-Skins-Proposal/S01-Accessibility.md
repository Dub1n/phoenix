# Non-Technical User Accessibility

## How Easy Would It Be for Non-Technical Users to Create Skins?

### Current Complexity Level: **MODERATE-TO-HIGH** ✗

Without additional tooling, creating skins would require:

- JSON configuration writing
- Understanding of command routing concepts
- Knowledge of prompt definition syntax
- Familiarity with menu structure hierarchies

### Proposed Solution: **Multi-Level Accessibility** ✓

#### Level 1: Visual Skin Builder (GUI/WebView):**

```typescript
// PCL could provide a visual skin builder
phoenix-code-lite skin:create --visual
// Opens browser-based GUI for drag-and-drop skin creation
```

**Features of Visual Builder:**

- **Drag-and-drop menu construction** with visual hierarchy
- **Template gallery** with pre-built skin components
- **Command wizard** for creating custom commands with forms
- **Live preview** of CLI interface during design
- **Export to JSON** with one-click skin generation
- **Import existing skins** for modification

#### Level 2: CLI Wizard (Enhanced Command Line):**

```bash
# Interactive skin creation wizard
phoenix-code-lite skin:wizard
```

**Wizard Features:**

- Step-by-step guided skin creation
- Multiple choice prompts for common patterns
- Template selection with customization
- Validation and preview before generation
- Integration with existing Yeoman-style scaffolding

#### Level 3: Template-Based Creation:**

```bash
# Start from existing skin template
phoenix-code-lite skin:clone qms-template my-custom-qms
phoenix-code-lite skin:customize my-custom-qms
```

## Implementation Approach for User-Friendly Creation

### Visual Skin Builder Architecture

```typescript
interface SkinBuilder {
  // Visual interface components
  menuDesigner: DragDropMenuBuilder;
  commandWizard: CommandDefinitionWizard;
  templateGallery: SkinTemplateRepository;
  previewEngine: LivePreviewRenderer;
  
  // Export capabilities
  exportToJSON(): SkinDefinition;
  validateSkin(): ValidationResult[];
  publishSkin(registry: SkinRegistry): Promise<void>;
}
```

### Complexity Reduction Strategies

1. **Smart Defaults**: Pre-configure 90% of settings with intelligent defaults
2. **Pattern Recognition**: Detect common workflow patterns and suggest skin structures
3. **Template Inheritance**: Build on existing skins rather than starting from scratch
4. **Validation & Guidance**: Real-time feedback and suggestions during creation
5. **Community Gallery**: Share and discover skins created by others

## Estimated Learning Curve

- **Visual Builder**: 30 minutes to create basic skin
- **CLI Wizard**: 45 minutes with technical comfort
- **Manual JSON**: 2-3 hours for technically inclined users
