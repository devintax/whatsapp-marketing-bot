// Debug Mautic OAuth2 Configuration
const https = require('https');
const http = require('http');

console.log('🔍 Debugging Mautic OAuth2 Configuration...\n');

// Configuration from test
const MAUTIC_BASE_URL = 'https://dfgbusiness.com/mautic';
const CLIENT_ID = '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o';
const REDIRECT_URI_LOCALHOST = 'http://localhost:5000/api/auth/mautic/callback';
const REDIRECT_URI_PRODUCTION = 'https://connect.vemgootech.info/api/auth/mautic/callback';

console.log('📋 Current Configuration:');
console.log(`Mautic URL: ${MAUTIC_BASE_URL}`);
console.log(`Client ID: ${CLIENT_ID}`);
console.log(`Localhost Redirect: ${REDIRECT_URI_LOCALHOST}`);
console.log(`Production Redirect: ${REDIRECT_URI_PRODUCTION}`);
console.log();

// Test different redirect URIs
const testRedirectURIs = [
    REDIRECT_URI_LOCALHOST,
    REDIRECT_URI_PRODUCTION,
    'http://localhost:5000/api/auth/mautic/callback',
    'https://api.vemgootech.info/api/auth/mautic/callback',
    'https://connect.vemgootech.info/api/auth/mautic/callback'
];

console.log('🧪 Testing OAuth2 URLs with different redirect URIs:\n');

testRedirectURIs.forEach((redirectUri, index) => {
    const authUrl = `${MAUTIC_BASE_URL}/oauth/v2/authorize?` +
        `client_id=${encodeURIComponent(CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=contacts:read contacts:write&` +
        `state=${encodeURIComponent(btoa(JSON.stringify({test: index + 1, timestamp: Date.now()})))}`;
    
    console.log(`${index + 1}. Redirect URI: ${redirectUri}`);
    console.log(`   OAuth2 URL: ${authUrl}`);
    console.log(`   Encoded Redirect: ${encodeURIComponent(redirectUri)}`);
    console.log();
});

// Test Mautic endpoint accessibility
console.log('🌐 Testing Mautic endpoint accessibility...\n');

const testMauticEndpoint = (endpoint, description) => {
    return new Promise((resolve) => {
        const url = `${MAUTIC_BASE_URL}${endpoint}`;
        console.log(`Testing ${description}: ${url}`);
        
        https.get(url, (res) => {
            console.log(`✅ ${description} - Status: ${res.statusCode} ${res.statusMessage}`);
            console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
            resolve();
        }).on('error', (err) => {
            console.log(`❌ ${description} - Error: ${err.message}`);
            resolve();
        });
    });
};

(async () => {
    await testMauticEndpoint('/', 'Mautic Home');
    await testMauticEndpoint('/oauth/v2/authorize', 'OAuth2 Authorize Endpoint');
    await testMauticEndpoint('/oauth/v2/token', 'OAuth2 Token Endpoint');
    
    console.log('\n📝 Recommendations:');
    console.log('1. Check Mautic OAuth2 app configuration at:');
    console.log('   https://dfgbusiness.com/mautic/s/credentials');
    console.log('2. Ensure the redirect URI in Mautic EXACTLY matches what we\'re sending');
    console.log('3. Verify the client ID is correct');
    console.log('4. Check if the OAuth2 app is enabled and active');
    console.log('5. Make sure the scopes (contacts:read contacts:write) are allowed');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Login to Mautic admin panel');
    console.log('2. Go to Settings > API Credentials');
    console.log('3. Edit the OAuth2 app');
    console.log('4. Verify/update the redirect URI');
    console.log('5. Test again with the correct configuration');
})();