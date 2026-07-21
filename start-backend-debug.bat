@echo off
echo Starting WhatsApp Marketing Bot Backend Server...
cd /d "C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend"
echo Current directory: %CD%
echo.
echo Checking if server.js exists...
if exist server.js (
    echo ✅ server.js found
) else (
    echo ❌ server.js not found
    pause
    exit /b 1
)
echo.
echo Starting server...
node server.js
pause