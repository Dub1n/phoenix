const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Searching for unused variables...');

// Function to run ESLint on a single file and extract unused variables
function analyzeFile(filePath) {
  try {
    const output = execSync(`npx eslint "${filePath}" --format=json --no-eslintrc --config="{ \\"extends\\": [\\"@typescript-eslint/recommended\\"], \\"rules\\": { \\"@typescript-eslint/no-unused-vars\\": \\"error\\" }, \\"parser\\": \\"@typescript-eslint/parser\\", \\"parserOptions\\": { \\"ecmaVersion\\": 2020, \\"sourceType\\": \\"module\\" } }"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const results = JSON.parse(output);
    const unusedVars = [];
    
    if (results.length > 0) {
      results[0].messages.forEach(message => {
        if (message.ruleId === '@typescript-eslint/no-unused-vars' || 
            message.message.includes('is defined but never used')) {
          const varMatch = message.message.match(/'([^']+)'/);
          const varName = varMatch ? varMatch[1] : 'unknown';
          unusedVars.push({
            variable: varName,
            line: message.line,
            column: message.column,
            message: message.message
          });
        }
      });
    }
    
    return unusedVars;
  } catch (error) {
    return [];
  }
}

// Get all TypeScript files in src directory
function getAllTsFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

try {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to analyze...`);
  
  const allUnusedVars = [];
  let processedCount = 0;
  
  for (const file of tsFiles) {
    process.stdout.write(`\rProcessing ${++processedCount}/${tsFiles.length}: ${path.basename(file)}`);
    
    const unusedVars = analyzeFile(file);
    if (unusedVars.length > 0) {
      const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
      allUnusedVars.push({
        file: relativePath,
        variables: unusedVars
      });
    }
  }
  
  console.log('\n\n=== UNUSED VARIABLES REPORT ===\n');
  
  if (allUnusedVars.length === 0) {
    console.log('No unused variables found!');
  } else {
    allUnusedVars.forEach(fileReport => {
      console.log(`${fileReport.file}:`);
      fileReport.variables.forEach(varInfo => {
        console.log(`  ${varInfo.variable} ${varInfo.line}`);
      });
      console.log('');
    });
    
    // Summary
    const totalUnused = allUnusedVars.reduce((sum, file) => sum + file.variables.length, 0);
    console.log(`\nTotal unused variables: ${totalUnused} across ${allUnusedVars.length} files`);
  }
  
  // Save to file
  fs.writeFileSync('unused-variables-report.json', JSON.stringify(allUnusedVars, null, 2));
  console.log('\nDetailed report saved to unused-variables-report.json');
  
} catch (error) {
  console.error('Error:', error.message);
}