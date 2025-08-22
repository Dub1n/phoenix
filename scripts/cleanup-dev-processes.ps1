# Development Process Cleanup Script
# Safely terminates development-related processes that may be left running

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false,
    [switch]$Force = $false
)

Write-Host "🧹 Development Process Cleanup Tool" -ForegroundColor Cyan
Write-Host "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No processes will be terminated" -ForegroundColor Yellow
    Write-Host ""
}

# ENHANCED SAFETY: Define trusted development tool paths
$trustedDevPaths = @(
    "*\Microsoft VS Code*",
    "*\Cursor*", 
    "*\Visual Studio Code*",
    "*\AppData\Local\Programs\Microsoft VS Code*",
    "*\AppData\Local\Programs\cursor*",
    "*\AppData\Roaming\npm*",
    "*\node_modules*",
    "*\npm\*",
    "*\yarn\*",
    "*\pnpm\*",
    "*\.vscode*",
    "*\haruspex*",
    "*\VDL_Vault*"
)

# ENHANCED SAFETY: Critical system processes that should NEVER be terminated
$criticalSystemProcesses = @(
    "explorer", "winlogon", "csrss", "smss", "services", "lsass", "svchost",
    "dwm", "conhost", "RuntimeBroker", "SearchUI", "StartMenuExperienceHost",
    "audiodg", "spoolsv", "wininit", "System", "Registry"
)

# ENHANCED SAFETY: Processes that might have dev-like names but aren't actually dev tools
$falsePositiveExclusions = @(
    "MicrosoftEdge*", "msedge*", "chrome*", "firefox*", "opera*",
    "Teams*", "Slack*", "Discord*", "Zoom*", 
    "WindowsTerminal*", "cmd", "powershell", "pwsh"
)

# Define process patterns to look for (more specific now)
$processPatterns = @{
    "VSCode/Cursor" = @("^Code$", "^Cursor$", "^code-insiders$", "^code-oss$")
    "Node.js" = @("^node$", "^nodejs$")  
    "Extension Hosts" = @("extensionHost", "Extension Host")
    "Language Servers" = @("tsserver", "typescript-language-server", "eslint-language-server", "pyls", "pylsp")
    "Development Servers" = @("webpack", "vite", "parcel", "rollup", "^tsc$", "webpack-dev-server")
    "Package Managers" = @("^npm$", "^yarn$", "^pnpm$", "^npx$")
}

# Additional search patterns for project-specific tools
$haruspexPatterns = @("haruspex", "debug-manager", "ipc-server")
#might not be neede - check [!]
#$claudePatterns = @("claude-code", "claude")

# ENHANCED SAFETY: Test if a process is a critical system process
function Test-IsSystemCritical {
    param($process)
    
    # Check against critical system process list
    foreach ($critical in $criticalSystemProcesses) {
        if ($process.ProcessName -like $critical) {
            return $true
        }
    }
    
    # Additional checks for system processes
    if ($process.ProcessName -match "^(System|Idle|Registry)$") {
        return $true
    }
    
    # Check if running from System32 (likely system process)
    if ($process.Path -and $process.Path -like "*\System32\*") {
        return $true
    }
    
    return $false
}

# ENHANCED SAFETY: Test if process should be excluded (false positive)
function Test-IsExplicitlyExcluded {
    param($process)
    
    foreach ($exclusion in $falsePositiveExclusions) {
        if ($process.ProcessName -like $exclusion) {
            return $true
        }
    }
    
    return $false
}

# ENHANCED SAFETY: Test if process path is in trusted development locations
function Test-ProcessPathIsTrusted {
    param($process)
    
    if (-not $process.Path -or $process.Path -eq "Access Denied") {
        return $false
    }
    
    foreach ($trustedPath in $trustedDevPaths) {
        if ($process.Path -like $trustedPath) {
            return $true
        }
    }
    
    return $false
}

# ENHANCED SAFETY: Detect IDE process types more precisely
function Get-IDEProcessType {
    param($process)
    
    if ($process.ProcessName -match "^(Code|Cursor)$") {
        # Check if it's the main IDE application
        if ($process.HasMainWindow) {
            # Main IDE window - NEVER auto-terminate
            return "MainIDE"
        }
        
        # Check command line or path for background process indicators
        try {
            # Try to get more process details
            $fullProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
            if ($fullProcess) {
                # Check process arguments if available (may require elevated permissions)
                $commandLine = ""
                try {
                    $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)" -ErrorAction SilentlyContinue).CommandLine
                } catch {
                    # If we can't get command line, fall back to other indicators
                }
                
                # Background process indicators in command line
                if ($commandLine -match "--type=|--extension-development|--extensionDevelopmentPath|--ms-enable-electron-run-as-node") {
                    return "BackgroundProcess"
                }
                
                # Check working set - main IDE typically uses more memory
                $workingSetMB = [math]::Round(($process.WorkingSet / 1MB), 1)
                if ($workingSetMB -gt 100) {
                    # Likely main IDE process (high memory usage)
                    return "MainIDE"
                } elseif ($workingSetMB -lt 50) {
                    # Likely background/helper process (low memory usage)
                    return "BackgroundProcess"
                }
            }
        } catch {
            # If we can't get details, default to safe categorization
        }
        
        # If we can't determine definitively, err on the side of caution
        return "UnknownIDE"
    }
    
    return "NotIDE"
}

# ENHANCED SAFETY: Calculate process risk level
function Get-ProcessRiskLevel {
    param($process)
    
    # System critical = NEVER terminate
    if (Test-IsSystemCritical $process) {
        return "NEVER"
    }
    
    # Explicitly excluded = NEVER terminate
    if (Test-IsExplicitlyExcluded $process) {
        return "NEVER"
    }
    
    # ENHANCED IDE DETECTION: Handle IDE processes more carefully
    $ideType = Get-IDEProcessType $process
    switch ($ideType) {
        "MainIDE" { 
            return "NEVER"  # Main IDE = absolutely never auto-terminate
        }
        "BackgroundProcess" { 
            # Background IDE processes from trusted paths = MEDIUM risk
            if (Test-ProcessPathIsTrusted $process) {
                return "MEDIUM"
            } else {
                return "HIGH"
            }
        }
        "UnknownIDE" { 
            return "HIGH"  # Unknown IDE processes = require confirmation
        }
        "NotIDE" {
            # Continue with other checks below
        }
    }
    
    # Extension hosts and language servers from trusted paths = LOW risk
    if (($process.ProcessName -match "extensionHost|tsserver|typescript-language-server") -and 
        (Test-ProcessPathIsTrusted $process)) {
        return "LOW"
    }
    
    # Development servers from trusted paths = LOW risk  
    if (($process.ProcessName -match "webpack|vite|parcel|rollup") -and 
        (Test-ProcessPathIsTrusted $process)) {
        return "LOW"
    }
    
    # Package managers without main window from trusted paths = LOW risk
    if (($process.ProcessName -match "^(npm|yarn|pnpm|npx)$") -and 
        (-not $process.HasMainWindow) -and 
        (Test-ProcessPathIsTrusted $process)) {
        return "LOW"
    }
    
    # Node processes without main window from trusted paths = MEDIUM risk
    if (($process.ProcessName -match "^(node|nodejs)$") -and 
        (-not $process.HasMainWindow) -and 
        (Test-ProcessPathIsTrusted $process)) {
        return "MEDIUM"
    }
    
    # Everything else = HIGH risk (require confirmation)
    return "HIGH"
}

function Get-DevelopmentProcesses {
    Write-Host "🔍 Scanning for development-related processes..." -ForegroundColor Yellow
    
    # Get processes with timeout protection
    try {
        $allProcesses = Get-Process -ErrorAction SilentlyContinue
        Write-Host "   Found $($allProcesses.Count) total processes to scan..." -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed to get process list: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
    
    $devProcesses = @()
    $processedCategories = 0
    
    foreach ($category in $processPatterns.Keys) {
        $patterns = $processPatterns[$category]
        $processedCategories++
        Write-Host "   Scanning $category ($processedCategories/$($processPatterns.Count))..." -ForegroundColor Gray
        
        foreach ($pattern in $patterns) {
            $matchingProcesses = $allProcesses | Where-Object { 
                # More precise pattern matching and safety checks
                ($_.ProcessName -match $pattern) -and
                # ENHANCED SAFETY: Exclude system critical processes
                (-not (Test-IsSystemCritical $_)) -and
                # ENHANCED SAFETY: Exclude false positives
                (-not (Test-IsExplicitlyExcluded $_))
            }
            
            foreach ($proc in $matchingProcesses) {
                # Some process objects may not have all properties (e.g., Path, StartTime)
                # Use safer property access with null checks
                $procPath = if ($proc.Path) { try { $proc.Path } catch { "Access Denied" } } else { "Access Denied" }
                $procStartTime = if ($proc.StartTime) { try { $proc.StartTime } catch { "Unknown" } } else { "Unknown" }
                $workingSetMB = if ($proc.WorkingSet) { try { [math]::Round(($proc.WorkingSet / 1MB), 1) } catch { 0 } } else { 0 }
                $mainWindowTitle = if ($proc.MainWindowTitle) { try { $proc.MainWindowTitle } catch { "" } } else { "" }
                $hasMainWindow = -not [string]::IsNullOrEmpty($mainWindowTitle)

                # ENHANCED SAFETY: Calculate risk level and IDE type for this process
                $riskLevel = Get-ProcessRiskLevel $proc
                $isTrustedPath = Test-ProcessPathIsTrusted $proc
                $ideType = Get-IDEProcessType $proc

                $devProcesses += [PSCustomObject]@{
                    Category = $category
                    ProcessName = $proc.ProcessName
                    Id = $proc.Id
                    Path = $procPath
                    StartTime = $procStartTime
                    WorkingSet = $workingSetMB
                    MainWindowTitle = $mainWindowTitle
                    HasMainWindow = $hasMainWindow
                    RiskLevel = $riskLevel
                    IsTrustedPath = $isTrustedPath
                    IDEType = $ideType
                }
            }
        }
    }
    
    # Look for Haruspex-specific processes (avoid CommandLine property due to permission issues)
    Write-Host "   Scanning for Haruspex processes..." -ForegroundColor Gray
    foreach ($pattern in $haruspexPatterns) {
        $matchingProcesses = $allProcesses | Where-Object { 
            # ENHANCED SAFETY: Haruspex process matching with safety checks
            ($_.ProcessName -match $pattern -or ($_.Path -and $_.Path -match $pattern)) -and
            # ENHANCED SAFETY: Exclude system critical processes
            (-not (Test-IsSystemCritical $_)) -and
            # ENHANCED SAFETY: Exclude false positives
            (-not (Test-IsExplicitlyExcluded $_))
        }
        
        foreach ($proc in $matchingProcesses) {
            # Handle exceptions first (same as first block) - use safer property access
            $procPath = if ($proc.Path) { try { $proc.Path } catch { "Access Denied" } } else { "Access Denied" }
            $procStartTime = if ($proc.StartTime) { try { $proc.StartTime } catch { "Unknown" } } else { "Unknown" }
            $workingSetMB = if ($proc.WorkingSet) { try { [math]::Round($proc.WorkingSet / 1MB, 1) } catch { 0 } } else { 0 }
            $mainWindowTitle = if ($proc.MainWindowTitle) { try { $proc.MainWindowTitle } catch { "" } } else { "" }
            
            $hasMainWindow = -not [string]::IsNullOrEmpty($mainWindowTitle)
            
            # ENHANCED SAFETY: Calculate risk level and IDE type for Haruspex processes
            $riskLevel = Get-ProcessRiskLevel $proc
            $isTrustedPath = Test-ProcessPathIsTrusted $proc
            $ideType = Get-IDEProcessType $proc
            
            $devProcesses += [PSCustomObject]@{
                Category = "Haruspex"
                ProcessName = $proc.ProcessName
                Id = $proc.Id
                Path = $procPath
                StartTime = $procStartTime
                WorkingSet = $workingSetMB
                MainWindowTitle = $mainWindowTitle
                HasMainWindow = $hasMainWindow
                RiskLevel = $riskLevel
                IsTrustedPath = $isTrustedPath
                IDEType = $ideType
            }
        }    
    }

    Write-Host "   Scan complete - found $($devProcesses.Count) development processes" -ForegroundColor Green
    return $devProcesses | Sort-Object Category, ProcessName
}

function Show-ProcessSummary {
    param($processes)
    
    if ($processes.Count -eq 0) {
        Write-Host "✅ No development processes found" -ForegroundColor Green
        return
    }
    
    Write-Host "📊 Found $($processes.Count) development-related processes:" -ForegroundColor Cyan
    Write-Host ""
    
    $grouped = $processes | Group-Object Category
    foreach ($group in $grouped) {
        Write-Host "📁 $($group.Name) ($($group.Count) processes):" -ForegroundColor White
        
        foreach ($proc in $group.Group) {
            # ENHANCED SAFETY: Color-code by risk level
            $color = switch ($proc.RiskLevel) {
                "NEVER" { "Red" }
                "HIGH" { "Yellow" }
                "MEDIUM" { "Cyan" }
                "LOW" { "Green" }
                default { "Gray" }
            }
            
            $window = if ($proc.HasMainWindow) { " [WINDOW: $($proc.MainWindowTitle)]" } else { " [Background]" }
            $memory = "($($proc.WorkingSet)MB)"
            $riskBadge = "[$($proc.RiskLevel) RISK]"
            $trustBadge = if ($proc.IsTrustedPath) { "[TRUSTED]" } else { "[UNTRUSTED]" }
            
            # ENHANCED SAFETY: Show IDE type for better identification
            $ideTypeBadge = ""
            if ($proc.IDEType -ne "NotIDE") {
                $ideTypeBadge = " [$($proc.IDEType)]"
            }
            
            Write-Host "  • $($proc.ProcessName) (PID: $($proc.Id)) $memory $riskBadge $trustBadge$ideTypeBadge$window" -ForegroundColor $color
            
            if ($Verbose -and $proc.Path -ne "Access Denied") {
                Write-Host "    Path: $($proc.Path)" -ForegroundColor DarkGray
            }
        }
        Write-Host ""
    }
}

function Get-SafeToTerminateProcesses {
    param($processes)
    
    # ENHANCED SAFETY: Multiple safety categories based on risk level
    $categorized = @{
        AutoSafe = @()              # LOW risk - can terminate automatically
        RequiresConfirmation = @()  # MEDIUM/HIGH risk - requires user confirmation
        NeverTerminate = @()        # NEVER risk - absolutely protected
        Excluded = @()              # Explicitly excluded processes
    }
    
    foreach ($proc in $processes) {
        switch ($proc.RiskLevel) {
            "NEVER" { 
                $categorized.NeverTerminate += $proc
                Write-Host "   🛡️ PROTECTED: $($proc.ProcessName) - System critical or excluded" -ForegroundColor Red
            }
            "LOW" { 
                # Only auto-safe if from trusted path
                if ($proc.IsTrustedPath) {
                    $categorized.AutoSafe += $proc
                } else {
                    $categorized.RequiresConfirmation += $proc
                    Write-Host "   ⚠️ SUSPICIOUS: $($proc.ProcessName) - Low risk but untrusted path" -ForegroundColor Yellow
                }
            }
            "MEDIUM" { 
                $categorized.RequiresConfirmation += $proc
            }
            "HIGH" { 
                $categorized.RequiresConfirmation += $proc
            }
            default { 
                # Unknown risk level - require confirmation
                $categorized.RequiresConfirmation += $proc
                Write-Host "   ❓ UNKNOWN: $($proc.ProcessName) - Risk level could not be determined" -ForegroundColor Magenta
            }
        }
    }
    
    # ENHANCED SAFETY: Additional validation for auto-safe processes
    $validatedAutoSafe = @()
    foreach ($proc in $categorized.AutoSafe) {
        # Double-check that auto-safe processes meet all criteria
        if ($proc.RiskLevel -eq "LOW" -and $proc.IsTrustedPath -and (-not $proc.HasMainWindow)) {
            $validatedAutoSafe += $proc
        } else {
            # Move questionable processes to confirmation list
            $categorized.RequiresConfirmation += $proc
            Write-Host "   🔄 MOVED TO CONFIRMATION: $($proc.ProcessName) - Failed additional validation" -ForegroundColor Yellow
        }
    }
    $categorized.AutoSafe = $validatedAutoSafe
    
    return $categorized
}

function Stop-DevelopmentProcesses {
    param($processes, $force = $false)
    
    if ($processes.Count -eq 0) {
        Write-Host "ℹ️ No processes to terminate" -ForegroundColor Blue
        return
    }
    
    $terminated = 0
    $failed = 0
    
    foreach ($proc in $processes) {
        try {
            if ($DryRun) {
                Write-Host "🔄 Would terminate: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
                $terminated++
            } else {
                $process = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
                if ($process) {
                    if ($force) {
                        $process | Stop-Process -Force -ErrorAction Stop
                        Write-Host "❌ Force-terminated: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
                    } else {
                        $process | Stop-Process -ErrorAction Stop
                        Write-Host "✅ Terminated: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Green
                    }
                    $terminated++
                } else {
                    Write-Host "⚠️ Process already terminated: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
                }
            }
        } catch {
            Write-Host "❌ Failed to terminate $($proc.ProcessName) (PID: $($proc.Id)): $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
    
    return @{
        Terminated = $terminated
        Failed = $failed
    }
}

function Confirm-TerminateProcess {
    param($proc)
    
    Write-Host "🤔 Confirm termination of: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
    
    # ENHANCED SAFETY: Show detailed risk information
    $riskColor = switch ($proc.RiskLevel) {
        "HIGH" { "Red" }
        "MEDIUM" { "Yellow" }
        "LOW" { "Green" }
        default { "Gray" }
    }
    Write-Host "   Risk Level: $($proc.RiskLevel)" -ForegroundColor $riskColor
    Write-Host "   Trusted Path: $(if ($proc.IsTrustedPath) { "YES" } else { "NO" })" -ForegroundColor $(if ($proc.IsTrustedPath) { "Green" } else { "Red" })
    Write-Host "   Category: $($proc.Category)" -ForegroundColor Cyan
    
    # ENHANCED SAFETY: Show IDE type information for better decision making
    if ($proc.IDEType -ne "NotIDE") {
        $ideTypeColor = switch ($proc.IDEType) {
            "MainIDE" { "Red" }
            "BackgroundProcess" { "Yellow" }
            "UnknownIDE" { "Magenta" }
            default { "Gray" }
        }
        Write-Host "   IDE Type: $($proc.IDEType)" -ForegroundColor $ideTypeColor
        
        if ($proc.IDEType -eq "MainIDE") {
            Write-Host "   🚨 CRITICAL: This appears to be the main IDE application!" -ForegroundColor Red
        } elseif ($proc.IDEType -eq "UnknownIDE") {
            Write-Host "   ❓ UNKNOWN: Cannot determine if this is main IDE or background process" -ForegroundColor Yellow
        }
    }
    
    if ($proc.HasMainWindow) {
        Write-Host "   Window: $($proc.MainWindowTitle)" -ForegroundColor Cyan
    }
    if ($proc.Path -ne "Access Denied") {
        Write-Host "   Path: $($proc.Path)" -ForegroundColor Gray
    }
    
    # ENHANCED SAFETY: Warn about high-risk processes
    if ($proc.RiskLevel -eq "HIGH") {
        Write-Host "   ⚠️ WARNING: This is a HIGH RISK process!" -ForegroundColor Red
    }
    if (-not $proc.IsTrustedPath) {
        Write-Host "   ⚠️ WARNING: Process is not from a trusted development path!" -ForegroundColor Red
    }
    
    $response = Read-Host "   Terminate this process? (y/N/a=all/q=quit)"
    return $response.ToLower()
}

# Main execution
try {
    $allDevProcesses = Get-DevelopmentProcesses
    
    Show-ProcessSummary -processes $allDevProcesses
    
    if ($allDevProcesses.Count -eq 0) {
        Write-Host "🎉 System is clean - no development processes found to clean up!" -ForegroundColor Green
        exit 0
    }
    
    $categorized = Get-SafeToTerminateProcesses -processes $allDevProcesses
    
    # ENHANCED SAFETY: Show protected processes
    if ($categorized.NeverTerminate.Count -gt 0) {
        Write-Host "🛡️ Protected processes (will NEVER be terminated) ($($categorized.NeverTerminate.Count)):" -ForegroundColor Red
        foreach ($proc in $categorized.NeverTerminate) {
            Write-Host "  • $($proc.ProcessName) (PID: $($proc.Id)) - $($proc.Category) - $($proc.RiskLevel)" -ForegroundColor Red
        }
        Write-Host ""
    }

    # Handle auto-safe processes
    if ($categorized.AutoSafe.Count -gt 0) {
        Write-Host "🛡️ Safe to terminate automatically ($($categorized.AutoSafe.Count) processes):" -ForegroundColor Green
        
        foreach ($proc in $categorized.AutoSafe) {
            Write-Host "  • $($proc.ProcessName) (PID: $($proc.Id)) - $($proc.Category) [TRUSTED, LOW RISK]" -ForegroundColor Green
        }
        Write-Host ""
        
        if (-not $DryRun) {
            $confirm = Read-Host "Terminate safe processes? (Y/n)"
            if ($confirm -eq '' -or $confirm.ToLower() -eq 'y') {
                $result = Stop-DevelopmentProcesses -processes $categorized.AutoSafe
                Write-Host "✅ Terminated $($result.Terminated) processes" -ForegroundColor Green
                if ($result.Failed -gt 0) {
                    Write-Host "❌ Failed to terminate $($result.Failed) processes" -ForegroundColor Red
                }
            }
        } else {
            $result = Stop-DevelopmentProcesses -processes $categorized.AutoSafe
        }
    }
    
    # Handle processes requiring confirmation
    if ($categorized.RequiresConfirmation.Count -gt 0 -and -not $Force) {
        Write-Host "⚠️ Processes requiring confirmation ($($categorized.RequiresConfirmation.Count)):" -ForegroundColor Yellow
        Write-Host ""
        
        $terminateAll = $false
        $processesToTerminate = @()
        
        foreach ($proc in $categorized.RequiresConfirmation) {
            if ($terminateAll) {
                $processesToTerminate += $proc
                continue
            }
            
            $response = Confirm-TerminateProcess -proc $proc
            
            switch ($response) {
                'y' { $processesToTerminate += $proc }
                'a' { 
                    $terminateAll = $true
                    $processesToTerminate += $proc
                }
                'q' { break }
                default { 
                    Write-Host "   Skipped" -ForegroundColor Gray
                }
            }
        }
        
        if ($processesToTerminate.Count -gt 0) {
            $result = Stop-DevelopmentProcesses -processes $processesToTerminate
            Write-Host "✅ Terminated $($result.Terminated) additional processes" -ForegroundColor Green
            if ($result.Failed -gt 0) {
                Write-Host "❌ Failed to terminate $($result.Failed) processes" -ForegroundColor Red
            }
        }
    }
    
    # Force termination if requested
    if ($Force -and $categorized.RequiresConfirmation.Count -gt 0) {
        Write-Host "💪 Force mode: Terminating all remaining processes..." -ForegroundColor Red
        $result = Stop-DevelopmentProcesses -processes $categorized.RequiresConfirmation -force $true
        Write-Host "❌ Force-terminated $($result.Terminated) processes" -ForegroundColor Red
        if ($result.Failed -gt 0) {
            Write-Host "❌ Failed to force-terminate $($result.Failed) processes" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🎯 Cleanup complete!" -ForegroundColor Green
    
    # ENHANCED SAFETY: Summary of safety measures
    Write-Host ""
    Write-Host "🛡️ ENHANCED SAFETY SUMMARY:" -ForegroundColor Cyan
    Write-Host "  • Protected processes: $($categorized.NeverTerminate.Count) (system critical + explicitly excluded)" -ForegroundColor Red
    Write-Host "  • Auto-safe processes: $($categorized.AutoSafe.Count) (low risk + trusted paths)" -ForegroundColor Green
    Write-Host "  • Required confirmation: $($categorized.RequiresConfirmation.Count) (medium/high risk)" -ForegroundColor Yellow
    Write-Host "  • Enhanced path validation: ✅ Enabled" -ForegroundColor Green
    Write-Host "  • Risk level assessment: ✅ Enabled" -ForegroundColor Green
    Write-Host "  • System process protection: ✅ Enabled" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host ""
        Write-Host "💡 Run without -DryRun to actually terminate processes" -ForegroundColor Blue
    }
    
} catch {
    Write-Host "💥 Script error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Additional cleanup - temp files and IPC connections
Write-Host ""
Write-Host "🧹 Checking for leftover development files..." -ForegroundColor Cyan

$tempCleanupPaths = @(
    "$env:TEMP\haruspex-*",
    "C:\temp\haruspex-*",
    "$env:LOCALAPPDATA\Temp\vscode-*",
    "$env:LOCALAPPDATA\Temp\cursor-*"
)

foreach ($pattern in $tempCleanupPaths) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "🗂️ Found temp files matching: $pattern ($($files.Count) items)" -ForegroundColor Yellow
        if (-not $DryRun) {
            $cleanup = Read-Host "Clean up these temp files? (y/N)"
            if ($cleanup.ToLower() -eq 'y') {
                try {
                    $files | Remove-Item -Recurse -Force -ErrorAction Stop
                    Write-Host "✅ Cleaned up temp files" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Failed to clean temp files: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
}

# Check for stuck IPC/socket files
$haruspexWorkspaces = Get-ChildItem -Path "C:\temp\haruspex-*" -Directory -ErrorAction SilentlyContinue
foreach ($workspace in $haruspexWorkspaces) {
    $debugDir = Join-Path $workspace.FullName ".haruspex"
    if (Test-Path $debugDir) {
        $socketFiles = Get-ChildItem -Path $debugDir -Filter "*connection*" -ErrorAction SilentlyContinue
        if ($socketFiles) {
            Write-Host "🔌 Found IPC connection files in: $debugDir" -ForegroundColor Yellow
            if (-not $DryRun) {
                $cleanup = Read-Host "Clean up IPC connection files? (y/N)"
                if ($cleanup.ToLower() -eq 'y') {
                    try {
                        $socketFiles | Remove-Item -Force -ErrorAction Stop
                        Write-Host "✅ Cleaned up IPC connection files" -ForegroundColor Green
                    } catch {
                        Write-Host "❌ Failed to clean IPC files: $($_.Exception.Message)" -ForegroundColor Red
                    }
                }
            }
        }
    }
}

Write-Host ""
Write-Host "🎉 Development environment cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 ENHANCED SAFETY FEATURES:" -ForegroundColor Blue
Write-Host "  • 🛡️ System process protection - Critical processes are never terminated" -ForegroundColor Gray
Write-Host "  • 🔍 IDE process detection - Distinguishes main IDE from background processes" -ForegroundColor Gray
Write-Host "  • 📍 Trusted path validation - Only processes from known dev locations are auto-safe" -ForegroundColor Gray
Write-Host "  • 🎯 Risk level assessment - Each process is evaluated for safety" -ForegroundColor Gray
Write-Host "  • ⚠️ Enhanced confirmations - High-risk processes show detailed warnings" -ForegroundColor Gray
Write-Host "  • 🚫 Explicit exclusions - Browsers, communication apps are protected" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Usage tips:" -ForegroundColor Blue
Write-Host "  • Use -DryRun to see what would be cleaned up safely" -ForegroundColor Gray
Write-Host "  • Use -Force to terminate all processes without confirmation (careful!)" -ForegroundColor Gray
Write-Host "  • Use -Verbose for detailed process and path information" -ForegroundColor Gray
Write-Host "  • Green processes = LOW RISK from trusted paths" -ForegroundColor Gray
Write-Host "  • Yellow/Red processes = MEDIUM/HIGH RISK requiring confirmation" -ForegroundColor Gray
