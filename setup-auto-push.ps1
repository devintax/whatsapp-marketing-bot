# 🔄 WhatsApp Marketing Bot - Auto Git Push Setup
# This script sets up automatic git commits and pushes whenever you save files

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄 AUTO GIT PUSH SETUP" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ================================
# STEP 1: Initialize Git Repository
# ================================
Write-Host "📦 Step 1: Initializing Git Repository..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path .git) {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
} else {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# ================================
# STEP 2: Configure Git User
# ================================
Write-Host ""
Write-Host "👤 Step 2: Configuring Git User..." -ForegroundColor Yellow
Write-Host ""

$gitUserName = git config user.name
$gitUserEmail = git config user.email

if (!$gitUserName) {
    $userName = Read-Host "Enter your name for Git commits"
    git config user.name "$userName"
    Write-Host "✅ Git user.name set" -ForegroundColor Green
} else {
    Write-Host "✅ Git user already configured: $gitUserName" -ForegroundColor Green
}

if (!$gitUserEmail) {
    $userEmail = Read-Host "Enter your email for Git commits"
    git config user.email "$userEmail"
    Write-Host "✅ Git user.email set" -ForegroundColor Green
} else {
    Write-Host "✅ Git email already configured: $gitUserEmail" -ForegroundColor Green
}

# ================================
# STEP 3: Add GitHub Remote
# ================================
Write-Host ""
Write-Host "🌐 Step 3: Connecting to GitHub..." -ForegroundColor Yellow
Write-Host ""

$existingRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHub remote already configured: $existingRemote" -ForegroundColor Green
} else {
    $repoUrl = "https://github.com/bido75/whatsapp-marketing-bot.git"
    git remote add origin $repoUrl
    Write-Host "✅ GitHub remote added: $repoUrl" -ForegroundColor Green
}

# ================================
# STEP 4: Create Initial Commit
# ================================
Write-Host ""
Write-Host "📝 Step 4: Creating Initial Commit..." -ForegroundColor Yellow
Write-Host ""

git add .
$status = git status --short
if ($status) {
    Write-Host "Files to commit:" -ForegroundColor Cyan
    Write-Host $status
    Write-Host ""
    
    $commitMsg = "Initial commit: WhatsApp AI Marketing Platform

✨ Features:
- AI-powered campaign generation (OpenAI, Groq, Gemini, Claude)
- WhatsApp Web.js integration with session persistence
- Real-time analytics dashboard with Socket.io
- Contact management with CSV/Excel import
- Campaign progress tracking
- Material-UI responsive frontend
- Express.js REST API backend
- MongoDB database
- Redis caching
- Cloudflare Tunnel deployment

🛠️ Tech Stack:
- Frontend: React 18 + Material-UI + Socket.io-client
- Backend: Node.js + Express + MongoDB + Socket.io
- AI: Multi-provider support with intelligent fallback
- Deployment: Cloudflare Tunnel

📚 Documentation:
- Comprehensive setup guides
- API documentation
- Deployment instructions
- Testing reports

🔒 Security:
- JWT authentication
- Environment variable protection
- API key management
- Session security"
    
    git commit -m "$commitMsg"
    Write-Host "✅ Initial commit created" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No changes to commit (already committed)" -ForegroundColor Gray
}

# ================================
# STEP 5: Push to GitHub
# ================================
Write-Host ""
Write-Host "🚀 Step 5: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""

git branch -M main

Write-Host "⚠️  You'll need to authenticate with GitHub" -ForegroundColor Yellow
Write-Host "   Username: bido75" -ForegroundColor Gray
Write-Host "   Password: Use your Personal Access Token" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Get a token at: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""

$pushConfirm = Read-Host "Ready to push to GitHub? (y/n)"
if ($pushConfirm -eq 'y') {
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "🎉 SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 View your repository:" -ForegroundColor Cyan
        Write-Host "   https://github.com/bido75/whatsapp-marketing-bot" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Push failed. Please check your credentials." -ForegroundColor Red
        Write-Host ""
    }
}

# ================================
# STEP 6: Create Auto-Push Scripts
# ================================
Write-Host ""
Write-Host "🔧 Step 6: Creating Auto-Push Scripts..." -ForegroundColor Yellow
Write-Host ""

# Create quick commit script
$quickCommitScript = @'
# Quick Commit & Push Script
# Usage: .\quick-commit.ps1 "Your commit message"

param(
    [string]$message = "Update: Latest changes"
)

Write-Host "🔄 Quick Commit & Push" -ForegroundColor Cyan
Write-Host ""

# Pull latest changes first
Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

# Stage all changes
Write-Host "📝 Staging changes..." -ForegroundColor Yellow
git add -A

# Show what will be committed
Write-Host ""
Write-Host "Files to commit:" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "$message"

# Push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "🌐 https://github.com/bido75/whatsapp-marketing-bot" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host ""
}
'@

Set-Content -Path "quick-commit.ps1" -Value $quickCommitScript
Write-Host "✅ Created: quick-commit.ps1" -ForegroundColor Green

# Create watch and auto-commit script
$watchScript = @'
# Auto-Commit Watch Script
# Watches for file changes and automatically commits every N minutes

param(
    [int]$intervalMinutes = 30
)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄 AUTO-COMMIT WATCHER STARTED" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏱️  Interval: $intervalMinutes minutes" -ForegroundColor Yellow
Write-Host "📁 Watching: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop..." -ForegroundColor Gray
Write-Host ""

$lastCommit = Get-Date

while ($true) {
    Start-Sleep -Seconds ($intervalMinutes * 60)
    
    # Check for changes
    $status = git status --short
    if ($status) {
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "📊 Changes detected at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host $status
        Write-Host ""
        
        # Auto-commit
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git add -A
        git commit -m "Auto-commit: Save latest changes [$timestamp]"
        
        Write-Host "💾 Committed changes" -ForegroundColor Green
        
        # Auto-push
        git push origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🚀 Pushed to GitHub" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Push failed - will retry next time" -ForegroundColor Yellow
        }
        
        $lastCommit = Get-Date
    } else {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}
'@

Set-Content -Path "watch-and-commit.ps1" -Value $watchScript
Write-Host "✅ Created: watch-and-commit.ps1" -ForegroundColor Green

# Create daily backup script
$backupScript = @'
# Daily Backup to GitHub
# Run this daily to backup your work

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💾 DAILY BACKUP TO GITHUB" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$date = Get-Date -Format "yyyy-MM-dd"

# Pull first
Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

# Stage all
Write-Host "📝 Staging all changes..." -ForegroundColor Yellow
git add -A

# Check for changes
$status = git status --short
if ($status) {
    Write-Host ""
    Write-Host "Files to backup:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    # Commit
    $commitMsg = "Daily backup: $date

✅ Automatic backup of all project files
📊 Includes: backend, frontend, documentation, config
🔒 Sensitive files excluded by .gitignore
"
    
    git commit -m "$commitMsg"
    Write-Host "💾 Backup committed" -ForegroundColor Green
    
    # Push
    Write-Host "🚀 Pushing backup to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "✅ BACKUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Repository: https://github.com/bido75/whatsapp-marketing-bot" -ForegroundColor Cyan
        Write-Host "📅 Backup date: $date" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Backup push failed" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "ℹ️ No changes to backup (already up-to-date)" -ForegroundColor Gray
    Write-Host ""
}
'@

Set-Content -Path "daily-backup.ps1" -Value $backupScript
Write-Host "✅ Created: daily-backup.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 AUTO-PUSH SETUP COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Created scripts:" -ForegroundColor Yellow
Write-Host "   1. quick-commit.ps1       - Quick commit & push" -ForegroundColor White
Write-Host "   2. watch-and-commit.ps1   - Auto-commit every N minutes" -ForegroundColor White
Write-Host "   3. daily-backup.ps1       - Daily backup to GitHub" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Usage:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Quick commit:" -ForegroundColor Cyan
Write-Host "   .\quick-commit.ps1 " -NoNewline -ForegroundColor White
Write-Host '"Your message"' -ForegroundColor Gray
Write-Host ""
Write-Host "   Watch mode (auto-commit every 30 min):" -ForegroundColor Cyan
Write-Host "   .\watch-and-commit.ps1 -intervalMinutes 30" -ForegroundColor White
Write-Host ""
Write-Host "   Daily backup:" -ForegroundColor Cyan
Write-Host "   .\daily-backup.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your repository:" -ForegroundColor Yellow
Write-Host "   https://github.com/bido75/whatsapp-marketing-bot" -ForegroundColor Cyan
Write-Host ""
