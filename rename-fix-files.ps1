# Script to remove timestamp prefixes from fix documentation files
# Converts: "YYYY-MM-DD-HHMMSS-comprehensive-fix-description.md" -> "description.md"
# Converts: "YYYY-MM-DD-HHMMSS-quick-fix-description.md" -> "description.md"

param(
    [switch]$WhatIf = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Define regex patterns for matching the old format
$comprehensivePattern = '\d{4}-\d{2}-\d{2}-\d{6}-comprehensive-fix-([^/\s]+)\.md'
$quickFixPattern = '\d{4}-\d{2}-\d{2}-\d{6}-quick-fix-([^/\s]+)\.md'

# Track changes for reporting
$fileRenames = @()
$contentChanges = @()

Write-Host "Starting fix file rename operation..." -ForegroundColor Green
Write-Host "WhatIf mode: $WhatIf" -ForegroundColor Yellow

# Phase 1: Rename actual files
Write-Host "`n=== Phase 1: Renaming Files ===" -ForegroundColor Cyan

# Find all comprehensive-fix files
$comprehensiveFiles = Get-ChildItem -Path . -Recurse -File -Name "*-comprehensive-fix-*.md" | Where-Object { $_ -match $comprehensivePattern }

foreach ($file in $comprehensiveFiles) {
    if ($file -match $comprehensivePattern) {
        $description = $matches[1]
        $newName = "$description.md"
        $oldPath = $file
        $newPath = $file -replace [regex]::Escape((Split-Path $file -Leaf)), $newName
        
        $fileRenames += @{
            Old = $oldPath
            New = $newPath
            Description = $description
        }
        
        if ($Verbose) {
            Write-Host "  $oldPath -> $newPath" -ForegroundColor Gray
        }
        
        if (-not $WhatIf) {
            if (Test-Path $oldPath) {
                Rename-Item -Path $oldPath -NewName $newName
                Write-Host "  Renamed: $oldPath -> $newName" -ForegroundColor Green
            }
        }
    }
}

# Find all quick-fix files
$quickFixFiles = Get-ChildItem -Path . -Recurse -File -Name "*-quick-fix-*.md" | Where-Object { $_ -match $quickFixPattern }

foreach ($file in $quickFixFiles) {
    if ($file -match $quickFixPattern) {
        $description = $matches[1]
        $newName = "$description.md"
        $oldPath = $file
        $newPath = $file -replace [regex]::Escape((Split-Path $file -Leaf)), $newName
        
        $fileRenames += @{
            Old = $oldPath
            New = $newPath
            Description = $description
        }
        
        if ($Verbose) {
            Write-Host "  $oldPath -> $newPath" -ForegroundColor Gray
        }
        
        if (-not $WhatIf) {
            if (Test-Path $oldPath) {
                Rename-Item -Path $oldPath -NewName $newName
                Write-Host "  Renamed: $oldPath -> $newName" -ForegroundColor Green
            }
        }
    }
}

Write-Host "Files to rename: $($fileRenames.Count)" -ForegroundColor Yellow

# Phase 2: Update file contents
Write-Host "`n=== Phase 2: Updating File Contents ===" -ForegroundColor Cyan

# Find all markdown files that might contain references
$allMdFiles = Get-ChildItem -Path . -Recurse -File -Include "*.md"

foreach ($mdFile in $allMdFiles) {
    $content = Get-Content -Path $mdFile.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $changed = $false
    
    # Replace comprehensive-fix references
    $content = $content -replace $comprehensivePattern, '$1.md'
    if ($content -ne $originalContent) {
        $changed = $true
    }
    
    # Replace quick-fix references
    $content = $content -replace $quickFixPattern, '$1.md'
    if ($content -ne $originalContent) {
        $changed = $true
    }
    
    if ($changed) {
        $contentChanges += $mdFile.FullName
        
        if ($Verbose) {
            Write-Host "  Updated: $($mdFile.FullName)" -ForegroundColor Gray
        }
        
        if (-not $WhatIf) {
            Set-Content -Path $mdFile.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  Updated: $($mdFile.FullName)" -ForegroundColor Green
        }
    }
}

Write-Host "Files with content changes: $($contentChanges.Count)" -ForegroundColor Yellow

# Phase 3: Update template references
Write-Host "`n=== Phase 3: Updating Template References ===" -ForegroundColor Cyan

$templatePattern = 'YYYY-MM-DD-HHMMSS-(comprehensive|quick)-fix-([^/\s]+)\.md'
$templateFiles = @()

foreach ($mdFile in $allMdFiles) {
    $content = Get-Content -Path $mdFile.FullName -Raw -Encoding UTF8
    if ($content -match $templatePattern) {
        $templateFiles += $mdFile.FullName
        $newContent = $content -replace $templatePattern, '$2.md'
        
        if ($Verbose) {
            Write-Host "  Updated template in: $($mdFile.FullName)" -ForegroundColor Gray
        }
        
        if (-not $WhatIf) {
            Set-Content -Path $mdFile.FullName -Value $newContent -Encoding UTF8 -NoNewline
            Write-Host "  Updated template in: $($mdFile.FullName)" -ForegroundColor Green
        }
    }
}

Write-Host "Template files updated: $($templateFiles.Count)" -ForegroundColor Yellow

# Summary Report
Write-Host "`n=== Summary Report ===" -ForegroundColor Cyan
Write-Host "Files renamed: $($fileRenames.Count)" -ForegroundColor White
Write-Host "Files with content updates: $($contentChanges.Count)" -ForegroundColor White
Write-Host "Template files updated: $($templateFiles.Count)" -ForegroundColor White

if ($WhatIf) {
    Write-Host "`nThis was a dry run. Use -WhatIf:`$false to execute the changes." -ForegroundColor Yellow
} else {
    Write-Host "`nOperation completed successfully!" -ForegroundColor Green
}

# Detailed reporting if verbose
if ($Verbose -and $fileRenames.Count -gt 0) {
    Write-Host "`n=== File Rename Details ===" -ForegroundColor Cyan
    foreach ($rename in $fileRenames) {
        Write-Host "  $($rename.Old) -> $($rename.Description).md" -ForegroundColor Gray
    }
}