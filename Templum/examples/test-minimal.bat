@echo off
REM Test Script for Minimal Templum Backend
REM This script starts the backend, tests connectivity, and runs basic commands

echo ================================================
echo Testing Minimal Templum Backend
echo ================================================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo Node.js detected: %node --version%
echo.

REM Navigate to the backend directory
cd /d "%~dp0minimal-backend"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        exit /b 1
    )
    echo.
)

echo Starting minimal backend server...
echo (Press Ctrl+C to stop the server when done testing)
echo.

REM Start the backend server in background
start /b cmd /c "node server.js > backend.log 2>&1"

REM Wait a moment for server to start
timeout /t 3 /nobreak > nul

REM Test health endpoint
echo Testing health endpoint...
curl -s http://localhost:3001/health
if %errorlevel% neq 0 (
    echo ERROR: Backend server is not responding
    echo Check backend.log for error details
    exit /b 1
)

echo.
echo.

REM Test skin definition endpoint
echo Testing skin definition endpoint...
curl -s http://localhost:3001/getSkinDefinition
echo.
echo.

REM Test hello command
echo Testing hello command...
curl -s -X POST http://localhost:3001/executeCommand ^
  -H "Content-Type: application/json" ^
  -d "{\"command\": \"example.hello\", \"args\": {\"name\": \"Tester\"}}"
echo.
echo.

REM Test status command
echo Testing status command...
curl -s -X POST http://localhost:3001/executeCommand ^
  -H "Content-Type: application/json" ^
  -d "{\"command\": \"example.status\"}"
echo.
echo.

echo ================================================
echo Basic tests completed successfully!
echo ================================================
echo.
echo Backend is running at: http://localhost:3001
echo You can now:
echo   1. Use the minimal CLI: npx ts-node ../minimal-cli.ts
echo   2. Start full Templum and it will discover this backend
echo   3. Test commands manually with curl
echo.
echo Backend log is in: minimal-backend/backend.log
echo Press any key to stop the backend server...
pause > nul

REM Kill the background server process
taskkill /f /im node.exe > nul 2>&1

echo Backend stopped.
echo Test complete.