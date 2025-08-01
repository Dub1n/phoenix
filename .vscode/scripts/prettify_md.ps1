#!/usr/bin/env pwsh
<#---
tags: [script, markdown, formatting, table, prettify, powershell]
provides: [markdown_table_formatting]
requires: [markdown-table-prettify]
---

# Markdown Table Prettifier

This script formats markdown tables in-place without creating temporary files.
It preserves Unicode characters and supports optional column padding.

## Usage

```powershell
# Basic usage
./prettify_md.ps1 filename.md

# With column padding (for more spacious tables)
./prettify_md.ps1 filename.md -ColumnPadding 1
```

## Dependencies

Requires Node.js and the markdown-table-prettify npm package:
```
npm install -g markdown-table-prettify
```

#>

param(
    [Parameter(Mandatory=$true)]
    [string]$FileName,
    
    [Parameter(Mandatory=$false)]
    [int]$ColumnPadding = 0
)

# Check if file exists
if (-not (Test-Path $FileName)) {
    Write-Error "File not found: $FileName"
    exit 1
}

# Create the Node.js script to prettify the file in place
$script = @"
const fs = require('fs');
const { CliPrettify } = require('markdown-table-prettify');

const file = '$FileName';
const options = { columnPadding: $ColumnPadding };

try {
    const content = fs.readFileSync(file, 'utf8');
    const prettified = CliPrettify.prettify(content, options);
    fs.writeFileSync(file, prettified);
    console.log('Successfully prettified tables in ' + file);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
"@

# Execute the Node.js script
try {
    $script | node
    Write-Host "Markdown tables in $FileName have been prettified!" -ForegroundColor Green
} catch {
    Write-Error "Failed to prettify markdown tables: $_"
    exit 1
} 