@echo off
echo ═══════════════════════════════════════════════════════
echo 🔧 COMPLETE BACKEND RESTART (Stop ALL Environments)
echo ═══════════════════════════════════════════════════════
echo.

echo Step 1: Killing ALL Node.js processes (localhost + production)...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ All Node.js processes stopped
) else (
    echo    ℹ️  No Node.js processes running
)
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Deleting WhatsApp session files...
cd /d "%~dp0backend\whatsapp_sessions"
if exist "session-*" (
    rd /s /q "session-*" 2>nul
    echo    ✅ Session folders deleted
)
if exist "session_status_*.json" (
    del /f /q "session_status_*.json" 2>nul
    echo    ✅ Status files deleted
)

echo.
echo Step 3: Starting backend in NEW window...
cd /d "%~dp0backend"
start "WhatsApp Bot Backend" cmd /k "node server.js"
echo    ✅ Backend starting in new window...
timeout /t 2 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════
echo ✅ RESTART COMPLETE!
echo ═══════════════════════════════════════════════════════
echo.
echo 🔧 CRITICAL FIX APPLIED:
echo    - Removed duplicate /status endpoint
echo    - Fixed canSendMessages validation
echo    - Now checks if client.isReady === true
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. Close ALL browser tabs (localhost + production)
echo.
echo 2. Open ONLY: https://connect.vemgootech.info
echo.
echo 3. Hard refresh: Ctrl+Shift+R
echo.
echo 4. Login
echo.
echo 5. Settings → Connect WhatsApp
echo.
echo 6. Wait for QR code (10-30 seconds)
echo.
echo 7. Scan with phone
echo.
echo 8. Wait for "Status: Connected" + green checkmark
echo.
echo 9. ONLY THEN try to send a test message
echo.
echo ⚠️  DO NOT try to send messages when it says:
echo     "isReady: false" - wait for "isReady: true"
echo.
echo ═══════════════════════════════════════════════════════
pause
