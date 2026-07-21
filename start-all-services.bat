@echo off
echo ========================================
echo WhatsApp Marketing Bot - Startup Script
echo ========================================
echo This will start all services in separate windows:
echo 1. Backend Server (Port 5000)
echo 2. Frontend Server (Port 8080) 
echo 3. Cloudflared Tunnel
echo ========================================
echo.
pause

echo Starting Backend Server...
start "WhatsApp Bot - Backend" cmd /c "start-backend.bat"

echo Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "WhatsApp Bot - Frontend" cmd /c "start-frontend.bat"

echo Waiting 10 seconds for build to complete...
timeout /t 10 /nobreak > nul

echo Starting Cloudflared Tunnel...
start "WhatsApp Bot - Tunnel" cmd /c "start-tunnel.bat"

echo.
echo ========================================
echo All services started in separate windows!
echo ========================================
echo Frontend: http://localhost:8080
echo Backend: http://localhost:5000
echo External: https://connect.vemgootech.info
echo ========================================
pause