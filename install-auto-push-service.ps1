# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 INSTALL AUTO-PUSH AS WINDOWS SCHEDULED TASK (Service Alternative)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# This script creates a Windows Scheduled Task that runs the auto-push
# watcher at startup and keeps it running in the background.
#
# REQUIREMENTS: Run as Administrator
#
# USAGE:
#   Right-click PowerShell → "Run as Administrator"
#   .\install-auto-push-service.ps1
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔧 INSTALLING AUTO-PUSH WATCHER AS SCHEDULED TASK" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Configuration
$taskName = "WhatsApp Bot Auto-Push Watcher"
$workspaceRoot = "C:\Users\vinny\Documents\DevOps\whatsApp-bot"
$scriptPath = Join-Path $workspaceRoot "auto-push-watcher.ps1"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Verify script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ ERROR: Auto-push watcher script not found!" -ForegroundColor Red
    Write-Host "Expected location: $scriptPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found auto-push watcher script" -ForegroundColor Green
Write-Host "📁 Script: $scriptPath" -ForegroundColor White
Write-Host "👤 User: $currentUser" -ForegroundColor White
Write-Host ""

# Remove existing task if it exists
Write-Host "🔍 Checking for existing task..." -ForegroundColor Cyan
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Found existing task - removing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✅ Removed old task" -ForegroundColor Green
}

# Create scheduled task action
Write-Host "📝 Creating scheduled task..." -ForegroundColor Cyan
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`" -intervalMinutes 5" `
    -WorkingDirectory $workspaceRoot

# Create trigger - Run at logon and keep running
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser

# Create settings - Allow task to run indefinitely
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 365)

# Create principal - Run with highest privileges
$principal = New-ScheduledTaskPrincipal `
    -UserId $currentUser `
    -LogonType Interactive `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automatically monitors WhatsApp Marketing Bot workspace and pushes changes to GitHub every 5 minutes" `
        -Force | Out-Null
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Start the task immediately
    Write-Host "🚀 Starting auto-push watcher now..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 2
    
    # Verify task is running
    $taskInfo = Get-ScheduledTask -TaskName $taskName
    $taskState = $taskInfo.State
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ AUTO-PUSH WATCHER INSTALLED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Task Status: $taskState" -ForegroundColor Cyan
    Write-Host "⏱️  Check Interval: 5 minutes" -ForegroundColor Cyan
    Write-Host "🔄 Runs at: System startup (automatically)" -ForegroundColor Cyan
    Write-Host "📁 Watching: $workspaceRoot" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 WHAT HAPPENS NOW:" -ForegroundColor Yellow
    Write-Host "  • Watcher is running in the background RIGHT NOW" -ForegroundColor White
    Write-Host "  • Every 5 minutes, it checks for file changes" -ForegroundColor White
    Write-Host "  • If changes found, auto-commits and pushes to GitHub" -ForegroundColor White
    Write-Host "  • Runs automatically every time you log in" -ForegroundColor White
    Write-Host "  • No manual intervention needed - EVER!" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 LOG FILE: $workspaceRoot\auto-push.log" -ForegroundColor Cyan
    Write-Host "🌐 GitHub: https://github.com/bido75/whatsapp-marketing-bot" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🛠️  MANAGEMENT COMMANDS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  View task status:" -ForegroundColor White
    Write-Host "    Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  View logs:" -ForegroundColor White
    Write-Host "    Get-Content -Path '$workspaceRoot\auto-push.log' -Tail 50 -Wait" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Stop auto-push:" -ForegroundColor White
    Write-Host "    Stop-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Start auto-push:" -ForegroundColor White
    Write-Host "    Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Remove auto-push:" -ForegroundColor White
    Write-Host "    Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to create scheduled task" -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Installation complete! Press any key to exit..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
