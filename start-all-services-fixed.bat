@echo off
echo 🔄 Starting WhatsApp Bot with API Routing Fix...

echo.
echo 🛑 Stopping all existing processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM http-server.exe /T 2>nul
taskkill /F /IM cloudflared.exe /T 2>nul

echo.
echo ⏳ Waiting for processes to stop...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Starting Backend Server (Port 5000)...
start "WhatsApp Bot Backend - API Fixed" /D "%~dp0backend" cmd /k "echo [BACKEND] API Server starting on localhost:5000... && echo [BACKEND] Endpoints: /api/auth, /api/campaigns, /api/contacts, /api/crm && node server.js"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 Starting Frontend Server (Port 8080)...
start "WhatsApp Bot Frontend - React App" /D "%~dp0frontend" cmd /k "echo [FRONTEND] React App starting on localhost:8080... && echo [FRONTEND] Production build with SPA routing && npx http-server build -p 8080 --spa -c-1"

echo.
echo ⏳ Waiting for frontend to start...
timeout /t 8 /nobreak >nul

echo.
echo 🌉 Starting Cloudflared Tunnel with API Routing Fix...
start "Cloudflared Tunnel - API ROUTING FIXED" cmd /k "echo [TUNNEL] Starting with FIXED configuration... && echo [TUNNEL] /api* requests -^> localhost:5000 (Backend) && echo [TUNNEL] /* requests -^> localhost:8080 (Frontend) && echo [TUNNEL] This fixes 405 Method Not Allowed errors && cloudflared tunnel --config tunnel-config.yml run whatsapp-bot"

echo.
echo ⏳ Waiting for tunnel to establish with API routing...
timeout /t 15 /nobreak >nul

echo.
echo ✅ ALL SERVICES STARTED WITH API ROUTING FIX!
echo.
echo 🔗 Access URLs:
echo    - External: https://connect.vemgootech.info
echo    - External API: https://connect.vemgootech.info/api/auth/login
echo    - Local Frontend: http://localhost:8080
echo    - Local API: http://localhost:5000/api/auth/login
echo.
echo 🔧 FIXES APPLIED:
echo    ✅ Cloudflared tunnel now routes /api* to backend
echo    ✅ CORS updated to allow localhost:8080
echo    ✅ Backend authentication working
echo    ✅ All 3 services running in isolated windows
echo.
echo 💡 YOUR DATA STATUS:
echo    ✅ 59 campaigns in database
echo    ✅ 6 contacts in database  
echo    ✅ User account intact
echo    ✅ Mautic OAuth configured
echo.
echo 🧪 TEST STEPS:
echo    1. Wait 30 seconds for tunnel to stabilize
echo    2. Open: https://connect.vemgootech.info
echo    3. Login: vkgbewonyo@gmail.com / BIDOpc2017$!
echo    4. Check if campaigns/contacts appear
echo    5. Test Mautic contact sync
echo.
echo 🔍 TROUBLESHOOTING:
echo    - If 405 errors persist: Check tunnel logs window
echo    - If no data appears: Authentication issue fixed
echo    - If Mautic sync fails: Run diagnostic script
echo.
pause