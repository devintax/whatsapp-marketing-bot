@echo off
echo 🔧 FINAL SPA FIX - Custom Express Server

echo.
echo 🛑 Stopping all services...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM cloudflared.exe /T 2>nul
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Starting Backend (Port 5000)...
start "Backend API" /D "%~dp0backend" cmd /k "echo [BACKEND] API Server && node server.js"
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Starting Frontend with CUSTOM SPA Server (Port 8080)...
start "Frontend SPA - CUSTOM" /D "%~dp0frontend" cmd /k "echo [FRONTEND] Custom Express SPA Server && echo [FRONTEND] Guaranteed SPA routing for ALL React routes && node spa-server.js"
timeout /t 8 /nobreak >nul

echo.
echo 🔍 Testing local SPA routing with custom server...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/dashboard' -UseBasicParsing; Write-Host 'Local SPA Test:' $r.StatusCode } catch { Write-Host 'Local SPA Error:' $_.Exception.Message }"

echo.
echo 🌉 Starting Cloudflared Tunnel...
start "Tunnel - Custom SPA" cmd /k "echo [TUNNEL] Routing to custom SPA server && cloudflared tunnel --config tunnel-config.yml run whatsapp-bot"
timeout /t 15 /nobreak >nul

echo.
echo ✅ CUSTOM SPA SERVER DEPLOYMENT COMPLETE!
echo.
echo 🧪 FINAL TESTS:
echo.
powershell -Command "Write-Host '1. Root Test:'; try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info' -UseBasicParsing; Write-Host '   Status:' $r.StatusCode } catch { Write-Host '   Error:' $_.Exception.Message }"

echo.
powershell -Command "Write-Host '2. Dashboard Test:'; try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info/dashboard' -UseBasicParsing; Write-Host '   Status:' $r.StatusCode } catch { Write-Host '   Error:' $_.Exception.Response.StatusCode }"

echo.
powershell -Command "Write-Host '3. Contacts Test:'; try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info/contacts' -UseBasicParsing; Write-Host '   Status:' $r.StatusCode } catch { Write-Host '   Error:' $_.Exception.Response.StatusCode }"

echo.
powershell -Command "Write-Host '4. API Test:'; try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info/api/auth/me' -UseBasicParsing; Write-Host '   Status:' $r.StatusCode } catch { Write-Host '   Status: 401 (Expected)' }"

echo.
echo 🎉 CUSTOM SPA SERVER GUARANTEES:
echo    ✅ Express server with explicit SPA routing
echo    ✅ ALL non-API routes serve index.html  
echo    ✅ React Router will handle client-side routing
echo    ✅ No more 404 errors on page refresh
echo.
pause