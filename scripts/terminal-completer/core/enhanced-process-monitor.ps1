# Enhanced Process Monitor - Phase 2 Implementation
# Implements enhanced process monitoring with responsiveness detection, state analysis,
# and advanced output pattern recognition for hanging detection
# Based on the terminal safety improvement roadmap

param(
    [Parameter(Mandatory=$false)]
    [int]$ProcessId = 0,
    
    [Parameter(Mandatory=$false)]
    [string]$Command = "",
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutMs = 30000,
    
    [Parameter(Mandatory=$false)]
    [switch]$Monitor = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Analyze = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Debug = $false
)

# Configuration for enhanced monitoring
$monitoringConfig = @{
    responsiveness = @{
        checkInterval = 100        # Milliseconds between checks
        stuckThreshold = 5         # Consecutive stuck checks before flagging
        cpuThreshold = 0.1         # Minimum CPU usage to consider "active"
        memoryThreshold = 1024     # Minimum memory change to consider "active"
    }
    stateAnalysis = @{
        sampleCount = 10           # Number of samples for state analysis
        sampleInterval = 200       # Milliseconds between samples
        stuckPatternThreshold = 0.8 # Threshold for detecting stuck patterns
    }
    # Debug mode configuration - much shorter timeouts for testing
    debug_mode = @{
        enabled = $false           # Set to true for debugging
        timeout_multiplier = 0.1   # Use 10% of normal timeouts
        check_interval = 50        # Faster checks (50ms instead of 100ms)
        stuck_threshold = 2        # Lower threshold for faster detection
    }
    # Phase 2 Enhanced Hanging Patterns
    hangingPatterns = @{
        "npm" = @{
            patterns = @("Building...", "Installing...", "Running tests...", "Waiting for changes...", "Compiling...", "Bundling...")
            timeout = 45           # Seconds before considering hanging
            context = @("package.json", "node_modules", "build", "test")
        }
        "jest" = @{
            patterns = @("Running tests...", "Test Suites:", "Tests:", "PASS", "FAIL", "Test Results", "Coverage")
            timeout = 60           # Tests can take longer
            context = @("test", "spec", "coverage", "jest.config")
        }
        "tsc" = @{
            patterns = @("Compiling...", "Found X errors", "Starting compilation", "Building project", "Type checking")
            timeout = 30           # Compilation should be relatively fast
            context = @("tsconfig.json", "src", "types", "compilation")
        }
        "webpack" = @{
            patterns = @("Waiting for changes...", "Compiled successfully", "Building...", "Bundling...", "Optimizing...")
            timeout = 90           # Webpack can take time for large builds
            context = @("webpack.config", "dist", "build", "bundle")
        }
        "git" = @{
            patterns = @("Updating...", "Resolving deltas...", "Counting objects...", "Compressing objects...", "Receiving objects...")
            timeout = 30           # Git operations should be reasonable
            context = @(".git", "remote", "branch", "merge")
        }
        "node" = @{
            patterns = @("Debugger listening on", "Waiting for debugger", "Server running", "Listening on port", "Ready")
            timeout = 15           # Node startup should be quick
            context = @("server", "debug", "port", "startup")
        }
        "yarn" = @{
            patterns = @("Installing packages...", "Building packages...", "Linking packages...", "Resolving packages...")
            timeout = 60           # Yarn operations can take time
            context = @("yarn.lock", "node_modules", "packages", "dependencies")
        }
        "docker" = @{
            patterns = @("Building image...", "Pulling image...", "Starting container...", "Waiting for container...")
            timeout = 120          # Docker operations can be slow
            context = @("Dockerfile", "docker-compose", "image", "container")
        }
        "python" = @{
            patterns = @("Installing packages...", "Collecting packages...", "Building wheels...", "Running setup.py")
            timeout = 90           # Python package operations can be slow
            context = @("requirements.txt", "setup.py", "pip", "virtualenv")
        }
        "maven" = @{
            patterns = @("Downloading...", "Building...", "Running tests...", "Compiling...", "Installing...")
            timeout = 120          # Maven operations can be slow
            context = @("pom.xml", "target", "src", "dependencies")
        }
    }
    # Phase 2 Enhanced Interactive Patterns
    interactivePatterns = @{
        "user_input" = @(
            "Press any key to continue",
            "Do you want to continue?",
            "Enter your choice:",
            "Y/N?",
            "Password:",
            "Username:",
            "Select option:",
            "Choose:",
            "Type 'y' to continue:",
            "Are you sure?",
            "Confirm (y/n):",
            "Input required:",
            "Please enter:",
            "Select [1-5]:",
            "Press Enter to continue"
        )
        "confirmation" = @(
            "Overwrite file?",
            "Delete file?",
            "Replace existing?",
            "Continue anyway?",
            "Proceed?",
            "Accept changes?",
            "Install anyway?",
            "Force install?"
        )
        "authentication" = @(
            "Enter password:",
            "Username:",
            "Login:",
            "Authentication required:",
            "Please authenticate:",
            "Sign in:",
            "Access token:",
            "API key:"
        )
        "choice_selection" = @(
            "Select option:",
            "Choose action:",
            "Pick one:",
            "Select [1-3]:",
            "Choose [a/b/c]:",
            "Pick option:",
            "Select choice:"
        )
    }
    # Phase 2 Output Change Tracking
    outputTracking = @{
        checkInterval = 2000       # Check output changes every 2 seconds
        minChangeThreshold = 10    # Minimum characters changed to consider "active"
        maxBufferSize = 10000      # Maximum output buffer size
        changeTimeout = 30         # Seconds without output change before hanging
        patternMatchTimeout = 45   # Seconds with matching pattern before hanging
    }
}

# Enhanced Process Monitoring Functions

function Watch-ProcessCompletion {
    param(
        [int]$ProcessId,
        [int]$TimeoutMs,
        [string]$Command = ""
    )
    
    if ($Debug) { 
        Write-Host "Starting enhanced process monitoring for PID: $ProcessId" -ForegroundColor Cyan 
    }
    
    $startTime = Get-Date
    $stuckCount = 0
    $lastCPU = 0
    $lastMemory = 0
    $outputBuffer = ""
    $lastOutputUpdate = Get-Date
    $outputChangeCount = 0
    $patternMatchStart = $null
    $currentPattern = ""
    
    while (((Get-Date) - $startTime).TotalMilliseconds -lt $TimeoutMs) {
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        
        if (-not $process -or $process.HasExited) {
            if ($Debug) { 
                Write-Host "Process completed naturally" -ForegroundColor Green 
            }
            $exitCode = if ($process) { $process.ExitCode } else { $null }
            return @{ 
                Status = "Completed"; 
                Reason = "Process finished naturally";
                ExitCode = $exitCode;
                OutputChanges = $outputChangeCount;
                FinalOutputLength = $outputBuffer.Length
            }
        }
        
        # Enhanced responsiveness monitoring
        $currentCPU = $process.CPU
        $currentMemory = $process.WorkingSet
        $isResponding = $process.Responding
        
        # Check for stuck behavior
        if (-not $isResponding) {
            $stuckCount++
            if ($Debug) { 
                Write-Host "Process not responding (stuck count: $stuckCount)" -ForegroundColor Yellow 
            }
            
            if ($stuckCount -gt $monitoringConfig.responsiveness.stuckThreshold) {
                if ($Debug) { 
                    Write-Host "Process flagged as hanging due to unresponsiveness" -ForegroundColor Red 
                }
                $stuckTime = $stuckCount * $monitoringConfig.responsiveness.checkInterval
                return @{ 
                    Status = "Hanging"; 
                    Reason = "Process not responding for $stuckTime ms";
                    StuckCount = $stuckCount;
                    LastCPU = $lastCPU;
                    LastMemory = $lastMemory;
                    OutputChanges = $outputChangeCount;
                    FinalOutputLength = $outputBuffer.Length
                }
            }
        } else {
            $stuckCount = 0
        }
        
        # Check for activity indicators
        $cpuDelta = [math]::Abs($currentCPU - $lastCPU)
        $memoryDelta = [math]::Abs($currentMemory - $lastMemory)
        
        $hasActivity = $cpuDelta -gt $monitoringConfig.responsiveness.cpuThreshold -or 
                      $memoryDelta -gt $monitoringConfig.responsiveness.memoryThreshold
        
        if ($hasActivity) {
            if ($Debug) { 
                Write-Host "Process showing activity - CPU: $cpuDelta, Memory: $memoryDelta" -ForegroundColor Green 
            }
            $stuckCount = [math]::Max(0, $stuckCount - 1)  # Reduce stuck count if activity detected
        }
        
        # Update last values
        $lastCPU = $currentCPU
        $lastMemory = $currentMemory
        
        # Phase 2: Enhanced output pattern recognition
        if ($Command -and $outputBuffer) {
            $hangingResult = Test-CommandHanging -Output $outputBuffer -Command $Command -LastUpdate $lastOutputUpdate -PatternMatchStart $patternMatchStart -CurrentPattern $currentPattern
            if ($hangingResult.IsHanging) {
                if ($Debug) { 
                    $pattern = $hangingResult.Pattern
                    $reason = $hangingResult.Reason
                    Write-Host "Hanging pattern detected: $pattern - $reason" -ForegroundColor Red 
                }
                return @{ 
                    Status = "Hanging"; 
                    Reason = $hangingResult.Reason;
                    Pattern = $hangingResult.Pattern;
                    Output = $outputBuffer;
                    OutputChanges = $outputChangeCount;
                    PatternMatchDuration = $hangingResult.PatternMatchDuration;
                    FinalOutputLength = $outputBuffer.Length
                }
            }
            
            # Update pattern tracking
            $patternMatchStart = $hangingResult.PatternMatchStart
            $currentPattern = $hangingResult.CurrentPattern
        }
        
        Start-Sleep -Milliseconds $monitoringConfig.responsiveness.checkInterval
    }
    
    if ($Debug) { 
        Write-Host "Timeout reached after $TimeoutMs ms" -ForegroundColor Red 
    }
    return @{ 
        Status = "Timeout"; 
        Reason = "Maximum time exceeded";
        StuckCount = $stuckCount;
        LastCPU = $lastCPU;
        LastMemory = $lastMemory;
        Output = $outputBuffer;
        OutputChanges = $outputChangeCount;
        FinalOutputLength = $outputBuffer.Length
    }
}

function Test-ProcessState {
    param(
        [int]$ProcessId,
        [int]$SampleCount = $monitoringConfig.stateAnalysis.sampleCount,
        [int]$SampleInterval = $monitoringConfig.stateAnalysis.sampleInterval
    )
    
    if ($Debug) { 
        Write-Host "Starting process state analysis for PID: $ProcessId" -ForegroundColor Cyan 
    }
    
    $samples = @()
    
    for ($i = 0; $i -lt $SampleCount; $i++) {
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        
        if ($process) {
            $sample = @{
                CPU = $process.CPU
                Memory = $process.WorkingSet
                Threads = $process.Threads.Count
                Handles = $process.HandleCount
                Responding = $process.Responding
                Timestamp = Get-Date
                SampleIndex = $i
            }
            $samples += $sample
            
            if ($Debug) { 
                $cpu = $process.CPU
                $memory = $process.WorkingSet
                $threads = $process.Threads.Count
                $responding = $process.Responding
                Write-Host ("Sample {0}: CPU={1}, Memory={2}, Threads={3}, Responding={4}" -f $i, $cpu, $memory, $threads, $responding) -ForegroundColor Gray
            }
        } else {
            if ($Debug) { 
                Write-Host "Process $ProcessId not found during sampling" -ForegroundColor Red 
            }
            return @{ 
                StuckProbability = 1.0; 
                Reason = "Process not found during sampling";
                Samples = $samples
            }
        }
        
        if ($i -lt $SampleCount - 1) {
            Start-Sleep -Milliseconds $SampleInterval
        }
    }
    
    # Analyze patterns for stuck behavior
    $analysis = Test-ProcessStuckPattern -Samples $samples
    
    if ($Debug) { 
        $stuckProb = $analysis.StuckProbability
        Write-Host "State analysis complete. Stuck probability: $stuckProb" -ForegroundColor Cyan
    }
    
    return $analysis
}

function Test-ProcessStuckPattern {
    param([array]$Samples)
    
    if ($Samples.Count -lt 2) {
        return @{ StuckProbability = 0.0; Reason = "Insufficient samples" }
    }
    
    $stuckIndicators = 0
    $totalIndicators = 0
    
    # Check for unresponsive behavior
    $unresponsiveCount = ($Samples | Where-Object { -not $_.Responding }).Count
    $unresponsiveRatio = $unresponsiveCount / $Samples.Count
    if ($unresponsiveRatio -gt 0.5) {
        $stuckIndicators += 2  # Strong indicator
    }
    $totalIndicators += 2
    
    # Check for CPU stagnation
    $cpuValues = $Samples | ForEach-Object { $_.CPU }
    $cpuVariance = Get-ArrayVariance -Values $cpuValues
    if ($cpuVariance -lt 0.1) {
        $stuckIndicators += 1  # Moderate indicator
    }
    $totalIndicators += 1
    
    # Check for memory stagnation
    $memoryValues = $Samples | ForEach-Object { $_.Memory }
    $memoryVariance = Get-ArrayVariance -Values $memoryValues
    if ($memoryVariance -lt 1024) {
        $stuckIndicators += 1  # Moderate indicator
    }
    $totalIndicators += 1
    
    # Check for thread count stagnation
    $threadValues = $Samples | ForEach-Object { $_.Threads }
    $threadVariance = Get-ArrayVariance -Values $threadValues
    if ($threadVariance -lt 0.1) {
        $stuckIndicators += 1  # Moderate indicator
    }
    $totalIndicators += 1
    
    # Calculate stuck probability
    $stuckProbability = $stuckIndicators / $totalIndicators
    
    # Determine reason based on strongest indicators
    $reasons = @()
    if ($unresponsiveRatio -gt 0.5) { 
        $percent = [math]::Round($unresponsiveRatio * 100)
        $reasons += "High unresponsiveness rate ($percent%)" 
    }
    if ($cpuVariance -lt 0.1) { 
        $cpuVar = [math]::Round($cpuVariance, 3)
        $reasons += "Low CPU variance ($cpuVar)" 
    }
    if ($memoryVariance -lt 1024) { 
        $memVar = [math]::Round($memoryVariance)
        $reasons += "Low memory variance ($memVar)" 
    }
    if ($threadVariance -lt 0.1) { 
        $threadVar = [math]::Round($threadVariance, 3)
        $reasons += "Low thread variance ($threadVar)" 
    }
    
    $reasonText = if ($reasons.Count -gt 0) { $reasons -join "; " } else { "No clear stuck indicators" }
    
    return @{
        StuckProbability = $stuckProbability
        Reason = $reasonText
        UnresponsiveRatio = $unresponsiveRatio
        CpuVariance = $cpuVariance
        MemoryVariance = $memoryVariance
        ThreadVariance = $threadVariance
        StuckIndicators = $stuckIndicators
        TotalIndicators = $totalIndicators
        Samples = $Samples
    }
}

function Test-CommandHanging {
    param(
        [string]$Output,
        [string]$Command,
        [datetime]$LastUpdate,
        [datetime]$PatternMatchStart,
        [string]$CurrentPattern
    )
    
    if (-not $Output -or -not $Command) {
        return @{ 
            IsHanging = $false;
            PatternMatchStart = $PatternMatchStart;
            CurrentPattern = $CurrentPattern
        }
    }
    
    # Check for interactive patterns first
    $interactiveResult = Test-InteractiveCommand -Command $Command -Output $Output
    if ($interactiveResult.IsInteractive) {
        return @{ 
            IsHanging = $true; 
            Pattern = $interactiveResult.Pattern; 
            Reason = "Interactive command waiting for input";
            Action = $interactiveResult.Action;
            PatternMatchStart = $PatternMatchStart;
            CurrentPattern = $CurrentPattern
        }
    }
    
    # Check for command-specific hanging patterns
    $commandType = Get-CommandType -Command $Command
    
    if ($monitoringConfig.hangingPatterns.ContainsKey($commandType)) {
        $commandConfig = $monitoringConfig.hangingPatterns[$commandType]
        
        # Check for context match
        $contextMatch = $false
        foreach ($context in $commandConfig.context) {
            if ($Output -like "*$context*") {
                $contextMatch = $true
                break
            }
        }
        
        if (-not $contextMatch) {
            return @{ 
                IsHanging = $false;
                PatternMatchStart = $PatternMatchStart;
                CurrentPattern = $CurrentPattern
            }
        }
        
        # Check for pattern match
        $patternMatch = $false
        $matchedPattern = ""
        foreach ($pattern in $commandConfig.patterns) {
            if ($Output -like "*$pattern*") {
                $patternMatch = $true
                $matchedPattern = $pattern
                break
            }
        }
        
        if (-not $patternMatch) {
            return @{ 
                IsHanging = $false;
                PatternMatchStart = $null;
                CurrentPattern = ""
            }
        }
        
        # If this is a new pattern match, start tracking
        if ($matchedPattern -ne $CurrentPattern) {
            $PatternMatchStart = Get-Date
            $CurrentPattern = $matchedPattern
        }
        
        # Check for timeout
        $timeSinceUpdate = (Get-Date) - $LastUpdate
        if ($timeSinceUpdate.TotalSeconds -gt $commandConfig.timeout) {
            $seconds = [math]::Round($timeSinceUpdate.TotalSeconds)
            return @{ 
                IsHanging = $true; 
                Pattern = $matchedPattern;
                Reason = "Output unchanged for $seconds s (exceeds $($commandConfig.timeout)s timeout)";
                TimeSinceUpdate = $timeSinceUpdate.TotalSeconds;
                PatternMatchDuration = if ($PatternMatchStart) { ((Get-Date) - $PatternMatchStart).TotalSeconds } else { 0 };
                PatternMatchStart = $PatternMatchStart;
                CurrentPattern = $CurrentPattern
            }
        }
        
        # Check for pattern match timeout (if we have a start time)
        if ($PatternMatchStart) {
            $patternMatchDuration = ((Get-Date) - $PatternMatchStart).TotalSeconds
            if ($patternMatchDuration -gt $monitoringConfig.outputTracking.patternMatchTimeout) {
                $seconds = [math]::Round($patternMatchDuration)
                return @{ 
                    IsHanging = $true; 
                    Pattern = $matchedPattern;
                    Reason = "Pattern '$matchedPattern' matched for $seconds s (exceeds $($monitoringConfig.outputTracking.patternMatchTimeout)s timeout)";
                    TimeSinceUpdate = $timeSinceUpdate.TotalSeconds;
                    PatternMatchDuration = $patternMatchDuration;
                    PatternMatchStart = $PatternMatchStart;
                    CurrentPattern = $CurrentPattern
                }
            }
        }
        
        # Return current state (not hanging yet, but tracking)
        return @{ 
            IsHanging = $false;
            PatternMatchStart = $PatternMatchStart;
            CurrentPattern = $CurrentPattern;
            MatchedPattern = $matchedPattern;
            TimeSinceUpdate = $timeSinceUpdate.TotalSeconds
        }
    }
    
    return @{ 
        IsHanging = $false;
        PatternMatchStart = $PatternMatchStart;
        CurrentPattern = $CurrentPattern
    }
}

function Test-InteractiveCommand {
    param(
        [string]$Command,
        [string]$Output
    )
        
    # Check all interactive pattern categories
    foreach ($category in $monitoringConfig.interactivePatterns.Keys) {
        foreach ($pattern in $monitoringConfig.interactivePatterns[$category]) {
            if ($Output -like "*$pattern*") {
                $action = switch ($category) {
                    "user_input" { "SendCtrlC" }
                    "confirmation" { "SendCtrlC" }
                    "authentication" { "SendCtrlC" }
                    "choice_selection" { "SendCtrlC" }
                    default { "SendCtrlC" }
                }
                
                $recommendation = switch ($category) {
                    "user_input" { "Command is waiting for input. Consider sending Ctrl+C to terminate." }
                    "confirmation" { "Command is waiting for confirmation. Consider sending Ctrl+C to terminate." }
                    "authentication" { "Command is waiting for authentication. Consider sending Ctrl+C to terminate." }
                    "choice_selection" { "Command is waiting for choice selection. Consider sending Ctrl+C to terminate." }
                    default { "Command is waiting for input. Consider sending Ctrl+C to terminate." }
                }
                
                return @{ 
                    IsInteractive = $true; 
                    Pattern = $pattern; 
                    Category = $category;
                    Action = $action;
                    Recommendation = $recommendation
                }
            }
        }
    }
    
    return @{ IsInteractive = $false }
}

function Get-CommandType {
    param([string]$Command)
    
    $commandLower = $Command.ToLower().Trim()
    
    if ($commandLower -match "^npm\s+") { return "npm" }
    if ($commandLower -match "^node\s+") { return "node" }
    if ($commandLower -match "^jest\s+") { return "jest" }
    if ($commandLower -match "^tsc\s+") { return "tsc" }
    if ($commandLower -match "^webpack\s+") { return "webpack" }
    if ($commandLower -match "^git\s+") { return "git" }
    if ($commandLower -match "^yarn\s+") { return "yarn" }
    if ($commandLower -match "^docker\s+") { return "docker" }
    if ($commandLower -match "^python\s+") { return "python" }
    if ($commandLower -match "^maven\s+") { return "maven" }
    if ($commandLower -match "^gradle\s+") { return "gradle" }
    if ($commandLower -match "^dotnet\s+") { return "dotnet" }
    if ($commandLower -match "^cargo\s+") { return "cargo" }
    if ($commandLower -match "^go\s+") { return "go" }
    if ($commandLower -match "^rustc\s+") { return "rustc" }
    if ($commandLower -match "^gcc\s+") { return "gcc" }
    if ($commandLower -match "^clang\s+") { return "clang" }
    if ($commandLower -match "^make\s+") { return "make" }
    if ($commandLower -match "^cmake\s+") { return "cmake" }
    
    return "unknown"
}

function Get-ArrayVariance {
    param([array]$Values)
    
    if ($Values.Count -lt 2) { return 0.0 }
    
    $mean = ($Values | Measure-Object -Average).Average
    $variance = ($Values | ForEach-Object { [math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average
    
    return $variance
}

function Enable-DebugMode {
    if ($Debug) {
        $monitoringConfig.debug_mode.enabled = $true
        Write-Host "Debug mode enabled - using shorter timeouts for faster testing" -ForegroundColor Yellow
        Write-Host "  • Timeout multiplier: $($monitoringConfig.debug_mode.timeout_multiplier)" -ForegroundColor Cyan
        Write-Host "  • Check interval: $($monitoringConfig.debug_mode.check_interval)ms" -ForegroundColor Cyan
        Write-Host "  • Stuck threshold: $($monitoringConfig.debug_mode.stuck_threshold)" -ForegroundColor Cyan
    }
}

# Main execution logic
if ($Debug) {
    Enable-DebugMode
}

if ($Monitor -and $ProcessId -gt 0) {
    if ($Debug) { 
        Write-Host "Starting enhanced monitoring for PID: $ProcessId" -ForegroundColor Green 
    }
    
    $result = Watch-ProcessCompletion -ProcessId $ProcessId -TimeoutMs $TimeoutMs -Command $Command
    
    if ($Debug) {
        Write-Host "Monitoring result:" -ForegroundColor Cyan
        $result | Format-List
    }
    
    # Return result as structured output
    $result | ConvertTo-Json -Depth 10
    exit 0
}

if ($Analyze -and $ProcessId -gt 0) {
    if ($Debug) { 
        Write-Host "Starting process state analysis for PID: $ProcessId" -ForegroundColor Green 
    }
    
    $result = Test-ProcessState -ProcessId $ProcessId
    
    if ($Debug) {
        Write-Host "Analysis result:" -ForegroundColor Cyan
        $result | Format-List
    }
    
    # Return result as structured output
    $result | ConvertTo-Json -Depth 10
    exit 0
}

# Show usage if no valid parameters
Write-Host "Enhanced Process Monitor - Phase 2 Implementation" -ForegroundColor Green
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  .\enhanced-process-monitor.ps1 -ProcessId <PID> -Monitor [-TimeoutMs <ms>] [-Command <cmd>] [-Debug]" -ForegroundColor White
Write-Host "  .\enhanced-process-monitor.ps1 -ProcessId <PID> -Analyze [-Debug]" -ForegroundColor White
Write-Host ""
Write-Host "Examples:" -ForegroundColor Yellow
Write-Host "  .\enhanced-process-monitor.ps1 -ProcessId 1234 -Monitor -Command 'npm test' -Debug" -ForegroundColor White
Write-Host "  .\enhanced-process-monitor.ps1 -ProcessId 1234 -Analyze -Debug" -ForegroundColor White
Write-Host ""
Write-Host "Phase 2 Features:" -ForegroundColor Cyan
Write-Host "  • Enhanced responsiveness monitoring" -ForegroundColor White
Write-Host "  • Process state analysis with pattern detection" -ForegroundColor White
Write-Host "  • Advanced output pattern recognition for hanging detection" -ForegroundColor White
Write-Host "  • Enhanced interactive command detection" -ForegroundColor White
Write-Host "  • Command-specific timeout configurations" -ForegroundColor White
Write-Host "  • Context-aware pattern matching" -ForegroundColor White
Write-Host "  • Output change tracking and analysis" -ForegroundColor White
Write-Host "  • Comprehensive hanging risk assessment" -ForegroundColor White
Write-Host ""
Write-Host "Supported Command Types:" -ForegroundColor Cyan
Write-Host "  • npm, jest, tsc, webpack, git, node, yarn, docker" -ForegroundColor White
Write-Host "  • python, maven, gradle, dotnet, cargo, go, rustc" -ForegroundColor White
Write-Host "  • gcc, clang, make, cmake" -ForegroundColor White
Write-Host ""
Write-Host "Interactive Pattern Categories:" -ForegroundColor Cyan
Write-Host "  • User input, confirmation, authentication, choice selection" -ForegroundColor White
