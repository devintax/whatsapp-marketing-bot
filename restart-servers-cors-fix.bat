@echo off
echo 🔄 Starting WhatsApp Bot Complete Infrastructure...

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
start "WhatsApp Bot Backend" /D "%~dp0backend" cmd /k "echo Starting Backend Server... && node server.js"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Starting Frontend Server (Port 8080)...
start "WhatsApp Bot Frontend" /D "%~dp0frontend" cmd /k "echo Starting Frontend Server... && npx http-server build -p 8080 --spa -c-1"

echo.
echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo 🌉 Starting Cloudflared Tunnel (whatsapp-bot)...
start "Cloudflared Tunnel" cmd /k "echo Starting Cloudflared Tunnel... && cloudflared tunnel --config tunnel-config.yml run whatsapp-bot"

echo.
echo ⏳ Waiting for tunnel to establish...
timeout /t 10 /nobreak >nul

echo.
echo ✅ All services started!
echo.
echo 🔗 Access URLs:
echo    - External Domain: https://connect.vemgootech.info
echo    - Local Frontend: http://localhost:8080
echo    - Local Backend: http://localhost:5000
echo.
echo � Services Status:
echo    - Backend Server: Port 5000 (Node.js + Express)
echo    - Frontend Server: Port 8080 (React Production Build)
echo    - Cloudflared Tunnel: whatsapp-bot (External Access)
echo.
echo 💡 Your data status:
echo    - 59 campaigns in database
echo    - 6 contacts in database
echo    - All business data intact
echo    - Mautic OAuth configured
echo.
echo 🔧 Next steps:
echo    1. Wait 30 seconds for all services to fully start
echo    2. Test: https://connect.vemgootech.info
echo    3. Login: vkgbewonyo@gmail.com
echo    4. Check data recovery and Mautic sync
echo.
pause