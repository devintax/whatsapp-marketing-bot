# 🧪 User Profile Testing Guide

## Quick Testing Instructions

### Step 1: Rebuild Frontend (5 min)
```powershell
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend
npm run build
```

### Step 2: Restart Backend (if needed)
```powershell
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot\backend
node server.js
```

### Step 3: Start Production Server
```powershell
cd C:\Users\vinny\Documents\DevOps\whatsApp-bot
node spa-server.js
```

### Step 4: Open Browser
Navigate to: `http://localhost:8080`

---

## 🎯 Testing Checklist

### Test 1: Login & Access Profile ✓
1. [ ] Login with: `edwinalove51@gmail.com` / `Tellhim312$!`
2. [ ] Click user avatar in top-right corner
3. [ ] Click "My Profile" from dropdown menu
4. [ ] Verify profile page loads with 4 tabs

**Expected Result**: Profile page opens, shows Personal Info tab

---

### Test 2: Personal Info Tab ✓
1. [ ] Check if existing data loads (email, name, etc.)
2. [ ] Update First Name to: "Edwin"
3. [ ] Update Last Name to: "Love"
4. [ ] Update Phone to: "(555) 123-4567"
5. [ ] Click "Save Changes"
6. [ ] Verify success message appears

**Expected Result**: ✅ "Profile updated successfully"

---

### Test 3: Business Info Tab ✓
1. [ ] Click "Business Info" tab
2. [ ] Set Business Name to: "Divine Financial Group"
3. [ ] Select Industry: "Finance"
4. [ ] Set Business Phone: "(555) 999-8888"
5. [ ] Set Business Email: "info@divinefinancial.com"
6. [ ] Add Description: "Professional financial services for tax season"
7. [ ] Click "Save Changes"

**Expected Result**: ✅ Business info saved

---

### Test 4: Upload Avatar ✓
1. [ ] Go back to "Personal Info" tab
2. [ ] Click "Upload Avatar" button
3. [ ] Select an image file (JPG/PNG, under 5MB)
4. [ ] Verify preview appears
5. [ ] Check avatar in top-right corner updates

**Expected Result**: ✅ Avatar appears in header immediately

---

### Test 5: Upload Business Logo ✓
1. [ ] Click "Business Info" tab
2. [ ] Click "Upload Logo" button
3. [ ] Select a logo image
4. [ ] Verify preview appears
5. [ ] Save changes

**Expected Result**: ✅ Logo uploaded and previewed

---

### Test 6: Settings Tab ✓
1. [ ] Click "Settings" tab
2. [ ] Change timezone to your timezone
3. [ ] Toggle "Email Notifications" off
4. [ ] Toggle "WhatsApp Notifications" on
5. [ ] Set AI Tone to "Professional"
6. [ ] Click "Save Settings"

**Expected Result**: ✅ Settings saved

---

### Test 7: Password Change ✓
1. [ ] Click "Security" tab
2. [ ] Enter Current Password: `Tellhim312$!`
3. [ ] Enter New Password: `NewPassword123!`
4. [ ] Confirm New Password: `NewPassword123!`
5. [ ] Click "Change Password"
6. [ ] Verify success message

**Test Next Login**: 
- [ ] Logout
- [ ] Login with new password
- [ ] Verify it works

**Expected Result**: ✅ Password changed successfully

---

### Test 8: Header Shows Business Name ✓
1. [ ] After setting business name
2. [ ] Check top of page (app bar)
3. [ ] Verify it shows "Divine Financial Group"
4. [ ] NOT "WhatsApp Marketing Bot"

**Expected Result**: ✅ Header displays your business name

---

### Test 9: Campaign Integration (CRITICAL) ✓
1. [ ] Navigate to Campaigns page
2. [ ] Click "Create Campaign"
3. [ ] Check the AI-generated message
4. [ ] **VERIFY**: Message should include "Divine Financial Group"
5. [ ] **VERIFY**: Should NOT say "Hello from Divine Financial Group!" if you changed business name

**Expected Result**: ✅ Campaign uses YOUR business name dynamically

---

### Test 10: Multi-User Testing (CRITICAL) ✓
#### Create Second User:
1. [ ] Logout from current session
2. [ ] Click "Sign Up" (if available) or use second account
3. [ ] Login as different user
4. [ ] Go to Profile
5. [ ] Set different business name (e.g., "ABC Company")
6. [ ] Go to Campaigns
7. [ ] Verify campaigns show "ABC Company"

#### Switch Back to First User:
1. [ ] Logout
2. [ ] Login as `edwinalove51@gmail.com`
3. [ ] Go to Campaigns
4. [ ] Verify campaigns show "Divine Financial Group"

**Expected Result**: ✅ Each user sees their own business name

---

## 🐛 Bug Reporting

### If Something Fails:

#### Error: "Cannot read property 'businessName' of null"
**Cause**: User profile not loaded yet  
**Fix**: Check browser console, verify API endpoint returns data

#### Error: Avatar upload fails
**Cause**: File too large or wrong format  
**Fix**: Use JPG/PNG under 5MB

#### Error: Profile page blank
**Cause**: React build issue  
**Fix**: Clear cache, rebuild frontend
```powershell
cd frontend
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
npm run build
```

#### Error: Campaigns still say "Divine Financial Group"
**Cause**: Frontend not rebuilt after code changes  
**Fix**: Rebuild frontend
```powershell
cd frontend
npm run build
```

---

## ✅ Success Criteria

All these should work:
- ✅ Can access /profile page
- ✅ Can update personal info
- ✅ Can update business info
- ✅ Can upload avatar
- ✅ Can upload logo
- ✅ Can change settings
- ✅ Can change password
- ✅ Header shows business name
- ✅ Avatar appears in header
- ✅ Campaigns use dynamic business name
- ✅ Each user has separate data

---

## 📞 Quick Troubleshooting

### Profile Page Not Loading:
```powershell
# Check if route is registered
# Open: frontend/src/App.js
# Look for: <Route path="/profile" element={<Profile />} />
```

### Business Name Not Showing in Header:
```powershell
# Check if Layout fetches profile
# Open: frontend/src/components/Layout.js
# Look for: fetchUserProfile() in useEffect
```

### Campaigns Still Hardcoded:
```powershell
# Check if Campaigns.js updated
# Open: frontend/src/pages/Campaigns.js
# Search for: userProfile?.businessName
# Should NOT find: 'Hello from Divine Financial Group!'
```

---

## 🎯 Next After Testing

Once all tests pass:

1. **✅ Mark Profile Tasks Complete** in todo list
2. **📝 Document any bugs** found
3. **🔄 Run migration script** for existing users
4. **🤖 Integrate AI** with user context
5. **🏷️ Tag contacts** with business owner

---

**Happy Testing!** 🚀

If everything works, you now have a professional multi-tenant platform with:
- Dynamic business branding
- User profile management
- Avatar/logo uploads
- Personalized campaigns
- Professional navigation

**Report back with results!** 📊
