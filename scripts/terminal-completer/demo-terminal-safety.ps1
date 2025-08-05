# Demo Terminal Safety Features
# Simple demonstration of automatic hanging prevention

Write-Host "=== Terminal Safety Demo ===" -ForegroundColor Green

# Demo 1: Quick command
Write-Host "`nDemo 1: Quick command" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "Quick command works"'

# Demo 2: NPM command
Write-Host "`nDemo 2: NPM command" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm --version'

# Demo 3: Timeout demonstration
Write-Host "`nDemo 3: Timeout demonstration" -ForegroundColor Yellow
Write-Host "This will timeout after 30 seconds..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'node -e "setTimeout(() => console.log(\"This should never print\"), 60000)"'

# Demo 4: Process cleanup
Write-Host "`nDemo 4: Process cleanup" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/kill-hanging.ps1

Write-Host "`n=== Demo Complete ===" -ForegroundColor Green
Write-Host "All demonstrations finished." -ForegroundColor Cyan 