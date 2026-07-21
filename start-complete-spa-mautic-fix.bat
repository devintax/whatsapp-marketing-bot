@echo off
echo 🔄 Starting WhatsApp Bot with COMPLETE SPA + MAUTIC FIX...

echo.
echo 🛑 Stopping all existing processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM http-server.exe /T 2>nul
taskkill /F /IM cloudflared.exe /T 2>nul

echo.
echo ⏳ Waiting for processes to stop...
timeout /t 5 /nobreak >nul

echo.
echo 🏗️ Ensuring frontend build exists...
cd frontend
if not exist "build" (
    echo 📦 Building React app for production...
    npm run build
) else (
    echo ✅ Frontend build exists
)
cd ..

echo.
echo 🚀 Starting Backend Server (Port 5000)...
start "Backend - Mautic Fixed" /D "%~dp0backend" cmd /k "echo [BACKEND] Starting with Mautic OAuth2 support... && echo [BACKEND] API Endpoints: /api/auth, /api/crm/mautic/callback && echo [BACKEND] OAuth2 redirect URI: https://connect.vemgootech.info/api/crm/mautic/callback && node server.js"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 Starting Frontend Server with SPA Routing (Port 8080)...
start "Frontend - SPA Routing Fixed" /D "%~dp0frontend" cmd /k "echo [FRONTEND] Starting with ENHANCED SPA routing... && echo [FRONTEND] All routes will fallback to index.html && echo [FRONTEND] /dashboard, /contacts, /campaigns all supported && npx http-server build -p 8080 --spa --cors -c-1"

echo.
echo ⏳ Waiting for frontend to start...
timeout /t 8 /nobreak >nul

echo.
echo 🌉 Starting Cloudflared Tunnel with ENHANCED SPA Support...
start "Tunnel - SPA + API Routing Fixed" cmd /k "echo [TUNNEL] Enhanced configuration loading... && echo [TUNNEL] /api/* -^> Backend (localhost:5000) && echo [TUNNEL] /* -^> Frontend SPA (localhost:8080) && echo [TUNNEL] SPA routing: /dashboard, /contacts, /campaigns supported && cloudflared tunnel --config tunnel-config.yml run whatsapp-bot"

echo.
echo ⏳ Waiting for tunnel to establish...
timeout /t 15 /nobreak >nul

echo.
echo ✅ ALL SERVICES STARTED WITH COMPLETE FIXES!
echo.
echo 🔗 ACCESS URLS:
echo    🌐 External: https://connect.vemgootech.info
echo    📊 Dashboard: https://connect.vemgootech.info/dashboard
echo    👥 Contacts: https://connect.vemgootech.info/contacts
echo    📧 Campaigns: https://connect.vemgootech.info/campaigns
echo    🔧 Local Frontend: http://localhost:8080
echo    🔌 Local API: http://localhost:5000
echo.
echo 🔧 FIXES APPLIED:
echo    ✅ Enhanced SPA routing (no more 404 on refresh)
echo    ✅ Proper httpHostHeader in tunnel config
echo    ✅ Frontend served with --spa --cors flags
echo    ✅ OAuth2 redirect URI: /api/crm/mautic/callback
echo    ✅ Enhanced tunnel timeout settings
echo.
echo 🎯 MAUTIC OAUTH FIX REQUIRED:
echo    1. Login to: https://dfgbusiness.com/mautic
echo    2. Go to: Settings ^> API Credentials
echo    3. Find Client ID: 1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw
echo    4. Update Redirect URI to: https://connect.vemgootech.info/api/crm/mautic/callback
echo    5. Ensure Status: Published/Active
echo.
echo 🧪 TEST SEQUENCE:
echo    1. Wait 30 seconds for all services to stabilize
echo    2. Test: https://connect.vemgootech.info (should load)
echo    3. Test: https://connect.vemgootech.info/dashboard (no 404)
echo    4. Refresh any page (should work without 404)
echo    5. After Mautic OAuth fix: Test contact sync
echo.
echo 🔍 TROUBLESHOOTING:
echo    - If still 404 on refresh: Check frontend build exists
echo    - If API calls fail: Check tunnel logs window
echo    - If Mautic sync fails: Complete OAuth configuration first
echo.
pause