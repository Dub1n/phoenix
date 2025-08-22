# Visible Background Heartbeat System
# Uses console manipulation to write heartbeat symbols directly to the active terminal

param(
    [int]$IntervalSeconds = 1,
    [int]$MaxHeartbeats = 300,
    [switch]$Debug = $false
)

# Try to get the parent console
Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    
    public class ConsoleHelper {
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr GetConsoleWindow();
        
        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr GetActiveWindow();
        
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool AttachConsole(int dwProcessId);
        
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool AllocConsole();
        
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool FreeConsole();
    }
"@

# Configuration
$heartbeatSymbols = @("*", "+", "x", "o")
$heartbeatCount = 0

try {
    # Get console window handle
    $consoleWindow = [ConsoleHelper]::GetConsoleWindow()
    
    if ($Debug) {
        Write-Host "[Visible-HB] Starting visible background heartbeat" -ForegroundColor Green
        Write-Host "[Visible-HB] Console window handle: $consoleWindow" -ForegroundColor Gray
        Write-Host "[Visible-HB] Will execute $MaxHeartbeats heartbeats every $IntervalSeconds seconds" -ForegroundColor Cyan
    }
    
    # Main heartbeat loop
    while ($heartbeatCount -lt $MaxHeartbeats) {
        $heartbeatCount++
        
        # Get symbol for this heartbeat
        $symbolIndex = ($heartbeatCount - 1) % $heartbeatSymbols.Count
        $symbol = $heartbeatSymbols[$symbolIndex]
        
        try {
            # Method 1: Direct console output using .NET Console class
            [System.Console]::WriteLine($symbol)
            
            if ($Debug) {
                Write-Host "[Visible-HB] Heartbeat #$heartbeatCount - Symbol: $symbol" -ForegroundColor Green
            }
        }
        catch {
            if ($Debug) {
                Write-Host "[Visible-HB] Console output failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Method 2: Fallback to standard output
            Write-Output $symbol
        }
        
        # Wait for next heartbeat
        Start-Sleep -Seconds $IntervalSeconds
    }
    
    if ($Debug) {
        Write-Host "[Visible-HB] Visible background heartbeat completed" -ForegroundColor Green
    }
}
catch {
    if ($Debug) {
        Write-Host "[Visible-HB] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}
finally {
    if ($Debug) {
        Write-Host "[Visible-HB] Visible background heartbeat stopped" -ForegroundColor Yellow
    }
}