/**
 * Simple Mautic API Discovery Test
 * Test different API endpoints and authentication methods
 */

require('dotenv').config();
const axios = require('axios');

const MAUTIC_CONFIG = {
    baseUrl: 'https://dfgbusiness.com/mautic',
    username: 'admin@dfgbusiness.com',
    password: 'GISpc2017$!'
};

async function discoverMauticAPI() {
    console.log('🔍 MAUTIC API DISCOVERY TEST');
    console.log('═'.repeat(50));

    // Test 1: Check if Mautic is accessible
    console.log('\n🧪 Test 1: Basic Mautic Access');
    try {
        const response = await axios.get(MAUTIC_CONFIG.baseUrl, { timeout: 10000 });
        console.log(`✅ Mautic homepage accessible: ${response.status}`);
        
        // Check if it's a Mautic installation
        if (response.data.includes('Mautic') || response.data.includes('mautic')) {
            console.log('✅ Confirmed: This is a Mautic installation');
        }
    } catch (error) {
        console.log(`❌ Mautic homepage not accessible: ${error.message}`);
        return;
    }

    // Test 2: Try different API endpoints
    console.log('\n🧪 Test 2: API Endpoint Discovery');
    const apiEndpoints = [
        '/api/contacts',
        '/index.php/api/contacts', 
        '/mautic/api/contacts',
        '/index.php/api',
        '/api'
    ];

    for (const endpoint of apiEndpoints) {
        try {
            const url = `${MAUTIC_CONFIG.baseUrl}${endpoint}`;
            console.log(`📡 Trying: ${url}`);
            
            const response = await axios.get(url, {
                auth: {
                    username: MAUTIC_CONFIG.username,
                    password: MAUTIC_CONFIG.password
                },
                timeout: 10000,
                validateStatus: (status) => status < 500 // Accept 4xx as valid response
            });

            console.log(`   Status: ${response.status}`);
            
            if (response.status === 200) {
                console.log(`   ✅ SUCCESS: Found working endpoint!`);
                console.log(`   Response type: ${response.headers['content-type']}`);
                
                if (response.data && typeof response.data === 'object') {
                    console.log(`   Data keys: ${Object.keys(response.data).slice(0, 5).join(', ')}`);
                    if (response.data.total !== undefined) {
                        console.log(`   Total items: ${response.data.total}`);
                    }
                }
                break;
            } else if (response.status === 401) {
                console.log(`   ❌ Authentication required`);
            } else if (response.status === 404) {
                console.log(`   ❌ Endpoint not found`);
            } else {
                console.log(`   ⚠️ Unexpected status: ${response.status}`);
            }

        } catch (error) {
            console.log(`   ❌ Failed: ${error.response?.status || error.message}`);
        }
    }

    // Test 3: Check API status/info endpoint
    console.log('\n🧪 Test 3: API Status Check');
    const statusEndpoints = [
        '/index.php/api',
        '/api',
        '/index.php/api/stats',
        '/api/stats'
    ];

    for (const endpoint of statusEndpoints) {
        try {
            const url = `${MAUTIC_CONFIG.baseUrl}${endpoint}`;
            console.log(`📡 Checking: ${url}`);
            
            const response = await axios.get(url, {
                auth: {
                    username: MAUTIC_CONFIG.username,
                    password: MAUTIC_CONFIG.password
                },
                timeout: 10000,
                validateStatus: (status) => status < 500
            });

            if (response.status === 200) {
                console.log(`   ✅ Status endpoint found!`);
                if (response.data) {
                    console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
                }
                break;
            }

        } catch (error) {
            console.log(`   ❌ Status check failed: ${error.response?.status || error.message}`);
        }
    }

    // Test 4: Manual authentication test
    console.log('\n🧪 Test 4: Authentication Methods');
    
    // Try to find OAuth endpoint
    const oauthEndpoints = [
        '/oauth/v2/token',
        '/index.php/oauth/v2/token', 
        '/mautic/oauth/v2/token'
    ];

    for (const endpoint of oauthEndpoints) {
        try {
            const url = `${MAUTIC_CONFIG.baseUrl}${endpoint}`;
            console.log(`📡 OAuth endpoint: ${url}`);
            
            // Just check if endpoint exists (expect 400 for missing params)
            const response = await axios.post(url, 'grant_type=client_credentials', {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000,
                validateStatus: (status) => status < 500
            });

            console.log(`   Status: ${response.status}`);
            
            if (response.status === 400) {
                console.log(`   ✅ OAuth endpoint exists (400 = missing/invalid params)`);
                if (response.data && response.data.error) {
                    console.log(`   OAuth error: ${response.data.error}`);
                }
            }

        } catch (error) {
            console.log(`   ❌ OAuth endpoint failed: ${error.response?.status || error.message}`);
        }
    }

    console.log('\n📋 DISCOVERY COMPLETE');
    console.log('Next step: Update the import script with working endpoints');
}

// Run discovery
discoverMauticAPI().catch(console.error);