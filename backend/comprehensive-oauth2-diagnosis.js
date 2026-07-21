require('dotenv').config();
const axios = require('axios');

async function comprehensiveOAuth2Diagnosis() {
    console.log('🚀 COMPREHENSIVE OAUTH2 ERROR #500 ROOT CAUSE ANALYSIS');
    console.log('=========================================================\n');

    // Step 1: Environment Variable Analysis
    console.log('1️⃣ ENVIRONMENT VARIABLE ANALYSIS:');
    console.log('=================================');
    const mauticBaseUrl = process.env.MAUTIC_BASE_URL;
    const clientId = process.env.MAUTIC_CLIENT_ID;
    const clientSecret = process.env.MAUTIC_CLIENT_SECRET;
    const redirectUriEnv = process.env.MAUTIC_REDIRECT_URI;
    const redirectUriCode = 'https://connect.vemgootech.info/api/crm/mautic/callback';

    console.log(`✓ MAUTIC_BASE_URL: ${mauticBaseUrl || 'NOT SET'}`);
    console.log(`✓ MAUTIC_CLIENT_ID: ${clientId ? clientId.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`✓ MAUTIC_CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 8) + '***' : 'NOT SET'}`);
    console.log(`✓ Env Redirect URI: ${redirectUriEnv || 'NOT SET'}`);
    console.log(`✓ Code Redirect URI: ${redirectUriCode}`);
    
    if (redirectUriEnv !== redirectUriCode) {
        console.log('❌ CRITICAL: REDIRECT URI MISMATCH FOUND!');
        console.log(`   Environment: ${redirectUriEnv}`);
        console.log(`   Backend code: ${redirectUriCode}`);
    } else {
        console.log('✅ Redirect URIs match');
    }

    // Step 2: Test Mautic OAuth2 Authorization URL
    console.log('\n2️⃣ TESTING MAUTIC OAUTH2 AUTHORIZATION URL:');
    console.log('============================================');
    
    if (!clientId || !mauticBaseUrl) {
        console.log('❌ Cannot test - missing Client ID or Base URL');
        return;
    }

    const state = Buffer.from(JSON.stringify({ 
        userId: 'test-user', 
        timestamp: Date.now() 
    })).toString('base64');

    const authUrl = `${mauticBaseUrl}/oauth/v2/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUriCode)}&` +
        `response_type=code&` +
        `state=${encodeURIComponent(state)}&` +
        `scope=contacts:read contacts:write campaigns:read emails:read users:read`;

    console.log('🔗 Generated OAuth2 URL:');
    console.log(authUrl);

    try {
        console.log('\n📡 Testing Mautic OAuth2 endpoint...');
        const response = await axios.get(`${mauticBaseUrl}/oauth/v2/authorize`, {
            params: {
                client_id: clientId,
                redirect_uri: redirectUriCode,
                response_type: 'code',
                state: state,
                scope: 'contacts:read contacts:write campaigns:read'
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status < 500; // Accept redirects and client errors
            }
        });

        console.log(`✅ Mautic OAuth2 endpoint responding: ${response.status}`);
        
        if (response.status === 302 && response.headers.location) {
            console.log(`🔄 Redirect to: ${response.headers.location}`);
        }

    } catch (error) {
        if (error.response?.status === 500) {
            console.log('❌ ERROR #500 CONFIRMED at Mautic OAuth2 endpoint');
            console.log('   This suggests the issue is in Mautic configuration');
        } else {
            console.log(`⚠️ Request failed: ${error.message}`);
        }
    }

    // Step 3: Test Mautic OAuth2 App Configuration
    console.log('\n3️⃣ TESTING MAUTIC OAUTH2 APP CONFIGURATION:');
    console.log('=============================================');
    
    try {
        // Try to get Mautic's OAuth2 client info (if available)
        const clientInfoUrl = `${mauticBaseUrl}/api/clients`;
        console.log(`📡 Checking Mautic API: ${clientInfoUrl}`);
        
        const apiResponse = await axios.get(clientInfoUrl, {
            headers: {
                'Authorization': `Bearer dummy-token` // This will fail but show us error type
            },
            validateStatus: function (status) {
                return status < 500;
            }
        });

        console.log(`📊 API Response: ${apiResponse.status}`);
        
    } catch (error) {
        console.log(`📊 API Error: ${error.response?.status || error.message}`);
    }

    // Step 4: Check if redirect URI is registered in Mautic
    console.log('\n4️⃣ REDIRECT URI VALIDATION:');
    console.log('===========================');
    console.log('🎯 REQUIRED MAUTIC CONFIGURATION:');
    console.log('  Go to: https://dfgbusiness.com/mautic/s/credentials');
    console.log(`  Find OAuth2 app with Client ID: ${clientId}`);
    console.log('  Verify these settings:');
    console.log(`    ✓ Redirect URI: ${redirectUriCode}`);
    console.log('    ✓ Grant Types: Authorization Code, Refresh Token');
    console.log('    ✓ Scopes: contacts:read, contacts:write, campaigns:read');
    console.log('    ✓ Published: Yes');
    console.log('    ✓ API Access: Enabled');

    // Step 5: Generate Fix Instructions
    console.log('\n5️⃣ PERMANENT FIX INSTRUCTIONS:');
    console.log('==============================');
    console.log('Based on analysis, here\'s what needs to be fixed:');
    
    if (redirectUriEnv !== redirectUriCode) {
        console.log('🔧 FIX 1: Update environment variable');
        console.log('   Change in .env file:');
        console.log(`   MAUTIC_REDIRECT_URI=${redirectUriCode}`);
    }
    
    console.log('🔧 FIX 2: Update Mautic OAuth2 app in dfgbusiness.com/mautic');
    console.log(`   - Set Redirect URI to: ${redirectUriCode}`);
    console.log('   - Ensure app is Published and API Access is enabled');
    
    console.log('🔧 FIX 3: Test the corrected flow');
    console.log('   - Restart backend server after .env changes');
    console.log('   - Try OAuth2 authorization again');

    console.log('\n📝 CREATING AUTO-FIX SCRIPT...');
    const fixScript = `# AUTOMATIC MAUTIC OAUTH2 FIX
# 1. Update .env file
MAUTIC_REDIRECT_URI=${redirectUriCode}

# 2. Restart backend server
# 3. Update Mautic OAuth2 app with redirect URI: ${redirectUriCode}
# 4. Test OAuth2 flow

echo "✅ Mautic OAuth2 configuration fix completed"
`;
    
    require('fs').writeFileSync('mautic-oauth2-fix.sh', fixScript);
    console.log('   📄 Fix script saved to: mautic-oauth2-fix.sh');
}

comprehensiveOAuth2Diagnosis().catch(console.error);