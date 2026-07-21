# Manual Campaign Test - PowerShell Script
Write-Host "🧪 MANUAL CAMPAIGN E2E TEST" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Sending test campaign to:" -ForegroundColor Yellow
Write-Host "   • +14432072634" -ForegroundColor White
Write-Host "   • +13028979466" -ForegroundColor White  
Write-Host "   • +13479324435" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Running test..." -ForegroundColor Cyan

# Change to backend directory
Set-Location "C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend"

# Run the test
try {
    node direct-test.js
    Write-Host ""
    Write-Host "✅ Test execution completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📱 Please check your WhatsApp messages!" -ForegroundColor Yellow
Write-Host "🖼️ Images should show as ACTUAL PICTURES (not [IMAGE:] text)" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"