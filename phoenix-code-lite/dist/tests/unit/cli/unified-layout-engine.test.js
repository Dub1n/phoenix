"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unified_layout_engine_1 = require("../../../src/cli/unified-layout-engine");
describe('Unified Layout Engine', () => {
    const createTestSkinMenuDefinition = () => ({
        title: 'Test Menu',
        subtitle: 'Test subtitle',
        items: [
            {
                id: 'item1',
                label: 'First Item',
                description: 'First item description',
                type: 'command',
                command: 'first'
            },
            {
                id: 'item2',
                label: 'Second Item',
                description: 'Second item description',
                type: 'command',
                command: 'second'
            },
            {
                id: 'item3',
                label: 'Third Item',
                description: 'Third item description',
                type: 'command',
                command: 'third'
            }
        ],
        theme: {
            primaryColor: 'blue',
            accentColor: 'cyan',
            separatorChar: '═',
            useIcons: true
        }
    });
    const createTestConstraints = () => ({
        minHeight: 25,
        minWidth: 40,
        maxWidth: 100,
        textboxLines: 3,
        paddingLines: 2,
        enforceConsistentHeight: true
    });
    describe('calculateMenuLayout', () => {
        test('should calculate layout with procedural numbering', () => {
            const skinDefinition = createTestSkinMenuDefinition();
            const constraints = createTestConstraints();
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            expect(layout.separatorLength).toBeGreaterThan(0);
            expect(layout.menuWidth).toBeGreaterThan(0);
            expect(layout.totalLines).toBeGreaterThan(0);
            expect(layout.contentLines).toBeGreaterThan(0);
            expect(layout.needsTruncation).toBeDefined();
            expect(layout.theme).toBeDefined();
        });
        test('should handle empty menu items', () => {
            const skinDefinition = {
                title: 'Empty Menu',
                items: [],
                theme: {
                    primaryColor: 'blue',
                    accentColor: 'cyan',
                    separatorChar: '═',
                    useIcons: true
                }
            };
            const constraints = createTestConstraints();
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            expect(layout.separatorLength).toBeGreaterThan(0);
            expect(layout.totalLines).toBeGreaterThan(0);
            expect(layout.contentLines).toBeGreaterThan(0);
        });
        test('should respect width constraints', () => {
            const skinDefinition = createTestSkinMenuDefinition();
            const constraints = {
                minHeight: 25,
                minWidth: 40,
                maxWidth: 50, // Small max width
                textboxLines: 3,
                paddingLines: 2,
                enforceConsistentHeight: true
            };
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            expect(layout.separatorLength).toBeLessThanOrEqual(50);
            expect(layout.menuWidth).toBeLessThanOrEqual(50);
        });
        test('should handle very long item labels', () => {
            const skinDefinition = {
                title: 'Test Menu',
                items: [
                    {
                        id: 'item1',
                        label: 'This is a very long item label that should be handled properly by the layout engine',
                        type: 'command',
                        command: 'long'
                    }
                ],
                theme: {
                    primaryColor: 'blue',
                    accentColor: 'cyan',
                    separatorChar: '═',
                    useIcons: true
                }
            };
            const constraints = createTestConstraints();
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            expect(layout.separatorLength).toBeGreaterThan(0);
            expect(layout.needsTruncation).toBeDefined();
        });
    });
    describe('renderMenuWithLayout', () => {
        test('should render menu with procedural numbering', () => {
            const skinDefinition = createTestSkinMenuDefinition();
            const constraints = createTestConstraints();
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            let capturedOutput = '';
            const originalConsoleLog = console.log;
            console.log = jest.fn((...args) => {
                capturedOutput += args.join(' ') + '\n';
            });
            try {
                (0, unified_layout_engine_1.renderMenuWithLayout)(skinDefinition, layout, { skinId: 'test', level: 'test' });
                // Verify procedural numbering
                expect(capturedOutput).toContain('1. First Item');
                expect(capturedOutput).toContain('2. Second Item');
                expect(capturedOutput).toContain('3. Third Item');
                // Verify no duplicate numbers
                expect(capturedOutput).not.toContain('1. 1.');
                expect(capturedOutput).not.toContain('2. 2.');
                expect(capturedOutput).not.toContain('3. 3.');
            }
            finally {
                console.log = originalConsoleLog;
            }
        });
        test('should handle height constraints', () => {
            const skinDefinition = createTestSkinMenuDefinition();
            const constraints = {
                minHeight: 5, // Very small height
                minWidth: 40,
                maxWidth: 100,
                textboxLines: 1,
                paddingLines: 1,
                enforceConsistentHeight: true
            };
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            let capturedOutput = '';
            const originalConsoleLog = console.log;
            console.log = jest.fn((...args) => {
                capturedOutput += args.join(' ') + '\n';
            });
            try {
                (0, unified_layout_engine_1.renderMenuWithLayout)(skinDefinition, layout, { skinId: 'test', level: 'test' });
                // Should still render with procedural numbering
                expect(capturedOutput).toContain('1. First Item');
                // Should show truncation indicator if needed
                if (layout.needsTruncation) {
                    expect(capturedOutput).toContain('... more options available');
                }
            }
            finally {
                console.log = originalConsoleLog;
            }
        });
        test('should render theme correctly', () => {
            const skinDefinition = {
                title: 'Test Menu',
                items: [
                    {
                        id: 'item1',
                        label: 'Test Item',
                        type: 'command',
                        command: 'test'
                    }
                ],
                theme: {
                    primaryColor: 'red',
                    accentColor: 'yellow',
                    separatorChar: '═',
                    useIcons: true
                }
            };
            const constraints = createTestConstraints();
            const layout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, constraints);
            let capturedOutput = '';
            const originalConsoleLog = console.log;
            console.log = jest.fn((...args) => {
                capturedOutput += args.join(' ') + '\n';
            });
            try {
                (0, unified_layout_engine_1.renderMenuWithLayout)(skinDefinition, layout, { skinId: 'test', level: 'test' });
                // Should render title and separator
                expect(capturedOutput).toContain('Test Menu');
                expect(capturedOutput).toContain('═');
            }
            finally {
                console.log = originalConsoleLog;
            }
        });
    });
    describe('renderSkinMenu', () => {
        test('should render skin menu with constraints', () => {
            const skinDefinition = createTestSkinMenuDefinition();
            const skinContext = { skinId: 'test', level: 'test' };
            const constraints = createTestConstraints();
            let capturedOutput = '';
            const originalConsoleLog = console.log;
            console.log = jest.fn((...args) => {
                capturedOutput += args.join(' ') + '\n';
            });
            try {
                (0, unified_layout_engine_1.renderSkinMenu)(skinDefinition, skinContext, constraints);
                // Should render with procedural numbering
                expect(capturedOutput).toContain('1. First Item');
                expect(capturedOutput).toContain('2. Second Item');
                expect(capturedOutput).toContain('3. Third Item');
            }
            finally {
                console.log = originalConsoleLog;
            }
        });
        test('should handle missing theme gracefully', () => {
            const skinDefinition = {
                title: 'Test Menu',
                items: [
                    {
                        id: 'item1',
                        label: 'Test Item',
                        type: 'command',
                        command: 'test'
                    }
                ]
                // No theme provided
            };
            const skinContext = { skinId: 'test', level: 'test' };
            const constraints = createTestConstraints();
            let capturedOutput = '';
            const originalConsoleLog = console.log;
            console.log = jest.fn((...args) => {
                capturedOutput += args.join(' ') + '\n';
            });
            try {
                (0, unified_layout_engine_1.renderSkinMenu)(skinDefinition, skinContext, constraints);
                // Should still render with default theme
                expect(capturedOutput).toContain('Test Menu');
                expect(capturedOutput).toContain('1. Test Item');
            }
            finally {
                console.log = originalConsoleLog;
            }
        });
    });
});
//# sourceMappingURL=unified-layout-engine.test.js.map