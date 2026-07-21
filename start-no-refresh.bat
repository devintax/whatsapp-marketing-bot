@echo off
title WhatsApp Bot - No Refresh Loop Startup

echo ========================================
echo  WhatsApp Bot - Anti-Refresh Startup
echo ========================================
echo.

echo Killing any existing processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM npm.exe /T >nul 2>&1

echo.
echo Clearing React cache...
rmdir /s /q "frontend\node_modules\.cache" >nul 2>&1
rmdir /s /q "frontend\build" >nul 2>&1

echo.
echo Starting Backend Server...
start "Backend Server" /D "%~dp0backend" cmd /c "echo Backend Starting... && node server.js && pause"

echo.
echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo Starting Frontend Server (No Refresh Mode)...
cd /d "%~dp0frontend"
set FAST_REFRESH=false
set BROWSER=none
set REACT_APP_FORCE_LOCALHOST=true
npm start

echo.
echo If page refreshes continuously, access: http://localhost:3000
pause