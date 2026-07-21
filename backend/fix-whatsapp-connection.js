/**
 * 🔧 FIX WHATSAPP CONNECTION ISSUES
 * 
 * This script cleans WhatsApp session files and cache to resolve
 * "Couldn't link device" errors.
 * 
 * Run: node fix-whatsapp-connection.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 WhatsApp Connection Fix Tool\n');
console.log('='.repeat(60));

const sessionPath = path.join(__dirname, 'whatsapp_sessions');

// Check if session folder exists
if (!fs.existsSync(sessionPath)) {
  console.log('✅ No session folder found - system is clean');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart backend server');
  console.log('   2. Go to Settings → WhatsApp Connection');
  console.log('   3. Click "Connect WhatsApp"');
  console.log('   4. Scan the NEW QR code');
  process.exit(0);
}

// List all session folders
const sessions = fs.readdirSync(sessionPath);

if (sessions.length === 0) {
  console.log('✅ Session folder is empty - system is clean');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart backend server');
  console.log('   2. Go to Settings → WhatsApp Connection');
  console.log('   3. Click "Connect WhatsApp"');
  console.log('   4. Scan the NEW QR code');
  process.exit(0);
}

console.log(`📁 Found ${sessions.length} session folder(s):\n`);

sessions.forEach((session, index) => {
  console.log(`   ${index + 1}. ${session}`);
});

console.log('\n🗑️  Deleting all session files...\n');

let deleted = 0;
let errors = 0;

sessions.forEach((session) => {
  const sessionFolder = path.join(sessionPath, session);
  
  try {
    // Recursively delete folder
    fs.rmSync(sessionFolder, { recursive: true, force: true });
    console.log(`   ✅ Deleted: ${session}`);
    deleted++;
  } catch (error) {
    console.log(`   ❌ Failed to delete ${session}: ${error.message}`);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Cleanup Results:');
console.log(`   ✅ Deleted: ${deleted} folder(s)`);
console.log(`   ❌ Errors: ${errors}`);

if (errors > 0) {
  console.log('\n⚠️  Some files could not be deleted.');
  console.log('   Solution: Close all WhatsApp processes and try again.');
  console.log('   Or manually delete: backend/whatsapp_sessions/');
} else {
  console.log('\n✅ SUCCESS! All WhatsApp session files cleaned.');
}

console.log('\n📝 Next steps:');
console.log('   1. ✅ Restart backend server (if running)');
console.log('   2. ✅ Clear browser cache (Ctrl+Shift+Delete)');
console.log('   3. ✅ Go to Settings → WhatsApp Connection');
console.log('   4. ✅ Click "Connect WhatsApp"');
console.log('   5. ✅ Wait for NEW QR code to appear');
console.log('   6. ✅ Scan with WhatsApp mobile app');
console.log('   7. ✅ Make sure WhatsApp mobile has internet connection');
console.log('   8. ✅ Make sure you\'re scanning from WhatsApp → Settings → Linked Devices');
console.log('\n⚠️  IMPORTANT: Don\'t scan the same QR code multiple times!');
console.log('   Each scan attempt generates a NEW QR code.');
