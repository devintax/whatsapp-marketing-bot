# Mautic CRM Integration Setup Guide

## Overview
This guide will help you connect your Mautic CRM to the WhatsApp Marketing Bot to automatically import contacts with phone numbers for WhatsApp campaigns.

## Prerequisites
- ✅ Mautic instance running and accessible
- ✅ Mautic admin/user account credentials  
- ✅ Contacts in Mautic with phone numbers
- ✅ WhatsApp Marketing Bot backend running

## Step 1: Prepare Your Mautic Instance

### Verify Contact Phone Numbers
1. Log into your Mautic admin panel
2. Go to **Contacts** → **Manage Contacts**
3. Verify contacts have phone numbers in these fields:
   - `mobile` (primary)
   - `phone` (secondary)  
   - Any custom field containing "phone"

### Check API Access
1. Ensure your Mautic instance allows API access
2. Verify you have admin or API user credentials
3. Test basic login via web interface first

## Step 2: Configure Integration

### Method 1: Via Test Script (Recommended)
1. Open `backend/test-mautic-integration.js`
2. Update the `MAUTIC_CONFIG` object:
   ```javascript
   const MAUTIC_CONFIG = {
       apiUrl: 'https://your-mautic-domain.com',    // Your Mautic URL
       username: 'your-mautic-username',             // Your login username
       password: 'your-mautic-password'              // Your login password
   };
   ```

3. Example configuration:
   ```javascript
   const MAUTIC_CONFIG = {
       apiUrl: 'https://mautic.vemgootech.info',
       username: 'admin',
       password: 'MySecurePassword123!'
   };
   ```

### Method 2: Via Frontend Interface
1. Access WhatsApp Bot at: https://connect.vemgootech.info
2. Go to **Contacts** → **CRM Integrations**
3. Click **Add Integration** → **Mautic**
4. Fill in your Mautic credentials
5. Click **Test Connection** then **Save**

## Step 3: Test Integration

### Run Integration Test
```bash
cd backend
node test-mautic-integration.js
```

### Expected Output
```
🔐 Authenticating...
✅ Authentication successful
🔗 Creating Mautic CRM Integration...
✅ Integration created successfully
🧪 Testing Mautic connection...
✅ Mautic connection successful
📞 Syncing contacts from Mautic...
✅ Successfully synced X contacts with phone numbers
📊 Integration test completed successfully!
```

## Step 4: Verify Contact Import

### Check Imported Contacts
1. In WhatsApp Bot frontend, go to **Contacts**
2. Look for contacts with `CRM Source: mautic`
3. Verify phone numbers are properly formatted
4. Contacts should be ready for WhatsApp campaigns

### Contact Sync Details
- **Frequency**: Every 24 hours (automatic)
- **Manual Sync**: Available via CRM Integrations page
- **Phone Fields**: mobile, phone, custom phone fields
- **Duplicate Handling**: Updates existing contacts by phone number
- **New Fields Added**: 
  - `mauticId`: Original Mautic contact ID
  - `crmSource`: Set to "mautic"
  - `lastSync`: Last synchronization timestamp

## Troubleshooting

### Common Issues

**Connection Failed**
- ✅ Verify Mautic URL is correct and accessible
- ✅ Check username/password are correct
- ✅ Ensure Mautic instance is running
- ✅ Check for firewall/network restrictions

**No Contacts Imported**
- ✅ Verify contacts have phone numbers in Mautic
- ✅ Check phone number fields are populated
- ✅ Ensure contacts are not marked as "Do Not Contact"

**Authentication Errors**
- ✅ Use admin account or account with API permissions
- ✅ Check if two-factor authentication is disabled for API user
- ✅ Verify account is not locked or suspended

### Debug Commands

```bash
# Test basic connectivity
curl -X GET "https://your-mautic-domain.com/api/contacts?limit=1" \
  -u "username:password"

# Check backend logs
cd backend
npm run dev

# Check frontend console
# Open browser developer tools on contacts page
```

## Next Steps

1. **Configure Mautic credentials** in test script or frontend
2. **Run integration test** to import contacts
3. **Verify contacts** appear in WhatsApp bot
4. **Create WhatsApp campaigns** targeting Mautic contacts
5. **Monitor sync status** for ongoing updates

## Security Notes

- Store Mautic credentials securely
- Use dedicated API user account when possible
- Regularly rotate passwords
- Monitor integration logs for suspicious activity

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Verify Mautic instance accessibility
3. Test with a small contact set first
4. Check backend logs for detailed error messages

**Integration Status**: ✅ Real Mautic API integration implemented
**Contact Sync**: ✅ Phone number extraction and contact creation
**Campaign Ready**: ✅ Imported contacts available for WhatsApp campaigns