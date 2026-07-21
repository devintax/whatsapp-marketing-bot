@echo off
echo.
echo ========================================
echo   Backend Server - Clean Start
echo ========================================
echo.

REM Kill all node processes
echo [1/4] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       [OK] Node processes stopped
) else (
    echo       [INFO] No Node processes running
)
echo.

REM Clear PORT environment variable
echo [2/4] Clearing PORT environment variable...
set PORT=
echo       [OK] Environment cleared
echo.

REM Wait 2 seconds
echo [3/4] Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo       [OK] Ready
echo.

REM Start backend
echo [4/4] Starting backend server...
echo.
echo ========================================
echo   Backend Starting (Port 5000)
echo ========================================
echo.
cd backend
npm run dev
