@echo off
echo 🔧 FIXING FRONTEND SPA ROUTING - ENHANCED VERSION

echo.
echo 🛑 Stopping frontend and tunnel only...
taskkill /F /IM http-server.exe /T 2>nul
taskkill /F /IM cloudflared.exe /T 2>nul

echo.
echo ⏳ Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo.
echo 📦 Verifying frontend build...
cd frontend
if not exist "build\index.html" (
    echo ❌ Frontend build missing! Building now...
    npm run build
) else (
    echo ✅ Frontend build exists with index.html
)

echo.
echo 🌐 Starting Frontend with EXPLICIT SPA configuration...
start "Frontend - SPA FIXED" cmd /k "echo [FRONTEND] Enhanced SPA routing with explicit fallback && echo [FRONTEND] Command: http-server build -p 8080 --spa --cors -c-1 && echo [FRONTEND] SPA flag ensures all routes serve index.html && npx http-server build -p 8080 --spa --cors -c-1 -o"

cd ..

echo.
echo ⏳ Waiting for frontend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🌉 Starting Cloudflared with VERBOSE SPA configuration...
start "Tunnel - VERBOSE SPA CONFIG" cmd /k "echo [TUNNEL] Verbose configuration loading... && echo [TUNNEL] Config file: tunnel-config.yml && echo [TUNNEL] Frontend: localhost:8080 with SPA support && echo [TUNNEL] API: localhost:5000 for /api/* paths && cloudflared tunnel --config tunnel-config.yml run whatsapp-bot --loglevel debug"

echo.
echo ⏳ Waiting for tunnel to establish with verbose logging...
timeout /t 20 /nobreak >nul

echo.
echo ✅ ENHANCED SPA + TUNNEL CONFIGURATION COMPLETE!
echo.
echo 🧪 TEST THESE URLS NOW:
echo    🌐 Root: https://connect.vemgootech.info
echo    📊 Dashboard: https://connect.vemgootech.info/dashboard
echo    👥 Contacts: https://connect.vemgootech.info/contacts
echo    🔄 Try refreshing each page multiple times
echo.
echo 🔍 DEBUGGING INFO:
echo    - Frontend: localhost:8080 with --spa flag
echo    - Tunnel: Debug logging enabled
echo    - Config: Enhanced httpHostHeader settings
echo.
echo 💡 If still 404: Check tunnel logs window for routing details
echo.
pause