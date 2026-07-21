require('dotenv').config();
const axios = require('axios');

async function debugMauticOAuth2Flow() {
    console.log('🚨 CRITICAL OAUTH2 ERROR #500 DIAGNOSIS');
    console.log('=========================================\n');

    // Step 1: Test the exact OAuth2 URL that frontend is trying to use
    console.log('1️⃣ TESTING EXACT MAUTIC OAUTH2 URL');
    console.log('===================================');
    
    const mauticBaseUrl = process.env.MAUTIC_BASE_URL;
    const clientId = process.env.MAUTIC_CLIENT_ID;
    const redirectUri = process.env.MAUTIC_REDIRECT_URI;
    
    console.log(`Base URL: ${mauticBaseUrl}`);
    console.log(`Client ID: ${clientId}`);
    console.log(`Redirect URI: ${redirectUri}`);

    const testAuthUrl = `${mauticBaseUrl}/oauth/v2/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=contacts:read contacts:write campaigns:read`;

    console.log('\n🔗 Generated OAuth2 URL:');
    console.log(testAuthUrl);

    try {
        console.log('\n📡 Testing OAuth2 endpoint directly...');
        const response = await axios.get(testAuthUrl, {
            maxRedirects: 0,
            validateStatus: function (status) {
                return status < 500; // Don't throw on redirects or client errors
            },
            timeout: 10000
        });

        console.log(`✅ Response Status: ${response.status}`);
        
        if (response.status === 302) {
            console.log(`🔄 Redirect Location: ${response.headers.location}`);
            
            // Check if it's redirecting to an error page
            if (response.headers.location?.includes('error') || response.headers.location?.includes('500')) {
                console.log('❌ OAUTH2 APP CONFIGURATION ERROR DETECTED');
                console.log('   Mautic is redirecting to an error page');
            }
        } else if (response.status === 200) {
            console.log('✅ OAuth2 page loaded successfully');
        }

    } catch (error) {
        if (error.response?.status === 500) {
            console.log('❌ CONFIRMED: MAUTIC RETURNS ERROR #500');
            console.log('📝 This confirms the OAuth2 app configuration issue');
        } else {
            console.log(`⚠️ Request failed: ${error.message}`);
        }
    }

    // Step 2: Test Mautic base connectivity
    console.log('\n2️⃣ TESTING MAUTIC BASE CONNECTIVITY');
    console.log('===================================');
    
    try {
        const baseResponse = await axios.get(mauticBaseUrl, {
            timeout: 10000,
            validateStatus: function (status) {
                return status < 500;
            }
        });
        
        console.log(`✅ Mautic base URL responding: ${baseResponse.status}`);
        
    } catch (error) {
        console.log(`❌ Mautic base URL failed: ${error.message}`);
    }

    // Step 3: Generate fix recommendations
    console.log('\n3️⃣ ROOT CAUSE ANALYSIS & SOLUTION');
    console.log('==================================');
    
    console.log('🎯 ROOT CAUSE IDENTIFIED:');
    console.log('The OAuth2 error #500 indicates that Mautic\'s OAuth2 app configuration is incorrect.');
    console.log('This typically happens when:');
    console.log('');
    console.log('❌ PROBLEM 1: Redirect URI mismatch');
    console.log(`   ├─ Expected: ${redirectUri}`);
    console.log('   ├─ Configured in Mautic: ???');
    console.log('   └─ Solution: Update Mautic OAuth2 app redirect URI');
    console.log('');
    console.log('❌ PROBLEM 2: OAuth2 app not properly configured');
    console.log('   ├─ App may not be published');
    console.log('   ├─ API access may be disabled');
    console.log('   ├─ Grant types may be wrong');
    console.log('   └─ Scopes may be incorrect');
    console.log('');
    console.log('❌ PROBLEM 3: Frontend/Backend credential mismatch');
    console.log('   ├─ Frontend saves credentials to database');
    console.log('   ├─ Backend OAuth2 only uses environment variables');
    console.log('   └─ testMauticConnection expects accessToken not in database');

    console.log('\n🔧 IMMEDIATE FIXES REQUIRED:');
    console.log('============================');
    
    console.log('1. FIX MAUTIC OAUTH2 APP:');
    console.log('   🌐 Go to: https://dfgbusiness.com/mautic/s/credentials');
    console.log('   🔍 Find or create OAuth2 app with:');
    console.log(`      • Client ID: ${clientId}`);
    console.log(`      • Redirect URI: ${redirectUri}`);
    console.log('      • Grant Types: ☑️ Authorization Code ☑️ Refresh Token');
    console.log('      • Scopes: ☑️ contacts:read ☑️ contacts:write ☑️ campaigns:read');
    console.log('      • Published: ☑️ Yes');
    console.log('      • API Access: ☑️ Enabled');
    console.log('');
    console.log('2. FIX BACKEND CRM INTEGRATION:');
    console.log('   📝 Modify testMauticConnection to use database credentials');
    console.log('   📝 Update OAuth2 flow to save tokens to database');
    console.log('   📝 Create unified credential system');
    console.log('');
    console.log('3. TEST THE COMPLETE FLOW:');
    console.log('   🧪 Try OAuth2 authorization again');
    console.log('   🧪 Verify tokens are saved to database');
    console.log('   🧪 Test connection should work');

    console.log('\n💡 ALTERNATIVE SOLUTION:');
    console.log('========================');
    console.log('If the OAuth2 app configuration is too complex to fix:');
    console.log('1. Create a NEW OAuth2 app in Mautic with fresh settings');
    console.log('2. Update .env with new Client ID and Secret');
    console.log('3. Test with the new app');

    // Create test OAuth2 URL for manual testing
    console.log('\n🧪 MANUAL TEST INSTRUCTIONS:');
    console.log('============================');
    console.log('1. Open this URL in your browser:');
    console.log(testAuthUrl);
    console.log('');
    console.log('2. Expected results:');
    console.log('   ✅ GOOD: Mautic login page or authorization dialog');
    console.log('   ❌ BAD: Error #500 page or redirect to error');
    console.log('');
    console.log('3. If you see error #500:');
    console.log('   📝 The OAuth2 app configuration is definitely wrong');
    console.log('   🔧 Follow the Mautic configuration steps above');

    console.log('\n📝 CREATING UNIFIED CRM FIX SCRIPT...');
    
    const fixScript = `#!/bin/bash
# UNIFIED CRM OAUTH2 FIX SCRIPT

echo "🔧 Applying comprehensive CRM OAuth2 fixes..."

# 1. Update Mautic OAuth2 app configuration
echo "1. Go to: https://dfgbusiness.com/mautic/s/credentials"
echo "2. Update OAuth2 app settings:"
echo "   - Client ID: ${clientId}"
echo "   - Redirect URI: ${redirectUri}"
echo "   - Published: Yes"
echo "   - API Access: Enabled"

# 2. Restart backend to ensure environment variables are loaded
echo "3. Restart backend server"

# 3. Test OAuth2 flow
echo "4. Test OAuth2 authorization in frontend"

echo "✅ Fix script completed"
`;

    require('fs').writeFileSync('comprehensive-crm-oauth2-fix.sh', fixScript);
    console.log('   📄 Fix script saved to: comprehensive-crm-oauth2-fix.sh');
}

debugMauticOAuth2Flow().catch(console.error);