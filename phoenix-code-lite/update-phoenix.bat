@echo off
echo ====================================
echo Phoenix Code Lite Update Script
echo ====================================
echo.

echo 🔧 Building TypeScript project...
cd /d "C:\Users\gabri\Documents\Infotopology\Phoenix\phoenix-code-lite"
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Check for TypeScript errors.
    pause
    exit /b 1
)

echo.
echo 🔗 Updating global npm link...
npm unlink -g phoenix-code-lite >nul 2>&1
npm link
if %errorlevel% neq 0 (
    echo ❌ Failed to link package globally!
    pause
    exit /b 1
)

echo.
echo ✅ Phoenix Code Lite updated successfully!
echo.
echo 📋 Available commands:
echo   phoenix-code-lite --help
echo   phoenix-code-lite config --edit
echo   phoenix-code-lite template
echo.
echo 🎯 Testing installation:
phoenix-code-lite --version
echo.
pause