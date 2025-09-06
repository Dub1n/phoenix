#!/bin/bash
# Templum CLI Automation Test Script - Claude Code Agent Version
# Purpose: Test Templum CLI using piped input - optimized for Claude Code Bash tool

set -e  # Exit on error

echo "=== Templum CLI Automation Test ==="
echo "Designed for Claude Code agent execution"
echo ""

# Navigate to Templum directory
cd "c:/Users/gabri/Documents/Infotopology/VDL_Vault/Templum"

echo "Starting Templum main application in background..."
# Start main app in background - let it run
node "../Templum/dist/src/index.js" &
MAIN_PID=$!

echo "Main app PID: $MAIN_PID"
echo "Waiting 3 seconds for startup..."
sleep 3

echo "Testing CLI with basic commands..."

# Test CLI with piped input based on Universal Interface Orchestrator pattern
# Commands based on Templum 1.2 CLI Process Separation architecture
{
  echo "help"        # Command help and usage
  echo "status"      # Service and backend connection status
  echo "list"        # List available backends/services  
  echo "config"      # Configuration management
  echo "version"     # Version information
  echo "exit"        # Exit CLI
} | npm run start:cli

CLI_EXIT_CODE=$?

echo ""
echo "=== Test Results ==="
echo "CLI Exit Code: $CLI_EXIT_CODE"
echo "Main App PID: $MAIN_PID (check if still running)"

# Check if main app is still running
if kill -0 $MAIN_PID 2>/dev/null; then
    echo "Main app is still running"
    echo "Stopping main app..."
    kill $MAIN_PID 2>/dev/null || true
else
    echo "Main app has already stopped"
fi

echo "Test completed!"

# Save results to a simple text file that I can read later
cat > "dev/auto/cli-test-results.txt" << EOF
Templum CLI Test Results
========================
Date: $(date)
CLI Exit Code: $CLI_EXIT_CODE
Main App PID: $MAIN_PID
Test Status: $([ $CLI_EXIT_CODE -eq 0 ] && echo "SUCCESS" || echo "FAILED")

Commands tested (Universal Interface Orchestrator pattern):
- help (command help and usage)
- status (service and backend connection status)  
- list (available backends/services)
- config (configuration management)
- version (version information)
- exit (exit CLI)

Notes:
- Used piped input (ideal for Claude Code agents)
- Background process management with PID tracking
- Simple text output for easy agent parsing
EOF

echo "Results saved to dev/auto/cli-test-results.txt"