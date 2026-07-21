#!/usr/bin/env pwsh

# Deep Dive End-to-End Testing Script
# This will verify and fix all CORS/API issues

Write-Host "🔍 DEEP DIVE END-TO-END TESTING - ROOT CAUSE ANALYSIS" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Yellow

# Step 1: Check current environment files
Write-Host "`n1. 📁 Checking Environment Files..." -ForegroundColor Cyan

$frontendPath = "C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend"

if (Test-Path "$frontendPath\.env.local") {
    Write-Host "   📄 .env.local contents:" -ForegroundColor Yellow
    Get-Content "$frontendPath\.env.local" | ForEach-Object { Write-Host "      $_" }
}

if (Test-Path "$frontendPath\.env.development") {
    Write-Host "   📄 .env.development contents:" -ForegroundColor Yellow
    Get-Content "$frontendPath\.env.development" | ForEach-Object { Write-Host "      $_" }
}

if (Test-Path "$frontendPath\.env") {
    Write-Host "   📄 .env contents:" -ForegroundColor Yellow
    Get-Content "$frontendPath\.env" | ForEach-Object { Write-Host "      $_" }
}

# Step 2: Check API configuration
Write-Host "`n2. 🔧 Checking API Configuration..." -ForegroundColor Cyan

$apiConfigPath = "$frontendPath\src\config\api.js"
if (Test-Path $apiConfigPath) {
    $apiConfig = Get-Content $apiConfigPath -Raw
    if ($apiConfig -match "connect\.vemgootech\.info") {
        Write-Host "   ✅ API config has external domain detection" -ForegroundColor Green
    } else {
        Write-Host "   ❌ API config missing external domain detection" -ForegroundColor Red
    }
    
    if ($apiConfig -match "api\.vemgootech\.info") {
        Write-Host "   ✅ API config has correct tunnel domain" -ForegroundColor Green
    } else {
        Write-Host "   ❌ API config missing tunnel domain" -ForegroundColor Red
    }
}

# Step 3: Check running processes
Write-Host "`n3. 🔍 Checking Running Processes..." -ForegroundColor Cyan

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   📊 Found $($nodeProcesses.Count) Node.js processes:" -ForegroundColor Yellow
    foreach ($process in $nodeProcesses) {
        Write-Host "      PID: $($process.Id), StartTime: $($process.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ No Node.js processes running" -ForegroundColor Red
}

# Step 4: Check port availability
Write-Host "`n4. 🌐 Checking Port Availability..." -ForegroundColor Cyan

$ports = @(3000, 5000, 8080)
foreach ($port in $ports) {
    $connection = netstat -ano | Select-String ":$port "
    if ($connection) {
        Write-Host "   📍 Port $port is in use: $($connection[0])" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Port $port is available" -ForegroundColor Green
    }
}

# Step 5: Test API connectivity
Write-Host "`n5. 🔗 Testing API Connectivity..." -ForegroundColor Cyan

$apiEndpoints = @(
    @{ Name = "Localhost Backend"; Url = "http://localhost:5000/" },
    @{ Name = "Tunnel API"; Url = "https://api.vemgootech.info/" }
)

foreach ($endpoint in $apiEndpoints) {
    try {
        Write-Host "   Testing $($endpoint.Name)..." -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ $($endpoint.Name): Status $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($endpoint.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 6: Recommendations
Write-Host "`n6. 💡 RECOMMENDATIONS BASED ON FINDINGS:" -ForegroundColor Cyan

Write-Host "`n🔧 IMMEDIATE FIXES NEEDED:" -ForegroundColor Yellow
Write-Host "   1. Kill all Node processes and restart clean" -ForegroundColor White
Write-Host "   2. Ensure .env.local doesn't have REACT_APP_FORCE_LOCALHOST=true" -ForegroundColor White
Write-Host "   3. Clear React cache completely" -ForegroundColor White
Write-Host "   4. Use production build for external domain testing" -ForegroundColor White

Write-Host "`n🚀 COMMANDS TO RUN:" -ForegroundColor Yellow
Write-Host "   # Kill processes:" -ForegroundColor White
Write-Host "   Get-Process node | Stop-Process -Force -ErrorAction SilentlyContinue" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Clear cache:" -ForegroundColor White
Write-Host "   Remove-Item 'C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend\node_modules\.cache' -Recurse -Force -ErrorAction SilentlyContinue" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Start clean:" -ForegroundColor White
Write-Host "   cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   npx serve -s build -p 3000" -ForegroundColor Gray

Write-Host "`n✅ TEST EXTERNAL DOMAIN:" -ForegroundColor Yellow
Write-Host "   Visit: https://connect.vemgootech.info" -ForegroundColor White
Write-Host "   Expected: API calls to https://api.vemgootech.info" -ForegroundColor White
Write-Host "   No CORS errors" -ForegroundColor White

Write-Host "`n=====================================================================" -ForegroundColor Yellow
Write-Host "🎯 DEEP DIVE COMPLETE - Use the recommendations above to fix the issue" -ForegroundColor Green