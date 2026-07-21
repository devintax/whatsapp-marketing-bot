# 🔧 BACKEND PORT ISSUE - Complete Solution

**Problem**: Backend trying to start on port **3000** instead of **5000**

**Root Cause**: The `$env:PORT=3000` command you ran earlier for the frontend set the PORT environment variable in your PowerShell session. Nodemon is inheriting this variable!

---

## ✅ SOLUTION (Choose One)

### **Option 1: Fresh Terminal** (Easiest - RECOMMENDED)

1. **Close ALL PowerShell terminals** in VS Code
2. **Open a NEW terminal** (Ctrl + Shift + `)
3. Run:
```powershell
cd backend
npm run dev
```

**Why this works**: New terminal = clean environment = no PORT variable

---

### **Option 2: Clear Environment in Current Terminal**

In your current terminal, run:
```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend
npm run dev
```

---

### **Option 3: Force PORT to 5000**

```powershell
$env:PORT=5000
cd backend
npm run dev
```

---

## 🎯 Quick Fix Script

I've created: **`start-backend-clean.bat`**

**Just run**:
```powershell
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot
.\start-backend-clean.bat
```

This script:
- Kills all node processes
- Clears PORT variable  
- Starts backend on correct port 5000

---

## ✅ Verification

When backend starts successfully, you should see:

```
✅ Connected to MongoDB successfully
✅ Real-Time Analytics Service initialized  
🚀 Server running on port 5000
   - Local: http://localhost:5000
   - Network: http://0.0.0.0:5000
```

**NOT**: `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000` ❌

---

## 📋 Step-by-Step (Foolproof)

### **Step 1: Kill All Node Processes**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### **Step 2: Close Current Terminal**
- Click the trash icon on your terminal
- This ensures clean environment

### **Step 3: Open New Terminal**
- Press `Ctrl + Shift + `` (backtick)
- Or click Terminal → New Terminal

### **Step 4: Start Backend**
```powershell
cd backend
npm run dev
```

### **Step 5: Verify**
- Wait for "Server running on port 5000"
- Should see NO errors about port 3000

---

## 🐛 Troubleshooting

### **Still shows port 3000?**

Check if .env file exists:
```powershell
Get-Content backend\.env | Select-String "PORT"
```

Should show: `PORT=5000`

If it shows `PORT=3000`, fix it:
```powershell
(Get-Content backend\.env) -replace 'PORT=3000', 'PORT=5000' | Set-Content backend\.env
```

### **Port 5000 in use?**

```powershell
# Find and kill process on port 5000
$conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### **Port 3000 in use?**

```powershell
# Find and kill process on port 3000 (probably frontend)
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

---

## 🚀 Recommended Workflow

**For Backend** (always port 5000):
```powershell
# Terminal 1
cd backend
npm run dev
```

**For Frontend** (always port 3000):
```powershell
# Terminal 2 (NEW terminal, don't reuse backend terminal!)
cd frontend
npm start
```

**Keep them in separate terminals!**

---

## ⚠️ Common Mistakes

### ❌ **Don't Do This**:
```powershell
# BAD: Setting PORT then running backend in same terminal
$env:PORT=3000
cd backend
npm run dev  # Will use port 3000!
```

### ✅ **Do This Instead**:
```powershell
# GOOD: Separate terminals for backend and frontend
# Terminal 1: Backend only
cd backend
npm run dev  # Uses .env PORT=5000

# Terminal 2: Frontend only  
cd frontend
npm start  # Uses its own port 3000
```

---

## 📊 Current Status Check

Run this to see what ports are in use:
```powershell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(3000, 5000, 8080)} | Select-Object LocalPort, OwningProcess, @{Name="ProcessName";Expression={(Get-Process -Id $_.OwningProcess).ProcessName}}
```

**Expected**:
- Port 5000: node (backend)
- Port 3000: node (frontend) OR empty

**If you see**:
- Port 3000: Multiple processes → Kill them all
- Port 5000: Multiple processes → Kill them all

---

## 🎯 Final Solution (Copy-Paste Ready)

```powershell
# Stop everything
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait
Start-Sleep -Seconds 2

# Start backend (NEW terminal recommended)
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend
npm run dev

# Wait for success message, then in ANOTHER NEW terminal:
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend
npm start
```

---

## ✅ Success Criteria

**Backend Started When You See**:
```
[nodemon] starting `node server.js`
🔧 Initializing Redis Cloud connection...
✅ Connected to MongoDB successfully
🚀 Server running on port 5000
```

**Frontend Started When You See**:
```
Compiled successfully!
webpack compiled with 0 errors

You can now view whatsapp-marketing-bot-frontend in the browser.
  Local:            http://localhost:3000
```

---

**🎯 ACTION: Open a NEW terminal and run the backend!**

Don't reuse the terminal where you ran `$env:PORT=3000` earlier!
