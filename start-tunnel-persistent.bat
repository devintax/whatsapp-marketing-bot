@echo off
echo Starting Cloudflare Tunnel for External Domain Access...
echo This will keep the tunnel running for connect.vemgootech.info and api.vemgootech.info
echo.

:start
echo [%date% %time%] Starting tunnel...
cloudflared tunnel --config config.yml run
echo [%date% %time%] Tunnel stopped. Restarting in 5 seconds...
timeout /t 5 /nobreak
goto start