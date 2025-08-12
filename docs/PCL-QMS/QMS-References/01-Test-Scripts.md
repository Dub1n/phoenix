---
tags: [QMS, Testing, PowerShell, Script Templates, Best Practices]
provides: [QMS Test Script Template, PowerShell Testing Best Practices, Lessons Learned]
requires: [QMS Environment Validation, Robust Automation]
---

# QMS Test Script Patterns & Best Practices

## Lessons Learned from Environment Validation Script

### 1. Parser Errors and PowerShell Syntax

- **Invisible Characters:** PowerShell parser errors (e.g., "missing terminator" or "missing catch/finally block") are often caused by invisible characters from copy-paste or non-UTF8 encodings. Always retype problematic lines if in doubt.
- **Try/Catch Limitations:** PowerShell's `try/catch` only handles *terminating* errors, not non-zero exit codes from external programs. For process exit codes, always check `$LASTEXITCODE`.
- **String Handling:** Avoid multiline or unclosed strings. Use single-line strings or here-strings with clear delimiters.
- **Braces and Blocks:** Ensure every `{` has a matching `}`. Avoid deeply nested or complex inline blocks in scripts.

### 2. Robust Command Checking

- **Use `Get-Command` for Existence:** Always check for command existence with `Get-Command ... -ErrorAction SilentlyContinue` before running external tools.
- **Centralize Results:** Store all check results in a hashtable or object for easy summary and reporting.
- **Helper Functions:** Encapsulate repetitive logic (e.g., command checks, process invocation) in functions for maintainability.

### 3. External Process Handling

- **Check `$LASTEXITCODE`:** After running an external command, check `$LASTEXITCODE` to determine success/failure.
- **Suppress Output Carefully:** Use `| Out-Null` to suppress output, but allow errors to surface for debugging.
- **Use `Push-Location`/`Pop-Location`:** For directory changes, use these instead of `Set-Location` to ensure you always return to your starting directory.

### 4. Modern PowerShell Practices

- **Use `Get-CimInstance` Instead of `Get-WmiObject`:** The former is the modern, supported cmdlet for system info.
- **Parameterize and Modularize:** Design scripts so that checks and steps can be easily reused or extended.

### 5. Summary and Reporting

- **Centralized Summary:** Build a summary from your results object at the end of the script. This makes it easy to see the outcome of all checks and is trivial to extend.
- **Color Coding:** Use `Write-Host` with `-ForegroundColor` for clear, readable output.

---

## PowerShell QMS Test Script Template

Below is a robust template for future QMS test scripts, based on the refactored environment validation script:

```powershell
# QMS Test Script Template (PowerShell)
# Description: Robust, maintainable, and extensible test script for QMS automation.

# --- SCRIPT SETUP ---
Clear-Host

# Centralized results object
$results = @{}

# --- HELPER FUNCTIONS ---
function Test-CommandExists {
    param (
        [string]$CommandName,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [hashtable]$ResultStore
    )
    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        $ResultStore.Found = $true
        $ResultStore.Message = $SuccessMessage
        Write-Host $SuccessMessage -ForegroundColor Green
    } else {
        $ResultStore.Found = $false
        $ResultStore.Message = $FailureMessage
        Write-Host $FailureMessage -ForegroundColor Yellow
    }
}

function Invoke-AndTestCommand {
    param (
        [Parameter(Mandatory=$true)]
        [scriptblock]$Command,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [hashtable]$ResultStore
    )
    & $Command | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $ResultStore.Found = $true
        $ResultStore.Message = $SuccessMessage
        Write-Host $SuccessMessage -ForegroundColor Green
    } else {
        $ResultStore.Found = $false
        $ResultStore.Message = $FailureMessage
        Write-Host $FailureMessage -ForegroundColor Red
    }
}

# --- TEST STEPS (EXAMPLES) ---
# 1. Check for required commands
$results.git = @{}
Test-CommandExists -CommandName 'git' -SuccessMessage "✓ Git available" -FailureMessage "✗ Git not found" -ResultStore $results.git

$results.node = @{}
Test-CommandExists -CommandName 'node' -SuccessMessage "✓ Node.js available" -FailureMessage "✗ Node.js not found" -ResultStore $results.node

# 2. Run a build/test process
$results.build = @{}
Invoke-AndTestCommand -Command { npm run build } -SuccessMessage "✓ Build successful" -FailureMessage "✗ Build failed" -ResultStore $results.build

# 3. Check for a file or directory
$results.docs = @{}
if (Test-Path "VDL2/QMS/Docs") {
    $results.docs.Found = $true
    $results.docs.Message = "✓ QMS Docs directory found"
    Write-Host $results.docs.Message -ForegroundColor Green
} else {
    $results.docs.Found = $false
    $results.docs.Message = "✗ QMS Docs directory not found"
    Write-Host $results.docs.Message -ForegroundColor Red
}

# 4. System resource check
$results.disk = @{}
try {
    $drive = Get-PSDrive C -ErrorAction Stop
    $freeSpace = [math]::Round($drive.Free / 1GB, 2)
    $results.disk.Value = "$freeSpace GB"
    Write-Host "Available disk space: $($results.disk.Value)" -ForegroundColor Green
} catch {
    $results.disk.Value = "Unknown"
    Write-Host "Could not determine disk space." -ForegroundColor Yellow
}

# --- SUMMARY ---
Write-Host "`n=== QMS Test Script Summary ===" -ForegroundColor Green
Write-Host ("Git: {0}" -f $results.git.Message)
Write-Host ("Node.js: {0}" -f $results.node.Message)
Write-Host ("Build: {0}" -f $results.build.Message)
Write-Host ("Docs: {0}" -f $results.docs.Message)
Write-Host ("Disk: {0}" -f $results.disk.Value)
Write-Host "------------------------------------"
Write-Host "Test script complete." -ForegroundColor Green
```

---

## Best Practices for QMS PowerShell Test Scripts

- **Centralize all results** for easy reporting and extensibility.
- **Use helper functions** for all repetitive logic.
- **Check command existence** before running external tools.
- **Always check `$LASTEXITCODE`** after running external processes.
- **Use `Push-Location`/`Pop-Location`** for directory changes.
- **Prefer `Get-CimInstance` over `Get-WmiObject`** for system info.
- **Color-code output** for clarity.
- **Keep all strings single-line** unless using here-strings with clear delimiters.
- **Document every step** and rationale for future maintainers.

---

This template and these practices should be used for all future QMS automation and validation scripts to ensure maintainability, clarity, and robustness.
