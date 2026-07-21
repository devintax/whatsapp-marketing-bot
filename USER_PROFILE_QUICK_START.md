# 🚀 User Profile Enhancement - Quick Start Guide

## 📌 What We're Fixing

### Current Problems:
1. ❌ Campaigns use hardcoded "Divine Financial Group" (Line 410 in Campaigns.js)
2. ❌ Users cannot update their profile, business name, or branding
3. ❌ No multi-business support (critical for platform growth)
4. ❌ AI doesn't use user's actual business context

### After Implementation:
1. ✅ Dynamic business names for all users
2. ✅ Professional profile management with avatars/logos
3. ✅ Perfect multi-tenancy with business isolation
4. ✅ AI uses each user's unique business context

---

## 🎯 Implementation Priority (Top-Down Approach)

### 🔥 **PHASE 1A: Backend User Model** (30 min - CRITICAL)

**File**: `backend/models/User.js`

Add these fields to existing schema:

```javascript
// Personal Info
firstName: { type: String, default: '' },
lastName: { type: String, default: '' },
phone: { type: String, default: '' },
profilePicture: { type: String, default: '' },

// Business Info (CRITICAL!)
businessName: { 
  type: String, 
  required: true,
  default: function() { return this.email.split('@')[0]; }
},
businessIndustry: { type: String, default: 'other' },
businessPhone: { type: String, default: '' },
businessEmail: { type: String, default: '' },
businessAddress: { type: String, default: '' },
businessWebsite: { type: String, default: '' },
businessLogo: { type: String, default: '' },
businessDescription: { type: String, default: '' },

// Settings
timezone: { type: String, default: 'America/New_York' },
language: { type: String, default: 'en' },

// Notifications
notifications: {
  email: { type: Boolean, default: true },
  whatsapp: { type: Boolean, default: false },
  campaignUpdates: { type: Boolean, default: true },
  contactImports: { type: Boolean, default: true }
},

// AI Preferences
aiPreferences: {
  preferredProvider: { type: String, default: 'groq' },
  defaultTone: { type: String, default: 'professional' }
},

// Account Info
lastLogin: { type: Date },
lastPasswordChange: { type: Date }

// Add virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim() || this.email;
});
```

**Test**: Restart backend and verify no errors
```bash
cd backend
node server.js
```

---

### 🔥 **PHASE 1B: Create Profile Routes** (45 min)

**File**: `backend/routes/profile.js` (NEW)

See full implementation in `USER_PROFILE_ENHANCEMENT_PLAN.md` Phase 1.2

**Key Routes**:
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `POST /api/profile/logo` - Upload logo
- `PUT /api/profile/password` - Change password

**Register in** `backend/server.js`:
```javascript
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static('uploads'));
```

**Create uploads directory**:
```bash
mkdir -p backend/uploads/avatars
```

**Test**:
```bash
node backend/test-profile.js
```

---

### 🔥 **PHASE 1C: Fix Hardcoded Business Name** (30 min - CRITICAL)

**File**: `frontend/src/pages/Campaigns.js`

**Find and replace** (around line 410):

```javascript
// OLD (REMOVE):
let message = 'Hello from Divine Financial Group!';

// NEW (ADD):
// At top of component
const [userProfile, setUserProfile] = useState(null);

// In useEffect
useEffect(() => {
  fetchCampaigns();
  checkWhatsAppStatus();
  fetchUserProfile(); // 🆕 Add this
}, []);

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_ENDPOINTS.PROFILE.GET, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      setUserProfile(response.data.profile);
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
};

// In handleSendCampaign function:
let message = `Hello from ${userProfile?.businessName || 'Your Business'}!`;
```

**Update API endpoints** (`frontend/src/config/api.js`):
```javascript
PROFILE: {
  GET: `${API_BASE_URL}/api/profile`,
  UPDATE: `${API_BASE_URL}/api/profile`,
  UPLOAD_AVATAR: `${API_BASE_URL}/api/profile/avatar`,
  UPLOAD_LOGO: `${API_BASE_URL}/api/profile/logo`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/profile/password`
}
```

**Test**: Send a campaign and verify it uses your business name (not Divine Financial Group)

---

### ⚡ **PHASE 2A: Create Profile Page** (1 hour)

**File**: `frontend/src/pages/Profile.js` (NEW)

See full implementation in `USER_PROFILE_ENHANCEMENT_PLAN.md` Phase 2

**Features**:
- ✅ Personal Info tab (name, avatar, email, phone)
- ✅ Business Info tab (business name, logo, industry, description)
- ✅ Settings tab (timezone, notifications, AI preferences)
- ✅ Security tab (password change)

**Add route** (`frontend/src/App.js`):
```javascript
import Profile from './pages/Profile';
<Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
```

---

### ⚡ **PHASE 2B: Add Profile Navigation** (30 min)

**File**: `frontend/src/components/Layout.js`

Add user menu dropdown with:
- User avatar
- Business name in header
- "My Profile" link
- Logout option

See implementation in `USER_PROFILE_ENHANCEMENT_PLAN.md` Phase 2.8

---

### 📊 **PHASE 3: Integration** (2 hours)

1. **Update AI Campaign Generation** (30 min)
   - Pre-fill business name from profile
   - Use user's AI preferences
   - Update AI context with business description

2. **Tag Contacts with Business** (30 min)
   - Add `businessOwner` field to Contact model
   - Tag all contacts with user's business name

3. **Update Dashboard** (30 min)
   - Show business logo and name
   - Display business-specific metrics

4. **Migrate Existing Users** (30 min)
   - Run migration script for existing users
   - Set default business names

---

## ✅ Testing Checklist

### Backend Tests:
- [ ] User registration includes businessName
- [ ] GET /api/profile returns profile data
- [ ] PUT /api/profile updates profile
- [ ] Avatar upload works
- [ ] Logo upload works
- [ ] Password change works
- [ ] Existing users can login (backward compatible)

### Frontend Tests:
- [ ] Profile page loads correctly
- [ ] Can update personal info
- [ ] Can update business info
- [ ] Can upload avatar
- [ ] Can upload logo
- [ ] Can change password
- [ ] User menu shows in header

### Integration Tests:
- [ ] Campaigns use user's business name (not hardcoded)
- [ ] AI generation uses user's business context
- [ ] Contacts tagged with business owner
- [ ] Dashboard shows business branding

### Multi-Tenancy Tests:
- [ ] User 1 sees only their contacts
- [ ] User 2 sees only their contacts
- [ ] Each user's campaigns use their business name
- [ ] AI context unique per user

---

## 🚦 Current Status

### ✅ Completed:
1. Contact management Phase 1 (phone validation)
2. Comprehensive user profile plan created
3. Todo list updated with priorities

### ⏳ Next Immediate Step:
**Test Contact Improvements First** (from previous work):
1. Restart backend server
2. Restart frontend (development mode)
3. Login as edwinalove51@gmail.com
4. Test contact creation with various phone formats
5. Verify auto-formatting works

### 🎯 Then Proceed with Profile:
Once contact improvements are verified working:
1. Start Phase 1A (Update User Model)
2. Phase 1B (Create Profile Routes)
3. Phase 1C (Fix Hardcoded Business Name)
4. Test each phase before moving to next

---

## 📝 Key Files Reference

### Backend Files to Create/Modify:
1. `backend/models/User.js` - Add profile fields ✏️
2. `backend/routes/profile.js` - NEW file 🆕
3. `backend/routes/auth.js` - Update registration ✏️
4. `backend/server.js` - Register profile routes ✏️
5. `backend/services/aiService.js` - Use user context ✏️

### Frontend Files to Create/Modify:
1. `frontend/src/pages/Profile.js` - NEW file 🆕
2. `frontend/src/pages/Campaigns.js` - Fix hardcoded name ✏️
3. `frontend/src/config/api.js` - Add profile endpoints ✏️
4. `frontend/src/components/Layout.js` - Add user menu ✏️
5. `frontend/src/App.js` - Add profile route ✏️

### Test Files to Create:
1. `backend/test-profile.js` - Profile API tests 🆕
2. `backend/scripts/migrate-existing-users.js` - Migration script 🆕

---

## 💡 Pro Tips

1. **Always test after each phase** - Don't move forward with broken code
2. **Backup database before migration** - Safety first!
3. **Use development environment first** - Test thoroughly before production
4. **Keep todo list updated** - Mark items complete as you go
5. **Follow zero-breaking-changes approach** - All existing functionality must work

---

## 🎯 Success Criteria

After complete implementation:
- ✅ No more hardcoded "Divine Financial Group"
- ✅ Each user has unique business identity
- ✅ Professional profile management
- ✅ Multi-business platform ready
- ✅ AI generates context-aware campaigns
- ✅ Zero disruption to existing users
- ✅ All tests passing

---

## 📞 Need Help?

Refer to these documents:
- **Full Implementation**: `USER_PROFILE_ENHANCEMENT_PLAN.md`
- **Contact Improvements**: `CONTACT_ENHANCEMENT_PHASE_1_SUMMARY.md`
- **Contact Plan**: `CONTACT_MANAGEMENT_IMPROVEMENT_PLAN.md`

---

**Ready to start?** Follow the phases top-to-bottom, test each one, and you'll have a professional multi-business platform! 🚀
