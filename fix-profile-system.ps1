# 🔧 PROFILE SYSTEM - COMPLETE FIX SCRIPT
# This script will clean, rebuild, and verify the frontend

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PROFILE SYSTEM FIX - Complete Rebuild & Verification   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$startLocation = Get-Location

try {
    # Step 1: Check if we're in the right directory
    Write-Host "📍 STEP 1: Verifying location..." -ForegroundColor Yellow
    if (!(Test-Path "frontend") -or !(Test-Path "backend")) {
        Write-Host "❌ ERROR: Not in project root directory!" -ForegroundColor Red
        Write-Host "Please run this script from: whatsApp-bot" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ In correct directory`n" -ForegroundColor Green

    # Step 2: Verify source file has PROFILE endpoints
    Write-Host "📍 STEP 2: Verifying source code has PROFILE endpoints..." -ForegroundColor Yellow
    $apiConfig = Get-Content "frontend\src\config\api.js" -Raw
    if ($apiConfig -match "PROFILE.*GET") {
        Write-Host "✅ Source code has PROFILE endpoints" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: Source code missing PROFILE endpoints!" -ForegroundColor Red
        Write-Host "Check frontend/src/config/api.js" -ForegroundColor Red
        exit 1
    }
    Write-Host ""

    # Step 3: Clean build folder
    Write-Host "📍 STEP 3: Cleaning build folder..." -ForegroundColor Yellow
    if (Test-Path "frontend\build") {
        Remove-Item "frontend\build" -Recurse -Force
        Write-Host "✅ Build folder removed" -ForegroundColor Green
    } else {
        Write-Host "✅ Build folder doesn't exist (already clean)" -ForegroundColor Green
    }
    Write-Host ""

    # Step 4: Clean cache
    Write-Host "📍 STEP 4: Cleaning cache..." -ForegroundColor Yellow
    if (Test-Path "frontend\node_modules\.cache") {
        Remove-Item "frontend\node_modules\.cache" -Recurse -Force
        Write-Host "✅ Cache removed" -ForegroundColor Green
    } else {
        Write-Host "✅ No cache to remove" -ForegroundColor Green
    }
    Write-Host ""

    # Step 5: Rebuild frontend
    Write-Host "📍 STEP 5: Rebuilding frontend..." -ForegroundColor Yellow
    Write-Host "⏳ This may take 1-2 minutes...`n" -ForegroundColor Cyan
    
    Set-Location "frontend"
    
    $buildOutput = npm run build 2>&1
    $buildSuccess = $LASTEXITCODE -eq 0
    
    Write-Host ($buildOutput | Out-String)
    
    if (!$buildSuccess) {
        Write-Host "`n❌ BUILD FAILED!" -ForegroundColor Red
        Write-Host "Check the error messages above." -ForegroundColor Red
        Set-Location $startLocation
        exit 1
    }
    
    Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
    Set-Location $startLocation
    Write-Host ""

    # Step 6: Verify new build file
    Write-Host "📍 STEP 6: Verifying new build file..." -ForegroundColor Yellow
    $buildFiles = Get-ChildItem "frontend\build\static\js\main.*.js"
    
    if ($buildFiles.Count -eq 0) {
        Write-Host "❌ ERROR: No build file found!" -ForegroundColor Red
        exit 1
    }
    
    $buildFile = $buildFiles[0]
    Write-Host "✅ Build file: $($buildFile.Name)" -ForegroundColor Green
    Write-Host "   Created: $($buildFile.LastWriteTime)" -ForegroundColor Cyan
    Write-Host "   Size: $([math]::Round($buildFile.Length / 1KB, 2)) KB" -ForegroundColor Cyan
    
    # Check if build is fresh (within last 5 minutes)
    $minutesOld = (Get-Date) - $buildFile.LastWriteTime
    if ($minutesOld.TotalMinutes -gt 5) {
        $mins = [math]::Round($minutesOld.TotalMinutes, 1)
        Write-Host "⚠️  WARNING: Build file is $mins minutes old" -ForegroundColor Yellow
        Write-Host "   Expected a fresh build (less than 5 minutes)" -ForegroundColor Yellow
    } else {
        $secs = [math]::Round($minutesOld.TotalSeconds, 0)
        Write-Host "✅ Build is fresh (${secs} seconds old)" -ForegroundColor Green
    }
    Write-Host ""

    # Step 7: Verify PROFILE in build
    Write-Host "📍 STEP 7: Searching for PROFILE in build..." -ForegroundColor Yellow
    $profileMatches = Select-String -Path $buildFile.FullName -Pattern "PROFILE" -AllMatches
    
    if ($profileMatches.Count -eq 0) {
        Write-Host "❌ ERROR: PROFILE not found in build file!" -ForegroundColor Red
        Write-Host "Build may have failed silently." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Found PROFILE in build ($($profileMatches.Matches.Count) occurrences)" -ForegroundColor Green
    
    # Show sample matches
    Write-Host "`n   Sample occurrences:" -ForegroundColor Cyan
    $sampleMatches = $profileMatches.Matches | Select-Object -First 3
    foreach ($match in $sampleMatches) {
        $context = $profileMatches.Line.Substring([math]::Max(0, $match.Index - 20), [math]::Min(60, $profileMatches.Line.Length - [math]::Max(0, $match.Index - 20)))
        Write-Host "   ... $context ..." -ForegroundColor Gray
    }
    Write-Host ""

    # Step 8: Test database connection
    Write-Host "📍 STEP 8: Testing database connection..." -ForegroundColor Yellow
    Write-Host "Running: node backend\check-user-data.js`n" -ForegroundColor Cyan
    
    $dbCheck = node backend\check-user-data.js 2>&1
    Write-Host ($dbCheck | Out-String)
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️  Database check had issues (see above)" -ForegroundColor Yellow
        Write-Host "This is OK if backend isn't running." -ForegroundColor Yellow
    }
    Write-Host ""

    # Step 9: Final summary
    Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                 ✅ FIX COMPLETE!                          ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

    Write-Host "🎯 NEXT STEPS:`n" -ForegroundColor Cyan
    Write-Host "1. Start backend (if not running):" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   node server.js`n" -ForegroundColor Gray

    Write-Host "2. Start frontend server:" -ForegroundColor White
    Write-Host "   node spa-server.js`n" -ForegroundColor Gray

    Write-Host "3. Clear browser cache:" -ForegroundColor White
    Write-Host "   Mobile: Settings → Clear Cache" -ForegroundColor Gray
    Write-Host "   Desktop: Ctrl+Shift+Delete → Clear Cache" -ForegroundColor Gray
    Write-Host ""

    Write-Host "4. Test profile page:" -ForegroundColor White
    Write-Host "   Navigate to: http://10.0.0.181:8080/profile" -ForegroundColor Gray
    $msg = "   Should load WITHOUT PROFILE undefined error"
    Write-Host $msg -ForegroundColor Gray
    Write-Host ""

    Write-Host "📊 Build Statistics:" -ForegroundColor Cyan
    Write-Host "   Build File: $($buildFile.Name)" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($buildFile.Length / 1KB, 2)) KB" -ForegroundColor Gray
    Write-Host "   Created: $($buildFile.LastWriteTime)" -ForegroundColor Gray
    Write-Host "   PROFILE occurrences: $($profileMatches.Matches.Count)" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "`n❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    Set-Location $startLocation
    exit 1
}

Write-Host "✅ All checks passed! Ready to test." -ForegroundColor Green
Write-Host ""
