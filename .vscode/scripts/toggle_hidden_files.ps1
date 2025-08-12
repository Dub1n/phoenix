# Toggle Hidden Files Script (Silent Version)
# Toggles files.exclude settings between true/false in Cursor settings.json

$settingsPath = "$env:APPDATA\Cursor\User\settings.json"

if (-not (Test-Path $settingsPath)) {
    # Write-Host "Settings file not found at: $settingsPath" -ForegroundColor Red
    exit 1
}

try {
    # Write-Host "Reading settings from: $settingsPath" -ForegroundColor Cyan
    
    # Read current settings
    $settingsContent = Get-Content $settingsPath -Raw
    
    # Test if JSON is valid before parsing
    try {
        $settings = $settingsContent | ConvertFrom-Json
    } catch {
        # Write-Host "ERROR: Invalid JSON in settings.json" -ForegroundColor Red
        # Write-Host "JSON Error: $($_.Exception.Message)" -ForegroundColor Red
        # Write-Host "Please fix the JSON syntax first (check for trailing commas, missing brackets, etc.)" -ForegroundColor Yellow
        exit 1
    }
    
    # Check if files.exclude exists
    if (-not $settings.'files.exclude') {
        # Write-Host "No 'files.exclude' section found in settings" -ForegroundColor Yellow
        exit 1
    }
    
    # Get all patterns in files.exclude
    $allPatterns = $settings.'files.exclude'.PSObject.Properties.Name
    
    if ($allPatterns.Count -eq 0) {
        # Write-Host "No patterns found in files.exclude" -ForegroundColor Yellow
        exit 1
    }
    
    # Determine current state by checking the first pattern
    $firstPattern = $allPatterns[0]
    $currentState = $settings.'files.exclude'.$firstPattern
    
    $newState = -not $currentState
    # Write-Host "Current state: $(if ($currentState) {'HIDDEN'} else {'VISIBLE'})" -ForegroundColor Yellow
    # Write-Host "Switching to: $(if ($newState) {'HIDDEN'} else {'VISIBLE'})" -ForegroundColor Yellow
    
    # Toggle ALL patterns in files.exclude
    foreach ($pattern in $allPatterns) {
        $settings.'files.exclude'.$pattern = $newState
        # Write-Host "  Toggled: $pattern = $newState" -ForegroundColor Gray
    }
    
    # Convert back to JSON with proper formatting (4-space indentation to match original)
    $newContent = $settings | ConvertTo-Json -Depth 10
    
    # Fix indentation: Convert 2-space to 4-space indentation to match Cursor's format
    $lines = $newContent -split "`n"
    $fixedLines = foreach ($line in $lines) {
        # Count leading spaces and double them
        if ($line -match '^(\s*)(.*)$') {
            $indentation = $matches[1]
            $content = $matches[2]
            # Double the indentation (2 spaces -> 4 spaces)
            $newIndentation = $indentation -replace ' ', '  '
            "$newIndentation$content"
        } else {
            $line
        }
    }
    $newContent = $fixedLines -join "`n"
    
    # Save with backup
    $backupPath = "$settingsPath.backup"
    Copy-Item $settingsPath $backupPath -Force
    
    $newContent | Set-Content $settingsPath -Encoding UTF8
    
    $stateText = if ($newState) { "HIDDEN" } else { "VISIBLE" }
    
    # Quick status message
    Write-Host "✅ Files are now: $stateText" -ForegroundColor Green
    Write-Host "Settings: Ctrl+Shift+P → 'Preferences: Open User Settings (JSON)'" -ForegroundColor Cyan
         
} catch {
    # Write-Host "Error toggling files: $($_.Exception.Message)" -ForegroundColor Red
    # Write-Host "Full Error: $($_.Exception)" -ForegroundColor Red
} 
