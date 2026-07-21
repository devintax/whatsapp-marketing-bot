# 🧪 Testing Avatar & Logo Uploads - Quick Guide

## ✅ What Was Fixed

**Problem**: Images were uploading to the server but not displaying in the UI.

**Root Cause**: Backend returned `avatarUrl` and `logoUrl`, but frontend expected `profilePicture` and `businessLogo`.

**Fix Applied**: 
- ✅ Changed backend response fields to match frontend expectations
- ✅ Backend server restarted automatically
- ✅ No frontend changes needed (was already correct)

---

## 🎯 How to Test (2 Minutes)

### **Step 1: Navigate to Profile Page**
1. Go to: `http://10.0.0.181:8080/profile` (or `http://localhost:3000/profile`)
2. You should see your profile with tabs: Personal Info, Business Info, Settings, Security

### **Step 2: Test Avatar Upload** (Personal Info Tab)
1. Click the **camera icon** on your profile picture
2. Select a JPG or PNG image (under 5MB)
3. **Expected Result**:
   - ✅ Image uploads immediately
   - ✅ Preview appears instantly
   - ✅ Success message: "Profile picture updated!"
   - ✅ Image visible in navigation header
   - ✅ Image persists after page refresh

### **Step 3: Test Logo Upload** (Business Info Tab)
1. Switch to **Business Info** tab
2. Click the **camera icon** on the business logo placeholder
3. Select a JPG/PNG/SVG image (under 5MB)
4. **Expected Result**:
   - ✅ Logo uploads immediately
   - ✅ Preview appears instantly
   - ✅ Success message: "Business logo updated!"
   - ✅ Logo persists after page refresh

---

## 🔍 What to Check in Browser Console

Open DevTools (`F12`) → Console tab

### **Successful Upload Should Show**:
```javascript
✅ Response from server:
{
  success: true,
  message: "Avatar uploaded successfully",
  profilePicture: "/uploads/avatars/avatar-673f123abc-1730000000.jpg"
}
```

### **Image Should Load From**:
```
http://10.0.0.181:5000/uploads/avatars/avatar-673f123abc-1730000000.jpg
```

### **NO Errors Like**:
```
❌ Cannot read property 'profilePicture' of undefined
❌ Failed to upload profile picture
❌ 404 Not Found
```

---

## 🗂️ Verify Files on Server

### **Check Backend Uploads Folder**:

```powershell
# List uploaded avatar files
Get-ChildItem backend\uploads\avatars

# List uploaded logo files  
Get-ChildItem backend\uploads\logos
```

**Expected**:
```
Directory: backend\uploads\avatars

Mode         LastWriteTime         Length Name
----         -------------         ------ ----
-a----  10/28/2025  3:45 PM      1234567 avatar-673f123abc-1730000000.jpg
```

---

## 🐛 Common Issues & Solutions

### **"Failed to upload profile picture"**

1. **Check browser console** for exact error
2. **Check backend terminal** for errors
3. **Restart backend** if needed:
   ```powershell
   cd backend
   npm run dev
   ```

### **Image uploads but doesn't display**

This was the original bug - **now fixed!** But if it happens:

1. Clear browser cache (`Ctrl + Shift + Delete`)
2. Hard refresh (`Ctrl + Shift + R`)
3. Check browser console for 404 errors on image URL

### **"No file uploaded" error**

- Make sure you selected a file
- File must be image type (JPG, PNG, GIF, or SVG for logos)
- File must be under 5MB

### **Backend not responding**

```powershell
# Check if backend is running
Get-Process -Name node | Where-Object { $_.Path -like "*nodemon*" }

# If not running, start it:
cd backend
npm run dev
```

---

## 📸 Test Cases Checklist

### **Avatar Upload**:
- [ ] Upload JPG → Works
- [ ] Upload PNG → Works
- [ ] Upload GIF → Works
- [ ] Upload >5MB file → Shows error
- [ ] Upload PDF file → Shows error
- [ ] Upload new avatar → Replaces old one
- [ ] Refresh page → Avatar still visible
- [ ] Avatar appears in header/navigation
- [ ] Old file deleted from server

### **Logo Upload**:
- [ ] Upload JPG → Works
- [ ] Upload PNG → Works
- [ ] Upload SVG → Works (logos only!)
- [ ] Upload >5MB file → Shows error
- [ ] Upload new logo → Replaces old one
- [ ] Refresh page → Logo still visible
- [ ] Old file deleted from server

### **Edge Cases**:
- [ ] Upload same file twice → Works both times
- [ ] Upload, logout, login → Image still there
- [ ] Upload from mobile device → Works
- [ ] Upload very small image (1KB) → Works
- [ ] Upload image with special chars in name → Works

---

## 🎯 Expected Behavior Summary

### **Before Fix** ❌:
```
User uploads image
   ↓
Backend saves file ✅
Backend saves path to DB ✅
Backend returns { avatarUrl: "/uploads/..." } ❌
   ↓
Frontend looks for profilePicture ❌
Frontend gets undefined ❌
   ↓
Image invisible in UI ❌
```

### **After Fix** ✅:
```
User uploads image
   ↓
Backend saves file ✅
Backend saves path to DB ✅
Backend returns { profilePicture: "/uploads/..." } ✅
   ↓
Frontend looks for profilePicture ✅
Frontend gets correct path ✅
   ↓
Image displays immediately ✅
```

---

## 📁 Where Files Are Stored

### **Physical Location**:
```
backend/
  uploads/
    avatars/
      avatar-{userId}-{timestamp}.jpg  ← Your profile picture
    logos/
      logo-{userId}-{timestamp}.png    ← Your business logo
```

### **Database (MongoDB)**:
```javascript
// User document only stores PATH (not the file itself):
{
  _id: "673f123abc...",
  email: "user@example.com",
  profilePicture: "/uploads/avatars/avatar-673f123abc-1730000000.jpg",
  businessProfile: {
    logo: "/uploads/logos/logo-673f123abc-1730000001.png"
  }
}
```

### **Accessed Via HTTP**:
```
http://10.0.0.181:5000/uploads/avatars/avatar-673f123abc-1730000000.jpg
```

---

## 🚀 Next Steps After Testing

Once uploads work:

1. **✅ Mark todo as complete**: 
   - "🧪 Test User Profile Features"

2. **Test Campaign Integration**:
   - Create a campaign
   - Check if business logo appears in campaign preview
   - Verify business name is used (not hardcoded)

3. **Optional Enhancements**:
   - Image cropping/resizing
   - Drag & drop upload
   - Preview before upload
   - Multiple images support

---

## 🎉 Success Criteria

You'll know everything works when:

✅ Click camera icon → file selector opens  
✅ Select image → upload starts  
✅ See success toast notification  
✅ Image appears immediately in UI  
✅ Refresh page → image still there  
✅ Check backend/uploads/ → file exists  
✅ No console errors  
✅ Works on both desktop & mobile  

---

**Testing Time**: ~2 minutes per upload type = 4 minutes total! 🎯
