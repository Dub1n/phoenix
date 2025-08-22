# Haruspex Debugging Test Execution Script
# Purpose: Automate setup and execution of debugging test scenarios

param(
    [Parameter(Mandatory=$false)]
    [string]$TestWorkspace = "C:\temp\haruspex-test-workspace",

    [Parameter(Mandatory=$false)]
    [switch]$SetupOnly
)

# Step 1: Environment validation
Write-Host "Step 1: Environment Validation..." -ForegroundColor Blue

$HaruspexRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Write-Host "Haruspex root: $HaruspexRoot" -ForegroundColor Gray

# Check if we're in the right directory
if (-not (Test-Path "$HaruspexRoot\package.json")) {
    Write-Host "Not in Haruspex project root. Current: $PWD" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "Node.js not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Node.js not found" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "npm: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "npm not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "npm not found" -ForegroundColor Red
    exit 1
}

# Step 2: Create test workspace
Write-Host "Step 2: Creating Test Workspace..." -ForegroundColor Blue

if (-not (Test-Path $TestWorkspace)) {
    Write-Host "Creating test workspace at: $TestWorkspace" -ForegroundColor Gray
    
    New-Item -ItemType Directory -Path $TestWorkspace -Force | Out-Null
    
    Set-Location $TestWorkspace
    
    # Create sample files
    Write-Host "Creating sample files..." -ForegroundColor Gray
    
    # Create README.md
    $readmeLines = @(
        "# Test Documentation",
        "This is a test workspace for Haruspex debugging.",
        "",
        "## Structure",
        "* README.md (this file)",
        "* test.ts - TypeScript test file",
        "* package.json - Project configuration",
        "* docs/ - Documentation directory",
        "* src/ - Source code directory"
    )
    $readmeLines | Out-File -Path "README.md" -Encoding UTF8
    
    # Create test.ts
    "export const test = 'hello world';" | Out-File -Path "test.ts" -Encoding UTF8
    
    # Create package.json
    $packageLines = @(
        "{",
        '  "name": "haruspex-test-workspace",',
        '  "version": "1.0.0",',
        '  "description": "Test workspace for Haruspex debugging",',
        '  "main": "index.js",',
        '  "scripts": {',
        '    "test": "echo \"Error: no test specified\" && exit 1"',
        '  },',
        '  "keywords": ["haruspex", "test", "debugging"],',
        '  "author": "Test User",',
        '  "license": "MIT"',
        "}"
    )
    $packageLines | Out-File -Path "package.json" -Encoding UTF8

    # Create subdirectories
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
    New-Item -ItemType Directory -Path "src" -Force | Out-Null
    
    # Create architecture.md
    $archLines = @(
        "# Architecture Documentation",
        "This document describes the system architecture.",
        "",
        "## Components",
        "* Core engine",
        "* Documentation providers",
        "* WebView components",
        "",
        "## Data Flow",
        "```mermaid",
        "graph TD",
        "    A[User] --> B[VSCode Extension]",
        "    B --> C[Haruspex Core]",
        "    C --> D[Debug System]",
        "```"
    )
    $archLines | Out-File -Path "docs\architecture.md" -Encoding UTF8

    # Create api.md
    $apiLines = @(
        "# API Reference",
        "This document provides API reference information.",
        "",
        "## Classes",
        "### HaruspexCoreEngine",
        "Main engine class for processing.",
        "",
        "### DocumentationProvider",
        "Provides documentation tree functionality."
    )
    $apiLines | Out-File -Path "docs\api.md" -Encoding UTF8

    # Create index.ts
    "console.log('Haruspex test workspace');" | Out-File -Path "src\index.ts" -Encoding UTF8
    
    Write-Host "Test workspace created successfully" -ForegroundColor Green
} else {
    Write-Host "Test workspace already exists" -ForegroundColor Green
}

# Step 3: Display CLI binary location
Write-Host "Step 3: Debugging CLI Information..." -ForegroundColor Blue
$cliBinary = "$HaruspexRoot\dist\src\debugging\cli-bin.js"
if (Test-Path $cliBinary) {
    Write-Host "CLI binary found: $cliBinary" -ForegroundColor Green
    Write-Host "Usage: node `"$cliBinary`" [command]" -ForegroundColor Gray
    Write-Host "Available commands: connect, status, health, interactive, watch" -ForegroundColor Gray
} else {
    Write-Host "CLI binary not found. Build may have failed." -ForegroundColor Red
}

# Exit if setup-only requested
if ($SetupOnly) {
    Write-Host "Setup complete! Ready for manual testing." -ForegroundColor Cyan
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open VSCode: code '$TestWorkspace'" -ForegroundColor Gray
    Write-Host "2. Verify Haruspex extension is active" -ForegroundColor Gray
    Write-Host "3. Test CLI: node '$cliBinary' connect" -ForegroundColor Gray
    exit 0
}

# Step 4: Launch VSCode with test workspace
Write-Host "Step 4: Launching VSCode with test workspace..." -ForegroundColor Blue
Write-Host "Opening VSCode with test workspace..." -ForegroundColor Gray

try {
    # Use full path to VSCode
    $vscodePath = "C:\Users\gabri\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd"
    
    # Check if extension is already installed
    Write-Host "Checking if Haruspex extension is installed..." -ForegroundColor Gray
    $extensionList = & $vscodePath --list-extensions 2>$null
    
    if ($extensionList -match "haruspex") {
        Write-Host "Haruspex extension already installed" -ForegroundColor Green
    } else {
        Write-Host "Haruspex extension not found. Extension needs to be packaged as VSIX first." -ForegroundColor Yellow
        Write-Host "For development testing, you can:" -ForegroundColor Gray
        Write-Host "1. Press F5 in VSCode with this project open (Extension Development Host)" -ForegroundColor Gray
        Write-Host "2. OR package the extension: npx vsce package" -ForegroundColor Gray
    }
    
    # Open the test workspace
    Write-Host "Opening test workspace in VSCode..." -ForegroundColor Gray
    & $vscodePath $TestWorkspace
    
    Write-Host "VSCode launched successfully with test workspace" -ForegroundColor Green
} catch {
    Write-Host "Failed to launch VSCode: $_" -ForegroundColor Red
    Write-Host "Please open VSCode manually and open: $TestWorkspace" -ForegroundColor Yellow
    Write-Host "For extension development, press F5 in VSCode with the Haruspex project open" -ForegroundColor Yellow
}

# Step 5: Display final instructions
Write-Host "Final Instructions:" -ForegroundColor Cyan
Write-Host "1. VSCode should now be open with the test workspace" -ForegroundColor Gray
Write-Host "2. Verify the Haruspex extension is active in the Extensions panel" -ForegroundColor Gray
Write-Host "3. Test the CLI: node '$cliBinary' connect" -ForegroundColor Gray
Write-Host "4. Use Ctrl+Shift+P and search for 'Haruspex' commands" -ForegroundColor Gray

Write-Host "Setup complete! Happy debugging!" -ForegroundColor Green
