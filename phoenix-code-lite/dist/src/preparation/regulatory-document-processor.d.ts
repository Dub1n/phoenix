/**
 * Regulatory Document Processor
 *
 * Processes regulatory documents (EN 62304, AAMI TIR45) for QMS requirements
 */
export interface RegulatoryRequirement {
    id: string;
    text: string;
    section: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    standard: string;
    version: string;
}
export interface RegulatoryDocumentResult {
    success: boolean;
    requirements: RegulatoryRequirement[];
    error?: string;
}
export declare class RegulatoryDocumentProcessor {
    private pdfValidator;
    constructor();
    /**
     * Process regulatory document and extract requirements
     */
    processRegulatoryDocument(pdfPath: string): Promise<RegulatoryDocumentResult>;
    /**
     * Extract requirements from document text
     */
    private extractRequirements;
    /**
     * Extract EN 62304 requirements
     */
    private extractEN62304Requirements;
    /**
     * Extract AAMI TIR45 requirements
     */
    private extractAAMITIR45Requirements;
    /**
     * Extract generic requirements for unknown documents
     */
    private extractGenericRequirements;
    /**
     * Find section number from requirement ID
     */
    private findSection;
}
//# sourceMappingURL=regulatory-document-processor.d.ts.map