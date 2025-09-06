@echo off
echo ESLint Unused Variables Fixer
echo ==============================
echo.
echo This script will automatically fix unused variable errors by adding underscore prefixes.
echo.
echo Choose an option:
echo 1. Preview changes (dry-run)
echo 2. Apply fixes
echo 3. Exit
echo.
set /p choice=Enter your choice (1-3): 

if "%choice%"=="1" (
    echo.
    echo Running dry-run preview...
    node eslint-unused-vars-fixer.js --dry-run
) else if "%choice%"=="2" (
    echo.
    echo Applying fixes...
    node eslint-unused-vars-fixer.js
    echo.
    echo Done! You can now run ESLint again to verify the fixes:
    echo cd "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum" && npx eslint --format=compact | findstr "unused"
) else if "%choice%"=="3" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Exiting...
    exit /b 1
)

echo.
pause