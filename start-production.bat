@echo off
echo.
echo ========================================
echo   Production Environment Startup
echo ========================================
echo.

REM Kill existing servers
echo [1/5] Stopping existing servers...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       [OK] Stopped existing Node processes
) else (
    echo       [INFO] No Node processes to stop
)
echo.

echo [2/5] Waiting 3 seconds...
timeout /t 3 /nobreak >nul
echo       [OK] Ready
echo.

echo [3/5] Starting BACKEND server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo       [OK] Backend started in new window
echo.

echo [4/5] Starting FRONTEND production server (Port 8080)...
start "Frontend Server" cmd /k "cd frontend && npx serve -s build -l 8080"
timeout /t 2 /nobreak >nul
echo       [OK] Frontend started in new window
echo.

echo [5/5] Opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:8080
echo       [OK] Browser opened
echo.

echo ========================================
echo   Production Environment Ready!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Both servers running in separate windows
echo Close those windows to stop the servers
echo.
pause
