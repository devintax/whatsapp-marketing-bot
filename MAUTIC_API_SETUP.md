# Mautic API Configuration Guide

## Step 1: Enable Mautic API

### 1.1 Access Mautic Configuration
1. Log into your Mautic instance: `https://dfgbusiness.com/mautic`
2. Go to **Settings** (gear icon) → **Configuration**
3. Click on **API Settings** tab

### 1.2 Enable API Access
- **API enabled**: Set to **Yes**
- **Enable HTTP basic auth**: Set to **Yes** (for username/password auth)
- **Enable OAuth 1.0a**: Set to **Yes** (recommended for production)
- **Enable OAuth 2.0**: Set to **Yes** (most secure option)

## Step 2: Create API Credentials for WhatsApp Bot

### 2.1 Create New API Application
1. In Mautic, go to **Settings** → **API Credentials**
2. Click **New** to create new API credentials
3. Fill in the application details:

**Application Details:**
- **Name**: `WhatsApp Marketing Bot`
- **Description**: `WhatsApp campaign automation and contact sync`
- **Callback/Redirect URI**: `https://connect.vemgootech.info/api/auth/mautic/callback`
- **Public Key**: (leave blank for now)
- **Secret Key**: (leave blank for now)

### 2.2 Authorization Grant Types
Select these grant types:
- ✅ **Authorization Code** (recommended)
- ✅ **Client Credentials** (for server-to-server)
- ✅ **Refresh Token**

### 2.3 Scopes (Permissions)
Select these scopes for the WhatsApp bot:
- ✅ **contacts:read** - Read contact information
- ✅ **contacts:write** - Create/update contacts
- ✅ **campaigns:read** - Read campaign data
- ✅ **emails:read** - Read email information
- ✅ **users:read** - Read user information

## Step 3: WhatsApp Bot Callback URLs

### 3.1 Primary Callback URL
```
https://connect.vemgootech.info/api/auth/mautic/callback
```

### 3.2 Development Callback URL (if testing locally)
```
http://localhost:5000/api/auth/mautic/callback
```

### 3.3 Alternative Domain Callbacks
```
https://connect.vemgootech.info/api/crm/mautic/oauth/callback
https://connect.vemgootech.info/api/integrations/mautic/auth
```

## Step 4: After Creating API Credentials

### 4.1 Copy Credentials
After creating the API application in Mautic, you'll get:
- **Client ID**: (copy this)
- **Client Secret**: (copy this)
- **Authorization URL**: Usually `https://dfgbusiness.com/mautic/oauth/v2/authorize`
- **Access Token URL**: Usually `https://dfgbusiness.com/mautic/oauth/v2/token`

### 4.2 Test API Access
Once enabled, test with this curl command:
```bash
curl -X GET "https://dfgbusiness.com/mautic/api/contacts?limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 5: WhatsApp Bot Configuration

### 5.1 Environment Variables
Add to your `.env` file:
```env
# Mautic OAuth Configuration
MAUTIC_BASE_URL=https://dfgbusiness.com/mautic
MAUTIC_CLIENT_ID=your_client_id_here
MAUTIC_CLIENT_SECRET=your_client_secret_here
MAUTIC_REDIRECT_URI=https://connect.vemgootech.info/api/auth/mautic/callback
```

### 5.2 Integration Configuration
```javascript
const MAUTIC_CONFIG = {
    baseUrl: 'https://dfgbusiness.com/mautic',
    clientId: 'your_client_id',
    clientSecret: 'your_client_secret',
    redirectUri: 'https://connect.vemgootech.info/api/auth/mautic/callback',
    authUrl: 'https://dfgbusiness.com/mautic/oauth/v2/authorize',
    tokenUrl: 'https://dfgbusiness.com/mautic/oauth/v2/token',
    apiUrl: 'https://dfgbusiness.com/mautic/api'
};
```

## Step 6: Authentication Flow

### 6.1 OAuth 2.0 Flow (Recommended)
1. User clicks "Connect Mautic" in WhatsApp bot
2. Redirects to: `https://dfgbusiness.com/mautic/oauth/v2/authorize`
3. User authorizes WhatsApp bot access
4. Mautic redirects to: `https://connect.vemgootech.info/api/auth/mautic/callback`
5. WhatsApp bot exchanges code for access token
6. Stores token securely for API calls

### 6.2 Basic Auth (Alternative)
If OAuth is complex, you can use:
- **Username**: `admin@dfgbusiness.com`
- **Password**: `GISpc2017$!`
- **API Endpoint**: `https://dfgbusiness.com/mautic/api/contacts`

## Step 7: Verify Configuration

### 7.1 Check API Status
Visit: `https://dfgbusiness.com/mautic/api/contacts?limit=1`

Expected response:
- **With Auth**: JSON with contact data
- **Without Auth**: 401 Unauthorized (good - API is working)
- **404 Error**: API not enabled or wrong URL

### 7.2 Test Contact Access
```bash
# Test with basic auth
curl -u "admin@dfgbusiness.com:GISpc2017$!" \
  "https://dfgbusiness.com/mautic/api/contacts?limit=1"
```

## Common Mautic API URLs

### 7.3 API Endpoints
- **Contacts**: `/api/contacts`
- **Campaigns**: `/api/campaigns`
- **Emails**: `/api/emails`
- **Users**: `/api/users/self`
- **OAuth Token**: `/oauth/v2/token`
- **OAuth Authorize**: `/oauth/v2/authorize`

## Troubleshooting

### 8.1 API Not Working
- Verify API is enabled in Mautic Configuration
- Check if Mautic installation has `/api/` endpoints
- Ensure proper permissions for API user
- Verify Mautic version supports API (3.0+)

### 8.2 404 Errors
- Try: `https://dfgbusiness.com/mautic/index.php/api/contacts`
- Check if Mautic uses `index.php` in URLs
- Verify Mautic is properly installed

### 8.3 Authorization Issues
- Ensure API credentials are correct
- Check if 2FA is disabled for API user
- Verify user has admin permissions

## Next Steps

1. **Enable API** in Mautic Configuration
2. **Create API credentials** with callback URL
3. **Configure WhatsApp bot** with credentials
4. **Test connection** with provided test scripts
5. **Import contacts** with phone numbers

**Primary Callback URL for WhatsApp Bot:**
```
https://connect.vemgootech.info/api/auth/mautic/callback
```

Copy this URL exactly when creating your Mautic API application!