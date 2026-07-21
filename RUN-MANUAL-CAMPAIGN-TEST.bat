@echo off
cls
echo.
echo 🧪 MANUAL CAMPAIGN E2E TEST
echo ==========================
echo.
echo 📱 Sending test campaign to:
echo    • +14432072634
echo    • +13028979466  
echo    • +13479324435
echo.
echo 🔄 Running test...
echo.

cd /d "C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend"

node direct-test.js

echo.
echo 📱 Please check your WhatsApp messages!
echo 🖼️ Images should show as ACTUAL PICTURES (not [IMAGE:] text)
echo.
pause