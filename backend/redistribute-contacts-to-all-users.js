const mongoose = require('mongoose');
require('dotenv').config();

async function redistributeContactsToAllUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Contact = require('./models/Contact');
    const User = require('./models/User');
    
    // Get all users
    const users = await User.find({}).select('_id email');
    console.log(`👥 Found ${users.length} users in the system`);
    
    // Get the master contact list from Vinny's account (which now has all contacts)
    const masterUserId = '68e37bea4eb7fec9ede39581'; // vkgbewonyo@gmail.com
    const masterUser = await User.findById(masterUserId);
    
    const masterContacts = await Contact.find({ user: masterUserId })
      .select('name phone email mauticId tags notes')
      .lean(); // Use lean() for better performance
    
    console.log(`\n👑 MASTER CONTACT LIST from ${masterUser.email}:`);
    console.log(`   📊 Total contacts to distribute: ${masterContacts.length}`);
    
    if (masterContacts.length === 0) {
      console.log('❌ No master contacts found to distribute');
      return;
    }
    
    let totalDistributed = 0;
    let totalSkipped = 0;
    
    // Distribute to each user
    for (const user of users) {
      if (user._id.toString() === masterUserId) {
        console.log(`\n👑 ${user.email}: Already has master contact list (${masterContacts.length} contacts)`);
        continue;
      }
      
      console.log(`\n👤 Processing ${user.email}...`);
      
      // Get current contact count for this user
      const currentCount = await Contact.countDocuments({ user: user._id });
      console.log(`   Current contacts: ${currentCount}`);
      
      // Delete existing contacts for this user to avoid duplicates
      if (currentCount > 0) {
        console.log(`   🗑️  Removing ${currentCount} existing contacts...`);
        await Contact.deleteMany({ user: user._id });
      }
      
      // Create new contacts for this user based on master list
      console.log(`   📥 Creating ${masterContacts.length} new contacts...`);
      
      const contactsToCreate = masterContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        user: user._id,
        tags: [
          ...(contact.tags || []),
          'synced-across-all-users',
          `synced-${new Date().toISOString().split('T')[0]}`
        ],
        notes: contact.notes || `Synced from master contact list`,
        mauticId: contact.mauticId,
        lastSync: new Date(),
        createdAt: new Date()
      }));
      
      try {
        // Insert in batches to handle large datasets
        const batchSize = 100;
        let inserted = 0;
        
        for (let i = 0; i < contactsToCreate.length; i += batchSize) {
          const batch = contactsToCreate.slice(i, i + batchSize);
          await Contact.insertMany(batch);
          inserted += batch.length;
          
          if (inserted % 200 === 0) {
            console.log(`     📈 Progress: ${inserted}/${contactsToCreate.length} contacts created...`);
          }
        }
        
        totalDistributed += inserted;
        console.log(`   ✅ Successfully created ${inserted} contacts`);
        
      } catch (error) {
        console.error(`   ❌ Error creating contacts for ${user.email}:`, error.message);
        totalSkipped++;
      }
    }
    
    // Verify final distribution
    console.log(`\n📊 DISTRIBUTION VERIFICATION:`);
    console.log(`=' .repeat(60)`);
    
    let allUsersHaveSameCount = true;
    const expectedCount = masterContacts.length;
    
    for (const user of users) {
      const finalCount = await Contact.countDocuments({ user: user._id });
      const mauticCount = await Contact.countDocuments({ 
        user: user._id, 
        mauticId: { $exists: true } 
      });
      
      console.log(`📧 ${user.email}:`);
      console.log(`   Total contacts: ${finalCount}`);
      console.log(`   Mautic contacts: ${mauticCount}`);
      console.log(`   Expected: ${expectedCount}`);
      
      if (finalCount !== expectedCount) {
        console.log(`   ⚠️  WARNING: Count mismatch!`);
        allUsersHaveSameCount = false;
      } else {
        console.log(`   ✅ Perfect match!`);
      }
      console.log('');
    }
    
    const totalSystemContacts = await Contact.countDocuments();
    const expectedSystemTotal = expectedCount * users.length;
    
    console.log(`\n🎯 SYSTEM SUMMARY:`);
    console.log(`   Expected per user: ${expectedCount}`);
    console.log(`   Number of users: ${users.length}`);
    console.log(`   Expected system total: ${expectedSystemTotal}`);
    console.log(`   Actual system total: ${totalSystemContacts}`);
    console.log(`   All users synchronized: ${allUsersHaveSameCount ? '✅' : '❌'}`);
    
    if (allUsersHaveSameCount) {
      console.log(`\n🎉 SUCCESS! All ${users.length} users now have identical contact lists!`);
      console.log(`\n👥 UNIVERSAL ACCESS:`);
      console.log(`   📱 Every user can access: ${expectedCount} contacts`);
      console.log(`   🔄 All Mautic contacts distributed to everyone`);
      console.log(`   ⚖️  Perfect synchronization achieved`);
    } else {
      console.log(`\n⚠️  Some users have mismatched contact counts - please review above`);
    }
    
    await mongoose.disconnect();
    console.log('🔚 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

redistributeContactsToAllUsers();