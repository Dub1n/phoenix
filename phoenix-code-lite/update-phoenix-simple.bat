@echo off
echo ====================================
echo Phoenix Code Lite Update Script
echo ====================================

pushd "C:\Users\gabri\Documents\Infotopology\Phoenix\phoenix-code-lite"

echo Building TypeScript project...
call npm run build
if errorlevel 1 (
    echo Build failed!
    popd
    pause
    exit /b 1
)

echo Updating global npm link...
call npm unlink -g phoenix-code-lite
call npm link

echo.
echo Phoenix Code Lite updated successfully!
echo Testing installation:
call phoenix-code-lite --version

popd
pause