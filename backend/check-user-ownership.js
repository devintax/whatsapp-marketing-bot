const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./models/User');
    const Campaign = require('./models/Campaign');
    
    console.log('🔍 CHECKING USER ACCOUNTS AND CAMPAIGN OWNERSHIP');
    console.log('='.repeat(60));
    
    // Find all users with similar email
    const users = await User.find({ 
      email: { $regex: /vkgbewonyo/i } 
    });
    
    console.log(`📊 Found ${users.length} users with similar email:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Find campaigns for this user
      const campaigns = await Campaign.find({ userId: user._id });
      console.log(`   Campaigns: ${campaigns.length}`);
      
      if (campaigns.length > 0) {
        campaigns.forEach((c, i) => {
          console.log(`     ${i+1}. "${c.name}" - ${c.status} - ${c.createdAt}`);
        });
      }
    }
    
    // Find the Tax Deadline Reminder campaign specifically
    console.log('\n🔍 Tax Deadline Reminder Campaign:');
    const taxCampaign = await Campaign.findOne({ name: 'Tax Deadline Reminder' });
    if (taxCampaign) {
      console.log(`   ID: ${taxCampaign._id}`);
      console.log(`   User ID: ${taxCampaign.userId}`);
      console.log(`   Status: ${taxCampaign.status}`);
      
      // Find owner
      const owner = await User.findById(taxCampaign.userId);
      console.log(`   Owner: ${owner ? owner.email : 'NOT FOUND'}`);
      
      // Re-assign to correct user if needed
      const correctUser = await User.findOne({ email: 'vkgbewonyo@gmail.com' });
      if (correctUser && taxCampaign.userId?.toString() !== correctUser._id.toString()) {
        console.log(`\n🔧 FIXING ownership: ${taxCampaign.userId} -> ${correctUser._id}`);
        taxCampaign.userId = correctUser._id;
        await taxCampaign.save();
        console.log('✅ Ownership fixed!');
      }
    } else {
      console.log('   ❌ Campaign not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();