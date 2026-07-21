/**
 * Mautic OAuth Configuration Guide
 * Complete setup instructions and redirect URI information
 */

console.log('🔧 MAUTIC OAUTH CONFIGURATION GUIDE');
console.log('═'.repeat(60));

console.log('\n📍 CORRECT REDIRECT URI');
console.log('━'.repeat(40));
console.log('✅ Use this exact redirect URI in your Mautic OAuth app:');
console.log('   https://connect.vemgootech.info/api/crm/mautic/callback');
console.log('');
console.log('❌ DO NOT use this old URI:');
console.log('   https://connect.vemgootech.info/api/auth/mautic/callback');

console.log('\n🔑 OAUTH APP SETUP STEPS');
console.log('━'.repeat(40));
console.log('1. 🌐 Login to Mautic Admin Panel:');
console.log('   URL: https://dfgbusiness.com/mautic/s/config');
console.log('');
console.log('2. 📱 Navigate to API Settings:');
console.log('   Settings → Configuration → API Settings');
console.log('');
console.log('3. ➕ Create/Edit OAuth Application:');
console.log('   - Name: WhatsApp Marketing Bot');
console.log('   - Redirect URI: https://connect.vemgootech.info/api/crm/mautic/callback');
console.log('   - Grant Types: ✅ Authorization Code');
console.log('   - Grant Types: ✅ Client Credentials (CRITICAL)');
console.log('');
console.log('4. 💾 Save and Copy Credentials:');
console.log('   - Client ID: Copy to .env file');
console.log('   - Client Secret: Copy to .env file');

console.log('\n🚨 CRITICAL ERROR ANALYSIS');
console.log('━'.repeat(40));
console.log('❌ Error: "The grant type is unauthorized for this client_id"');
console.log('');
console.log('🔍 This error means:');
console.log('   1. ❌ Client Credentials grant type is NOT enabled');
console.log('   2. ❌ OAuth app is configured for Authorization Code only');
console.log('   3. ❌ Our integration needs Client Credentials grant');

console.log('\n🔧 IMMEDIATE FIX REQUIRED');
console.log('━'.repeat(40));
console.log('🎯 In Mautic OAuth App Settings, ensure BOTH are checked:');
console.log('   ✅ Authorization Code Grant');
console.log('   ✅ Client Credentials Grant ← THIS IS MISSING!');
console.log('');
console.log('📝 Current OAuth app probably only has:');
console.log('   ✅ Authorization Code Grant');
console.log('   ❌ Client Credentials Grant ← ADD THIS!');

console.log('\n📋 VERIFICATION CHECKLIST');
console.log('━'.repeat(40));
console.log('Before testing, confirm these settings:');
console.log('');
console.log('🔐 OAuth Application Settings:');
console.log('   □ Name: WhatsApp Marketing Bot (or similar)');
console.log('   □ Redirect URI: https://connect.vemgootech.info/api/crm/mautic/callback');
console.log('   □ Grant Types: Authorization Code ✅');
console.log('   □ Grant Types: Client Credentials ✅ ← CRITICAL');
console.log('   □ Status: Published/Active');
console.log('');
console.log('📄 Environment Variables (.env):');
console.log('   □ MAUTIC_BASE_URL=https://dfgbusiness.com/mautic');
console.log('   □ MAUTIC_CLIENT_ID=(from OAuth app)');
console.log('   □ MAUTIC_CLIENT_SECRET=(from OAuth app)');

console.log('\n🧪 TEST AFTER CONFIGURATION');
console.log('━'.repeat(40));
console.log('After updating the OAuth app settings:');
console.log('1. ⏳ Wait 2-3 minutes for changes to propagate');
console.log('2. 🔄 Restart your backend server');
console.log('3. 🧪 Run: node analyze-mautic-contact-volume.js');
console.log('4. ✅ Should authenticate successfully');

console.log('\n📱 MAUTIC ADMIN ACCESS URLS');
console.log('━'.repeat(40));
console.log('🌐 Main Admin: https://dfgbusiness.com/mautic/s/dashboard');
console.log('⚙️ Configuration: https://dfgbusiness.com/mautic/s/config');
console.log('🔑 API Settings: https://dfgbusiness.com/mautic/s/config/edit/api');
console.log('📱 OAuth Apps: Navigate to Configuration → API Settings → OAuth');

console.log('\n🔍 TROUBLESHOOTING TIPS');
console.log('━'.repeat(40));
console.log('If still having issues:');
console.log('');
console.log('1. 🔄 Delete and recreate OAuth app');
console.log('2. 🕐 Wait 5 minutes after creating');
console.log('3. 📋 Double-check all grant types are enabled');
console.log('4. 🔗 Verify redirect URI is EXACT match');
console.log('5. 🧪 Test with simple API call first');

console.log('\n💡 WHY CLIENT CREDENTIALS IS NEEDED');
console.log('━'.repeat(40));
console.log('📊 Our contact sync uses "client_credentials" grant because:');
console.log('   - No user interaction required');
console.log('   - Server-to-server authentication');
console.log('   - Automatic contact synchronization');
console.log('   - Background processing capability');
console.log('');
console.log('🚫 Authorization Code grant alone is insufficient because:');
console.log('   - Requires user login each time');
console.log('   - Not suitable for automated processes');
console.log('   - Cannot run in background');

console.log('\n📞 NEXT STEPS SUMMARY');
console.log('━'.repeat(40));
console.log('1. 🔧 Enable Client Credentials grant in Mautic OAuth app');
console.log('2. ✅ Verify redirect URI is correct');
console.log('3. 💾 Save changes and wait 2-3 minutes');
console.log('4. 🧪 Test authentication again');
console.log('5. 📊 Proceed with contact volume analysis');

// Current credentials check
require('dotenv').config();
console.log('\n🔍 CURRENT CONFIGURATION CHECK');
console.log('━'.repeat(40));
console.log(`📍 Mautic URL: ${process.env.MAUTIC_BASE_URL || 'NOT SET'}`);
console.log(`🔑 Client ID: ${process.env.MAUTIC_CLIENT_ID ? process.env.MAUTIC_CLIENT_ID.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`🔐 Client Secret: ${process.env.MAUTIC_CLIENT_SECRET ? 'SET (' + process.env.MAUTIC_CLIENT_SECRET.length + ' chars)' : 'NOT SET'}`);

if (!process.env.MAUTIC_CLIENT_ID || !process.env.MAUTIC_CLIENT_SECRET) {
    console.log('\n❌ CONFIGURATION INCOMPLETE');
    console.log('   Missing OAuth credentials in .env file');
} else {
    console.log('\n✅ CREDENTIALS CONFIGURED');
    console.log('   Issue is likely grant type configuration in Mautic');
}