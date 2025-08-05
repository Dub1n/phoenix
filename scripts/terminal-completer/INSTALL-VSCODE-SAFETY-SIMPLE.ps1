# VSCode/Cursor-Specific Terminal Safety Installation
# Installs automatic safe execution only for VSCode/Cursor terminals

Write-Host "=== VSCode/Cursor Terminal Safety Installation ===" -ForegroundColor Green
Write-Host "This will make ALL terminal commands in VSCode/Cursor automatically use safe execution." -ForegroundColor Yellow
Write-Host "This does NOT modify your global PowerShell profile." -ForegroundColor Cyan
Write-Host ""

# Confirm installation
$confirm = Read-Host "Do you want to install VSCode/Cursor terminal safety? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nInstalling VSCode/Cursor Terminal Safety..." -ForegroundColor Green

# Step 1: Ensure VSCode settings exist
Write-Host "Step 1: Configuring VSCode terminal settings..." -ForegroundColor Cyan
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" -Force | Out-Null
    Write-Host "✓ Created .vscode directory" -ForegroundColor Green
}

# Step 2: Update VSCode settings
Write-Host "Step 2: Updating VSCode settings..." -ForegroundColor Cyan
$vscodeSettings = @{
    "terminal.integrated.defaultProfile.windows" = "PowerShell"
    "terminal.integrated.profiles.windows" = @{
        "PowerShell" = @{
            "source" = "PowerShell"
            "args" = @(
                "-ExecutionPolicy", "Bypass",
                "-File", "`${workspaceFolder}/scripts/auto-terminal-manager.ps1",
                "-Command", "powershell -NoProfile -ExecutionPolicy Bypass"
            )
            "env" = @{
                "SAFE_TERMINAL_ENABLED" = "true"
                "SAFE_TERMINAL_PROJECT_ROOT" = "`${workspaceFolder}"
            }
        }
    }
    "terminal.integrated.env.windows" = @{
        "SAFE_TERMINAL_ENABLED" = "true"
        "SAFE_TERMINAL_PROJECT_ROOT" = "`${workspaceFolder}"
    }
    "terminal.integrated.shellArgs.windows" = @(
        "-ExecutionPolicy", "Bypass",
        "-File", "`${workspaceFolder}/scripts/auto-terminal-manager.ps1",
        "-Command", "powershell -NoProfile -ExecutionPolicy Bypass"
    )
    "terminal.integrated.automationProfile.windows" = @{
        "source" = "PowerShell"
        "args" = @(
            "-ExecutionPolicy", "Bypass",
            "-File", "`${workspaceFolder}/scripts/auto-terminal-manager.ps1",
            "-Command", "powershell -NoProfile -ExecutionPolicy Bypass"
        )
    }
}

# Merge with existing settings
$existingSettings = @{}
if (Test-Path ".vscode/settings.json") {
    $existingSettings = Get-Content ".vscode/settings.json" -Raw | ConvertFrom-Json
}

# Merge settings
$mergedSettings = $existingSettings | ConvertTo-Json -Depth 10 | ConvertFrom-Json
foreach ($key in $vscodeSettings.Keys) {
    $mergedSettings.$key = $vscodeSettings.$key
}

# Write merged settings
$mergedSettings | ConvertTo-Json -Depth 10 | Out-File -FilePath ".vscode/settings.json" -Encoding UTF8
Write-Host "✓ VSCode terminal settings updated" -ForegroundColor Green

# Step 3: Ensure Cursor settings exist
Write-Host "Step 3: Configuring Cursor terminal settings..." -ForegroundColor Cyan
if (-not (Test-Path ".cursor")) {
    New-Item -ItemType Directory -Path ".cursor" -Force | Out-Null
    Write-Host "✓ Created .cursor directory" -ForegroundColor Green
}

# Step 4: Update Cursor settings
Write-Host "Step 4: Updating Cursor settings..." -ForegroundColor Cyan
$cursorSettings = @{
    "terminal.integrated.defaultProfile.windows" = "PowerShell"
    "terminal.integrated.profiles.windows" = @{
        "PowerShell" = @{
            "source" = "PowerShell"
            "args" = @(
                "-ExecutionPolicy", "Bypass",
                "-File", "`${workspaceFolder}/scripts/auto-terminal-manager.ps1",
                "-Command", "powershell -NoProfile -ExecutionPolicy Bypass"
            )
            "env" = @{
                "SAFE_TERMINAL_ENABLED" = "true"
                "SAFE_TERMINAL_PROJECT_ROOT" = "`${workspaceFolder}"
            }
        }
    }
    "terminal.integrated.env.windows" = @{
        "SAFE_TERMINAL_ENABLED" = "true"
        "SAFE_TERMINAL_PROJECT_ROOT" = "`${workspaceFolder}"
    }
    "terminal.integrated.shellArgs.windows" = @(
        "-ExecutionPolicy", "Bypass",
        "-File", "`${workspaceFolder}/scripts/auto-terminal-manager.ps1",
        "-Command", "powershell -NoProfile -ExecutionPolicy Bypass"
    )
    "terminal.integrated.automationProfile.windows" = @{
        "source" = "PowerShell"
        "args" = @(
            "-ExecutionPolicy", "Bypass",
            "-File", "`${workspaceFolder}/scripts/auto-terminal-manager.ps1",
            "-Command", "powershell -NoProfile -ExecutionPolicy Bypass"
        )
    }
}

$cursorSettings | ConvertTo-Json -Depth 10 | Out-File -FilePath ".cursor/terminal-settings.json" -Encoding UTF8
Write-Host "✓ Cursor terminal settings updated" -ForegroundColor Green

# Step 5: Create environment setup for manual activation
Write-Host "Step 5: Creating environment setup..." -ForegroundColor Cyan
$envSetupContent = @"
# Environment Setup for VSCode/Cursor Terminal Safety
# Source this file to enable safe terminal execution manually

# Set environment variables
`$env:SAFE_TERMINAL_ENABLED = "true"
`$env:SAFE_TERMINAL_PROJECT_ROOT = "$(Get-Location)"

# Add project scripts to PATH
`$env:PATH = "$(Get-Location)\scripts;" + `$env:PATH

Write-Host "VSCode/Cursor terminal safety environment activated!" -ForegroundColor Green
Write-Host "Safe terminal execution is now active for this session." -ForegroundColor Cyan
"@

$envSetupContent | Out-File -FilePath "scripts/env-setup.ps1" -Encoding UTF8
Write-Host "✓ Environment setup script created" -ForegroundColor Green

# Step 6: Test the installation
Write-Host "Step 6: Testing installation..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "VSCode/Cursor terminal safety test"' -Debug

# Step 7: Create simple usage guide
Write-Host "Step 7: Creating usage guide..." -ForegroundColor Cyan
$usageContent = @"
# VSCode/Cursor Terminal Safety - Usage Guide

## What's Installed

* VSCode Settings: Terminal automatically uses safe execution in VSCode
* Cursor Settings: Terminal automatically uses safe execution in Cursor
* Environment Setup: Manual activation script for other terminals
* No Global Changes: Does not modify your PowerShell profile

## How It Works

### Automatic (VSCode/Cursor)
When you open a terminal in VSCode or Cursor, it automatically:
* Uses the safe terminal manager
* Applies appropriate timeouts
* Prevents hanging processes
* Provides automatic cleanup

### Manual (Other Terminals)
When you need safe execution in other terminals:

```powershell
# Activate environment manually
. scripts/env-setup.ps1

# Use safe wrapper directly
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm test'
```

## What Commands Are Protected

* Package Managers: npm, yarn, pnpm, npx
* Node.js: node, nvm, nrm
* Git: git, git-*
* Build Tools: tsc, webpack, rollup, vite, parcel
* Testing: jest, mocha, cypress
* Linting: eslint, prettier, stylelint
* Git Hooks: husky, lint-staged, commitizen

## Configuration

Edit `.cursor/terminal-config.json` to customize:
* Timeout values
* Retry settings
* Background job limits
* Process patterns

## Troubleshooting

* VSCode/Cursor terminal not working: Restart VSCode/Cursor
* Commands hanging: Use emergency kill script
* Permission issues: Check execution policy
* Debug mode: Add -Debug to any command

## Emergency Commands

```powershell
# Kill hanging processes
.\scripts\kill-hanging.ps1

# Test safe execution
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm --version'

# Manual environment activation
. scripts/env-setup.ps1
```

## Success Indicators

* Environment variable SAFE_TERMINAL_ENABLED = "true"
* Commands show "Executing safely:" message
* No more hanging terminal calls in VSCode/Cursor
* Automatic timeout enforcement

## Files Created/Modified

* .vscode/settings.json - VSCode terminal configuration
* .cursor/terminal-settings.json - Cursor terminal configuration
* scripts/env-setup.ps1 - Manual environment activation
* scripts/auto-terminal-manager.ps1 - Safe execution wrapper
* scripts/kill-hanging.ps1 - Emergency process cleanup

## Support

* Check logs in .cursor/terminal-config.json
* Use debug mode: -Debug flag
* Test with: npm --version
* Emergency: .\scripts\kill-hanging.ps1
"@

$usageContent | Out-File -FilePath "VSCODE-SAFETY-USAGE.md" -Encoding UTF8
Write-Host "✓ Usage guide created" -ForegroundColor Green

# Final summary
Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
Write-Host "✅ VSCode/Cursor terminal safety is now installed!" -ForegroundColor Green
Write-Host ""
Write-Host "What's been set up:" -ForegroundColor Cyan
Write-Host "  • VSCode terminal settings for safe execution" -ForegroundColor White
Write-Host "  • Cursor terminal settings for safe execution" -ForegroundColor White
Write-Host "  • Environment setup script for manual activation" -ForegroundColor White
Write-Host "  • Usage guide and documentation" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart VSCode/Cursor to apply terminal settings" -ForegroundColor White
Write-Host "  2. Open a new terminal in VSCode/Cursor" -ForegroundColor White
Write-Host "  3. Test with: npm --version" -ForegroundColor White
Write-Host "  4. Read: VSCODE-SAFETY-USAGE.md" -ForegroundColor White
Write-Host ""
Write-Host "All terminal commands in VSCode/Cursor will now automatically use safe execution!" -ForegroundColor Green
Write-Host "Your global PowerShell profile remains unchanged." -ForegroundColor Cyan 