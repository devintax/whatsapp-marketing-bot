/**
 * Mautic OAuth Error 500 Diagnostic
 * Analyzes and fixes the OAuth configuration issues
 */

const axios = require('axios');

async function diagnoseMauticOAuthError() {
    console.log('🔍 MAUTIC OAUTH ERROR 500 DIAGNOSTIC');
    console.log('═'.repeat(60));
    
    const MAUTIC_BASE_URL = 'https://dfgbusiness.com/mautic';
    const CLIENT_ID = '1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw';
    const REDIRECT_URI = 'https://connect.vemgootech.info/api/crm/mautic/callback';
    
    console.log('📋 Current OAuth Configuration:');
    console.log(`🌐 Mautic URL: ${MAUTIC_BASE_URL}`);
    console.log(`🔑 Client ID: ${CLIENT_ID}`);
    console.log(`🔄 Redirect URI: ${REDIRECT_URI}`);
    
    // Test 1: Check if Mautic server is accessible
    console.log('\n🧪 TEST 1: Basic Mautic Server Accessibility');
    console.log('━'.repeat(50));
    
    try {
        const response = await axios.get(MAUTIC_BASE_URL, { timeout: 10000 });
        console.log(`✅ Mautic server accessible - Status: ${response.status}`);
    } catch (error) {
        console.log(`❌ Mautic server issue: ${error.message}`);
        if (error.response) {
            console.log(`📡 Status: ${error.response.status}`);
        }
    }
    
    // Test 2: Check OAuth endpoint specifically
    console.log('\n🧪 TEST 2: OAuth Authorization Endpoint');
    console.log('━'.repeat(50));
    
    try {
        const authEndpoint = `${MAUTIC_BASE_URL}/oauth/v2/authorize`;
        const response = await axios.get(authEndpoint, { 
            timeout: 10000,
            validateStatus: (status) => status < 500
        });
        console.log(`✅ OAuth endpoint accessible - Status: ${response.status}`);
    } catch (error) {
        console.log(`❌ OAuth endpoint error: ${error.message}`);
        if (error.response?.status === 500) {
            console.log('🔍 Error 500 details:', error.response.data);
        }
    }
    
    // Test 3: Check with minimal parameters
    console.log('\n🧪 TEST 3: OAuth with Minimal Parameters');
    console.log('━'.repeat(50));
    
    try {
        const minimalUrl = `${MAUTIC_BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&response_type=code`;
        console.log(`🔗 Testing minimal URL: ${minimalUrl}`);
        
        const response = await axios.get(minimalUrl, { 
            timeout: 10000,
            validateStatus: (status) => status < 500
        });
        console.log(`✅ Minimal OAuth works - Status: ${response.status}`);
    } catch (error) {
        console.log(`❌ Minimal OAuth failed: ${error.message}`);
    }
    
    // Test 4: Validate redirect URI format
    console.log('\n🧪 TEST 4: Redirect URI Validation');
    console.log('━'.repeat(50));
    
    const validRedirectUri = encodeURIComponent(REDIRECT_URI);
    console.log(`🔗 Encoded Redirect URI: ${validRedirectUri}`);
    
    // Check if redirect URI is properly formatted
    if (REDIRECT_URI.startsWith('https://')) {
        console.log('✅ Redirect URI uses HTTPS');
    } else {
        console.log('❌ Redirect URI should use HTTPS');
    }
    
    if (REDIRECT_URI.includes('connect.vemgootech.info')) {
        console.log('✅ Redirect URI domain matches');
    } else {
        console.log('❌ Redirect URI domain mismatch');
    }
    
    // Common OAuth Error 500 Causes
    console.log('\n💡 COMMON OAUTH ERROR 500 CAUSES:');
    console.log('━'.repeat(40));
    console.log('1. ❌ Client ID not found in Mautic');
    console.log('2. ❌ Redirect URI not registered in Mautic OAuth app');
    console.log('3. ❌ Mautic OAuth app is disabled/inactive');
    console.log('4. ❌ Mautic server configuration issues');
    console.log('5. ❌ URL encoding problems in parameters');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('━'.repeat(25));
    console.log('1. 🔍 Check Mautic OAuth App Configuration:');
    console.log(`   - Login to: ${MAUTIC_BASE_URL}`);
    console.log('   - Go to: Settings > API Credentials');
    console.log(`   - Verify Client ID: ${CLIENT_ID}`);
    console.log('   - Check Status: Should be "Published"');
    console.log(`   - Verify Redirect URI: ${REDIRECT_URI}`);
    
    console.log('\n2. 🔄 Alternative Redirect URIs to try:');
    console.log('   - https://connect.vemgootech.info/api/crm/mautic/callback');
    console.log('   - https://connect.vemgootech.info/mautic/callback');
    console.log('   - https://connect.vemgootech.info/callback');
    
    console.log('\n3. 🧪 Test OAuth app directly in Mautic:');
    console.log('   - Use Mautic\'s built-in OAuth test feature');
    console.log('   - Check if app generates tokens manually');
    
    // Generate alternative OAuth URLs to test
    console.log('\n🔗 ALTERNATIVE OAUTH URLS TO TEST:');
    console.log('━'.repeat(40));
    
    const alternatives = [
        {
            name: 'Without State Parameter',
            url: `${MAUTIC_BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=contacts:read`
        },
        {
            name: 'With Simple Scope',
            url: `${MAUTIC_BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=contacts:read`
        },
        {
            name: 'Minimal Required Parameters',
            url: `${MAUTIC_BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&response_type=code`
        }
    ];
    
    alternatives.forEach((alt, index) => {
        console.log(`\n${index + 1}. ${alt.name}:`);
        console.log(alt.url);
    });
    
    console.log('\n🎯 IMMEDIATE ACTION PLAN:');
    console.log('━'.repeat(30));
    console.log('1. Check Mautic OAuth app configuration first');
    console.log('2. Try the alternative URLs above');
    console.log('3. If still failing, create new OAuth app in Mautic');
    console.log('4. Verify Mautic server logs for detailed error info');
}

// Run the diagnostic
diagnoseMauticOAuthError().catch(console.error);