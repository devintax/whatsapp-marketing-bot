@echo off
cd /d "C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend"
echo ========================================
echo Starting WhatsApp Bot Frontend (Production)
echo ========================================
echo Frontend will be available at: http://localhost:8080
echo External Domain: https://connect.vemgootech.info
echo ========================================
echo Building production version...
call npm run build
echo.
echo Starting production server with SPA support...
npx serve -s build -l 8080 --single
pause