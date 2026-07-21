const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUserData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');
    
    // Find user by email
    const user = await User.findOne({ 
      email: 'edwinalove51@gmail.com' 
    });
    
    if (!user) {
      console.log('❌ User not found with email: edwinalove51@gmail.com');
      
      // List all users
      const allUsers = await User.find({}, 'email name');
      console.log('\n📋 Available users:');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name})`);
      });
      
      await mongoose.connection.close();
      return;
    }
    
    console.log('✅ User found!');
    console.log('─'.repeat(60));
    console.log('\n📧 EMAIL:', user.email);
    console.log('👤 NAME:', user.name);
    console.log('📅 CREATED:', user.createdAt);
    console.log('🔑 ROLE:', user.role);
    
    console.log('\n🏢 BUSINESS PROFILE:');
    console.log('─'.repeat(60));
    console.log('  Business Name:', user.businessProfile.businessName || '(empty)');
    console.log('  Industry:', user.businessProfile.industry || '(empty)');
    console.log('  Description:', user.businessProfile.description || '(empty)');
    console.log('  Phone:', user.businessProfile.phone || '(empty)');
    console.log('  Email:', user.businessProfile.email || '(empty)');
    console.log('  Website:', user.businessProfile.website || '(empty)');
    console.log('  Address:', user.businessProfile.address || '(empty)');
    console.log('  Logo:', user.businessProfile.logo || '(empty)');
    
    console.log('\n👤 PERSONAL INFORMATION:');
    console.log('─'.repeat(60));
    console.log('  First Name:', user.firstName || '(empty)');
    console.log('  Last Name:', user.lastName || '(empty)');
    console.log('  Phone:', user.phone || '(empty)');
    console.log('  Profile Picture:', user.profilePicture || '(empty)');
    
    console.log('\n⚙️  SETTINGS:');
    console.log('─'.repeat(60));
    console.log('  Timezone:', user.preferences?.timezone || 'Not set');
    console.log('  Language:', user.preferences?.language || 'Not set');
    
    console.log('\n🔔 NOTIFICATIONS:');
    console.log('─'.repeat(60));
    console.log('  Email:', user.notifications?.email !== undefined ? user.notifications.email : 'Not set');
    console.log('  WhatsApp:', user.notifications?.whatsapp !== undefined ? user.notifications.whatsapp : 'Not set');
    
    console.log('\n🤖 AI PREFERENCES:');
    console.log('─'.repeat(60));
    console.log('  Provider:', user.aiPreferences?.preferredProvider || 'Not set');
    console.log('  Tone:', user.aiPreferences?.defaultTone || 'Not set');
    
    console.log('\n🔒 SECURITY:');
    console.log('─'.repeat(60));
    console.log('  Last Login:', user.lastLogin || 'Never');
    console.log('  Last Password Change:', user.lastPasswordChange || 'Never');
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ DATA CHECK COMPLETE');
    console.log('═'.repeat(60));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserData();
