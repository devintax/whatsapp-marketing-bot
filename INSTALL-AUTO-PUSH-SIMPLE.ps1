# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INSTALL AUTO-PUSH AS WINDOWS BACKGROUND TASK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# This is the SIMPLEST way to enable complete hands-off automation.
# 
# STEP 1: Right-click PowerShell → "Run as Administrator"
# STEP 2: Run this script
# STEP 3: Done! Auto-push runs forever in background
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Check for administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Close this window" -ForegroundColor Yellow
    Write-Host "2. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "3. Select Run as Administrator" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " INSTALLING AUTO-PUSH BACKGROUND TASK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$taskName = "WhatsApp-Bot-Auto-Push"
$workspaceRoot = "C:\Users\vinny\Documents\DevOps\whatsApp-bot"
$scriptPath = Join-Path $workspaceRoot "auto-push-watcher.ps1"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Host "Workspace: $workspaceRoot" -ForegroundColor White
Write-Host "Script: $scriptPath" -ForegroundColor White
Write-Host "User: $currentUser" -ForegroundColor White
Write-Host ""

# Verify script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: Auto-push script not found!" -ForegroundColor Red
    Write-Host "Expected: $scriptPath" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Remove existing task
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Old task removed" -ForegroundColor Green
}

# Create task
Write-Host "Creating scheduled task..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`" -intervalMinutes 5" `
    -WorkingDirectory $workspaceRoot

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 365)

$principal = New-ScheduledTaskPrincipal `
    -UserId $currentUser `
    -LogonType Interactive `
    -RunLevel Highest

# Register task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Auto-push WhatsApp Bot changes to GitHub every 5 minutes" `
    -Force | Out-Null

Write-Host "Task created successfully!" -ForegroundColor Green

# Start task
Write-Host "Starting auto-push watcher..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 2

# Verify
$taskInfo = Get-ScheduledTask -TaskName $taskName
$taskState = $taskInfo.State

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " AUTO-PUSH INSTALLED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Status: $taskState" -ForegroundColor Cyan
Write-Host "Interval: 5 minutes" -ForegroundColor Cyan
Write-Host "Runs at: System login (automatic)" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT HAPPENS NOW:" -ForegroundColor Yellow
Write-Host "- Watcher is running in background NOW" -ForegroundColor White
Write-Host "- Every 5 minutes, checks for changes" -ForegroundColor White
Write-Host "- Auto-commits and pushes to GitHub" -ForegroundColor White
Write-Host "- Runs automatically at startup" -ForegroundColor White
Write-Host "- NO manual intervention needed!" -ForegroundColor White
Write-Host ""
Write-Host "Log file: $workspaceRoot\auto-push.log" -ForegroundColor Cyan
Write-Host "GitHub: https://github.com/bido75/whatsapp-marketing-bot" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MANAGEMENT COMMANDS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "View logs:" -ForegroundColor White
Write-Host '  Get-Content "' -NoNewline; Write-Host "$workspaceRoot\auto-push.log" -NoNewline -ForegroundColor Gray; Write-Host '" -Tail 50 -Wait'
Write-Host ""
Write-Host "Stop auto-push:" -ForegroundColor White
Write-Host "  Stop-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host ""
Write-Host "Start auto-push:" -ForegroundColor White
Write-Host "  Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host ""
Write-Host "Remove auto-push:" -ForegroundColor White
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
