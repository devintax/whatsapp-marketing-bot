const mongoose = require('mongoose');
require('dotenv').config();

async function fixMainUserContactAccess() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Contact = require('./models/Contact');
    const User = require('./models/User');
    
    console.log('🔍 MAIN ADMIN ACCOUNT ANALYSIS:');
    console.log('=' .repeat(50));
    
    // Find the main admin user
    const mainAdminUser = await User.findById('68f4bcc2eb61f568f2f30db6');
    if (mainAdminUser) {
      console.log(`👑 Main Admin User Found:`);
      console.log(`   Email: ${mainAdminUser.email}`);
      console.log(`   ID: ${mainAdminUser._id}`);
      console.log(`   Role: ${mainAdminUser.role || 'user'}`);
      
      const contactCount = await Contact.countDocuments({ user: mainAdminUser._id });
      console.log(`   Total Contacts: ${contactCount}`);
      
      const todayContacts = await Contact.countDocuments({ 
        user: mainAdminUser._id,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      });
      console.log(`   Added Today: ${todayContacts}`);
    }
    
    // Check if there are other admin-like users
    console.log('\n🔍 LOOKING FOR OTHER POTENTIAL ADMIN ACCOUNTS:');
    console.log('=' .repeat(50));
    
    const potentialAdminUsers = await User.find({
      $or: [
        { email: { $regex: /admin/i } },
        { email: { $regex: /dfgbusiness/i } },
        { role: 'admin' },
        { role: 'super_admin' }
      ]
    });
    
    for (const user of potentialAdminUsers) {
      const contactCount = await Contact.countDocuments({ user: user._id });
      console.log(`📧 ${user.email} (${user._id})`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Contacts: ${contactCount}`);
      console.log('');
    }
    
    // Check if we need to redistribute contacts to a different main user
    console.log('🔧 REDISTRIBUTION OPTIONS:');
    console.log('=' .repeat(50));
    
    const allUsers = await User.find({}).select('_id email role');
    console.log('Available users for main admin assignment:');
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user._id}) - Role: ${user.role || 'user'}`);
    });
    
    // Offer to fix the contact distribution
    console.log('\n💡 SOLUTION RECOMMENDATIONS:');
    console.log('=' .repeat(50));
    console.log('1. If you login with admin@dfgbusiness.com - you should see 1,370 contacts');
    console.log('2. If you login with a different email, we can redistribute contacts to that account');
    console.log('3. We can also update your login credentials to use the main admin account');
    
    // Show login test
    console.log('\n🔐 LOGIN CREDENTIAL TEST:');
    const testUsers = [
      { email: 'admin@dfgbusiness.com', password: 'GISpcServer2017$!' },
      { email: 'support@dfgbusiness.com', password: 'GISpcServer2017$!' },
      { email: 'vinny@vemgotech.com', password: 'GISpcServer2017$!' }
    ];
    
    for (const testUser of testUsers) {
      const user = await User.findOne({ email: testUser.email });
      if (user) {
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(testUser.password, user.password);
        const contactCount = await Contact.countDocuments({ user: user._id });
        
        console.log(`📧 ${testUser.email}:`);
        console.log(`   Password Valid: ${isValidPassword ? '✅' : '❌'}`);
        console.log(`   Contact Count: ${contactCount}`);
        console.log(`   User ID: ${user._id}`);
        console.log('');
      }
    }
    
    await mongoose.disconnect();
    console.log('🔚 Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMainUserContactAccess();