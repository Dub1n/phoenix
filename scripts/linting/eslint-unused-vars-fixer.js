#!/usr/bin/env node

/**
 * ESLint Unused Variables Fixer
 * 
 * Automatically fixes @typescript-eslint/no-unused-vars errors by adding underscore prefixes
 * to unused variables, parameters, and imports.
 * 
 * To get the ESLINT_OUTPUT_FILE, save the output from `cd "<Project>" && npx eslint --format=compact | findstr "unused"
 * 
 * Usage:
 *   node eslint-unused-vars-fixer.js           # Apply fixes
 *   node eslint-unused-vars-fixer.js --dry-run # Preview changes without applying
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('--dryrun');

// ES module equivalent of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input file containing ESLint output
const ESLINT_OUTPUT_FILE = 'C:\\Users\\gabri\\Documents\\Infotopology\\VDL_Vault\\scripts\\linting\\command_output.md';

/**
 * Parse ESLint error line to extract file path, line number, column number, and variable name
 * @param {string} line - ESLint error line
 * @returns {Object|null} Parsed error info or null if not a valid error line
 */
function parseEslintError(line) {
    // Pattern: C:\path\to\file.ts: line 97, col 14, Error - 'error' is defined but never used.
    const match = line.match(/^.*?(.+\.ts): line (\d+), col (\d+), Error - '([^']+)' is defined but never used\./);
    
    if (!match) {
        return null;
    }
    
    return {
        filePath: match[1],
        lineNumber: parseInt(match[2], 10),
        columnNumber: parseInt(match[3], 10),
        variableName: match[4]
    };
}

/**
 * Fix unused variable by adding underscore prefix or removing imports
 * @param {string} line - The line of code containing the unused variable
 * @param {number} columnNumber - Column position of the variable (1-based)
 * @param {string} variableName - Name of the unused variable
 * @returns {string} Fixed line of code
 */
function fixUnusedVariable(line, columnNumber, variableName) {
    // Convert to 0-based indexing
    const colIndex = columnNumber - 1;
    
    // Check if this is an import statement - remove the unused import entirely
    // This includes both single-line imports and multi-line import components
    if (line.trim().startsWith('import') || isPartOfImportBlock(line, variableName)) {
        return removeUnusedImport(line, variableName);
    }
    
    // For all other cases, add underscore prefix directly
    // Find the variable name at or near the specified column
    const beforeCol = line.substring(0, colIndex);
    const afterCol = line.substring(colIndex);
    
    // Look for the variable name starting at the column position
    const varRegex = new RegExp(`^${variableName}\\b`);
    if (varRegex.test(afterCol)) {
        // Variable starts exactly at the column - replace it
        return beforeCol + '_' + afterCol;
    }
    
    // Look backwards and forwards for the variable name
    const searchRadius = 20; // Search within 20 characters
    const searchStart = Math.max(0, colIndex - searchRadius);
    const searchEnd = Math.min(line.length, colIndex + searchRadius);
    const searchArea = line.substring(searchStart, searchEnd);
    
    // Find the variable in the search area and replace with underscore prefix
    const varInAreaRegex = new RegExp(`\\b${variableName}\\b`);
    if (varInAreaRegex.test(searchArea)) {
        return line.replace(varInAreaRegex, `_${variableName}`);
    }
    
    // If we can't find it precisely, try a global replace (less safe but fallback)
    console.warn(`Could not locate '${variableName}' at column ${columnNumber} in: ${line.trim()}`);
    return line.replace(new RegExp(`\\b${variableName}\\b`, 'g'), `_${variableName}`);
}

/**
 * Check if a line is part of a multi-line import block
 * @param {string} line - The line to check
 * @param {string} variableName - The variable name we're looking for
 * @returns {boolean} True if this line is part of an import block
 */
function isPartOfImportBlock(line, variableName) {
    const trimmed = line.trim();
    
    // Check if line contains the variable name and looks like part of an import
    // Patterns: "  VariableName," or "  VariableName" (with optional comma)
    if (trimmed === variableName || trimmed === variableName + ',') {
        return true;
    }
    
    // Check if line contains variable name and other import-like patterns
    if (line.includes(variableName)) {
        // Look for patterns that suggest this is part of an import:
        // - Contains only identifiers, commas, and whitespace
        // - No assignment operators, function calls, etc.
        const hasOnlyImportChars = /^[\s\w,]*$/.test(line);
        if (hasOnlyImportChars) {
            return true;
        }
    }
    
    return false;
}

/**
 * Remove unused import from import statement (handles multi-line imports)
 * @param {string} line - The import line
 * @param {string} variableName - The unused import name
 * @returns {string} Fixed import line or empty string if entire import should be removed
 */
function removeUnusedImport(line, variableName) {
    // Handle different import patterns
    
    // Pattern 1: Single line import - import { VarName } from 'module'
    const singleImportMatch = line.match(/^(\s*)import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]+['"];?\s*$/);
    if (singleImportMatch) {
        const imports = singleImportMatch[2].split(',').map(imp => imp.trim()).filter(imp => imp.length > 0);
        if (imports.length === 1 && imports[0] === variableName) {
            // This is the only import, remove the entire line
            return '';
        }
        
        // Multiple imports, remove just this one
        const filteredImports = imports.filter(imp => imp !== variableName);
        if (filteredImports.length === 0) {
            return '';
        }
        
        const indent = singleImportMatch[1];
        const moduleMatch = line.match(/from\s*['"]([^'"]+)['"];?\s*$/);
        const moduleName = moduleMatch ? moduleMatch[1] : '';
        return `${indent}import { ${filteredImports.join(', ')} } from '${moduleName}';`;
    }
    
    // Pattern 2: Multi-line import - individual line within import block
    // Handle cases like:  VarName, or   VarName (without trailing comma means it's likely last item)
    if (line.includes(variableName)) {
        const trimmed = line.trim();
        
        // If this line contains only the variable name (with optional comma and whitespace)
        if (trimmed === variableName || trimmed === variableName + ',') {
            // Remove the entire line
            return '';
        }
        
        // If the line contains the variable among others, remove just this variable
        let result = line.replace(new RegExp(`\\b${variableName}\\s*,?\\s*`, 'g'), '');
        
        // Clean up formatting issues
        result = result.replace(/,\s*,/g, ',');
        result = result.replace(/,\s*}/g, ' }');
        result = result.replace(/{\s*,/g, '{ ');
        
        // If result is now just whitespace or empty, remove the line
        if (result.trim() === '' || result.trim() === ',') {
            return '';
        }
        
        return result;
    }
    
    // Pattern 3: Default/namespace imports - import VarName from 'module' or import * as VarName
    const defaultImportMatch = line.match(/^(\s*)import\s+(\w+)\s+from\s*['"][^'"]+['"];?\s*$/);
    if (defaultImportMatch && defaultImportMatch[2] === variableName) {
        return '';
    }
    
    const namespaceImportMatch = line.match(/^(\s*)import\s*\*\s*as\s+(\w+)\s+from\s*['"][^'"]+['"];?\s*$/);
    if (namespaceImportMatch && namespaceImportMatch[2] === variableName) {
        return '';
    }
    
    // If we can't parse it, return original line with a warning
    console.warn(`Could not remove '${variableName}' from import: ${line.trim()}`);
    return line;
}

/**
 * Process all errors for a single file
 * @param {string} filePath - Path to the TypeScript file
 * @param {Array} errors - Array of error objects for this file
 */
function fixErrorsInFile(filePath, errors) {
    try {
        if (isDryRun) {
            console.log(`\n📁 ${filePath}`);
            console.log('-'.repeat(filePath.length + 3));
        } else {
            console.log(`Processing ${filePath} (${errors.length} errors)`);
        }
        
        // Read the file
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Sort errors by line number in descending order (for actual fixes)
        // For dry-run, keep original order for better readability
        if (!isDryRun) {
            errors.sort((a, b) => b.lineNumber - a.lineNumber);
        }
        
        let changesCount = 0;
        
        // Apply fixes or preview changes
        for (const error of errors) {
            const lineIndex = error.lineNumber - 1; // Convert to 0-based indexing
            
            if (lineIndex >= 0 && lineIndex < lines.length) {
                const originalLine = lines[lineIndex];
                const fixedLine = fixUnusedVariable(originalLine, error.columnNumber, error.variableName);
                
                if (fixedLine !== originalLine) {
                    if (isDryRun) {
                        console.log(`\n  Line ${error.lineNumber}: Fix '${error.variableName}'`);
                        console.log(`    - ${originalLine.trim()}`);
                        if (fixedLine === '') {
                            console.log(`    + [REMOVE ENTIRE LINE]`);
                        } else {
                            console.log(`    + ${fixedLine.trim()}`);
                        }
                    } else {
                        lines[lineIndex] = fixedLine;
                        if (fixedLine === '') {
                            console.log(`  Removed import '${error.variableName}' at line ${error.lineNumber}`);
                        } else {
                            console.log(`  Fixed '${error.variableName}' at line ${error.lineNumber}`);
                        }
                    }
                    changesCount++;
                } else {
                    if (isDryRun) {
                        console.log(`\n  Line ${error.lineNumber}: ⚠️  Could not determine fix for '${error.variableName}'`);
                        console.log(`    ${originalLine.trim()}`);
                    } else {
                        console.warn(`  Could not fix '${error.variableName}' at line ${error.lineNumber}`);
                    }
                }
            } else {
                console.error(`  Invalid line number ${error.lineNumber} for file ${filePath}`);
            }
        }
        
        // Write the fixed content back to the file (only if not dry-run)
        if (!isDryRun && changesCount > 0) {
            const fixedContent = lines.join('\n');
            fs.writeFileSync(filePath, fixedContent, 'utf8');
        }
        
        return changesCount;
        
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
        return 0;
    }
}

/**
 * Main function to process the ESLint output and fix all unused variable errors
 */
function main() {
    try {
        if (isDryRun) {
            console.log('='.repeat(80));
            console.log('ESLint Unused Variables Fixer - DRY RUN');
            console.log('='.repeat(80));
        } else {
            console.log('ESLint Unused Variables Fixer');
            console.log('==============================');
        }
        
        console.log('Reading ESLint output file...');
        const eslintOutput = fs.readFileSync(ESLINT_OUTPUT_FILE, 'utf8');
        const lines = eslintOutput.split('\n');
        
        // Parse all errors
        const errors = [];
        for (const line of lines) {
            const error = parseEslintError(line);
            if (error) {
                errors.push(error);
            }
        }
        
        if (errors.length === 0) {
            console.log('No unused variable errors found in ESLint output.');
            return;
        }
        
        if (isDryRun) {
            console.log(`\nFound ${errors.length} unused variable errors to preview:\n`);
        } else {
            console.log(`Found ${errors.length} unused variable errors to fix.`);
        }
        
        // Group errors by file path
        const errorsByFile = {};
        for (const error of errors) {
            if (!errorsByFile[error.filePath]) {
                errorsByFile[error.filePath] = [];
            }
            errorsByFile[error.filePath].push(error);
        }
        
        // Process each file
        let totalChanges = 0;
        for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
            totalChanges += fixErrorsInFile(filePath, fileErrors);
        }
        
        if (isDryRun) {
            console.log('\n' + '='.repeat(80));
            console.log(`📊 SUMMARY: ${totalChanges} changes would be made across ${Object.keys(errorsByFile).length} files`);
            console.log('='.repeat(80));
            console.log('\nTo apply these changes, run without --dry-run:');
            console.log('  node eslint-unused-vars-fixer.js');
        } else {
            console.log('\nAll unused variable errors have been processed!');
            console.log(`Made ${totalChanges} changes across ${Object.keys(errorsByFile).length} files.`);
            console.log('Run ESLint again to verify the fixes.');
        }
        
    } catch (error) {
        console.error('Error reading ESLint output file:', error.message);
        process.exit(1);
    }
}

// Run the script
main();

export {
    parseEslintError,
    fixUnusedVariable,
    removeUnusedImport,
    fixErrorsInFile
};
