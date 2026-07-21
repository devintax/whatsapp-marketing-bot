# 🔧 Backend Server Fix - Port 5000 Already in Use

**Error**: `EADDRINUSE: address already in use 0.0.0.0:5000`

**Cause**: Another Node.js process is already running on port 5000

---

## ✅ Quick Fix (PowerShell Commands)

### **Option 1: Kill All Node Processes** (Fastest)

```powershell
# Stop all Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start backend server
cd backend
npm run dev
```

**⚠️ Warning**: This will stop ALL Node.js processes, including frontend if running!

---

### **Option 2: Kill Only Port 5000 Process** (Safer)

```powershell
# Find process using port 5000
$port = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

# Kill that specific process
if ($port) {
    Stop-Process -Id $port.OwningProcess -Force
    Write-Host "✅ Killed process $($port.OwningProcess) using port 5000"
} else {
    Write-Host "❌ No process found on port 5000"
}

# Start backend server
cd backend
npm run dev
```

---

### **Option 3: Use Different Port** (Alternative)

Edit `backend/.env`:

```env
# Change from:
PORT=5000

# To:
PORT=5001
```

Then update frontend API URL in `frontend/src/config/api.js`:

```javascript
// Change from:
const API_BASE_URL = 'http://localhost:5000/api';

// To:
const API_BASE_URL = 'http://localhost:5001/api';
```

---

## 🚀 Automated Fix Script

**Run this PowerShell script** (saves you time):

```powershell
# kill-port-5000.ps1

Write-Host "🔍 Finding process using port 5000..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction Stop
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction Stop
    
    Write-Host "📍 Found: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
    Write-Host "🔪 Killing process..." -ForegroundColor Red
    
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
    
    Write-Host "✅ Process killed successfully!" -ForegroundColor Green
    Write-Host "🚀 Port 5000 is now free" -ForegroundColor Green
    
} catch {
    Write-Host "❌ No process found on port 5000" -ForegroundColor Red
    Write-Host "ℹ️  Port might already be free" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Starting backend server..." -ForegroundColor Yellow
Set-Location -Path "backend"
npm run dev
```

**Save as**: `kill-port-5000.ps1`

**Run**:
```powershell
.\kill-port-5000.ps1
```

---

## 🎯 Recommended Solution (Step-by-Step)

### **Step 1: Open New PowerShell Terminal**

Press `Ctrl + Shift + ` ` (backtick) in VS Code

### **Step 2: Run This Command**

```powershell
Get-Process -Name node | Stop-Process -Force; Start-Sleep 2; cd backend; npm run dev
```

**This will**:
1. ✅ Stop all Node.js processes
2. ⏱️ Wait 2 seconds
3. 📂 Navigate to backend folder
4. 🚀 Start backend server

---

## 🔍 Verify Backend is Running

After starting, you should see:

```
✅ Connected to MongoDB successfully
✅ Real-Time Analytics Service initialized
🚀 Server running on http://localhost:5000
📊 API endpoints available at http://localhost:5000/api
```

**Test it**:
```powershell
curl http://localhost:5000/api/health
```

**Expected response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T..."
}
```

---

## 🐛 Troubleshooting

### **Issue 1: Permission Denied**

**Error**: `Access is denied`

**Solution**: Run PowerShell as Administrator
- Right-click PowerShell
- Select "Run as Administrator"
- Try again

---

### **Issue 2: Process Keeps Restarting**

**Cause**: Task runner or VS Code task auto-restarting

**Solution**:
1. Open VS Code Terminal panel
2. Find any running "Backend Server" tasks
3. Click trash icon to stop them
4. Manually start: `cd backend && npm run dev`

---

### **Issue 3: Still Getting EADDRINUSE**

**Solution**: Restart your computer (last resort)
- This will clear all processes
- Then start fresh

**Or check other apps using port 5000**:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
```

---

## ✅ Prevention Tips

### **1. Always Stop Server Before Closing VS Code**

Press `Ctrl + C` in backend terminal before closing

### **2. Use Single Terminal for Backend**

Don't start multiple backend instances

### **3. Check Before Starting**

```powershell
# Check if port is in use
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# If output appears, port is in use
# If no output, port is free
```

---

## 🚀 Quick Start Commands (Copy-Paste Ready)

### **Kill Port 5000 and Start Backend**:
```powershell
Get-Process -Name node | Stop-Process -Force; Start-Sleep 2; cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend; npm run dev
```

### **Start Frontend** (in separate terminal):
```powershell
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend; npm start
```

### **Check Both Servers Running**:
```powershell
# Backend
curl http://localhost:5000/api/health

# Frontend
curl http://localhost:3000
```

---

## 📋 Current Status

**Backend**: ❌ CRASHED (port 5000 in use)  
**Frontend**: ❓ Unknown (might be running)

**Action Required**: Kill port 5000 process and restart backend

---

**Run the quick fix command now to get testing! 🚀**
