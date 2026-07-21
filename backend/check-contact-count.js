const mongoose = require('mongoose');
require('dotenv').config();

async function checkContactCount() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Contact = require('./models/Contact');
    
    const totalCount = await Contact.countDocuments();
    console.log(`📊 Current total contacts: ${totalCount}`);
    
    const byUser = await Contact.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n👥 Contacts by user:');
    byUser.forEach(user => {
      console.log(`   User ${user._id}: ${user.count} contacts`);
    });
    
    // Check for recent contacts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await Contact.countDocuments({
      createdAt: { $gte: today }
    });
    
    console.log(`\n📅 Contacts added today: ${todayCount}`);
    
    await mongoose.disconnect();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkContactCount();