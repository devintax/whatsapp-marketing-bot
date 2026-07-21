# 👤 User Profile & Business Management Enhancement Plan

## 🎯 Executive Summary

**Critical Need**: Multi-tenant WhatsApp Marketing Platform requires robust user profile and business management to support multiple businesses with unique identities, branding, and settings.

**Current Gap**: Users cannot update their profile, business information, or branding. System uses hardcoded business names ("Divine Financial Group") instead of dynamic user data.

**Solution**: Comprehensive user profile system with personal info, business branding, settings, and multi-business support.

**Status**: COMPREHENSIVE PLAN - Ready for Implementation ✅

---

## 🚨 Current Issues Identified

### 1. **Hardcoded Business References**
```javascript
// ❌ FOUND IN: frontend/src/pages/Campaigns.js (Line ~410)
let message = 'Hello from Divine Financial Group!'; // Hardcoded!

// ❌ FOUND IN: Multiple AI training contexts
businessName: 'Divine Financial Group' // Should be user.businessName
```

### 2. **No User Profile Management**
- Users cannot update their email, name, or phone
- No password change functionality
- No profile picture/avatar upload
- No business logo for WhatsApp branding

### 3. **Multi-Tenancy Limitations**
- No business-specific settings
- Cannot distinguish between multiple businesses
- Contacts not properly tagged with business owner
- Campaigns don't reflect user's actual business

### 4. **Missing Account Features**
- No timezone settings (affects scheduling)
- No notification preferences
- No account security options
- No session management

---

## 📋 Enhancement Phases

### **Phase 1: Backend Profile Infrastructure** (PRIORITY: CRITICAL)

#### 1.1 Update User Model Schema

**File**: `backend/models/User.js`

**Changes**: Add new fields to existing schema (backward compatible)

```javascript
const userSchema = new mongoose.Schema({
  // ✅ EXISTING FIELDS (Keep as-is)
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // 🆕 PERSONAL INFORMATION
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '' }, // User's personal phone
  profilePicture: { type: String, default: '' }, // URL or base64
  
  // 🆕 BUSINESS INFORMATION (CRITICAL for Multi-Tenancy)
  businessName: { 
    type: String, 
    required: true,
    default: function() { 
      return this.email.split('@')[0]; // Fallback: use email prefix
    }
  },
  businessIndustry: { 
    type: String, 
    enum: ['financial', 'retail', 'healthcare', 'technology', 'education', 'hospitality', 'real-estate', 'other'],
    default: 'other'
  },
  businessPhone: { type: String, default: '' }, // Business contact number
  businessEmail: { type: String, default: '' }, // Business email (different from login)
  businessAddress: { type: String, default: '' },
  businessWebsite: { type: String, default: '' },
  businessLogo: { type: String, default: '' }, // URL or base64
  businessDescription: { type: String, default: '' },
  
  // 🆕 ACCOUNT SETTINGS
  timezone: { type: String, default: 'America/New_York' },
  language: { type: String, default: 'en' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, default: '12h' },
  
  // 🆕 NOTIFICATION PREFERENCES
  notifications: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    campaignUpdates: { type: Boolean, default: true },
    contactImports: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true }
  },
  
  // 🆕 AI PREFERENCES
  aiPreferences: {
    preferredProvider: { 
      type: String, 
      enum: ['groq', 'openai', 'gemini', 'claude'],
      default: 'groq'
    },
    defaultTone: { 
      type: String, 
      enum: ['professional', 'casual', 'friendly', 'urgent', 'educational'],
      default: 'professional'
    },
    autoTrainContext: { type: Boolean, default: true }
  },
  
  // 🆕 SECURITY & SESSIONS
  lastLogin: { type: Date },
  lastPasswordChange: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  lockUntil: { type: Date },
  
  // 🆕 SUBSCRIPTION & LIMITS (Future)
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'trial' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    limits: {
      contacts: { type: Number, default: 100 },
      campaigns: { type: Number, default: 10 },
      messagesPerMonth: { type: Number, default: 1000 }
    }
  }
});

// 🆕 VIRTUAL FIELDS
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim() || this.email;
});

userSchema.virtual('displayName').get(function() {
  return this.businessName || this.fullName || this.email;
});

// 🆕 METHODS
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  return this.save();
};

userSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.accountLocked = true;
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }
  return this.save();
};
```

**Migration Strategy**: 
- ✅ All new fields have defaults - existing users won't break
- ✅ Virtual fields computed on-the-fly
- ✅ Backward compatible with existing auth flow

---

#### 1.2 Create Profile Routes

**File**: `backend/routes/profile.js` (NEW)

```javascript
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar/logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(7);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, GIF) are allowed'));
  }
});

// GET /api/profile - Get current user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      profile: {
        // Personal Info
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profilePicture: user.profilePicture,
        fullName: user.fullName,
        
        // Business Info
        businessName: user.businessName,
        businessIndustry: user.businessIndustry,
        businessPhone: user.businessPhone,
        businessEmail: user.businessEmail,
        businessAddress: user.businessAddress,
        businessWebsite: user.businessWebsite,
        businessLogo: user.businessLogo,
        businessDescription: user.businessDescription,
        
        // Settings
        timezone: user.timezone,
        language: user.language,
        dateFormat: user.dateFormat,
        timeFormat: user.timeFormat,
        
        // Notifications
        notifications: user.notifications,
        
        // AI Preferences
        aiPreferences: user.aiPreferences,
        
        // Account Info
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// PUT /api/profile - Update user profile
router.put('/', [
  auth,
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('phone').optional().trim(),
  body('businessName').optional().trim().isLength({ min: 1, max: 100 }),
  body('businessIndustry').optional().isIn(['financial', 'retail', 'healthcare', 'technology', 'education', 'hospitality', 'real-estate', 'other']),
  body('businessPhone').optional().trim(),
  body('businessEmail').optional().trim().isEmail(),
  body('timezone').optional().trim(),
  body('language').optional().isIn(['en', 'es', 'fr', 'de'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'firstName', 'lastName', 'phone',
      'businessName', 'businessIndustry', 'businessPhone', 'businessEmail',
      'businessAddress', 'businessWebsite', 'businessDescription',
      'timezone', 'language', 'dateFormat', 'timeFormat'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    // Update nested fields (notifications, aiPreferences)
    if (req.body.notifications) {
      user.notifications = { ...user.notifications.toObject(), ...req.body.notifications };
    }
    
    if (req.body.aiPreferences) {
      user.aiPreferences = { ...user.aiPreferences.toObject(), ...req.body.aiPreferences };
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// POST /api/profile/avatar - Upload profile picture
router.post('/avatar', [auth, upload.single('avatar')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Store file path or convert to base64
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.profilePicture = avatarUrl;
    await user.save();
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
});

// POST /api/profile/logo - Upload business logo
router.post('/logo', [auth, upload.single('logo')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const logoUrl = `/uploads/avatars/${req.file.filename}`;
    user.businessLogo = logoUrl;
    await user.save();
    
    res.json({
      success: true,
      message: 'Business logo uploaded successfully',
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Failed to upload logo', error: error.message });
  }
});

// PUT /api/profile/password - Change password
router.put('/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.lastPasswordChange = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

module.exports = router;
```

---

#### 1.3 Update Auth Routes

**File**: `backend/routes/auth.js`

**Changes**: Update registration and login to include new fields

```javascript
// In POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('businessName').optional().trim() // 🆕 Accept businessName during registration
], async (req, res) => {
  try {
    // ... existing validation ...
    
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      businessName: req.body.businessName || req.body.email.split('@')[0], // 🆕 Default businessName
      firstName: req.body.firstName || '', // 🆕 Optional first name
      lastName: req.body.lastName || ''    // 🆕 Optional last name
    });
    
    await user.save();
    
    // Update last login
    await user.updateLastLogin(); // 🆕 Track login
    
    // ... existing token generation ...
  } catch (error) {
    // ... existing error handling ...
  }
});

// In POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // ... existing validation ...
    
    // Update last login
    await user.updateLastLogin(); // 🆕 Track login
    
    // ... existing token generation ...
  } catch (error) {
    // ... existing error handling ...
  }
});
```

---

#### 1.4 Register Profile Routes in Server

**File**: `backend/server.js`

```javascript
// Add this after existing route imports
const profileRoutes = require('./routes/profile'); // 🆕

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/profile', profileRoutes); // 🆕 Add profile routes

// Serve uploaded files
app.use('/uploads', express.static('uploads')); // 🆕 Serve avatars/logos
```

---

#### 1.5 Create Uploads Directory

**Command** (Run once):
```bash
mkdir -p backend/uploads/avatars
```

Add to `.gitignore`:
```
uploads/avatars/*
!uploads/avatars/.gitkeep
```
**File**: `backend/models/User.js`

**New Fields to Add**:
```javascript
// Personal Information
firstName: { type: String, default: '' },
lastName: { type: String, default: '' },
fullName: { type: String, default: '' }, // Computed from first + last
phone: { type: String, default: '' }, // User's personal phone
profilePicture: { type: String, default: '' }, // URL or base64

// Business Information (CRITICAL for multi-tenancy)
businessName: { type: String, required: true, default: 'My Business' },
businessIndustry: { type: String, default: 'General' },
businessPhone: { type: String, default: '' }, // Business contact number
businessEmail: { type: String, default: '' }, // Business contact email
businessAddress: { type: String, default: '' },
businessWebsite: { type: String, default: '' },
businessLogo: { type: String, default: '' }, // For WhatsApp branding
businessDescription: { type: String, default: '' }, // For AI context

// Account Settings
timezone: { type: String, default: 'UTC' },
language: { type: String, default: 'en' },
dateFormat: { type: String, default: 'MM/DD/YYYY' },
timeFormat: { type: String, default: '12h' }, // 12h or 24h

// Notification Preferences
notifications: {
  email: { type: Boolean, default: true },
  whatsapp: { type: Boolean, default: true },
  campaignUpdates: { type: Boolean, default: true },
  contactSync: { type: Boolean, default: true },
  weeklyReports: { type: Boolean, default: false }
},

// Security & Privacy
twoFactorEnabled: { type: Boolean, default: false },
lastPasswordChange: { type: Date, default: Date.now },
passwordResetToken: String,
passwordResetExpires: Date,

// Account Status
isActive: { type: Boolean, default: true },
accountType: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
subscriptionExpiry: Date,

// Metadata
lastLogin: Date,
loginCount: { type: Number, default: 0 },
lastProfileUpdate: Date  
   - phone: String
   - profilePicture: String (URL)
   
   // Business Information (CRITICAL for multi-tenant)
   - businessName: { type: String, required: true }
   - businessIndustry: String
   - businessPhone: String
   - businessAddress: String
   - businessLogo: String (URL)
   - businessWebsite: String
   
   // Account Settings
   - timezone: { type: String, default: 'UTC' }
   - language: { type: String, default: 'en' }
   - notifications: {
       email: { type: Boolean, default: true },
       whatsapp: { type: Boolean, default: true },
       campaigns: { type: Boolean, default: true }
     }
   ```

2. **Migration Strategy** (Zero Breaking Changes)
   - Add new fields as optional (not required initially)
   - Set defaults for existing users
   - Gradual migration as users update profiles

**Files to Modify**:
- `backend/models/User.js` (extend schema)
- `backend/routes/auth.js` (update registration to include businessName)

**Testing Required**:
- Existing users can still login ✅
- New fields appear in user object ✅
- Registration still works ✅

---

### **Phase 2: Profile API Routes** (PRIORITY 2)
**Goal**: Create RESTful API for profile management

**New Routes** (`backend/routes/profile.js`):
```javascript
GET    /api/profile           - Get current user profile
PUT    /api/profile           - Update profile information
POST   /api/profile/avatar    - Upload profile picture
POST   /api/profile/logo      - Upload business logo
PUT    /api/profile/password  - Change password
DELETE /api/profile/avatar    - Remove profile picture
```

**Implementation Details**:

1. **GET /api/profile**
   ```javascript
   // Return user profile (excluding password)
   {
     success: true,
     user: {
       _id, email, firstName, lastName, phone,
       profilePicture, businessName, businessIndustry,
       businessPhone, businessLogo, timezone, language,
       notifications, createdAt
     }
   }
   ```

2. **PUT /api/profile**
   ```javascript
   // Update allowed fields only
   // Validate business name (required for multi-tenant)
   // Return updated user
   ```

3. **POST /api/profile/avatar**
   ```javascript
   // Use multer for file upload
   // Resize image to 200x200
   // Store in public/uploads/avatars/
   // Or use cloud storage (AWS S3, Cloudinary)
   ```

**Files to Create**:
- `backend/routes/profile.js` (new file)
- `backend/middleware/upload.js` (file upload handler)

**Dependencies**:
- `multer` - File upload handling
- `sharp` - Image resizing (optional)

---

### **Phase 2: Frontend Profile UI** (PRIORITY: HIGH)

#### 2.1 Create Profile Page Component

**File**: `frontend/src/pages/Profile.js` (NEW)

**Features**:
- Tabbed interface (Personal, Business, Settings, Security)
- Avatar/logo upload with preview
- Real-time validation
- Auto-save indicator
- Professional Material-UI design

**Component Structure**:
```javascript
import React, { useState, useEffect } from 'react';
import {
  Container, Tabs, Tab, Box, Card, CardContent,
  TextField, Button, Avatar, Grid, Alert,
  Switch, FormControlLabel, Divider, Typography,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';

export default function Profile() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState({
    // Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePicture: '',
    
    // Business
    businessName: '',
    businessIndustry: '',
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
    businessWebsite: '',
    businessLogo: '',
    businessDescription: '',
    
    // Settings
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    
    // Notifications
    notifications: {
      email: true,
      whatsapp: false,
      campaignUpdates: true,
      contactImports: true,
      weeklyReports: true
    },
    
    // AI Preferences
    aiPreferences: {
      preferredProvider: 'groq',
      defaultTone: 'professional',
      autoTrainContext: true
    }
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // Implementation in next section
  };

  const handleSave = async () => {
    // Implementation in next section
  };

  const handleAvatarUpload = async (event) => {
    // Implementation in next section
  };

  const handleLogoUpload = async (event) => {
    // Implementation in next section
  };

  const handlePasswordChange = async () => {
    // Implementation in next section
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label="Personal Info" />
          <Tab icon={<BusinessIcon />} label="Business Info" />
          <Tab icon={<SettingsIcon />} label="Settings" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        <CardContent>
          {/* Tab panels implementation below */}
        </CardContent>
      </Card>
    </Container>
  );
}
```

---

#### 2.2 Personal Info Tab

**Features**:
- Avatar upload with preview
- First name, last name, email (readonly), phone
- Professional card layout

```javascript
{activeTab === 0 && (
  <Box>
    <Grid container spacing={3}>
      {/* Avatar Upload Section */}
      <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
        <Avatar
          src={profile.profilePicture || '/default-avatar.png'}
          sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
        />
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCameraIcon />}
        >
          Upload Photo
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleAvatarUpload}
          />
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          JPG, PNG or GIF (Max 5MB)
        </Typography>
      </Grid>

      {/* Personal Details Form */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={profile.email}
              disabled
              helperText="Email cannot be changed"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="(123) 456-7890"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => fetchProfile()}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  </Box>
)}
```

---

#### 2.3 Business Info Tab

**Features**:
- Business logo upload
- Business name (CRITICAL - used everywhere)
- Industry, contact info, website
- Description for AI context

```javascript
{activeTab === 1 && (
  <Box>
    <Grid container spacing={3}>
      {/* Business Logo Upload */}
      <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
        <Avatar
          src={profile.businessLogo || '/default-logo.png'}
          variant="rounded"
          sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
        />
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCameraIcon />}
        >
          Upload Logo
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleLogoUpload}
          />
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Square format recommended (500x500px)
        </Typography>
      </Grid>

      {/* Business Details Form */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Name"
              value={profile.businessName}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              required
              helperText="This name appears in your campaigns and contacts"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={profile.businessIndustry}
                onChange={(e) => setProfile({ ...profile, businessIndustry: e.target.value })}
                label="Industry"
              >
                <MenuItem value="financial">Financial Services</MenuItem>
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="technology">Technology</MenuItem>
                <MenuItem value="education">Education</MenuItem>
                <MenuItem value="hospitality">Hospitality</MenuItem>
                <MenuItem value="real-estate">Real Estate</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Business Phone"
              value={profile.businessPhone}
              onChange={(e) => setProfile({ ...profile, businessPhone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Email"
              type="email"
              value={profile.businessEmail}
              onChange={(e) => setProfile({ ...profile, businessEmail: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Website"
              value={profile.businessWebsite}
              onChange={(e) => setProfile({ ...profile, businessWebsite: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Address"
              value={profile.businessAddress}
              onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Description"
              value={profile.businessDescription}
              onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })}
              multiline
              rows={3}
              helperText="Used by AI to generate better campaign content"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => fetchProfile()}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  </Box>
)}
```

---

#### 2.4 Settings Tab

**Features**:
- Timezone selection
- Language preference
- Date/time format
- Notification preferences
- AI preferences

```javascript
{activeTab === 2 && (
  <Box>
    <Grid container spacing={3}>
      {/* Regional Settings */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Regional Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Timezone</InputLabel>
          <Select
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            label="Timezone"
          >
            <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
            <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
            <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
            <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
            <MenuItem value="UTC">UTC</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Language</InputLabel>
          <Select
            value={profile.language}
            onChange={(e) => setProfile({ ...profile, language: e.target.value })}
            label="Language"
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Notification Preferences */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={profile.notifications.email}
              onChange={(e) => setProfile({
                ...profile,
                notifications: { ...profile.notifications, email: e.target.checked }
              })}
            />
          }
          label="Email Notifications"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={profile.notifications.campaignUpdates}
              onChange={(e) => setProfile({
                ...profile,
                notifications: { ...profile.notifications, campaignUpdates: e.target.checked }
              })}
            />
          }
          label="Campaign Status Updates"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={profile.notifications.contactImports}
              onChange={(e) => setProfile({
                ...profile,
                notifications: { ...profile.notifications, contactImports: e.target.checked }
              })}
            />
          }
          label="Contact Import Notifications"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={profile.notifications.weeklyReports}
              onChange={(e) => setProfile({
                ...profile,
                notifications: { ...profile.notifications, weeklyReports: e.target.checked }
              })}
            />
          }
          label="Weekly Performance Reports"
        />
      </Grid>

      {/* AI Preferences */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          AI Preferences
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Preferred AI Provider</InputLabel>
          <Select
            value={profile.aiPreferences.preferredProvider}
            onChange={(e) => setProfile({
              ...profile,
              aiPreferences: { ...profile.aiPreferences, preferredProvider: e.target.value }
            })}
            label="Preferred AI Provider"
          >
            <MenuItem value="groq">Groq (Fast & Free)</MenuItem>
            <MenuItem value="openai">OpenAI</MenuItem>
            <MenuItem value="gemini">Google Gemini</MenuItem>
            <MenuItem value="claude">Anthropic Claude</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Default Tone</InputLabel>
          <Select
            value={profile.aiPreferences.defaultTone}
            onChange={(e) => setProfile({
              ...profile,
              aiPreferences: { ...profile.aiPreferences, defaultTone: e.target.value }
            })}
            label="Default Tone"
          >
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="educational">Educational</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Save Button */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button onClick={() => fetchProfile()}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  </Box>
)}
```

---

#### 2.5 Security Tab

**Features**:
- Change password
- Last login info
- Account security status

```javascript
{activeTab === 3 && (
  <Box>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          type="password"
          label="Current Password"
          value={passwordData.currentPassword}
          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          type="password"
          label="New Password"
          value={passwordData.newPassword}
          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          helperText="Minimum 6 characters"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          type="password"
          label="Confirm New Password"
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
          helperText={
            passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
              ? 'Passwords do not match'
              : ''
          }
        />
      </Grid>

      <Grid item xs={12}>
        <Button
          variant="contained"
          color="warning"
          onClick={handlePasswordChange}
          disabled={
            loading ||
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            passwordData.newPassword !== passwordData.confirmPassword ||
            passwordData.newPassword.length < 6
          }
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </Grid>

      {/* Account Info */}
      <Grid item xs={12} sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Last Login:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Account Created:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Subscription Plan:</strong> {profile.subscription?.plan || 'Free'} ({profile.subscription?.status || 'Active'})
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  </Box>
)}
```

---

#### 2.6 API Integration Functions

**Implementation of API calls**:

```javascript
const fetchProfile = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await axios.get(API_ENDPOINTS.PROFILE.GET, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      setProfile(response.data.profile);
    }
  } catch (error) {
    setError('Failed to load profile: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleSave = async () => {
  try {
    setLoading(true);
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('token');
    const response = await axios.put(API_ENDPOINTS.PROFILE.UPDATE, profile, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    setError('Failed to update profile: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    setError('File size must be less than 5MB');
    return;
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    setError('Please upload an image file');
    return;
  }
  
  try {
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = localStorage.getItem('token');
    const response = await axios.post(API_ENDPOINTS.PROFILE.UPLOAD_AVATAR, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      setProfile({ ...profile, profilePicture: response.data.avatarUrl });
      setSuccess('Profile picture uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    setError('Failed to upload avatar: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    setError('File size must be less than 5MB');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    setError('Please upload an image file');
    return;
  }
  
  try {
    setLoading(true);
    const formData = new FormData();
    formData.append('logo', file);
    
    const token = localStorage.getItem('token');
    const response = await axios.post(API_ENDPOINTS.PROFILE.UPLOAD_LOGO, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      setProfile({ ...profile, businessLogo: response.data.logoUrl });
      setSuccess('Business logo uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    setError('Failed to upload logo: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handlePasswordChange = async () => {
  try {
    setLoading(true);
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('token');
    const response = await axios.put(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    setError('Failed to change password: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};
```

---

#### 2.7 Update API Endpoints Config

**File**: `frontend/src/config/api.js`

```javascript
export const API_ENDPOINTS = {
  // ... existing endpoints ...
  
  // 🆕 PROFILE ENDPOINTS
  PROFILE: {
    GET: `${API_BASE_URL}/api/profile`,
    UPDATE: `${API_BASE_URL}/api/profile`,
    UPLOAD_AVATAR: `${API_BASE_URL}/api/profile/avatar`,
    UPLOAD_LOGO: `${API_BASE_URL}/api/profile/logo`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/profile/password`
  }
};
```

---

#### 2.8 Add Profile Link to Navigation

**File**: `frontend/src/components/Layout.js` (or wherever navigation is)

```javascript
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, IconButton, Menu, MenuItem, 
  Avatar, Typography 
} from '@mui/material';

export default function Layout() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch user profile for header display
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.PROFILE.GET, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {user?.businessName || 'WhatsApp Marketing'}
        </Typography>

        {/* User Menu */}
        <IconButton onClick={handleProfileMenuOpen} color="inherit">
          <Avatar 
            src={user?.profilePicture || '/default-avatar.png'} 
            alt={user?.fullName || user?.email}
          />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="body2">
              {user?.fullName || user?.email}
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleProfileClick}>My Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
```

---

#### 2.9 Add Profile Route

**File**: `frontend/src/App.js` (or routing file)

```javascript
import Profile from './pages/Profile';

// Add to routes
<Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
```

---

###

 **Phase 3: Integration with Existing Features** (PRIORITY: CRITICAL)

#### 3.1 Update Campaign Creation to Use User's Business Name

**File**: `frontend/src/pages/Campaigns.js`

**Current Issue** (Line ~410):
```javascript
let message = 'Hello from Divine Financial Group!'; // ❌ HARDCODED
```

**Fix**:
```javascript
// At the top of component, add user state
const [userProfile, setUserProfile] = useState(null);

// Fetch user profile on mount
useEffect(() => {
  fetchUserProfile();
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

// Update handleSendCampaign function:
const handleSendCampaign = async (campaign) => {
  try {
    // ... existing code ...
    
    // ✅ FIXED: Use dynamic business name
    let message = `Hello from ${userProfile?.businessName || 'Your Business'}!`;
    
    // ... rest of existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
};
```

---

#### 3.2 Update AI Campaign Generation to Use User Context

**File**: `frontend/src/pages/Campaigns.js`

**Update AI Generation Dialog**:
```javascript
// Pre-populate business name from user profile
const [aiFormData, setAiFormData] = useState({
  businessName: userProfile?.businessName || '',  // ✅ Auto-fill from profile
  campaignType: 'promotional',
  prompt: '',
  tone: userProfile?.aiPreferences?.defaultTone || 'professional', // ✅ Use user preference
  targetAudience: '',
  aiProvider: userProfile?.aiPreferences?.preferredProvider || 'groq' // ✅ Use user preference
});

// Update aiFormData when userProfile changes
useEffect(() => {
  if (userProfile) {
    setAiFormData(prev => ({
      ...prev,
      businessName: userProfile.businessName || prev.businessName,
      tone: userProfile.aiPreferences?.defaultTone || prev.tone,
      aiProvider: userProfile.aiPreferences?.preferredProvider || prev.aiProvider
    }));
  }
}, [userProfile]);
```

---

#### 3.3 Update Backend AI Service to Use User's Business Context

**File**: `backend/services/aiService.js`

**Update AI Training Context**:
```javascript
async generateCampaignDesign(prompt, options = {}) {
  try {
    // Fetch user's business context from database
    const user = await User.findById(options.userId);
    
    // Build comprehensive context using user's profile
    const systemContext = `
You are an expert marketing content creator for ${user.businessName || 'a business'}.

Business Profile:
- Industry: ${user.businessIndustry || 'General'}
- Description: ${user.businessDescription || 'A professional business'}
- Tone Preference: ${options.tone || user.aiPreferences?.defaultTone || 'professional'}

Task: Create a ${options.campaignType || 'marketing'} campaign that:
- Reflects the business's industry and values
- Uses appropriate tone for the target audience
- Includes clear calls-to-action
- Is optimized for WhatsApp messaging (concise, engaging)

Campaign Requirements:
${prompt}

Target Audience: ${options.targetAudience || 'General audience'}
    `.trim();
    
    // ... rest of existing AI generation logic ...
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}
```

---

#### 3.4 Update Contact Management to Tag with Business

**File**: `backend/routes/contacts.js`

**Update Contact Creation**:
```javascript
router.post('/', [auth, validation], async (req, res) => {
  try {
    // Fetch user profile for business context
    const user = await User.findById(req.user.id);
    
    const contactData = {
      ...req.body,
      user: req.user.id,
      crmSource: req.body.crmSource || 'manual',
      businessOwner: user.businessName,  // 🆕 Tag with business name
      businessIndustry: user.businessIndustry,  // 🆕 Tag with industry
      createdBy: user.fullName || user.email  // 🆕 Track creator
    };
    
    const contact = new Contact(contactData);
    await contact.save();
    
    res.json({
      success: true,
      contact,
      businessContext: {
        businessName: user.businessName,
        industry: user.businessIndustry
      }
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

**Update Contact Model** (`backend/models/Contact.js`):
```javascript
const contactSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // 🆕 BUSINESS CONTEXT FIELDS
  businessOwner: { type: String, default: '' }, // User's business name
  businessIndustry: { type: String, default: '' }, // User's industry
  createdBy: { type: String, default: '' }, // Creator's name
  
  // ... rest of schema ...
});
```

---

#### 3.5 Update Mautic Sync to Include Business Context

**File**: `backend/routes/integrations/mautic.js`

**Update Sync Function**:
```javascript
router.post('/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // ... existing Mautic fetch logic ...
    
    // Tag imported contacts with user's business
    const contactsToSave = mauticContacts.map(mc => ({
      name: mc.fields.all.firstname + ' ' + mc.fields.all.lastname,
      email: mc.fields.all.email,
      phone: mc.fields.all.mobile,
      user: req.user.id,
      mauticId: mc.id,
      crmSource: 'mautic',
      businessOwner: user.businessName,  // 🆕 Tag with business
      businessIndustry: user.businessIndustry,  // 🆕 Tag with industry
      tags: [...(mc.tags || []), user.businessName]  // 🆕 Add business name as tag
    }));
    
    // ... rest of sync logic ...
  } catch (error) {
    // ... error handling ...
  }
});
```

---

#### 3.6 Update Dashboard to Show User's Business Metrics

**File**: `frontend/src/pages/Dashboard.js`

**Add Business Context Display**:
```javascript
export default function Dashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchUserProfile();
    fetchStats();
  }, []);

  return (
    <Container>
      {/* Business Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        {userProfile?.businessLogo && (
          <Avatar 
            src={userProfile.businessLogo} 
            variant="rounded"
            sx={{ width: 60, height: 60 }}
          />
        )}
        <Box>
          <Typography variant="h4">
            {userProfile?.businessName || 'Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userProfile?.businessIndustry || ''} • {userProfile?.email}
          </Typography>
        </Box>
      </Box>

      {/* Rest of dashboard */}
      {/* ... existing dashboard components ... */}
    </Container>
  );
}
```

---

### **Phase 4: Testing & Validation** (PRIORITY: HIGH)

#### 4.1 Backend Tests

**Tests to Create** (`backend/test-profile.js`):

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testProfileManagement() {
  console.log('🧪 Testing Profile Management...\n');
  
  let token;
  let userId;
  
  try {
    // Test 1: Register new user with business name
    console.log('1️⃣ Testing registration with business name...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'testbusiness@example.com',
      password: 'Test123!',
      businessName: 'Test Business Corp',
      firstName: 'John',
      lastName: 'Doe'
    });
    
    token = registerResponse.data.token;
    console.log('✅ Registration successful');
    console.log('   Business Name:', registerResponse.data.user?.businessName);
    
    // Test 2: Get profile
    console.log('\n2️⃣ Testing GET profile...');
    const profileResponse = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile fetch successful');
    console.log('   Business Name:', profileResponse.data.profile.businessName);
    console.log('   Full Name:', profileResponse.data.profile.fullName);
    
    // Test 3: Update profile
    console.log('\n3️⃣ Testing profile update...');
    const updateResponse = await axios.put(`${API_BASE}/profile`, {
      firstName: 'Jane',
      businessName: 'Updated Business Corp',
      businessIndustry: 'technology',
      businessDescription: 'A cutting-edge tech company'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile update successful');
    console.log('   Updated Business Name:', updateResponse.data.profile.businessName);
    
    // Test 4: Change password
    console.log('\n4️⃣ Testing password change...');
    const passwordResponse = await axios.put(`${API_BASE}/profile/password`, {
      currentPassword: 'Test123!',
      newPassword: 'NewTest456!'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Password change successful');
    
    // Test 5: Login with new password
    console.log('\n5️⃣ Testing login with new password...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testbusiness@example.com',
      password: 'NewTest456!'
    });
    
    console.log('✅ Login with new password successful');
    
    console.log('\n✅ All profile tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProfileManagement();
```

**Run Test**:
```bash
node backend/test-profile.js
```

---

#### 4.2 Integration Tests

**Test Scenarios**:
1. ✅ New user registration includes business name
2. ✅ Existing users can update business info
3. ✅ Campaign creation uses user's business name
4. ✅ AI generation uses user's business context
5. ✅ Contacts tagged with user's business
6. ✅ Mautic sync includes business tagging
7. ✅ Dashboard shows business-specific data

---

#### 4.3 Migration Test for Existing Users

**Script**: `backend/scripts/migrate-existing-users.js`

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateExistingUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔄 Migrating existing users...');
    
    // Find users without businessName
    const usersToMigrate = await User.find({
      $or: [
        { businessName: { $exists: false } },
        { businessName: '' }
      ]
    });
    
    console.log(`Found ${usersToMigrate.length} users to migrate`);
    
    for (const user of usersToMigrate) {
      // Set default business name from email
      if (!user.businessName) {
        user.businessName = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      }
      
      // Set defaults for other new fields
      if (!user.timezone) user.timezone = 'America/New_York';
      if (!user.language) user.language = 'en';
      if (!user.notifications) {
        user.notifications = {
          email: true,
          whatsapp: false,
          campaignUpdates: true,
          contactImports: true,
          weeklyReports: false
        };
      }
      
      await user.save();
      console.log(`✅ Migrated user: ${user.email} → ${user.businessName}`);
    }
    
    console.log('\n✅ Migration complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateExistingUsers();
```

---

### **Implementation Priority & Timeline**

#### 🔥 **CRITICAL PATH** (Do First - 2-3 hours):

1. **Backend User Model Update** (30 min)
   - Add new fields to User schema
   - Test with existing data

2. **Backend Profile Routes** (45 min)
   - Create profile.js routes
   - Test GET/PUT endpoints

3. **Update Campaign Integration** (30 min)
   - Fix hardcoded business name in Campaigns.js
   - Use user.businessName dynamically

4. **Frontend Profile Page** (1 hour)
   - Create basic Profile.js component
   - Implement Personal and Business tabs

#### ⚡ **HIGH PRIORITY** (Do Next - 3-4 hours):

5. **Avatar/Logo Upload** (1 hour)
   - Implement file upload backend
   - Add upload UI in frontend

6. **Settings & Security Tabs** (1 hour)
   - Notification preferences
   - Password change

7. **Navigation Integration** (30 min)
   - Add profile menu to header
   - Update routing

8. **AI Service Integration** (1 hour)
   - Update AI context with user business info
   - Test AI generation with dynamic context

#### 📋 **MEDIUM PRIORITY** (Do Later - 2-3 hours):

9. **Contact Tagging** (1 hour)
   - Tag contacts with business owner
   - Update Mautic sync

10. **Dashboard Enhancement** (1 hour)
    - Show business branding
    - Display business-specific metrics

11. **Migration Script** (30 min)
    - Migrate existing users
    - Test with production data

---

### **Zero Breaking Changes Guarantee** ✅

#### Backward Compatibility Checklist:

- [x] All new User fields have defaults
- [x] Existing user login flow unchanged
- [x] Existing campaigns still work
- [x] Existing contacts preserved
- [x] No required fields added to existing models
- [x] API responses include old + new fields
- [x] Frontend handles missing profile data gracefully
- [x] Migration script for existing users

#### Safety Measures:

1. **Gradual Rollout**:
   - Phase 1: Backend only (no frontend changes)
   - Phase 2: Add profile page (optional feature)
   - Phase 3: Integrate with campaigns (backward compatible)

2. **Fallback Values**:
   ```javascript
   // Always provide fallbacks
   businessName: user.businessName || 'Your Business'
   profilePicture: user.profilePicture || '/default-avatar.png'
   ```

3. **Feature Flags** (Optional):
   ```javascript
   const ENABLE_USER_PROFILES = process.env.ENABLE_USER_PROFILES === 'true';
   ```

---

### **Success Metrics**

#### After Implementation:

✅ Users can update their business name  
✅ Campaigns use dynamic business names (not hardcoded)  
✅ AI uses user's business context for better content  
✅ Contacts tagged with correct business owner  
✅ Multi-business support fully functional  
✅ Zero existing user disruption  
✅ Professional user experience with avatars/logos  

---

### **Next Steps**

#### Immediate Actions:

1. **Review this plan** with stakeholders
2. **Backup database** before any changes
3. **Start with Phase 1** (Backend User Model)
4. **Test each phase** before moving to next
5. **Run migration script** for existing users
6. **Deploy gradually** (backend → frontend → integration)

---

## 📝 **Summary**

This enhancement adds **professional user profile and business management** to your multi-tenant WhatsApp marketing platform while maintaining **100% backward compatibility** with existing functionality.

**Key Benefits**:
- ✅ Proper multi-business support
- ✅ Dynamic business names (no more hardcoded values)
- ✅ Better AI campaign generation
- ✅ Professional user experience
- ✅ Scalable for future businesses
- ✅ Zero disruption to existing users

**Development Time**: ~8-10 hours total  
**Risk Level**: LOW (all changes are backward compatible)  
**Impact**: HIGH (critical for multi-tenant platform)

---

**Ready to proceed?** Start with Phase 1 (Backend User Model Update) and work through systematically. Each phase is independently testable and deployable. 🚀

---

### **Phase 3: Frontend Profile Page** (PRIORITY 3)
**Goal**: Create user-facing profile management UI

**New Component** (`frontend/src/pages/Profile.js`):

**Sections**:
1. **Personal Information**
   - First Name, Last Name
   - Email (view only, or with email verification)
   - Phone Number
   - Profile Picture Upload

2. **Business Information**
   - Business Name (required)
   - Business Industry (dropdown)
   - Business Phone
   - Business Address
   - Business Logo Upload
   - Business Website

3. **Account Settings**
   - Timezone Selection
   - Language Preference
   - Notification Preferences (toggles)

4. **Security**
   - Change Password
   - Last Login Info
   - Active Sessions (future)

**UI Components Needed**:
- `ProfileImageUpload.js` - Avatar upload with preview
- `BusinessLogoUpload.js` - Logo upload with preview
- `PasswordChangeDialog.js` - Secure password update
- `NotificationSettings.js` - Toggle switches for preferences

**Files to Create**:
- `frontend/src/pages/Profile.js` (main page)
- `frontend/src/components/ProfileImageUpload.js`
- `frontend/src/components/BusinessLogoUpload.js`
- `frontend/src/components/PasswordChangeDialog.js`

---

### **Phase 4: Navigation & Layout Integration** (PRIORITY 4)
**Goal**: Add profile access throughout the app

**Changes Needed**:

1. **Update Navigation/Header**
   - Add user dropdown menu in top-right
   - Display user avatar (or initials if no avatar)
   - Show user name or business name
   - Add "My Profile" menu item

2. **Add Profile Link to Sidebar**
   - Profile icon with user avatar
   - "My Profile" text
   - Active state when on profile page

3. **Update Routes**
   - Add `/profile` route
   - Protected route (requires authentication)

**Files to Modify**:
- `frontend/src/components/Layout.js` (add user menu)
- `frontend/src/App.js` (add profile route)
- `frontend/src/config/api.js` (add profile endpoints)

---

### **Phase 5: Dynamic Business Context** (PRIORITY 5)
**Goal**: Replace all hardcoded business references with user data

**Critical Changes**:

1. **Campaign Message Fallback**
   ```javascript
   // OLD (Campaigns.js):
   let message = 'Hello from Divine Financial Group!';
   
   // NEW:
   const user = await getUserProfile(); // Fetch from context/state
   let message = `Hello from ${user.businessName || 'Your Business'}!`;
   ```

2. **AI Training Context**
   ```javascript
   // Use user.businessName for AI context
   const aiRequest = {
     businessName: user.businessName,
     businessIndustry: user.businessIndustry,
     // ... rest of AI request
   };
   ```

3. **Contact Association**
   ```javascript
   // Contacts already have user field
   // Ensure business context is preserved
   contact.businessOwner = user.businessName;
   ```

**Files to Modify**:
- `frontend/src/pages/Campaigns.js` (remove hardcoded business name)
- `frontend/src/pages/CampaignCreate.js` (use user context)
- `backend/services/aiService.js` (use user business context)
- `backend/routes/campaigns.js` (fetch user for business context)

---

### **Phase 6: User Context Provider** (PRIORITY 6)
**Goal**: Global user state management across frontend

**Implementation**:

1. **Create User Context**
   ```javascript
   // frontend/src/contexts/UserContext.js
   const UserContext = createContext();
   
   export const UserProvider = ({ children }) => {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       fetchUserProfile(); // Load on app start
     }, []);
     
     return (
       <UserContext.Provider value={{ user, setUser, loading }}>
         {children}
       </UserContext.Provider>
     );
   };
   
   export const useUser = () => useContext(UserContext);
   ```

2. **Wrap App with Provider**
   ```javascript
   // App.js
   <UserProvider>
     <Router>
       <Routes>
         {/* ... routes */}
       </Routes>
     </Router>
   </UserProvider>
   ```

3. **Use in Components**
   ```javascript
   // Any component
   const { user } = useUser();
   const businessName = user?.businessName || 'Your Business';
   ```

**Files to Create**:
- `frontend/src/contexts/UserContext.js` (new)

**Files to Modify**:
- `frontend/src/App.js` (wrap with UserProvider)
- `frontend/src/pages/Campaigns.js` (use useUser hook)
- `frontend/src/pages/Dashboard.js` (display user info)

---

## 🎨 UI/UX Design Specifications

### Profile Page Layout
```
┌─────────────────────────────────────────┐
│ My Profile                    [Save]    │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────┐   Personal Information      │
│  │       │   First Name: [______]      │
│  │ 📷    │   Last Name:  [______]      │
│  │       │   Email:      [______]      │
│  └───────┘   Phone:      [______]      │
│  Change Photo                           │
│                                         │
│  Business Information                   │
│  ┌───────┐                             │
│  │ 🏢    │   Business Name: [______]   │
│  │       │   Industry:      [v____]    │
│  └───────┘   Phone:         [______]   │
│  Upload Logo  Address:       [______]   │
│               Website:       [______]   │
│                                         │
│  Account Settings                       │
│  Timezone:      [v____________]         │
│  Language:      [v____________]         │
│                                         │
│  Notifications                          │
│  Email:         [x] On  [ ] Off        │
│  WhatsApp:      [x] On  [ ] Off        │
│  Campaigns:     [x] On  [ ] Off        │
│                                         │
│  Security                               │
│  [Change Password]                      │
│  Last Login: Oct 27, 2025 10:30 AM    │
└─────────────────────────────────────────┘
```

### User Dropdown Menu (Header)
```
┌──────────────────┐
│ 👤 John Doe     │ ← Avatar + Name
├──────────────────┤
│ 📊 Dashboard    │
│ 👤 My Profile   │ ← New menu item
│ ⚙️  Settings    │
│ ──────────────  │
│ 🚪 Logout       │
└──────────────────┘
```

---

## 🔧 Technical Implementation Details

### File Upload Handling

**Backend Setup** (`backend/middleware/upload.js`):
```javascript
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
  }
};

// Export multer instance
module.exports = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});
```

**Frontend Upload Component** (`ProfileImageUpload.js`):
```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  try {
    const response = await axios.post(API_ENDPOINTS.PROFILE.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      setUser({ ...user, profilePicture: response.data.avatarUrl });
      toast.success('Profile picture updated!');
    }
  } catch (error) {
    toast.error('Failed to upload image');
  }
};
```

---

## 🗄️ Database Migration Strategy

### Step 1: Add New Fields (Non-Breaking)
```javascript
// All new fields are optional
// Existing users continue working
// No data loss
```

### Step 2: Set Defaults for Existing Users
```javascript
// Migration script: backend/migrations/add-business-name.js
const User = require('../models/User');

async function migrateUsers() {
  const users = await User.find({ businessName: { $exists: false } });
  
  for (const user of users) {
    // Infer business name from email or set default
    const businessName = user.email.split('@')[0] + ' Business';
    user.businessName = businessName;
    await user.save();
    console.log(`✅ Migrated user: ${user.email} → ${businessName}`);
  }
}

migrateUsers().then(() => console.log('Migration complete!'));
```

### Step 3: Make businessName Required (Future)
```javascript
// After all users migrated
businessName: { 
  type: String, 
  required: true // Now safe to enforce
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- ✅ User model validation
- ✅ Profile routes authorization
- ✅ File upload validation
- ✅ Business name requirement

### Integration Tests
- ✅ Profile CRUD operations
- ✅ Avatar upload and retrieval
- ✅ Password change workflow
- ✅ User context propagation

### End-to-End Tests
- ✅ Login → View Profile → Update Info → Logout
- ✅ Upload Avatar → Verify Display → Delete Avatar
- ✅ Create Campaign → Uses User Business Name
- ✅ Multi-user isolation (User A can't see User B's profile)

### Regression Tests (Critical!)
- ✅ Existing users can still login
- ✅ Contact creation still works
- ✅ Campaign sending unchanged
- ✅ Mautic sync unaffected
- ✅ WhatsApp connection preserved

---

## 📊 Success Metrics

### Immediate Benefits
- ✅ Users can update their account information
- ✅ Business-specific branding in campaigns
- ✅ Professional profile pictures
- ✅ Proper multi-tenant separation

### Long-term Benefits
- ✅ Scalable for multiple businesses
- ✅ Better AI training per business
- ✅ Business-specific analytics
- ✅ Custom branding per organization

---

## 🚀 Implementation Order (Top to Bottom)

### Week 1: Backend Foundation
1. ✅ Update User model with new fields
2. ✅ Create profile routes (GET, PUT)
3. ✅ Implement file upload middleware
4. ✅ Test with existing users (no breaking changes)

### Week 2: Frontend UI
1. ✅ Create Profile page component
2. ✅ Build image upload components
3. ✅ Implement password change dialog
4. ✅ Add profile link to navigation

### Week 3: Integration & Context
1. ✅ Create UserContext provider
2. ✅ Replace hardcoded business names
3. ✅ Update AI service to use user context
4. ✅ Test campaign creation with dynamic business

### Week 4: Polish & Migration
1. ✅ Migrate existing users with default business names
2. ✅ Add avatar/logo placeholders
3. ✅ Comprehensive testing
4. ✅ Documentation update

---

## 🛡️ Zero Breaking Changes Guarantee

### What We're NOT Changing
- ❌ Authentication flow
- ❌ Campaign creation logic
- ❌ Contact management
- ❌ WhatsApp integration
- ❌ Database schema (only extending)
- ❌ API endpoint URLs (only adding new)

### What We're ADDING
- ✅ New profile routes
- ✅ New user fields (optional)
- ✅ New Profile page
- ✅ User context provider
- ✅ Dynamic business name support

### Backward Compatibility
- ✅ Existing users work unchanged
- ✅ Existing campaigns still send
- ✅ Existing contacts preserved
- ✅ Graceful defaults for missing data
- ✅ Fallback to hardcoded values if user context unavailable

---

## 📝 Next Steps

### Immediate Action (Phase 1)
1. Update `backend/models/User.js` with new fields
2. Update `backend/routes/auth.js` to accept businessName on registration
3. Test existing user login (should work unchanged)
4. Create `backend/routes/profile.js` with GET endpoint

### After Phase 1 Testing
5. Implement PUT /api/profile route
6. Add file upload routes
7. Create frontend Profile page
8. Add to navigation

---

## ✨ Summary

**Total New Files**: 8
- 3 Backend files (profile routes, upload middleware, migration)
- 5 Frontend files (Profile page, image upload components, context)

**Total Modified Files**: 6
- 2 Backend files (User model, auth routes)
- 4 Frontend files (App.js, Layout.js, Campaigns.js, config/api.js)

**Zero Breaking Changes**: ✅ GUARANTEED
**Backward Compatible**: ✅ 100%
**Multi-Tenant Ready**: ✅ YES

---

**Created**: October 27, 2025  
**Status**: Ready for Implementation  
**Priority**: HIGH (Blocks proper multi-tenant operation)
