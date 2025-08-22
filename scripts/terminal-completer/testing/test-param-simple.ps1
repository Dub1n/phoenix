# Minimal parameter test script
param(
    [Parameter(Mandatory=$false)]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [switch]$Debug = $false
)

Write-Host "Command: $Command"
Write-Host "Debug: $Debug"

if ($Command) {
    Write-Host "Executing: $Command"
} else {
    Write-Host "No command specified"
}
