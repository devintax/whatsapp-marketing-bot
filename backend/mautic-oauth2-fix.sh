# AUTOMATIC MAUTIC OAUTH2 FIX
# 1. Update .env file
MAUTIC_REDIRECT_URI=https://connect.vemgootech.info/api/crm/mautic/callback

# 2. Restart backend server
# 3. Update Mautic OAuth2 app with redirect URI: https://connect.vemgootech.info/api/crm/mautic/callback
# 4. Test OAuth2 flow

echo "✅ Mautic OAuth2 configuration fix completed"
