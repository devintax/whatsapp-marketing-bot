# 🚀 Quick Mautic API Setup Guide

## ⚡ Step 1: Enable Mautic API (5 minutes)

### 1.1 Access Mautic Settings
1. Go to: `https://dfgbusiness.com/mautic`
2. Login with: `admin@dfgbusiness.com` / `GISpc2017$!`
3. Click **Settings** (⚙️ gear icon) → **Configuration**
4. Click **API Settings** tab

### 1.2 Enable API Features
Set these to **YES**:
- ✅ **API enabled**: YES
- ✅ **Enable HTTP basic auth**: YES  
- ✅ **Enable OAuth 1.0a**: YES
- ✅ **Enable OAuth 2.0**: YES
- **Click SAVE & CLOSE**

## ⚡ Step 2: Create WhatsApp Bot API Credentials

### 2.1 Create New API Application
1. In Mautic, go to **Settings** → **API Credentials**
2. Click **New** button
3. Fill in these exact details:

```
Name: WhatsApp Marketing Bot
Description: Contact sync and campaign automation
Callback/Redirect URI: https://connect.vemgootech.info/api/auth/mautic/callback
Public Key: (leave blank)
Secret Key: (leave blank)
```

### 2.2 Select Grant Types
Check these boxes:
- ✅ **Authorization Code**
- ✅ **Client Credentials** 
- ✅ **Refresh Token**

### 2.3 Select Scopes
Check these permissions:
- ✅ **contacts:read**
- ✅ **contacts:write**
- ✅ **campaigns:read**
- ✅ **emails:read**
- ✅ **users:read**

### 2.4 Save and Copy Credentials
1. Click **Save & Close**
2. **COPY THESE VALUES** (you'll need them):
   - **Client ID**: (long string starting with letters/numbers)
   - **Client Secret**: (long string starting with letters/numbers)

## ⚡ Step 3: Configure WhatsApp Bot

### 3.1 Add to Environment Variables
Add these to your `.env` file in `/backend/`:

```env
# Mautic CRM Integration  
MAUTIC_BASE_URL=https://dfgbusiness.com/mautic
MAUTIC_CLIENT_ID=paste_your_client_id_here
MAUTIC_CLIENT_SECRET=paste_your_client_secret_here
MAUTIC_REDIRECT_URI=https://connect.vemgootech.info/api/auth/mautic/callback
```

### 3.2 Example Configuration
```env
MAUTIC_BASE_URL=https://dfgbusiness.com/mautic
MAUTIC_CLIENT_ID=abc123def456ghi789
MAUTIC_CLIENT_SECRET=xyz789uvw456rst123
MAUTIC_REDIRECT_URI=https://connect.vemgootech.info/api/auth/mautic/callback
```

## ⚡ Step 4: Test Integration

### 4.1 Restart Backend Server
```bash
cd backend
# Stop current server (Ctrl+C)
node server.js
# or npm run dev
```

### 4.2 Test API Endpoint
Visit this URL to test: `https://dfgbusiness.com/mautic/api/contacts?limit=1`

**Expected Results:**
- ❌ **401 Unauthorized** = ✅ Good! API is working, needs auth
- ❌ **404 Not Found** = ❌ API not enabled, go back to Step 1
- ✅ **JSON Response** = ✅ Perfect! API working

### 4.3 Test OAuth Flow
1. Go to: `https://connect.vemgootech.info/contacts`
2. Click **Add Integration** → **Mautic**
3. Click **Connect to Mautic**
4. Should redirect to Mautic login
5. After login, should redirect back with success

## ⚡ Step 5: Import Contacts

### 5.1 Sync Contacts
Once connected:
1. Go to **Contacts** in WhatsApp bot
2. Click **Sync from Mautic** 
3. Contacts with phone numbers will be imported

### 5.2 Verify Import
Check that contacts show:
- ✅ **CRM Source**: "mautic"
- ✅ **Phone numbers** properly formatted
- ✅ **Names and emails** from Mautic

## 🔧 Troubleshooting

### Problem: "API Not Found" (404)
**Solution**: API not enabled in Mautic
1. Go to Mautic **Settings** → **Configuration** → **API Settings**
2. Set **API enabled** to **YES**
3. Save and try again

### Problem: "Unauthorized" (401) 
**Solution**: Check credentials
1. Verify Client ID and Secret are correct
2. Check callback URL matches exactly
3. Ensure user has admin permissions

### Problem: "No Contacts Imported"
**Solution**: Check phone numbers
1. Ensure Mautic contacts have mobile/phone fields
2. Verify fields are not empty
3. Check for international format (+1234567890)

### Problem: Callback URL Error
**Solution**: Use exact URL
```
https://connect.vemgootech.info/api/auth/mautic/callback
```

## 📋 Checklist

Before testing, ensure:
- ✅ Mautic API enabled (Step 1)
- ✅ API credentials created (Step 2) 
- ✅ Environment variables set (Step 3)
- ✅ Backend server restarted (Step 4)
- ✅ Callback URL matches exactly

## 🎯 Quick Test Commands

### Test API Status
```bash
curl "https://dfgbusiness.com/mautic/api/contacts?limit=1"
# Should return 401 Unauthorized (good!)
```

### Test With Basic Auth (fallback)
```bash
curl -u "admin@dfgbusiness.com:GISpc2017$!" \
  "https://dfgbusiness.com/mautic/api/contacts?limit=1"
# Should return JSON with contact data
```

## 🚀 Success!

When working, you'll see:
1. **Mautic OAuth** redirects working
2. **Contacts imported** with phone numbers
3. **Campaign targeting** includes Mautic contacts
4. **Automatic sync** every 24 hours

**Callback URL for Mautic:** 
```
https://connect.vemgootech.info/api/auth/mautic/callback
```

**Copy this URL exactly when setting up your Mautic API credentials!**