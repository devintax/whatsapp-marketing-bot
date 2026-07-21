@echo off
echo.
echo ========================================
echo   WhatsApp Bot - Backend Server Fix
echo ========================================
echo.
echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Processes terminated
) else (
    echo    [INFO] No Node.js processes running
)
echo.
echo Step 2: Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo    [OK] Ready
echo.
echo Step 3: Starting backend server...
echo.
echo ========================================
echo   Backend Server Starting Below
echo ========================================
echo.
cd backend
npm run dev
