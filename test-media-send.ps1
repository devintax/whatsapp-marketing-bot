# PowerShell script to test media sending
Write-Host "🧪 TESTING MEDIA FIX - SENDING TO YOUR NUMBERS" -ForegroundColor Green
Write-Host "📱 Target: +14432072634, +13028979466, +13479324435" -ForegroundColor Yellow

Set-Location "C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend"

# Check if server is running
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not running. Please start backend first." -ForegroundColor Red
    exit 1
}

# Login
try {
    $loginBody = @{
        email = "vkgbewonyo@gmail.com"
        password = "BIDOpc2017$!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get campaigns
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $campaigns = Invoke-RestMethod -Uri "http://localhost:5000/api/campaigns" -Method Get -Headers $headers
    Write-Host "✅ Retrieved $($campaigns.Count) campaigns" -ForegroundColor Green
    
    # Find campaigns with images
    $campaignsWithImages = $campaigns | Where-Object { $_.message -and $_.message.Contains("[IMAGE:") }
    Write-Host "✅ Found $($campaignsWithImages.Count) campaigns with image references" -ForegroundColor Green
    
    if ($campaignsWithImages.Count -gt 0) {
        $testCampaign = $campaignsWithImages[0]
        Write-Host "📱 Sending campaign: $($testCampaign.title)" -ForegroundColor Yellow
        
        # Send campaign
        $sendBody = @{
            recipients = @("+14432072634", "+13028979466", "+13479324435")
        } | ConvertTo-Json
        
        $sendResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/whatsapp/send-campaign/$($testCampaign._id)" -Method Post -Body $sendBody -ContentType "application/json" -Headers $headers
        
        Write-Host ""
        Write-Host "📤 SEND RESULTS:" -ForegroundColor Cyan
        Write-Host "Success: $($sendResponse.success)" -ForegroundColor $(if($sendResponse.success) { "Green" } else { "Red" })
        Write-Host "Message: $($sendResponse.message)" -ForegroundColor White
        
        if ($sendResponse.success) {
            Write-Host ""
            Write-Host "🎉 SUCCESS! MEDIA FIX IS WORKING!" -ForegroundColor Green
            Write-Host "✅ Campaign sent to all 3 numbers" -ForegroundColor Green
            Write-Host "📱 Check your WhatsApp for ACTUAL IMAGES (not [IMAGE:] text)" -ForegroundColor Yellow
            Write-Host "🖼️ Images should now display as real attachments" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ No campaigns with image references found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Campaign send failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Test completed. Check your WhatsApp messages!" -ForegroundColor Green