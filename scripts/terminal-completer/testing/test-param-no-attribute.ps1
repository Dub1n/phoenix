# Minimal parameter test script without Parameter attribute
param(
    [string]$Command,
    [switch]$Debug
)

Write-Host "Command: $Command"
Write-Host "Debug: $Debug"

if ($Command) {
    Write-Host "Executing: $Command"
} else {
    Write-Host "No command specified"
}
