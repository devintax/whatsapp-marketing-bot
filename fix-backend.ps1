# Backend Server Port 5000 Fix Script
# Kills process using port 5000 and restarts backend

Write-Host ""
Write-Host "🔧 WhatsApp Bot - Backend Server Fix" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and kill process on port 5000
Write-Host "🔍 Step 1: Finding process using port 5000..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction Stop
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction Stop
    
    Write-Host "   📍 Found: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
    Write-Host "   ⏱️  Start Time: $($process.StartTime)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔪 Step 2: Terminating process..." -ForegroundColor Red
    
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
    
    Write-Host "   ✅ Process terminated successfully!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "   ℹ️  No process found on port 5000 (port is free)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Navigate to backend directory
Write-Host "📂 Step 3: Navigating to backend directory..." -ForegroundColor Yellow
$backendPath = "C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend"

if (Test-Path $backendPath) {
    Set-Location -Path $backendPath
    Write-Host "   ✅ Directory: $backendPath" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "   ❌ Backend directory not found!" -ForegroundColor Red
    Write-Host "   Expected: $backendPath" -ForegroundColor Gray
    exit 1
}

# Step 3: Start backend server
Write-Host "🚀 Step 4: Starting backend development server..." -ForegroundColor Yellow
Write-Host "   Running: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Backend server should start below" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Run the server
npm run dev
