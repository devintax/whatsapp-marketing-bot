# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🤖 AUTOMATIC GIT PUSH WATCHER - COMPLETE HANDS-OFF AUTOMATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# This script monitors your workspace for ANY file changes and
# automatically commits and pushes to GitHub without manual intervention.
#
# USAGE:
#   .\auto-push-watcher.ps1                    # Default: 5-minute checks
#   .\auto-push-watcher.ps1 -intervalMinutes 2  # Custom interval
#   .\auto-push-watcher.ps1 -immediate         # Instant push on changes
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [int]$intervalMinutes = 5,
    [switch]$immediate = $false,
    [switch]$verbose = $false
)

# Configuration
$workspaceRoot = "C:\Users\vinny\Documents\DevOps\whatsApp-bot"
$logFile = Join-Path $workspaceRoot "auto-push.log"
$maxLogSize = 5MB

# Color output functions
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
    Add-Content -Path $logFile -Value "[$timestamp] $Message"
}

function Write-Success { param([string]$msg) Write-ColorOutput $msg "Green" }
function Write-Info { param([string]$msg) Write-ColorOutput $msg "Cyan" }
function Write-Warning { param([string]$msg) Write-ColorOutput $msg "Yellow" }
function Write-Error-Custom { param([string]$msg) Write-ColorOutput $msg "Red" }

# Rotate log file if too large
function Rotate-LogFile {
    if (Test-Path $logFile) {
        $logSize = (Get-Item $logFile).Length
        if ($logSize -gt $maxLogSize) {
            $backupLog = $logFile -replace '\.log$', "-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
            Move-Item $logFile $backupLog -Force
            Write-Info "📋 Log file rotated to: $backupLog"
        }
    }
}

# Check if git is initialized
function Test-GitRepository {
    Set-Location $workspaceRoot
    if (-not (Test-Path ".git")) {
        Write-Error-Custom "❌ Not a git repository! Run 'git init' first."
        return $false
    }
    return $true
}

# Check if there are uncommitted changes
function Test-HasChanges {
    Set-Location $workspaceRoot
    $status = git status --porcelain 2>&1
    if ($status) {
        return $true
    }
    return $false
}

# Auto-commit and push changes
function Invoke-AutoCommitPush {
    param([string]$reason = "Auto-commit")
    
    Set-Location $workspaceRoot
    
    try {
        # Pull latest changes first
        if ($verbose) { Write-Info "📥 Pulling latest changes..." }
        git pull origin main --no-rebase 2>&1 | Out-Null
        
        # Stage all changes
        git add -A
        
        # Get detailed file changes
        $changedFiles = git diff --cached --name-status
        $fileCount = ($changedFiles | Measure-Object).Count
        
        if ($fileCount -eq 0) {
            if ($verbose) { Write-Info "✅ No changes to commit" }
            return $false
        }
        
        # Create detailed commit message
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = @"
$reason - $timestamp

Changes detected ($fileCount files):
$($changedFiles -join "`n")

[Automated by auto-push-watcher.ps1]
"@
        
        # Commit changes
        Write-Info "💾 Committing $fileCount file(s)..."
        git commit -m $commitMessage 2>&1 | Out-Null
        
        # Push to GitHub
        Write-Info "🚀 Pushing to GitHub..."
        $pushResult = git push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ Successfully pushed $fileCount file(s) to GitHub!"
            Write-Success "🌐 https://github.com/bido75/whatsapp-marketing-bot"
            return $true
        } else {
            Write-Error-Custom "❌ Push failed: $pushResult"
            return $false
        }
        
    } catch {
        Write-Error-Custom "❌ Auto-commit failed: $_"
        return $false
    }
}

# Main watch loop
function Start-AutoPushWatcher {
    Clear-Host
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "🤖 AUTOMATIC GIT PUSH WATCHER - RUNNING" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
    Write-Success "✅ Auto-push watcher started successfully!"
    Write-Info "📁 Watching: $workspaceRoot"
    Write-Info "⏱️  Check interval: $intervalMinutes minute(s)"
    Write-Info "📋 Log file: $logFile"
    Write-Host ""
    Write-Warning "⚠️  This will run FOREVER until you press Ctrl+C"
    Write-Warning "⚠️  All file changes will be automatically committed and pushed to GitHub"
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
    
    # Verify git repository
    if (-not (Test-GitRepository)) {
        exit 1
    }
    
    # Initial check for uncommitted changes
    Write-Info "🔍 Checking for uncommitted changes..."
    if (Test-HasChanges) {
        Write-Warning "⚠️  Found uncommitted changes! Pushing now..."
        Invoke-AutoCommitPush -reason "Initial auto-commit on watcher start"
    } else {
        Write-Success "✅ Repository is clean - watching for changes..."
    }
    
    # Main watch loop
    $checkCount = 0
    while ($true) {
        try {
            $checkCount++
            
            # Rotate log if needed
            if ($checkCount % 10 -eq 0) {
                Rotate-LogFile
            }
            
            # Wait for interval
            if ($immediate) {
                Start-Sleep -Seconds 30  # 30-second checks for immediate mode
            } else {
                Start-Sleep -Seconds ($intervalMinutes * 60)
            }
            
            # Check for changes
            if (Test-HasChanges) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Warning "🔔 [$timestamp] Changes detected! Auto-committing..."
                
                $success = Invoke-AutoCommitPush -reason "Auto-commit: Changes detected"
                
                if ($success) {
                    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    Write-Success "✅ AUTO-PUSH COMPLETED SUCCESSFULLY!"
                    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    Write-Host ""
                }
            } else {
                if ($verbose) {
                    $timestamp = Get-Date -Format "HH:mm:ss"
                    Write-Host "[$timestamp] ✓ No changes detected" -ForegroundColor DarkGray
                } else {
                    Write-Host "." -NoNewline -ForegroundColor DarkGray
                }
            }
            
        } catch {
            Write-Error-Custom "❌ Watcher error: $_"
            Write-Info "🔄 Continuing to watch..."
        }
    }
}

# Cleanup handler for Ctrl+C
$cleanupHandler = {
    Write-Host ""
    Write-Host ""
    Write-Warning "🛑 Auto-push watcher stopped by user"
    Write-Info "📊 Total runtime: $(New-TimeSpan -Start $script:startTime -End (Get-Date))"
    Write-Info "🌐 GitHub: https://github.com/bido75/whatsapp-marketing-bot"
    Write-Host ""
    exit 0
}

# Register cleanup handler
$script:startTime = Get-Date
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanupHandler | Out-Null
[Console]::TreatControlCAsInput = $false

# Start the watcher
try {
    Start-AutoPushWatcher
} catch {
    Write-Error-Custom "❌ Fatal error: $_"
    exit 1
}
