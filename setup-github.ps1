# Quick GitHub Setup Commands
# Copy and paste these commands one section at a time

# ================================
# SECTION 1: SAFETY CHECK
# ================================
Write-Host "🔍 SAFETY CHECK: Searching for sensitive data..." -ForegroundColor Yellow
Write-Host ""

# Check for .env files (these should NOT be committed)
Write-Host "Checking for .env files..." -ForegroundColor Cyan
Get-ChildItem -Recurse -Filter ".env*" -File -ErrorAction SilentlyContinue | Select-Object FullName

Write-Host ""
Write-Host "✅ If .env files are shown above, they will be IGNORED by .gitignore (safe)" -ForegroundColor Green
Write-Host "⚠️  If no .env files shown, double-check backend/.env exists for local config" -ForegroundColor Yellow
Write-Host ""

# Check for hardcoded API keys (basic check)
Write-Host "Checking for potential API keys in JavaScript files..." -ForegroundColor Cyan
$apiKeyPatterns = @("sk-", "gsk_", "AIza", "MONGODB_URI", "mongodb://")
foreach ($pattern in $apiKeyPatterns) {
    Write-Host "  Searching for: $pattern" -ForegroundColor Gray
    $results = Select-String -Path ".\backend\**\*.js", ".\frontend\**\*.js" -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
    if ($results) {
        Write-Host "  ⚠️  WARNING: Found '$pattern' in:" -ForegroundColor Red
        $results | ForEach-Object { Write-Host "     - $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Magenta
Write-Host "SAFETY CHECK COMPLETE" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "⚠️  REVIEW RESULTS ABOVE CAREFULLY!" -ForegroundColor Yellow
Write-Host "If you see API keys in .js files, STOP and remove them before continuing!" -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to continue to Git setup (or Ctrl+C to abort)..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# ================================
# SECTION 2: GIT INITIALIZATION
# ================================
Write-Host ""
Write-Host "================================" -ForegroundColor Magenta
Write-Host "INITIALIZING GIT REPOSITORY" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if already a Git repository
if (Test-Path .git) {
    Write-Host "⚠️  Git repository already exists (.git folder found)" -ForegroundColor Yellow
    Write-Host "Skipping 'git init'..." -ForegroundColor Yellow
} else {
    Write-Host "Initializing new Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

Write-Host ""

# ================================
# SECTION 3: CONFIGURE GIT USER
# ================================
Write-Host "================================" -ForegroundColor Magenta
Write-Host "CONFIGURE GIT USER" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

# Check if Git user is configured
$gitUserName = git config user.name
$gitUserEmail = git config user.email

if (!$gitUserName) {
    Write-Host "⚠️  Git user.name not configured" -ForegroundColor Yellow
    $userName = Read-Host "Enter your name for Git commits"
    git config user.name "$userName"
    Write-Host "✅ Git user.name set to: $userName" -ForegroundColor Green
} else {
    Write-Host "✅ Git user.name already configured: $gitUserName" -ForegroundColor Green
}

if (!$gitUserEmail) {
    Write-Host "⚠️  Git user.email not configured" -ForegroundColor Yellow
    $userEmail = Read-Host "Enter your email for Git commits"
    git config user.email "$userEmail"
    Write-Host "✅ Git user.email set to: $userEmail" -ForegroundColor Green
} else {
    Write-Host "✅ Git user.email already configured: $gitUserEmail" -ForegroundColor Green
}

Write-Host ""

# ================================
# SECTION 4: STAGE FILES
# ================================
Write-Host "================================" -ForegroundColor Magenta
Write-Host "STAGING FILES FOR COMMIT" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "Adding all files (respecting .gitignore)..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "⚠️  REVIEW THE LIST ABOVE CAREFULLY!" -ForegroundColor Yellow
Write-Host "Make sure NO sensitive files are listed (no .env, no API keys)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue to commit (or Ctrl+C to abort)..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# ================================
# SECTION 5: CREATE INITIAL COMMIT
# ================================
Write-Host ""
Write-Host "================================" -ForegroundColor Magenta
Write-Host "CREATING INITIAL COMMIT" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "Creating initial commit..." -ForegroundColor Cyan

git commit -m "Initial commit: WhatsApp AI Marketing Automation Platform

Features:
- AI-powered campaign generation with multi-provider support (OpenAI, Groq, Gemini, Claude)
- WhatsApp Web.js integration with session persistence
- Real-time analytics dashboard with Socket.io
- Contact management with CSV/Excel import
- Campaign progress tracking with live updates
- Material-UI responsive frontend
- Express.js REST API backend
- MongoDB database with optimized schemas
- Redis caching for performance
- Cloudflare Tunnel deployment support

Tech Stack:
- Frontend: React 18 + Material-UI + Socket.io-client
- Backend: Node.js + Express + MongoDB + Socket.io
- AI: OpenAI GPT-4, Groq, Google Gemini, Anthropic Claude
- Deployment: Cloudflare Tunnel (connect.vemgootech.info, api.vemgootech.info)

Documentation:
- Comprehensive API documentation
- Deployment guides
- Architecture overview
- Testing and QA reports
"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Initial commit created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Error creating commit" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ================================
# SECTION 6: CONNECT TO GITHUB
# ================================
Write-Host "================================" -ForegroundColor Magenta
Write-Host "CONNECT TO GITHUB REPOSITORY" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "🌐 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to https://github.com and create a new repository" -ForegroundColor Yellow
Write-Host "   - Repository name: whatsapp-marketing-bot" -ForegroundColor Gray
Write-Host "   - Visibility: Private (recommended)" -ForegroundColor Gray
Write-Host "   - Do NOT initialize with README, .gitignore, or license" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy the repository URL (should look like):" -ForegroundColor Yellow
Write-Host "   https://github.com/YOUR_USERNAME/whatsapp-marketing-bot.git" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Enter the repository URL below:" -ForegroundColor Yellow

$repoUrl = Read-Host "GitHub repository URL"

if ($repoUrl) {
    Write-Host ""
    Write-Host "Adding GitHub remote..." -ForegroundColor Cyan
    
    # Check if remote already exists
    $existingRemote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "⚠️  Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to update it? (y/n)"
        if ($overwrite -eq 'y') {
            git remote set-url origin $repoUrl
            Write-Host "✅ Remote 'origin' updated" -ForegroundColor Green
        }
    } else {
        git remote add origin $repoUrl
        Write-Host "✅ Remote 'origin' added" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Verifying remote..." -ForegroundColor Cyan
    git remote -v
    
    Write-Host ""
    Write-Host "Setting main branch..." -ForegroundColor Cyan
    git branch -M main
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Magenta
    Write-Host "READY TO PUSH TO GITHUB!" -ForegroundColor Magenta
    Write-Host "================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Run this command to push to GitHub:" -ForegroundColor Green
    Write-Host ""
    Write-Host "    git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  You may be prompted for credentials:" -ForegroundColor Yellow
    Write-Host "   Username: Your GitHub username" -ForegroundColor Gray
    Write-Host "   Password: Your Personal Access Token (NOT your GitHub password)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Get a Personal Access Token:" -ForegroundColor Yellow
    Write-Host "   https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "   → Generate new token (classic)" -ForegroundColor Gray
    Write-Host "   → Select scopes: 'repo' (full control)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "No repository URL entered. You can add it later with:" -ForegroundColor Yellow
    Write-Host "    git remote add origin YOUR_REPO_URL" -ForegroundColor Cyan
    Write-Host "    git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Magenta
Write-Host "🎉 GIT SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ What we did:" -ForegroundColor Green
Write-Host "   1. Safety check for sensitive data" -ForegroundColor Gray
Write-Host "   2. Initialized Git repository" -ForegroundColor Gray
Write-Host "   3. Configured Git user" -ForegroundColor Gray
Write-Host "   4. Staged all files (respecting .gitignore)" -ForegroundColor Gray
Write-Host "   5. Created initial commit" -ForegroundColor Gray
Write-Host "   6. Connected to GitHub remote" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Next: Read GITHUB_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
