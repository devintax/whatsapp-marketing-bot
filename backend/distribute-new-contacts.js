const mongoose = require('mongoose');
require('dotenv').config();

async function distributeNewContactsToAllUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Contact = require('./models/Contact');
    const User = require('./models/User');
    
    // Get all users
    const users = await User.find({}).select('_id email');
    console.log(`👥 Found ${users.length} users in the system`);
    
    // Get contacts that were just added (today's sync)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newContacts = await Contact.find({
      createdAt: { $gte: today },
      user: '68f4bcc2eb61f568f2f30db6' // Main admin user who got all the new contacts
    }).sort({ _id: 1 });
    
    console.log(`📊 Found ${newContacts.length} new contacts to distribute`);
    
    if (newContacts.length === 0) {
      console.log('❌ No new contacts found to distribute');
      return;
    }
    
    if (users.length === 0) {
      console.log('❌ No users found in the system');
      return;
    }
    
    // Calculate distribution
    const contactsPerUser = Math.floor(newContacts.length / users.length);
    const remainder = newContacts.length % users.length;
    
    console.log(`📈 Distribution plan:`);
    console.log(`   - ${contactsPerUser} contacts per user`);
    console.log(`   - ${remainder} extra contacts for first ${remainder} users`);
    
    let contactIndex = 0;
    let totalDistributed = 0;
    
    // Distribute contacts to each user
    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      const user = users[userIndex];
      const isMainAdminUser = user._id.toString() === '68f4bcc2eb61f568f2f30db6';
      
      // Calculate how many contacts this user should get
      let contactsForThisUser = contactsPerUser;
      if (userIndex < remainder) {
        contactsForThisUser += 1; // Give extra contact to first few users
      }
      
      // If this is the main admin user, they already have all the contacts, so skip
      if (isMainAdminUser) {
        console.log(`👑 User ${user.email} (main admin): Already has ${newContacts.length} new contacts`);
        continue;
      }
      
      console.log(`\n👤 Processing user ${user.email} (${user._id})`);
      console.log(`   📋 Will receive ${contactsForThisUser} contacts`);
      
      // Create contacts for this user
      const contactsToCreate = [];
      
      for (let i = 0; i < contactsForThisUser && contactIndex < newContacts.length; i++) {
        const originalContact = newContacts[contactIndex];
        
        // Create a copy of the contact for this user
        const newContactData = {
          name: originalContact.name,
          phone: originalContact.phone,
          email: originalContact.email,
          user: user._id,
          tags: [...(originalContact.tags || []), 'distributed-sync'],
          notes: `Distributed from Mautic sync - Original ID: ${originalContact.mauticId}`,
          mauticId: originalContact.mauticId,
          lastSync: new Date(),
          createdAt: new Date()
        };
        
        contactsToCreate.push(newContactData);
        contactIndex++;
      }
      
      if (contactsToCreate.length > 0) {
        try {
          await Contact.insertMany(contactsToCreate);
          totalDistributed += contactsToCreate.length;
          console.log(`   ✅ Successfully created ${contactsToCreate.length} contacts`);
        } catch (error) {
          console.error(`   ❌ Error creating contacts for user ${user.email}:`, error.message);
        }
      }
    }
    
    // Verify final distribution
    console.log(`\n📊 Distribution Summary:`);
    console.log(`   - Total new contacts distributed: ${totalDistributed}`);
    console.log(`   - Original admin user contacts: ${newContacts.length}`);
    
    // Show final contact counts for all users
    const finalCounts = await Contact.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`\n👥 Final contact distribution:`);
    for (const userCount of finalCounts) {
      const user = users.find(u => u._id.toString() === userCount._id?.toString());
      const userEmail = user ? user.email : 'Unknown';
      console.log(`   ${userEmail}: ${userCount.count} contacts`);
    }
    
    const totalSystemContacts = await Contact.countDocuments();
    console.log(`\n🎯 Total system contacts: ${totalSystemContacts}`);
    
    await mongoose.disconnect();
    console.log('🔚 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

distributeNewContactsToAllUsers();