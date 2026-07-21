/**
 * WhatsApp Connection Diagnostic Tool
 * Checks all components needed for WhatsApp connection
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 WHATSAPP CONNECTION DIAGNOSTIC TOOL');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Check session directory
console.log('1️⃣ Checking WhatsApp session directory...');
const sessionPath = path.join(__dirname, 'whatsapp_sessions');
try {
  if (fs.existsSync(sessionPath)) {
    const sessions = fs.readdirSync(sessionPath);
    console.log(`   ✅ Session directory exists`);
    console.log(`   📁 Found ${sessions.length} items in session directory:`);
    sessions.forEach(item => {
      const itemPath = path.join(sessionPath, item);
      const stats = fs.statSync(itemPath);
      console.log(`      - ${item} (${stats.isDirectory() ? 'folder' : 'file'})`);
    });
  } else {
    console.log(`   ⚠️  Session directory does not exist`);
    console.log(`   📝 Creating session directory...`);
    fs.mkdirSync(sessionPath, { recursive: true });
    console.log(`   ✅ Session directory created`);
  }
} catch (error) {
  console.log(`   ❌ Error checking session directory: ${error.message}`);
}

// 2. Check for session status files
console.log('\n2️⃣ Checking session status files...');
try {
  const statusFiles = fs.readdirSync(sessionPath).filter(f => f.startsWith('session_status_'));
  if (statusFiles.length > 0) {
    console.log(`   📄 Found ${statusFiles.length} session status file(s):`);
    statusFiles.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(sessionPath, file), 'utf8'));
        console.log(`      - ${file}: Status=${content.status}, Time=${content.timestamp}`);
      } catch (e) {
        console.log(`      - ${file}: ❌ Could not read (${e.message})`);
      }
    });
  } else {
    console.log(`   ℹ️  No session status files found (this is normal for first connection)`);
  }
} catch (error) {
  console.log(`   ❌ Error checking status files: ${error.message}`);
}

// 3. Check for locked files
console.log('\n3️⃣ Checking for locked/busy session files...');
const userSessionPath = path.join(sessionPath, 'session-user_690a36c2e0c4bdf8358042bf');
if (fs.existsSync(userSessionPath)) {
  console.log(`   📁 User session folder exists`);
  try {
    const sessionFiles = fs.readdirSync(userSessionPath, { recursive: true });
    const lockedFiles = sessionFiles.filter(f => 
      f.includes('Cookies') || 
      f.includes('.log') || 
      f.includes('.lock')
    );
    if (lockedFiles.length > 0) {
      console.log(`   ⚠️  Found ${lockedFiles.length} potentially locked files:`);
      lockedFiles.forEach(file => console.log(`      - ${file}`));
      console.log(`   💡 These files may cause EBUSY errors`);
    } else {
      console.log(`   ✅ No obviously locked files found`);
    }
  } catch (error) {
    console.log(`   ❌ Could not read session folder: ${error.message}`);
  }
} else {
  console.log(`   ℹ️  No user session folder yet (normal for first connection)`);
}

// 4. Check Chrome/Chromium
console.log('\n4️⃣ Checking Chrome/Chromium installation...');
const { execSync } = require('child_process');
try {
  const chromePath = execSync('where chrome', { encoding: 'utf8' }).trim();
  console.log(`   ✅ Chrome found: ${chromePath}`);
} catch {
  try {
    const chromiumPath = execSync('where chromium', { encoding: 'utf8' }).trim();
    console.log(`   ✅ Chromium found: ${chromiumPath}`);
  } catch {
    console.log(`   ⚠️  Chrome/Chromium not found in PATH`);
    console.log(`   📝 WhatsApp Web.js will try to use bundled Chromium`);
  }
}

// 5. Check backend server
console.log('\n5️⃣ Checking if backend server is running...');
try {
  const { spawn } = require('child_process');
  const netstat = spawn('netstat', ['-ano']);
  let output = '';
  
  netstat.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  netstat.on('close', (code) => {
    const port5000 = output.split('\n').filter(line => line.includes(':5000'));
    if (port5000.length > 0) {
      console.log(`   ✅ Port 5000 is in use (backend is running)`);
      port5000.forEach(line => console.log(`      ${line.trim()}`));
    } else {
      console.log(`   ❌ Port 5000 is not in use (backend is NOT running)`);
      console.log(`   💡 Start backend with: cd backend && node server.js`);
    }
    
    // 6. Recommendations
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 RECOMMENDATIONS:');
    console.log('═══════════════════════════════════════════════════════');
    
    if (fs.existsSync(userSessionPath)) {
      console.log('\n⚠️  OLD SESSION DETECTED:');
      console.log('   1. Stop backend server');
      console.log('   2. Run: clean-whatsapp-sessions.bat');
      console.log('   3. Restart backend');
      console.log('   4. Try connecting again');
    } else {
      console.log('\n✅ NO OLD SESSION - READY FOR FRESH CONNECTION:');
      console.log('   1. Make sure backend is running: node server.js');
      console.log('   2. Go to Settings in the app');
      console.log('   3. Click "Connect WhatsApp"');
      console.log('   4. Wait for QR code (may take 10-30 seconds)');
      console.log('   5. Scan with phone');
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');
  });
} catch (error) {
  console.log(`   ❌ Could not check port: ${error.message}`);
}
