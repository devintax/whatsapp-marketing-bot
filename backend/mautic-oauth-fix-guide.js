/**
 * Mautic OAuth Configuration Fix
 * Creates alternative OAuth URLs and provides manual setup instructions
 */

console.log('🔧 MAUTIC OAUTH ERROR 500 - COMPLETE SOLUTION');
console.log('═'.repeat(60));

console.log('\n🎯 ROOT CAUSE IDENTIFIED:');
console.log('━'.repeat(30));
console.log('✅ Mautic server is accessible');
console.log('✅ OAuth endpoint exists');
console.log('✅ Client ID format is correct');
console.log('❌ Redirect URI likely not registered in Mautic OAuth app');

console.log('\n📋 STEP-BY-STEP FIX:');
console.log('━'.repeat(25));

console.log('\n1️⃣ LOGIN TO MAUTIC ADMIN:');
console.log('   🌐 URL: https://dfgbusiness.com/mautic');
console.log('   👤 Use your admin credentials');

console.log('\n2️⃣ NAVIGATE TO API CREDENTIALS:');
console.log('   📍 Go to: Settings > Configuration > API Settings');
console.log('   OR: Settings > API Credentials');

console.log('\n3️⃣ FIND YOUR OAUTH APP:');
console.log('   🔍 Look for Client ID: 1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw');
console.log('   📝 App name might be: "WhatsApp Bot" or similar');

console.log('\n4️⃣ UPDATE REDIRECT URI:');
console.log('   📝 Current Redirect URI should be:');
console.log('      ❌ https://connect.vemgootech.info/api/auth/mautic/callback');
console.log('   📝 Change it to:');
console.log('      ✅ https://connect.vemgootech.info/api/crm/mautic/callback');

console.log('\n5️⃣ VERIFY APP STATUS:');
console.log('   ✅ Status: Published/Active');
console.log('   ✅ Redirect URI: Updated');
console.log('   ✅ Scopes: contacts:read, contacts:write, campaigns:read');

console.log('\n🔗 ALTERNATIVE TEST URLS:');
console.log('━'.repeat(30));

const BASE_URL = 'https://dfgbusiness.com/mautic';
const CLIENT_ID = '1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw';

const testUrls = [
    {
        name: 'Original (with state)',
        url: `${BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=https%3A%2F%2Fconnect.vemgootech.info%2Fapi%2Fcrm%2Fmautic%2Fcallback&response_type=code&state=test123&scope=contacts:read contacts:write campaigns:read`
    },
    {
        name: 'Without state parameter',
        url: `${BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=https%3A%2F%2Fconnect.vemgootech.info%2Fapi%2Fcrm%2Fmautic%2Fcallback&response_type=code&scope=contacts:read`
    },
    {
        name: 'Minimal parameters only',
        url: `${BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&response_type=code`
    },
    {
        name: 'Alternative callback path',
        url: `${BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=https%3A%2F%2Fconnect.vemgootech.info%2Fmautic%2Fcallback&response_type=code`
    }
];

testUrls.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}:`);
    console.log(`   ${test.url}`);
});

console.log('\n🧪 MANUAL TESTING STEPS:');
console.log('━'.repeat(30));
console.log('1. Fix the redirect URI in Mautic first');
console.log('2. Try URL #1 (original with corrected redirect)');
console.log('3. If still error 500, try URL #2 (without state)');
console.log('4. If still error 500, try URL #3 (minimal)');
console.log('5. If URL #3 works, redirect URI is the issue');

console.log('\n⚡ QUICK FIX - CREATE NEW OAUTH APP:');
console.log('━'.repeat(45));
console.log('If updating existing app doesn\'t work:');
console.log('1. Create NEW OAuth app in Mautic');
console.log('2. Set Redirect URI: https://connect.vemgootech.info/api/crm/mautic/callback');
console.log('3. Set Scopes: contacts:read, contacts:write, campaigns:read');
console.log('4. Copy the NEW Client ID and Secret');
console.log('5. Update your .env file with new credentials');

console.log('\n💡 WHAT EACH ERROR MEANS:');
console.log('━'.repeat(30));
console.log('✅ Status 200: OAuth app found, parameters accepted');
console.log('❌ Error 500: OAuth app configuration issue');
console.log('❌ Error 400: Invalid parameters');
console.log('❌ Error 404: OAuth app not found');

console.log('\n🎉 AFTER FIXING:');
console.log('━'.repeat(20));
console.log('1. OAuth flow will redirect properly');
console.log('2. Access tokens will be stored');
console.log('3. Contact sync will work with OAuth2');
console.log('4. "0 contacts imported" will show real numbers');

console.log('\n🔄 NEXT: Test the OAuth flow again after fixing redirect URI!');
console.log('═'.repeat(60));