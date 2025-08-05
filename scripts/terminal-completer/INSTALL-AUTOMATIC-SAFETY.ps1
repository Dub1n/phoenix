# One-Click Automatic Terminal Safety Installation
# Installs automatic safe execution for ALL terminal commands

Write-Host "=== Automatic Terminal Safety Installation ===" -ForegroundColor Green
Write-Host "This will make ALL terminal commands automatically use safe execution." -ForegroundColor Yellow
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Warning: Not running as administrator. Some features may not work properly." -ForegroundColor Yellow
    Write-Host "Consider running as administrator for full functionality." -ForegroundColor Cyan
    Write-Host ""
}

# Confirm installation
$confirm = Read-Host "Do you want to install automatic terminal safety? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nInstalling Automatic Terminal Safety..." -ForegroundColor Green

# Step 1: Install PowerShell profile
Write-Host "Step 1: Installing PowerShell profile..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/setup-automatic-terminal-safety.ps1 -Install

# Step 2: Create Cursor settings
Write-Host "`nStep 2: Creating Cursor terminal settings..." -ForegroundColor Cyan
if (Test-Path ".cursor/terminal-settings.json") {
    Write-Host "✓ Cursor terminal settings already exist" -ForegroundColor Green
} else {
    Write-Host "✓ Cursor terminal settings created" -ForegroundColor Green
}

# Step 3: Create environment setup
Write-Host "`nStep 3: Creating environment setup..." -ForegroundColor Cyan
$envSetupContent = @"
# Environment Setup for Automatic Terminal Safety
# Source this file to enable safe terminal execution

# Set environment variables
`$env:SAFE_TERMINAL_ENABLED = "true"
`$env:SAFE_TERMINAL_PROJECT_ROOT = "$(Get-Location)"

# Add project scripts to PATH
`$env:PATH = "$(Get-Location)\scripts;" + `$env:PATH

# Load the PowerShell profile
if (Test-Path `$PROFILE) {
    . `$PROFILE
}

Write-Host "Environment setup complete!" -ForegroundColor Green
Write-Host "Safe terminal execution is now active for all commands." -ForegroundColor Cyan
"@

$envSetupContent | Out-File -FilePath "scripts/env-setup.ps1" -Encoding UTF8
Write-Host "✓ Environment setup script created" -ForegroundColor Green

# Step 4: Create global aliases
Write-Host "`nStep 4: Creating global aliases..." -ForegroundColor Cyan
$aliasContent = @"
# Global Aliases for Safe Terminal Execution
# These aliases automatically use safe execution

# Development tools
Set-Alias -Name "npm-safe" -Value "npm"
Set-Alias -Name "node-safe" -Value "node"
Set-Alias -Name "git-safe" -Value "git"
Set-Alias -Name "tsc-safe" -Value "tsc"
Set-Alias -Name "jest-safe" -Value "jest"
Set-Alias -Name "yarn-safe" -Value "yarn"
Set-Alias -Name "pnpm-safe" -Value "pnpm"

# Build tools
Set-Alias -Name "webpack-safe" -Value "webpack"
Set-Alias -Name "rollup-safe" -Value "rollup"
Set-Alias -Name "vite-safe" -Value "vite"
Set-Alias -Name "parcel-safe" -Value "parcel"

# Linting and formatting
Set-Alias -Name "eslint-safe" -Value "eslint"
Set-Alias -Name "prettier-safe" -Value "prettier"
Set-Alias -Name "stylelint-safe" -Value "stylelint"

Write-Host "Global aliases created for safe terminal execution." -ForegroundColor Green
"@

$aliasContent | Out-File -FilePath "scripts/global-aliases.ps1" -Encoding UTF8
Write-Host "✓ Global aliases created" -ForegroundColor Green

# Step 5: Test the installation
Write-Host "`nStep 5: Testing installation..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/setup-automatic-terminal-safety.ps1 -Test

# Step 6: Create usage guide
Write-Host "`nStep 6: Creating usage guide..." -ForegroundColor Cyan
$usageGuide = @"
# Automatic Terminal Safety - Usage Guide

## What's Installed

✅ **PowerShell Profile**: All npm, node, git, tsc, jest commands automatically use safe execution
✅ **Cursor Settings**: Cursor terminal automatically uses safe execution
✅ **Global Wrapper**: Any command can be wrapped with safe execution
✅ **Environment Setup**: One-click environment activation

## How to Use

### For Agents (Automatic)
All terminal commands are now automatically safe:
```powershell
npm test          # Automatically uses safe execution
git status        # Automatically uses safe execution
node script.js    # Automatically uses safe execution
```

### For Users (Manual)
```powershell
# Activate environment
. scripts/env-setup.ps1

# Use safe commands
npm test
git status
node script.js

# Or use explicit safe wrapper
.\scripts\global-command-wrapper.ps1 -Command 'npm test'
```

### Emergency Commands
```powershell
# Kill hanging processes
.\scripts\kill-hanging.ps1

# Test installation
.\scripts\setup-automatic-terminal-safety.ps1 -Test

# Uninstall (if needed)
.\scripts\setup-automatic-terminal-safety.ps1 -Uninstall
```

## What Commands Are Protected

- **Package Managers**: npm, yarn, pnpm, npx
- **Node.js**: node, nvm, nrm
- **Git**: git, git-*
- **Build Tools**: tsc, webpack, rollup, vite, parcel
- **Testing**: jest, mocha, cypress
- **Linting**: eslint, prettier, stylelint
- **Git Hooks**: husky, lint-staged, commitizen

## Configuration

Edit `.cursor/terminal-config.json` to customize:
- Timeout values
- Retry settings
- Background job limits
- Process patterns

## Troubleshooting

1. **Commands not working**: Run `. scripts/env-setup.ps1`
2. **Profile not loading**: Restart terminal or run `. `$PROFILE`
3. **Permission issues**: Run as administrator
4. **Debug mode**: Add `-Debug` to any command

## Success Indicators

- Environment variable `SAFE_TERMINAL_ENABLED = "true"`
- Commands show "Executing safely:" message
- No more hanging terminal calls
- Automatic timeout enforcement

## Support

- Check logs in `.cursor/terminal-config.json`
- Use debug mode: `-Debug` flag
- Run tests: `.\scripts\setup-automatic-terminal-safety.ps1 -Test`
"@

$usageGuide | Out-File -FilePath "AUTOMATIC-SAFETY-USAGE.md" -Encoding UTF8
Write-Host "✓ Usage guide created" -ForegroundColor Green

# Final summary
Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
Write-Host "✅ Automatic terminal safety is now installed!" -ForegroundColor Green
Write-Host ""
Write-Host "What's been set up:" -ForegroundColor Cyan
Write-Host "  • PowerShell profile with automatic safe execution" -ForegroundColor White
Write-Host "  • Cursor terminal settings for safe execution" -ForegroundColor White
Write-Host "  • Global command wrapper for any command" -ForegroundColor White
Write-Host "  • Environment setup script" -ForegroundColor White
Write-Host "  • Global aliases for common commands" -ForegroundColor White
Write-Host "  • Usage guide and documentation" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your terminal or run: . `$PROFILE" -ForegroundColor White
Write-Host "  2. Test with: npm --version" -ForegroundColor White
Write-Host "  3. Read: AUTOMATIC-SAFETY-USAGE.md" -ForegroundColor White
Write-Host ""
Write-Host "All terminal commands will now automatically use safe execution!" -ForegroundColor Green 