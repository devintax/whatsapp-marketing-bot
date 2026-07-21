/**
 * 📱 WHATSAPP CONNECTION TROUBLESHOOTING GUIDE
 * 
 * Complete step-by-step guide to connect WhatsApp and resolve common issues
 */

# 🚀 WhatsApp Connection Guide

## ✅ STEP 1: Initial Setup

### Prerequisites Checklist:
- [ ] Backend server is running (port 5000)
- [ ] Frontend is accessible (http://localhost:8080)
- [ ] You're logged into the application
- [ ] You have WhatsApp installed on your mobile phone
- [ ] Your phone has internet connection

---

## 📱 STEP 2: Connect WhatsApp (First Time)

### On Your Computer:

1. **Login to Application**
   - Go to: http://localhost:8080
   - Login with your credentials

2. **Navigate to Settings**
   - Click: Settings (⚙️) in sidebar
   - Or go to: http://localhost:8080/settings

3. **Scroll to WhatsApp Section**
   - Look for: "WhatsApp Connection Status"
   - You should see: Status: Not Connected

4. **Click "Connect WhatsApp" Button**
   - A QR code will appear within 5-10 seconds
   - Wait for the QR code to fully load
   - **DO NOT close this window!**

### On Your Phone:

5. **Open WhatsApp Mobile App**
   - Make sure you have WhatsApp installed
   - Open the app

6. **Go to Linked Devices**
   - Tap: Settings (⚙️ or three dots)
   - Tap: "Linked Devices"
   - **NOT "WhatsApp Web"** - must use "Linked Devices"!

7. **Link Your Device**
   - Tap: "Link a Device" (green button)
   - Camera will open
   - Point camera at QR code on computer screen
   - Hold steady until it scans

8. **Wait for Connection**
   - You'll see "Linking device..." on phone
   - Computer should show: "Authenticating..."
   - After 5-30 seconds: "Status: Connected ✅"

---

## 🔧 STEP 3: Troubleshooting Common Issues

### Issue 1: "Couldn't Link Device" Error

**Symptoms:**
- QR code scans but shows error
- "Try again later" message
- Connection keeps failing

**SOLUTION:**

#### Method A - Batch File (Easiest):
1. Stop backend server (Ctrl+C in terminal)
2. Double-click: `clean-whatsapp-sessions.bat`
3. Press any key to confirm cleanup
4. Restart backend: `cd backend && npm run dev`
5. Clear browser cache (Ctrl+Shift+Delete)
6. Refresh page (F5)
7. Try connecting again

#### Method B - Manual Cleanup:
1. Stop backend server
2. Navigate to: `backend/whatsapp_sessions/`
3. Delete the entire folder
4. Restart backend server
5. Clear browser cache
6. Try connecting again

---

### Issue 2: QR Code Doesn't Appear

**Symptoms:**
- Button says "Loading..."
- Status shows "Initializing..."
- QR code never shows up

**SOLUTION:**

1. **Check Backend Console:**
   - Look for errors in backend terminal
   - Should see: "WhatsApp client initializing..."

2. **Restart Backend:**
   ```powershell
   # Stop current process (Ctrl+C)
   cd backend
   npm run dev
   ```

3. **Check Browser Console:**
   - Press F12 to open DevTools
   - Look for JavaScript errors
   - Check Network tab for failed API calls

4. **Verify Port 5000 is Running:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   - Should show LISTENING status

---

### Issue 3: "Status: Restoring" Stuck

**Symptoms:**
- Shows "Restoring..." indefinitely
- Can't generate new QR code
- Stuck for more than 60 seconds

**SOLUTION:**

1. **Use Reset Button:**
   - After 30 seconds, "Reset Connection" button appears
   - Click it to force reset

2. **Or Clean Sessions Manually:**
   - Run: `clean-whatsapp-sessions.bat`
   - Restart backend
   - Try connecting again

---

### Issue 4: JWT Token Expired

**Symptoms:**
```
🔐 Auth middleware - Token invalid: jwt expired
```

**SOLUTION:**

1. **Logout and Login:**
   - Click your profile picture/name
   - Click "Logout"
   - Login again with credentials
   - New token lasts 7 days

---

### Issue 5: Connection Drops Frequently

**Symptoms:**
- Connects successfully
- Disconnects after a few minutes
- Have to reconnect constantly

**SOLUTION:**

1. **Check Phone Internet:**
   - Make sure phone has stable WiFi/4G
   - WhatsApp needs to be running in background

2. **Don't Kill WhatsApp App:**
   - Keep WhatsApp open on phone
   - Don't force-close the app
   - Allow background data usage

3. **Check for Multiple Linked Devices:**
   - WhatsApp allows max 5 linked devices
   - Remove old/unused linked devices:
     - WhatsApp → Settings → Linked Devices
     - Tap device → "Log Out"

---

## 📊 Expected Console Logs

### ✅ Successful Connection:

```
🔄 Initializing WhatsApp client for user [userId]...
📱 WhatsApp client created successfully
🔄 Real WhatsApp QR code generated for user [userId]
✅ WhatsApp client ready for user [userId]
📱 WhatsApp authenticated successfully
Status: connected
```

### ❌ Connection Error:

```
❌ Error initializing WhatsApp client: [error message]
⚠️ QR code generation failed
```

---

## 🎯 Best Practices

### DO:
✅ Wait for QR code to fully load before scanning
✅ Use "Linked Devices" (not WhatsApp Web)
✅ Keep phone internet connection stable
✅ Clean sessions if you see errors
✅ Restart backend after session cleanup
✅ Clear browser cache after major changes

### DON'T:
❌ Don't scan the same QR code multiple times
❌ Don't close QR code window immediately after scanning
❌ Don't force-close WhatsApp on phone
❌ Don't try to connect while backend is restarting
❌ Don't use WhatsApp Web camera (use Linked Devices!)

---

## 🆘 Advanced Troubleshooting

### Problem: Port 5000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
Stop-Process -Id [PID] -Force

# Restart backend
cd backend
npm run dev
```

---

### Problem: Chrome/Browser Issues

**Solution:**
1. Try **Incognito/Private mode**
2. Try **different browser** (Chrome works best)
3. **Disable extensions** that might interfere
4. **Clear all browser data** (Ctrl+Shift+Delete)

---

### Problem: WhatsApp Rate Limiting

**Symptoms:**
- Multiple connection attempts fail
- WhatsApp shows "Too many attempts"

**Solution:**
1. **Wait 15-30 minutes** between connection attempts
2. WhatsApp rate-limits connection attempts
3. Don't try to connect more than 3-5 times in quick succession

---

## 📞 Testing Your Connection

### After Successfully Connecting:

1. **Test with Yourself First:**
   ```
   1. Go to Contacts
   2. Add your own phone number
   3. Add your name
   4. Create test campaign
   5. Send message to yourself
   6. Check WhatsApp on your phone
   ```

2. **Expected Result:**
   - You receive personalized message: "Hi [YourName]!"
   - Message appears in your WhatsApp within seconds
   - Backend logs show successful send

3. **If Test Fails:**
   - Check backend console for errors
   - Verify WhatsApp still shows "Connected"
   - Check phone number format: +14432072634
   - Ensure phone has internet connection

---

## 🎉 Success Indicators

### ✅ Everything is Working When:

1. **Settings Page Shows:**
   - Status: Connected ✅ (green)
   - Your phone number displayed
   - "Disconnect" button available

2. **Backend Console Shows:**
   - "WhatsApp authenticated successfully"
   - No error messages
   - Ready to send messages

3. **Test Campaign Works:**
   - Messages send successfully
   - You receive on WhatsApp
   - Console shows personalization working

---

## 📚 Additional Resources

### Quick Commands:

```powershell
# Restart backend
cd backend
npm run dev

# Clean WhatsApp sessions
# (Use batch file or manual delete)

# Check port status
netstat -ano | findstr :5000

# Kill all Node processes
Get-Process -Name node | Stop-Process -Force
```

### File Locations:

- **Session Files:** `backend/whatsapp_sessions/`
- **Cleanup Script:** `clean-whatsapp-sessions.bat`
- **Backend Logs:** Check terminal running `npm run dev`
- **Frontend:** http://localhost:8080

---

## 🔄 Quick Reset Checklist

If everything is broken and you want to start fresh:

1. [ ] Stop all Node processes
2. [ ] Run: `clean-whatsapp-sessions.bat`
3. [ ] Delete browser cache
4. [ ] Restart backend server
5. [ ] Logout and login again
6. [ ] Try connecting WhatsApp
7. [ ] Test with yourself first

---

**Need more help? Check the Pro Tips page for WhatsApp compliance best practices!**
