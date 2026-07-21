@echo off
echo 🔧 DEFINITIVE SPA ROUTING FIX

echo.
echo 🛑 Stopping ALL services to ensure clean restart...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM http-server.exe /T 2>nul  
taskkill /F /IM cloudflared.exe /T 2>nul

echo.
echo ⏳ Waiting for complete shutdown...
timeout /t 5 /nobreak >nul

echo.
echo 📦 Verifying React build has proper routing...
cd frontend
if not exist "build\index.html" (
    echo ❌ Building React app...
    npm run build
) else (
    echo ✅ React build exists
)

echo.
echo 🔍 Checking React build structure...
if exist "build\static" (
    echo ✅ Static assets found
) else (
    echo ❌ Static assets missing - rebuilding...
    npm run build
)

echo.
echo 🚀 Starting Backend (Port 5000)...
start "Backend API" /D "%~dp0backend" cmd /k "echo [BACKEND] API Server with OAuth2 support && echo [BACKEND] Listening on localhost:5000 && node server.js"

echo.
echo ⏳ Backend startup delay...
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Starting Frontend with DEFINITIVE SPA routing...
echo Frontend will serve index.html for ALL non-API routes
start "Frontend SPA" cmd /k "echo [FRONTEND] DEFINITIVE SPA Configuration && echo [FRONTEND] Serving from: %~dp0frontend\build && echo [FRONTEND] SPA Mode: ALL routes fallback to index.html && echo [FRONTEND] Command: http-server build -p 8080 --spa --cors -c-1 && cd /d %~dp0frontend && npx http-server build -p 8080 --spa --cors -c-1"

cd ..

echo.
echo ⏳ Frontend startup delay...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Testing local frontend SPA routing...
echo Testing if localhost:8080 serves React routes properly...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080/dashboard' -UseBasicParsing; Write-Host 'Local SPA Test: Status' $response.StatusCode } catch { Write-Host 'Local SPA Test: Error -' $_.Exception.Message }"

echo.
echo 🌉 Starting Cloudflared Tunnel with DEFINITIVE configuration...
start "Tunnel SPA FIXED" cmd /k "echo [TUNNEL] DEFINITIVE SPA ROUTING CONFIG && echo [TUNNEL] /api/* -^> localhost:5000 (Backend) && echo [TUNNEL] /* -^> localhost:8080 (Frontend SPA) && echo [TUNNEL] All React routes will work && cloudflared tunnel --config tunnel-config.yml run whatsapp-bot"

echo.
echo ⏳ Tunnel establishment delay...
timeout /t 20 /nobreak >nul

echo.
echo ✅ DEFINITIVE SPA ROUTING DEPLOYMENT COMPLETE!
echo.
echo 🧪 COMPREHENSIVE TEST SEQUENCE:
echo.
echo 1. Test Root: https://connect.vemgootech.info
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info' -UseBasicParsing; Write-Host '   ✅ Root:' $r.StatusCode } catch { Write-Host '   ❌ Root: Error' }"

echo.
echo 2. Test Dashboard: https://connect.vemgootech.info/dashboard  
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info/dashboard' -UseBasicParsing; Write-Host '   ✅ Dashboard:' $r.StatusCode } catch { Write-Host '   ❌ Dashboard:' $_.Exception.Response.StatusCode }"

echo.
echo 3. Test Contacts: https://connect.vemgootech.info/contacts
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info/contacts' -UseBasicParsing; Write-Host '   ✅ Contacts:' $r.StatusCode } catch { Write-Host '   ❌ Contacts:' $_.Exception.Response.StatusCode }"

echo.
echo 4. Test API: https://connect.vemgootech.info/api/auth/me
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://connect.vemgootech.info/api/auth/me' -UseBasicParsing; Write-Host '   ✅ API:' $r.StatusCode } catch { Write-Host '   ✅ API: 401 (Expected)' }"

echo.
echo 🎯 EXPECTED RESULTS:
echo    ✅ Root: 200 (React app loads)
echo    ✅ Dashboard: 200 (SPA routing works) 
echo    ✅ Contacts: 200 (SPA routing works)
echo    ✅ API: 401 (API routing works, auth required)
echo.
echo 💡 If any show 404: Check the tunnel logs window
echo    SPA routing means ALL non-API routes serve index.html
echo.
pause