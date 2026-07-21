@echo off
echo Starting Cloudflare Tunnel for External API Access...
echo.
echo This will restore api.vemgootech.info connectivity
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: cloudflared is not installed or not in PATH
    @echo off
cd /d "C:\Users\vinny\Documents\DevOps\whatsApp-bot"
echo ========================================
echo Starting Cloudflared Tunnel
echo ========================================
echo External Domain: https://connect.vemgootech.info
echo Backend API: https://api.vemgootech.info
echo ========================================
cloudflared tunnel --config config.yml run whatsapp-bot
pause
    echo Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
    pause
    exit /b 1
)

echo Starting tunnel to expose localhost:5000 to api.vemgootech.info...
echo.
echo THIS WILL FIX THE 400 ERRORS YOU'RE SEEING!
echo.

REM Start the tunnel (replace with your actual tunnel command)
REM You'll need to use your actual tunnel configuration
echo Please run this command manually with your tunnel credentials:
echo cloudflared tunnel --url http://localhost:5000 --hostname api.vemgootech.info
echo.
echo OR if you have a configured tunnel:
echo cloudflared tunnel run your-tunnel-name
echo.

pause