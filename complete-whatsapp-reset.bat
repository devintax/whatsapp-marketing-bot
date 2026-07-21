@echo off
echo ═══════════════════════════════════════════════════════
echo 🔧 COMPLETE WHATSAPP CONNECTION RESET
echo ═══════════════════════════════════════════════════════
echo.

echo Step 1: Stopping ALL Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Node.js processes stopped
) else (
    echo    ℹ️  No Node.js processes were running
)
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Deleting WhatsApp session files...
cd /d "%~dp0backend\whatsapp_sessions"
if exist "session-*" (
    rd /s /q "session-*" 2>nul
    echo    ✅ Session folders deleted
) else (
    echo    ℹ️  No session folders found
)

if exist "session_status_*.json" (
    del /f /q "session_status_*.json" 2>nul
    echo    ✅ Status files deleted
) else (
    echo    ℹ️  No status files found
)

echo.
echo Step 3: Clearing any Chrome/Chromium cache...
if exist "%LOCALAPPDATA%\Temp\puppeteer_*" (
    rd /s /q "%LOCALAPPDATA%\Temp\puppeteer_*" 2>nul
    echo    ✅ Puppeteer cache cleared
) else (
    echo    ℹ️  No Puppeteer cache found
)

echo.
echo ═══════════════════════════════════════════════════════
echo ✅ CLEANUP COMPLETE!
echo ═══════════════════════════════════════════════════════
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. Start backend:
echo    cd backend
echo    node server.js
echo.
echo 2. In your browser (connect.vemgootech.info ONLY):
echo    - Press Ctrl+Shift+Delete
echo    - Clear "Cached images and files"
echo    - Clear "Cookies and other site data"
echo    - Click "Clear data"
echo    - Hard refresh: Ctrl+Shift+R
echo.
echo 3. Login to the app
echo.
echo 4. Go to Settings
echo.
echo 5. Click "Connect WhatsApp"
echo.
echo 6. Wait 10-30 seconds for QR code
echo.
echo 7. Scan with phone
echo.
echo ═══════════════════════════════════════════════════════
pause
