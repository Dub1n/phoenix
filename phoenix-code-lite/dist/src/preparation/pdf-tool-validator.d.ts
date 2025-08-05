/**
 * PDF Tool Validator
 *
 * Validates PDF processing tools availability and functionality
 * for QMS regulatory document processing
 */
export interface PDFProcessingResult {
    success: boolean;
    text?: string;
    metadata?: any;
    error?: string;
}
export declare class PDFToolValidator {
    /**
     * Check if pdftotext is available
     */
    checkPdftotext(): Promise<boolean>;
    /**
     * Check if pdfinfo is available
     */
    checkPdfinfo(): Promise<boolean>;
    /**
     * Test PDF processing capability
     */
    testProcessing(pdfPath: string): Promise<PDFProcessingResult>;
    /**
     * Process PDF using system tools (pdftotext, pdfinfo)
     */
    private processWithSystemTools;
    /**
     * Process PDF using Node.js libraries
     */
    private processWithNodeJS;
    /**
     * Parse pdfinfo output into structured metadata
     */
    private parsePdfInfo;
}
//# sourceMappingURL=pdf-tool-validator.d.ts.map