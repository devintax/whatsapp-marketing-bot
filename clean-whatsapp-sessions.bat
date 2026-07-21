@echo off
echo ========================================
echo WhatsApp Session Cleanup Tool
echo ========================================
echo.
echo This will delete all WhatsApp session files
echo to fix connection issues.
echo.
pause

echo.
echo Stopping backend server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Deleting session files...
cd /d "%~dp0backend\whatsapp_sessions"
if exist "session-*" (
    rd /s /q "session-*" 2>nul
)
if exist "session_status_*.json" (
    del /f /q "session_status_*.json" 2>nul
)

echo.
echo ========================================
echo Session files cleaned!
echo ========================================
echo.
echo Next steps:
echo 1. Restart backend server
echo 2. Clear browser cache (Ctrl+Shift+Delete)
echo 3. Go to Settings -^> WhatsApp Connection
echo 4. Click "Connect WhatsApp"
echo 5. Scan the NEW QR code
echo.
echo IMPORTANT: Make sure you scan from
echo WhatsApp -^> Settings -^> Linked Devices
echo.
pause
