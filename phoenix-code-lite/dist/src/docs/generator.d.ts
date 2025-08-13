/**---
 * title: [Docs Generator - API & Architecture]
 * tags: [Docs, Generator]
 * provides: [Documentation Generator]
 * requires: []
 * description: [Generates documentation artifacts like API references and architecture diagrams.]
 * ---*/
export declare class DocumentationGenerator {
    generateAPIDocs(outputPath: string): Promise<void>;
    generateUserGuide(outputPath: string): Promise<void>;
    private extractAPIDocumentation;
    private extractClasses;
    private extractInterfaces;
    private extractMethods;
    private generateUserGuideContent;
    private generateQuickStartContent;
}
//# sourceMappingURL=generator.d.ts.map