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

const fs = require('fs');
const { execSync } = require('child_process');

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

// Fix unused variables in a file
function fixUnusedVariables(filePath, unusedVars) {
  console.log(`\nFixing ${unusedVars.length} unused variables in ${filePath}:`);
  
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  
  // Sort by line number (descending) to avoid line number shifts
  unusedVars.sort((a, b) => b.line - a.line);
  
  unusedVars.forEach(({ variable, line, type }) => {
    if (variable.startsWith('_')) {
      console.log(`  - ${variable} (line ${line}): Already prefixed with underscore, skipping`);
      return;
    }
    
    console.log(`  - ${variable} (line ${line}): ${type} -> _${variable}`);
    
    // Get the line (0-indexed)
    const lineIndex = line - 1;
    const originalLine = lines[lineIndex];
    
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
      'src/core/enhanced-state-manager.ts',
      'src/core/resource-manager.ts'
    ],
    interfaces: [
      'src/interfaces/cli-adapter.ts',
      'src/interfaces/vscode-adapter.ts',
      'src/interfaces/terminal-ui-components.ts'
    ],
    tests: [
      'src/tests/**/*.ts',
      'src/validation/**/*.ts', 
      'src/scripts/**/*.ts'
    ],
    all: [
      'src/skin/**/*.ts',
      'src/types/**/*.ts',
      'src/rendering/**/*.ts',
      'src/session/**/*.ts',
      'src/state/**/*.ts'
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

if (require.main === module) {
  main();
}