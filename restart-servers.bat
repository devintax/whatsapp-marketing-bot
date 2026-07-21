@echo off
echo ===============================================
echo    WhatsApp Marketing Bot - Server Restart
echo ===============================================
echo.

echo [1/4] Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/4] Starting Backend Server (Port 5000)...
cd /d "C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend"
start "Backend Server" cmd /k "echo Backend Server Starting... && node server.js"
timeout /t 3 >nul

echo [3/4] Starting Frontend Server (Port 3000)...
cd /d "C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend"
start "Frontend Server" cmd /k "echo Frontend Server Starting... && npm start"
timeout /t 3 >nul

echo [4/4] Checking server status...
echo.
echo Backend (Port 5000): http://localhost:5000/api/health
echo Frontend (Port 3000): http://localhost:3000
echo.
echo ===============================================
echo Both servers are starting in separate windows
echo ===============================================
echo.
echo Press any key to exit this script...
pause >nul