# Haruspex Debugging Test Execution Script
# Purpose: Automate setup and execution of debugging test scenarios

param(
    [Parameter(Mandatory=$false)]
    [string]$TestWorkspace = "C:\temp\haruspex-test-workspace",
    
    [Parameter(Mandatory=$false)]
    [switch]$SetupOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$CleanFirst
)

Write-Host "🔮 Haruspex Debugging Test Execution" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Set locations
$HaruspexRoot = "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex"
$TestGuide = "$HaruspexRoot\dev\debugging\03-PRACTICAL-DEBUGGING-TEST.md"

Write-Host "📍 Haruspex Root: $HaruspexRoot" -ForegroundColor Green
Write-Host "📍 Test Workspace: $TestWorkspace" -ForegroundColor Green

# Clean existing workspace if requested
if ($CleanFirst -and (Test-Path $TestWorkspace)) {
    Write-Host "🧹 Cleaning existing test workspace..." -ForegroundColor Yellow
    Remove-Item $TestWorkspace -Recurse -Force
}

# Step 1: Build Haruspex Extension
Write-Host "`n🔨 Step 1: Building Haruspex Extension..." -ForegroundColor Blue
Set-Location $HaruspexRoot

Write-Host "Running npm run build..." -ForegroundColor Gray
$buildResult = & npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed:" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    exit 1
}

# Step 2: Setup Test Workspace
Write-Host "`n📁 Step 2: Setting up test workspace..." -ForegroundColor Blue

if (-not (Test-Path $TestWorkspace)) {
    Write-Host "Creating test workspace at $TestWorkspace" -ForegroundColor Gray
    New-Item -ItemType Directory -Path $TestWorkspace -Force | Out-Null
    
    Set-Location $TestWorkspace
    
    # Create sample files
    Write-Host "Creating sample files..." -ForegroundColor Gray
    
    $readmeContent = @"
# Test Documentation
This is a test workspace for Haruspex debugging.

## Structure
* README.md (this file)
* test.ts - TypeScript test file
* package.json - Project configuration
* docs/ - Documentation directory
* src/ - Source code directory
"@
    
    $readmeContent | Out-File -Path "README.md" -Encoding UTF8
    
    "export const test = 'hello world';" | Out-File -Path "test.ts" -Encoding UTF8
    
    $packageContent = @"
{
  "name": "haruspex-test-workspace",
  "version": "1.0.0",
  "description": "Test workspace for Haruspex debugging",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["haruspex", "test", "debugging"],
  "author": "Test User",
  "license": "MIT"
}
"@
    
    $packageContent | Out-File -Path "package.json" -Encoding UTF8

    # Create subdirectories
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
    New-Item -ItemType Directory -Path "src" -Force | Out-Null
    
    $archContent = @"
# Architecture Documentation
This document describes the system architecture.

## Components
* Core engine
* Documentation providers
* WebView components

## Data Flow
```mermaid
graph TD
    A[User] --> B[VSCode Extension]
    B --> C[Haruspex Core]
    C --> D[Debug System]
```
"@
    
    $archContent | Out-File -Path "docs\architecture.md" -Encoding UTF8

    $apiContent = @"
# API Reference
This document provides API reference information.

## Classes
### HaruspexCoreEngine
Main engine class for processing.

### DocumentationProvider
Provides documentation tree functionality.
"@
    
    $apiContent | Out-File -Path "docs\api.md" -Encoding UTF8

    "console.log('Haruspex test workspace');" | Out-File -Path "src\index.ts" -Encoding UTF8
    
    Write-Host "✅ Test workspace created successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Test workspace already exists" -ForegroundColor Green
}

# Step 3: Display CLI binary location
Write-Host "`n🔧 Step 3: Debugging CLI Information..." -ForegroundColor Blue
$cliBinary = "$HaruspexRoot\dist\debugging\cli-bin.js"
if (Test-Path $cliBinary) {
    Write-Host "✅ CLI binary found: $cliBinary" -ForegroundColor Green
    Write-Host "Usage: node `"$cliBinary`" [command]" -ForegroundColor Gray
    Write-Host "Available commands: connect, status, health, interactive, watch" -ForegroundColor Gray
} else {
    Write-Host "❌ CLI binary not found. Build may have failed." -ForegroundColor Red
}

# Exit if setup-only requested
if ($SetupOnly) {
    Write-Host "`n🎯 Setup complete! Ready for manual testing." -ForegroundColor Cyan
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open VSCode: code '$TestWorkspace'" -ForegroundColor Gray
    Write-Host "2. Verify Haruspex extension is active" -ForegroundColor Gray
    Write-Host "3. Test CLI: node '$cliBinary' connect" -ForegroundColor Gray
    Write-Host "4. Follow test guide: $TestGuide" -ForegroundColor Gray
    exit 0
}

# Step 4: Launch VSCode with test workspace
Write-Host "`n🚀 Step 4: Launching VSCode with test workspace..." -ForegroundColor Blue
Write-Host "Opening VSCode with test workspace..." -ForegroundColor Gray
Start-Process "code" -ArgumentList "`"$TestWorkspace`""

# Wait a moment for VSCode to start
Start-Sleep -Seconds 3

Write-Host "`n✅ Haruspex Debugging Test Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify Haruspex extension loaded in VSCode (look for Haruspex icon)" -ForegroundColor White
Write-Host "2. Test debugging CLI connection:" -ForegroundColor White
Write-Host "   node `"$cliBinary`" connect" -ForegroundColor Gray
Write-Host "3. Follow the complete test guide:" -ForegroundColor White  
Write-Host "   $TestGuide" -ForegroundColor Gray

Write-Host "`n🔧 Quick CLI Commands:" -ForegroundColor Yellow
Write-Host "node `"$cliBinary`" status    # Check extension status" -ForegroundColor Gray
Write-Host "node `"$cliBinary`" health    # Get health information" -ForegroundColor Gray
Write-Host "node `"$cliBinary`" watch     # Monitor real-time changes" -ForegroundColor Gray
Write-Host "node `"$cliBinary`" interactive # Start interactive session" -ForegroundColor Gray

Write-Host "`n🎯 Ready for practical debugging test!" -ForegroundColor Cyan