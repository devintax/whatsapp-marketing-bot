# 🚀 ROBUST SERVER STARTUP SCRIPT
# This script starts both backend and frontend servers and keeps them running

Write-Host "🚀 Starting WhatsApp Marketing Bot Servers..." -ForegroundColor Green

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = netstat -ano | findstr ":$Port" | ForEach-Object { 
            ($_ -split '\s+')[-1] 
        } | Where-Object { $_ -match '^\d+$' }
        
        foreach ($pid in $processes) {
            if ($pid) {
                Write-Host "🛑 Stopping process $pid on port $Port" -ForegroundColor Yellow
                taskkill /PID $pid /F 2>$null
            }
        }
    } catch {
        Write-Host "⚠️ Could not stop processes on port $Port" -ForegroundColor Yellow
    }
}

# Clean up existing processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Cyan
Stop-ProcessOnPort 5000
Stop-ProcessOnPort 3000
Stop-ProcessOnPort 8080

Start-Sleep -Seconds 2

# Navigate to project root
Set-Location "C:\Users\vinny\Documents\DevOps\whatsApp-bot"

# Start Backend Server (Port 5000)
Write-Host "🎯 Starting Backend Server (Port 5000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend'; Write-Host '🚀 BACKEND SERVER STARTING...' -ForegroundColor Green; node server.js"

# Wait for backend to start
Write-Host "⏱️ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if backend is running
$backendRunning = Test-PortInUse 5000
if ($backendRunning) {
    Write-Host "✅ Backend Server is running on http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Server failed to start" -ForegroundColor Red
}

# Build Frontend
Write-Host "🔨 Building Frontend..." -ForegroundColor Blue
Set-Location "frontend"
npm run build | Out-Host

# Start Frontend Server (Port 8080)
Write-Host "🎯 Starting Frontend Server (Port 8080)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend'; Write-Host '🚀 FRONTEND SERVER STARTING...' -ForegroundColor Green; npx serve -s build -p 8080"

# Wait for frontend to start
Write-Host "⏱️ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if frontend is running
$frontendRunning = Test-PortInUse 8080
if ($frontendRunning) {
    Write-Host "✅ Frontend Server is running on http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend Server failed to start" -ForegroundColor Red
}

# Summary
Write-Host "`n🎊 SERVER STARTUP COMPLETE!" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "🔗 Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "🌐 Frontend App: http://localhost:8080" -ForegroundColor White
Write-Host "🎯 External URL: https://connect.vemgootech.info" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# Test Progress Tracker
Write-Host "`n🧪 PROGRESS TRACKER TESTING:" -ForegroundColor Cyan
Write-Host "1. Open: http://localhost:8080" -ForegroundColor White
Write-Host "2. Login: vkgbewonyo@gmail.com / BIDOpc2017$!" -ForegroundColor White
Write-Host "3. Go to Campaigns → Create Campaign" -ForegroundColor White
Write-Host "4. Send campaign and watch for floating progress tracker" -ForegroundColor White
Write-Host "5. Check browser console (F12) for debug logs" -ForegroundColor White

# Keep script open
Write-Host "`n✨ Press any key to close this script (servers will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")