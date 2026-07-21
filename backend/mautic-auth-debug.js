/**
 * Detailed Mautic Authentication Debug Test
 * Deep dive into authentication issues
 */

require('dotenv').config();
const axios = require('axios');

const MAUTIC_CONFIG = {
    baseUrl: 'https://dfgbusiness.com/mautic',
    username: 'admin@dfgbusiness.com',
    password: 'GISpc2017$!',
    clientId: '1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw',
    clientSecret: '2ss4w1u8eiqsws8gswcossk48oksc8okoskskwgo4kgo4csccw'
};

async function debugMauticAuth() {
    console.log('🔍 DETAILED MAUTIC AUTHENTICATION DEBUG');
    console.log('═'.repeat(60));

    // Test 1: Check OAuth endpoint with detailed response
    console.log('\n🧪 Test 1: OAuth Endpoint Analysis');
    try {
        const authUrl = `${MAUTIC_CONFIG.baseUrl}/index.php/oauth/v2/token`;
        console.log(`📡 POST ${authUrl}`);
        
        const authData = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: MAUTIC_CONFIG.clientId,
            client_secret: MAUTIC_CONFIG.clientSecret
        });

        const response = await axios.post(authUrl, authData, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 15000,
            validateStatus: () => true // Accept all status codes
        });

        console.log(`Status: ${response.status}`);
        console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);

        if (response.data && response.data.errors) {
            console.log('\n🔍 OAuth Error Analysis:');
            response.data.errors.forEach((error, index) => {
                console.log(`   Error ${index + 1}: ${error.message}`);
                console.log(`   Code: ${error.code}`);
                console.log(`   Type: ${error.type}`);
            });
        }

    } catch (error) {
        console.log(`❌ OAuth test failed: ${error.message}`);
    }

    // Test 2: Check Basic Auth with detailed error analysis
    console.log('\n🧪 Test 2: Basic Auth Analysis');
    try {
        const apiUrl = `${MAUTIC_CONFIG.baseUrl}/index.php/api/contacts?limit=1`;
        console.log(`📡 GET ${apiUrl}`);
        console.log(`🔐 Username: ${MAUTIC_CONFIG.username}`);
        console.log(`🔐 Password: ${MAUTIC_CONFIG.password.substring(0, 3)}...`);

        const response = await axios.get(apiUrl, {
            auth: {
                username: MAUTIC_CONFIG.username,
                password: MAUTIC_CONFIG.password
            },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'WhatsApp-Bot/1.0'
            },
            timeout: 15000,
            validateStatus: () => true // Accept all status codes
        });

        console.log(`Status: ${response.status}`);
        console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);

        if (response.status === 401) {
            console.log('\n🔍 401 Unauthorized Analysis:');
            console.log('   Possible causes:');
            console.log('   1. ❌ Invalid username/password');
            console.log('   2. ❌ API access not enabled for user');
            console.log('   3. ❌ User account disabled/locked');
            console.log('   4. ❌ API endpoints disabled in Mautic config');
        }

    } catch (error) {
        console.log(`❌ Basic auth test failed: ${error.message}`);
        if (error.response) {
            console.log(`Response status: ${error.response.status}`);
            console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }

    // Test 3: Try to access Mautic login page
    console.log('\n🧪 Test 3: Login Page Analysis');
    try {
        const loginUrl = `${MAUTIC_CONFIG.baseUrl}/s/login`;
        console.log(`📡 GET ${loginUrl}`);
        
        const response = await axios.get(loginUrl, {
            timeout: 10000,
            maxRedirects: 5
        });

        console.log(`Status: ${response.status}`);
        
        if (response.data.includes('login') || response.data.includes('password')) {
            console.log('✅ Login page accessible - Mautic is running');
        }
        
        // Check for CSRF tokens or other security measures
        if (response.data.includes('csrf') || response.data.includes('token')) {
            console.log('⚠️ CSRF protection detected - may need tokens for API access');
        }

    } catch (error) {
        console.log(`❌ Login page test failed: ${error.message}`);
    }

    // Test 4: Alternative OAuth grant types
    console.log('\n🧪 Test 4: Alternative OAuth Grant Types');
    
    const grantTypes = [
        'authorization_code',
        'password', 
        'refresh_token'
    ];

    for (const grantType of grantTypes) {
        try {
            const authUrl = `${MAUTIC_CONFIG.baseUrl}/index.php/oauth/v2/token`;
            console.log(`📡 Testing grant_type: ${grantType}`);
            
            let authData;
            if (grantType === 'password') {
                authData = new URLSearchParams({
                    grant_type: grantType,
                    client_id: MAUTIC_CONFIG.clientId,
                    client_secret: MAUTIC_CONFIG.clientSecret,
                    username: MAUTIC_CONFIG.username,
                    password: MAUTIC_CONFIG.password
                });
            } else {
                authData = new URLSearchParams({
                    grant_type: grantType,
                    client_id: MAUTIC_CONFIG.clientId,
                    client_secret: MAUTIC_CONFIG.clientSecret
                });
            }

            const response = await axios.post(authUrl, authData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000,
                validateStatus: () => true
            });

            console.log(`   Status: ${response.status}`);
            if (response.data && response.data.access_token) {
                console.log(`   ✅ SUCCESS! Access token received for ${grantType}`);
                console.log(`   Token: ${response.data.access_token.substring(0, 20)}...`);
                
                // Test the token immediately
                const testResponse = await axios.get(`${MAUTIC_CONFIG.baseUrl}/index.php/api/contacts?limit=1`, {
                    headers: { 'Authorization': `Bearer ${response.data.access_token}` },
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                console.log(`   API Test Status: ${testResponse.status}`);
                if (testResponse.status === 200) {
                    console.log(`   🎉 WORKING TOKEN! Found working grant type: ${grantType}`);
                    return { grantType, token: response.data.access_token };
                }
                
            } else if (response.data && response.data.errors) {
                console.log(`   ❌ Error: ${response.data.errors[0]?.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.log(`   ❌ ${grantType} failed: ${error.message}`);
        }
    }

    console.log('\n📋 AUTHENTICATION DEBUG COMPLETE');
    console.log('\nNext steps:');
    console.log('1. Check Mautic admin panel for API settings');
    console.log('2. Verify user permissions for API access');
    console.log('3. Enable the correct OAuth grant types');
    console.log('4. Check if API is enabled globally in Mautic');
}

// Run debug
debugMauticAuth().catch(console.error);