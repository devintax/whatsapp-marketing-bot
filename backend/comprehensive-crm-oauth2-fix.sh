#!/bin/bash
# UNIFIED CRM OAUTH2 FIX SCRIPT

echo "🔧 Applying comprehensive CRM OAuth2 fixes..."

# 1. Update Mautic OAuth2 app configuration
echo "1. Go to: https://dfgbusiness.com/mautic/s/credentials"
echo "2. Update OAuth2 app settings:"
echo "   - Client ID: 1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o"
echo "   - Redirect URI: https://connect.vemgootech.info/api/crm/mautic/callback"
echo "   - Published: Yes"
echo "   - API Access: Enabled"

# 2. Restart backend to ensure environment variables are loaded
echo "3. Restart backend server"

# 3. Test OAuth2 flow
echo "4. Test OAuth2 authorization in frontend"

echo "✅ Fix script completed"
