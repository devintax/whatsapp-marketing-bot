const mongoose = require('mongoose');
require('dotenv').config();

async function investigateContactDistribution() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Contact = require('./models/Contact');
    const User = require('./models/User');
    
    // Get all users with their email addresses
    const users = await User.find({}).select('_id email');
    console.log(`👥 Found ${users.length} users in the system\n`);
    
    // Check contact distribution with user details
    console.log('📊 Detailed Contact Distribution:');
    console.log('=' .repeat(60));
    
    for (const user of users) {
      const contactCount = await Contact.countDocuments({ user: user._id });
      const todayCount = await Contact.countDocuments({ 
        user: user._id,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      });
      
      console.log(`📧 ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Total contacts: ${contactCount}`);
      console.log(`   Added today: ${todayCount}`);
      console.log(`   Expected: ~745-1370 contacts`);
      
      if (contactCount < 740) {
        console.log(`   ⚠️  ISSUE: Contact count is unexpectedly low!`);
      }
      console.log('');
    }
    
    // Check for contacts with null user
    const nullUserContacts = await Contact.countDocuments({ user: null });
    console.log(`❓ Contacts with null user: ${nullUserContacts}`);
    
    // Check the main admin user specifically
    const mainAdminId = '68f4bcc2eb61f568f2f30db6';
    const mainAdminUser = users.find(u => u._id.toString() === mainAdminId);
    if (mainAdminUser) {
      console.log(`\n👑 MAIN ADMIN USER ANALYSIS:`);
      console.log(`Email: ${mainAdminUser.email}`);
      
      const mainAdminContacts = await Contact.find({ user: mainAdminId })
        .select('name phone mauticId createdAt tags')
        .sort({ createdAt: -1 })
        .limit(10);
        
      console.log(`Recent contacts (latest 10):`);
      mainAdminContacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name} - ${contact.phone} - Created: ${contact.createdAt.toISOString().split('T')[0]} - Tags: ${contact.tags?.join(', ') || 'none'}`);
      });
    }
    
    // Check for any potential issues with the distribution
    const mauticSyncContacts = await Contact.countDocuments({
      tags: { $in: ['mautic-comprehensive-sync', 'distributed-sync'] }
    });
    console.log(`\n🔍 Contacts with Mautic sync tags: ${mauticSyncContacts}`);
    
    const totalContacts = await Contact.countDocuments();
    console.log(`\n📊 TOTAL SYSTEM CONTACTS: ${totalContacts}`);
    
    await mongoose.disconnect();
    console.log('🔚 Investigation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

investigateContactDistribution();