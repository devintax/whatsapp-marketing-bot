# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 QUICK START AUTO-PUSH WATCHER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# Simple launcher to start the auto-push watcher in foreground.
# Use this to test before installing as a scheduled task.
#
# USAGE: Just double-click this file or run in PowerShell
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clear-Host

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 AUTO-PUSH WATCHER - QUICK START" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your automation mode:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [1] Test Mode - 5 minute checks (RECOMMENDED FIRST)" -ForegroundColor Green
Write-Host "      Safe mode to verify everything works" -ForegroundColor Gray
Write-Host ""
Write-Host "  [2] Fast Mode - 2 minute checks" -ForegroundColor Cyan
Write-Host "      Quick response to changes" -ForegroundColor Gray
Write-Host ""
Write-Host "  [3] Instant Mode - 30 second checks" -ForegroundColor Yellow
Write-Host "      Nearly instant auto-push (most aggressive)" -ForegroundColor Gray
Write-Host ""
Write-Host "  [4] Install as Background Service (RECOMMENDED)" -ForegroundColor Magenta
Write-Host "      Runs automatically at startup, completely hands-off" -ForegroundColor Gray
Write-Host ""
Write-Host "  [5] View current auto-push logs" -ForegroundColor White
Write-Host ""
Write-Host "  [Q] Quit" -ForegroundColor DarkGray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter your choice (1-5 or Q)"

switch ($choice.ToUpper()) {
    "1" {
        Write-Host ""
        Write-Host "Starting Test Mode - 5 minute checks..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        Start-Sleep -Seconds 2
        & "$PSScriptRoot\auto-push-watcher.ps1" -intervalMinutes 5 -verbose
    }
    "2" {
        Write-Host ""
        Write-Host "Starting Fast Mode - 2 minute checks..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        Start-Sleep -Seconds 2
        & "$PSScriptRoot\auto-push-watcher.ps1" -intervalMinutes 2 -verbose
    }
    "3" {
        Write-Host ""
        Write-Host "Starting Instant Mode - 30 second checks..." -ForegroundColor Yellow
        Write-Host "WARNING: This is VERY aggressive!" -ForegroundColor Red
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        Start-Sleep -Seconds 2
        & "$PSScriptRoot\auto-push-watcher.ps1" -immediate -verbose
    }
    "4" {
        Write-Host ""
        Write-Host "Installing as Background Service..." -ForegroundColor Magenta
        Write-Host ""
        Write-Host "This requires Administrator privileges!" -ForegroundColor Yellow
        Write-Host "A UAC prompt will appear - click Yes to continue." -ForegroundColor Yellow
        Write-Host ""
        Start-Sleep -Seconds 3
        
        # Restart as admin
        $scriptPath = Join-Path $PSScriptRoot "install-auto-push-service.ps1"
        Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs -Wait
    }
    "5" {
        Write-Host ""
        Write-Host "📋 Viewing auto-push logs (Ctrl+C to exit)..." -ForegroundColor White
        Write-Host ""
        $logPath = Join-Path $PSScriptRoot "auto-push.log"
        if (Test-Path $logPath) {
            Get-Content -Path $logPath -Tail 100 -Wait
        } else {
            Write-Host "❌ No logs found yet. The watcher hasn't run." -ForegroundColor Red
            Write-Host "Start the watcher first (option 1, 2, 3, or 4)" -ForegroundColor Yellow
        }
    }
    "Q" {
        Write-Host ""
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Please run again and select 1-5 or Q." -ForegroundColor Red
        Start-Sleep -Seconds 2
        exit 1
    }
}
