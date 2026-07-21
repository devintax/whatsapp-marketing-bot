#!/bin/bash
echo "🧪 TESTING MAUTIC OAUTH2 CONFIGURATION"
echo "======================================"

# Test if environment variables are loaded
if [ -z "$MAUTIC_CLIENT_ID" ]; then
    echo "❌ MAUTIC_CLIENT_ID not found - server needs restart"
else
    echo "✅ MAUTIC_CLIENT_ID loaded: ${MAUTIC_CLIENT_ID:0:15}..."
fi

if [ -z "$MAUTIC_REDIRECT_URI" ]; then
    echo "❌ MAUTIC_REDIRECT_URI not found"
else
    echo "✅ MAUTIC_REDIRECT_URI: $MAUTIC_REDIRECT_URI"
fi

echo ""
echo "🔗 OAuth2 Test URL:"
echo "https://dfgbusiness.com/mautic/oauth/v2/authorize?client_id=$MAUTIC_CLIENT_ID&redirect_uri=$MAUTIC_REDIRECT_URI&response_type=code&scope=contacts:read"
echo ""
echo "📝 Next: Update Mautic OAuth2 app redirect URI and test!"
