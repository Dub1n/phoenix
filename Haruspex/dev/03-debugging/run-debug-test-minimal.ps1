# Haruspex Debugging Test Script
param(
    [string]$TestWorkspace = "C:\temp\haruspex-test-workspace",
    [switch]$SetupOnly
)

Write-Host "Step 1: Environment Validation..." -ForegroundColor Blue

$HaruspexRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Write-Host "Haruspex root: $HaruspexRoot" -ForegroundColor Gray

if (-not (Test-Path "$HaruspexRoot\package.json")) {
    Write-Host "Not in Haruspex project root. Current: $PWD" -ForegroundColor Red
    exit 1
}

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

Write-Host "Step 2: Creating Test Workspace..." -ForegroundColor Blue

if (-not (Test-Path $TestWorkspace)) {
    Write-Host "Creating test workspace at: $TestWorkspace" -ForegroundColor Gray
    
    New-Item -ItemType Directory -Path $TestWorkspace -Force | Out-Null
    Set-Location $TestWorkspace
    
    Write-Host "Creating sample files..." -ForegroundColor Gray
    
    # Create README.md
    $readmeContent = "# Test Documentation`nThis is a test workspace for Haruspex debugging.`n`n## Structure`n* README.md (this file)`n* test.ts - TypeScript test file`n* package.json - Project configuration`n* docs/ - Documentation directory`n* src/ - Source code directory"
    $readmeContent | Out-File -Path "README.md" -Encoding UTF8
    
    # Create test.ts
    "export const test = 'hello world';" | Out-File -Path "test.ts" -Encoding UTF8
    
    # Create package.json
    $packageContent = '{"name":"haruspex-test-workspace","version":"1.0.0","description":"Test workspace for Haruspex debugging","main":"index.js","scripts":{"test":"echo \"Error: no test specified\" && exit 1"},"keywords":["haruspex","test","debugging"],"author":"Test User","license":"MIT"}'
    $packageContent | Out-File -Path "package.json" -Encoding UTF8

    # Create subdirectories
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
    New-Item -ItemType Directory -Path "src" -Force | Out-Null
    
    # Create architecture.md
    $archContent = "# Architecture Documentation`nThis document describes the system architecture.`n`n## Components`n* Core engine`n* Documentation providers`n* WebView components"
    $archContent | Out-File -Path "docs\architecture.md" -Encoding UTF8

    # Create api.md
    $apiContent = "# API Reference`nThis document provides API reference information.`n`n## Classes`n### HaruspexCoreEngine`nMain engine class for processing.`n`n### DocumentationProvider`nProvides documentation tree functionality."
    $apiContent | Out-File -Path "docs\api.md" -Encoding UTF8

    # Create index.ts
    "console.log('Haruspex test workspace');" | Out-File -Path "src\index.ts" -Encoding UTF8
    
    Write-Host "Test workspace created successfully" -ForegroundColor Green
} else {
    Write-Host "Test workspace already exists" -ForegroundColor Green
}

Write-Host "Step 3: CLI Information..." -ForegroundColor Blue
$cliBinary = "$HaruspexRoot\dist\src\debugging\cli-bin.js"
if (Test-Path $cliBinary) {
    Write-Host "CLI binary found: $cliBinary" -ForegroundColor Green
    Write-Host "Usage: node `"$cliBinary`" [command]" -ForegroundColor Gray
} else {
    Write-Host "CLI binary not found. Build may have failed." -ForegroundColor Red
}

if ($SetupOnly) {
    Write-Host "Setup complete! Ready for manual testing." -ForegroundColor Cyan
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run the script without -SetupOnly to open VSCode with test workspace" -ForegroundColor Gray
    Write-Host "2. For extension testing: Press F5 in VSCode with Haruspex project open" -ForegroundColor Gray
    Write-Host "3. Open workspace: $TestWorkspace" -ForegroundColor Gray
    Write-Host "4. Initialize Haruspex in the workspace (Ctrl+Shift+P -> 'Haruspex: Initialize Workspace')" -ForegroundColor Gray
    Write-Host "5. Test CLI: node '$cliBinary' connect --workspace '$TestWorkspace'" -ForegroundColor Gray
    exit 0
}

Write-Host "Step 4: Launching VSCode..." -ForegroundColor Blue
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

Write-Host "Setup complete! Happy debugging!" -ForegroundColor Green
