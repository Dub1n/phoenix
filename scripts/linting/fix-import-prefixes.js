#!/usr/bin/env node
/**
 * Fix Incorrect Import Prefixes
 * 
 * Removes underscore prefixes from import statements that were incorrectly added
 * by the unused variable script.
 * 
 * Usage: node fix-import-prefixes.js <directory>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Fix underscore-prefixed imports in a file
function fixImportPrefixes(filePath) {
  console.log(`\nFixing import prefixes in ${filePath}:`);
  
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const originalContent = fileContent;
  let fixCount = 0;
  
  // Pattern to match underscore-prefixed imports
  const importPatterns = [
    // Named imports: import { _Something } from 'module'
    {
      pattern: /import\s*\{\s*([^}]*)\s*\}\s*from\s*['"][^'"]*['"]/g,
      fix: (match) => {
        const fixed = match.replace(/(\s|,|{)_([A-Z][A-Za-z]*)/g, '$1$2');
        if (fixed !== match) {
          fixCount++;
          console.log(`    Fixed: ${match.trim()} -> ${fixed.trim()}`);
        }
        return fixed;
      }
    },
    // Default imports: import _Something from 'module'
    {
      pattern: /import\s+_([A-Z][A-Za-z]*)\s+from\s+['"][^'"]*['"]/g,
      fix: (match) => {
        const fixed = match.replace(/import\s+_([A-Z][A-Za-z]*)\s+/, 'import $1 ');
        fixCount++;
        console.log(`    Fixed: ${match.trim()} -> ${fixed.trim()}`);
        return fixed;
      }
    }
  ];
  
  // Apply all patterns
  importPatterns.forEach(({ pattern, fix }) => {
    fileContent = fileContent.replace(pattern, fix);
  });
  
  // Write back only if changes were made
  if (fileContent !== originalContent) {
    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`    ✅ Fixed ${fixCount} import prefixes`);
  } else {
    console.log(`    ✨ No underscore-prefixed imports found`);
  }
  
  return fixCount;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || 'src/interfaces';
  
  console.log(`🔧 Fixing underscore-prefixed imports in ${directory}...\n`);
  
  let totalFixed = 0;
  
  // Get all TypeScript files in the directory
  const files = execSync(`find ${directory} -name "*.ts"`, { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.trim().length > 0);
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      totalFixed += fixImportPrefixes(file);
    }
  });
  
  console.log(`\n🎉 Total import prefixes fixed: ${totalFixed}`);
  
  // Verify TypeScript compilation
  console.log('\n🔍 Verifying TypeScript compilation...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful!');
  } catch (error) {
    console.log('❌ TypeScript compilation still has errors:');
    console.log(error.stdout.toString());
  }
}

main();