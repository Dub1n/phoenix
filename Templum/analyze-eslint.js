const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running ESLint and analyzing results...');

try {
  // Run ESLint and capture JSON output
  const eslintOutput = execSync('npx eslint src/ --format=json', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  // Parse the JSON output
  const results = JSON.parse(eslintOutput);
  
  // Categories for sorting
  const categories = {
    'unused-vars': [],
    'no-console': [],
    'no-explicit-any': [],
    'no-non-null-assertion': [],
    'parsing-errors': [],
    'other': []
  };
  
  // Process each file's results
  results.forEach(fileResult => {
    const fileName = fileResult.filePath.replace(/.*[\\\/]/, ''); // Get just filename
    const relativePath = fileResult.filePath.replace(process.cwd().replace(/\\/g, '/') + '/', '');
    
    fileResult.messages.forEach(message => {
      const entry = {
        file: relativePath,
        fileName: fileName,
        line: message.line,
        column: message.column,
        message: message.message,
        ruleId: message.ruleId,
        severity: message.severity === 2 ? 'error' : 'warning'
      };
      
      // Categorize based on rule
      if (message.ruleId && message.ruleId.includes('unused-vars')) {
        categories['unused-vars'].push(entry);
      } else if (message.ruleId === 'no-console') {
        categories['no-console'].push(entry);
      } else if (message.ruleId === '@typescript-eslint/no-explicit-any') {
        categories['no-explicit-any'].push(entry);
      } else if (message.ruleId === '@typescript-eslint/no-non-null-assertion') {
        categories['no-non-null-assertion'].push(entry);
      } else if (!message.ruleId || message.message.includes('Parsing error')) {
        categories['parsing-errors'].push(entry);
      } else {
        categories['other'].push(entry);
      }
    });
  });
  
  // Generate report
  console.log('\n=== ESLint Error Analysis ===\n');
  
  Object.keys(categories).forEach(category => {
    const issues = categories[category];
    if (issues.length > 0) {
      console.log(`\n${category.toUpperCase()} (${issues.length} issues):`);
      console.log('='.repeat(50));
      
      issues.forEach(issue => {
        console.log(`${issue.file}:`);
        console.log(`  Line ${issue.line}: ${issue.message}`);
        if (category === 'unused-vars') {
          // Extract variable name from message if possible
          const match = issue.message.match(/'([^']+)' is defined but never used/);
          if (match) {
            console.log(`    Variable: ${match[1]}`);
          }
        }
        console.log('');
      });
    }
  });
  
  // Save detailed results to file
  fs.writeFileSync('eslint-analysis.json', JSON.stringify({ categories, summary: {
    totalIssues: results.reduce((sum, file) => sum + file.messages.length, 0),
    categoryBreakdown: Object.keys(categories).map(cat => ({
      category: cat,
      count: categories[cat].length
    }))
  }}, null, 2));
  
  console.log('\nDetailed analysis saved to eslint-analysis.json');
  
} catch (error) {
  console.error('Error running ESLint analysis:', error.message);
  
  // If ESLint fails, try to run it and capture the output anyway
  try {
    const errorOutput = execSync('npx eslint src/', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('ESLint output:', errorOutput);
  } catch (eslintError) {
    console.log('ESLint stderr:', eslintError.stderr);
  }
}