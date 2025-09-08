#!/usr/bin/env node
/**
 * Automated Unused Variable Fixer
 * Parses ESLint output and renames unused variables by adding underscore prefix
 * 
 * Usage:
 *   node fix-unused-vars.js [directory]
 * 
 * Arguments:
 *   directory: backend, core, interfaces, tests, all (default: backend)
 * 
 * Examples:
 *   node fix-unused-vars.js core      # Fix core components
 *   node fix-unused-vars.js           # Fix backend (default)
 *   node fix-unused-vars.js all       # Fix remaining components
 * 
 * Created for TASK-ESLINT-001 - Reusable for all ESLint unused variable tasks
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Run ESLint to get unused variable errors
function getUnusedVariables(filePath) {
  try {
    const eslintOutput = execSync(`npx eslint "${filePath}" --format json`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const results = JSON.parse(eslintOutput);
    const unusedVars = [];
    
    results.forEach(result => {
      result.messages.forEach(message => {
        if (message.ruleId === '@typescript-eslint/no-unused-vars') {
          const match = message.message.match(/'([^']+)' is (defined but never used|assigned a value but never used)/);
          if (match) {
            unusedVars.push({
              file: result.filePath,
              line: message.line,
              column: message.column,
              variable: match[1],
              type: match[2].includes('assigned') ? 'assignment' : 'definition'
            });
          }
        }
      });
    });
    
    return unusedVars;
  } catch (error) {
    // ESLint returns non-zero exit code when errors found, but we still get output
    if (error.stdout) {
      const results = JSON.parse(error.stdout);
      const unusedVars = [];
      
      results.forEach(result => {
        result.messages.forEach(message => {
          if (message.ruleId === '@typescript-eslint/no-unused-vars') {
            const match = message.message.match(/'([^']+)' is (defined but never used|assigned a value but never used)/);
            if (match) {
              unusedVars.push({
                file: result.filePath,
                line: message.line,
                column: message.column,
                variable: match[1],
                type: match[2].includes('assigned') ? 'assignment' : 'definition'
              });
            }
          }
        });
      });
      
      return unusedVars;
    }
    console.error('Error running ESLint:', error.message);
    return [];
  }
}

// Check if an unused variable is part of an import statement
function isImportStatement(line, variable) {
  const importRegex = /^\s*import\s+/;
  return importRegex.test(line) && line.includes(variable);
}

// Remove unused import from import statement
function removeUnusedImport(line, variable) {
  // Handle different import patterns
  
  // Pattern 1: import { var1, var2, var3 } from 'module'
  const namedImportRegex = new RegExp(`\\{([^}]*)\\}`, 'g');
  let newLine = line.replace(namedImportRegex, (match, imports) => {
    const importList = imports.split(',')
      .map(imp => imp.trim())
      .filter(imp => {
        const cleanImp = imp.replace(/\s+as\s+\w+/, ''); // Remove 'as alias'
        return cleanImp !== variable && !cleanImp.startsWith(`_${variable}`);
      })
      .join(', ');
    
    // If no imports left, mark line for removal
    if (!importList.trim()) {
      return 'REMOVE_LINE';
    }
    
    return `{${importList}}`;
  });
  
  // Pattern 2: import variable from 'module' (default import)
  const defaultImportRegex = new RegExp(`import\\s+${variable}\\s+from`, 'g');
  if (defaultImportRegex.test(line)) {
    return 'REMOVE_LINE';
  }
  
  // Pattern 3: import * as variable from 'module'
  const namespaceImportRegex = new RegExp(`import\\s+\\*\\s+as\\s+${variable}\\s+from`, 'g');
  if (namespaceImportRegex.test(line)) {
    return 'REMOVE_LINE';
  }
  
  return newLine === 'REMOVE_LINE' ? null : newLine;
}

// Fix unused variables in a file
function fixUnusedVariables(filePath, unusedVars) {
  console.log(`\nFixing ${unusedVars.length} unused variables in ${filePath}:`);
  
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  
  // Sort by line number (descending) to avoid line number shifts
  unusedVars.sort((a, b) => b.line - a.line);
  
  const linesToRemove = new Set();
  
  unusedVars.forEach(({ variable, line, type }) => {
    if (variable.startsWith('_')) {
      console.log(`  - ${variable} (line ${line}): Already prefixed with underscore, skipping`);
      return;
    }
    
    // Get the line (0-indexed)
    const lineIndex = line - 1;
    const originalLine = lines[lineIndex];
    
    // Check if this is an import statement
    if (isImportStatement(originalLine, variable)) {
      console.log(`  - ${variable} (line ${line}): unused import -> REMOVE`);
      
      const newLine = removeUnusedImport(originalLine, variable);
      if (newLine === null) {
        // Remove entire line
        linesToRemove.add(lineIndex);
        console.log(`    Removed entire import line`);
      } else {
        lines[lineIndex] = newLine;
        console.log(`    Removed from import statement`);
      }
      return;
    }
    
    // Handle non-import unused variables with underscore prefix
    console.log(`  - ${variable} (line ${line}): ${type} -> _${variable}`);
    
    // Different regex patterns for different contexts
    const patterns = [
      // Function parameters: (param1, param2) => { or function(param1, param2) {
      {
        pattern: new RegExp(`\\b${variable}\\b(?=\\s*[,)])`, 'g'),
        replacement: `_${variable}`,
        description: 'function parameter'
      },
      // Variable declarations: const variable = or let variable =
      {
        pattern: new RegExp(`\\b(const|let|var)\\s+(${variable})\\b`, 'g'),
        replacement: `$1 _${variable}`,
        description: 'variable declaration'
      },
      // Destructuring: [variable, other] = or {variable, other} =
      {
        pattern: new RegExp(`([\\[{,\\s])(${variable})([\\]},\\s])`, 'g'),
        replacement: `$1_${variable}$3`,
        description: 'destructuring assignment'
      },
      // For loop variable: for (const variable of
      {
        pattern: new RegExp(`(for\\s*\\(\\s*const\\s+)(${variable})\\b`, 'g'),
        replacement: `$1_${variable}`,
        description: 'for loop variable'
      },
      // Catch block: catch (variable) {
      {
        pattern: new RegExp(`(catch\\s*\\(\\s*)(${variable})(\\s*\\))`, 'g'),
        replacement: `$1_${variable}$3`,
        description: 'catch block parameter'
      }
    ];
    
    let lineModified = false;
    patterns.forEach(({ pattern, replacement, description }) => {
      if (pattern.test(originalLine)) {
        lines[lineIndex] = originalLine.replace(pattern, replacement);
        console.log(`    Applied ${description} pattern`);
        lineModified = true;
      }
    });
    
    if (!lineModified) {
      console.log(`    ⚠️  No pattern matched for: ${originalLine.trim()}`);
    }
  });
  
  // Remove lines marked for deletion (in reverse order to maintain indices)
  Array.from(linesToRemove).sort((a, b) => b - a).forEach(lineIndex => {
    lines.splice(lineIndex, 1);
  });
  
  // Write the modified content back
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Fixed ${filePath}`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || 'backend';
  
  // File lists for different directories
  const fileLists = {
    backend: [
      'src/backend/backend-service-router.ts',
      'src/backend/dynamic-command-router.ts',
      'src/backend/pcl-backend-integration.ts',
      'src/backend/service-discovery.ts',
      'src/backend/connection-factory.ts'
    ],
    core: [
      'src/core/templum-core.ts',
      'src/core/templum-config-manager.ts', 
      'src/core/universal-interface-manager.ts',
      'src/core/adapter-registry.ts',
      'src/core/templum-resource-manager.ts',
      'src/core/error-recovery.ts'
    ],
    interfaces: [
      'src/interfaces/cli-adapter.ts',
      'src/interfaces/cli-adapter-abstracted.ts',
      'src/interfaces/vscode-adapter.ts', 
      'src/interfaces/vscode-adapter-abstracted.ts',
      'src/interfaces/vscode-templum-webview.ts',
      'src/interfaces/terminal-ui-components.ts',
      'src/interfaces/templum-orchestrator-interface.ts',
      'src/interfaces/core-component-interfaces.ts',
      'src/interfaces/command-adapter-abstracted.ts',
      'src/interfaces/interface-adapter-registry.ts',
      'src/interfaces/interactive-menu-renderer.ts',
      'src/interfaces/universal-interaction-manager.ts'
    ],
    tests: [
      'src/tests/integration-validation-framework.ts',
      'src/tests/e2e/e2e-scenarios.ts',
      'src/tests/e2e/e2e-test-framework.ts',
      'src/tests/backend/generic-backend-integration.test.ts',
      'src/tests/backend/comprehensive-backend-validation.test.ts',
      'src/tests/backend/service-discovery.test.ts',
      'src/validation/production-readiness-validator.ts',
      'src/validation/performance-validation.ts',
      'src/validation/skin-validator.ts',
      'src/scripts/simple-phase6-validation.ts',
      'src/scripts/run-phase6-integration-validation.ts',
      'src/scripts/production-readiness-validation.ts'
    ],
    all: [
      'src/skin/skin-version-manager.ts',
      'src/skin/pcl-rendering-adapter.ts',
      'src/skin/universal-skin-engine-impl.ts',
      'src/skin/universal-skin-engine.ts',
      'src/rendering/universal-skin-renderer.ts',
      'src/rendering/universal-layout-engine.ts',
      'src/state/enhanced-state-synchronization.ts',
      'src/state/state-sync-foundation.ts',
      'src/session/session-context-foundation.ts',
      'src/session/templum-universal-session-manager.ts',
      'src/types/universal-skin-definition.ts',
      'src/types/universal-skin-engine-types.ts',
      'src/types/templum-types.ts'
    ]
  };
  
  const filesToProcess = fileLists[directory];
  if (!filesToProcess) {
    console.log(`❌ Unknown directory: ${directory}`);
    console.log(`Available options: ${Object.keys(fileLists).join(', ')}`);
    return;
  }
  
  console.log(`🔍 Scanning for unused variables in ${directory} files...\n`);
  
  let totalFixed = 0;
  
  filesToProcess.forEach(file => {
    const unusedVars = getUnusedVariables(file);
    if (unusedVars.length > 0) {
      fixUnusedVariables(file, unusedVars);
      totalFixed += unusedVars.length;
    } else {
      console.log(`✨ ${file}: No unused variables found`);
    }
  });
  
  console.log(`\n🎉 Total unused variables fixed: ${totalFixed}`);
  
  // Verify the fixes worked
  console.log('\n🔍 Verifying fixes...');
  filesToProcess.forEach(file => {
    const remainingVars = getUnusedVariables(file);
    if (remainingVars.length === 0) {
      console.log(`✅ ${file}: All unused variables fixed`);
    } else {
      console.log(`❌ ${file}: ${remainingVars.length} unused variables remaining:`);
      remainingVars.forEach(v => console.log(`   - ${v.variable} (line ${v.line})`));
    }
  });
}

main();