const mongoose = require('mongoose');
require('dotenv').config();

async function fixNullUserContacts() {
  try {
    console.log('🔧 Fixing contacts with user: null...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const Contact = require('./models/Contact');
    
    // Get all contacts with user: null
    const nullUserContacts = await Contact.find({ user: null });
    console.log(`📊 Found ${nullUserContacts.length} contacts with user: null\n`);

    // From the error logs, we know the correct user ID is: 68f4bcc2eb61f568f2f30db6
    const correctUserId = '68f4bcc2eb61f568f2f30db6';
    console.log(`🎯 Using user ID: ${correctUserId} for fixing null user contacts\n`);

    // Check for potential conflicts before updating
    console.log('🔍 Checking for potential phone number conflicts...');
    const phoneNumbers = nullUserContacts.map(contact => contact.phone);
    const existingContacts = await Contact.find({
      user: correctUserId,
      phone: { $in: phoneNumbers }
    });

    console.log(`⚠️ Found ${existingContacts.length} existing contacts with same user and phone numbers`);
    
    if (existingContacts.length > 0) {
      console.log('📋 Conflicts found for phones:', existingContacts.slice(0, 5).map(c => c.phone));
      console.log('\n🛠️ Resolution: Removing null-user contacts that conflict with existing user contacts...');

      // Delete null-user contacts that conflict with existing user contacts
      const conflictingPhones = existingContacts.map(c => c.phone);
      const deleteResult = await Contact.deleteMany({
        user: null,
        phone: { $in: conflictingPhones }
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} conflicting null-user contacts`);
      
      // Get remaining null-user contacts
      const remainingNullContacts = await Contact.find({ user: null });
      console.log(`📊 Remaining null-user contacts: ${remainingNullContacts.length}`);
      
      if (remainingNullContacts.length > 0) {
        // Update remaining null-user contacts
        const updateResult = await Contact.updateMany(
          { user: null },
          { $set: { user: correctUserId } }
        );
        
        console.log(`✅ Updated ${updateResult.modifiedCount} remaining contacts to user: ${correctUserId}`);
      }
    } else {
      // No conflicts, just update all null-user contacts
      console.log('✅ No conflicts found. Updating all null-user contacts...');
      
      const updateResult = await Contact.updateMany(
        { user: null },
        { $set: { user: correctUserId } }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} contacts to user: ${correctUserId}`);
    }

    // Final verification
    const finalNullCount = await Contact.countDocuments({ user: null });
    const finalTotalCount = await Contact.countDocuments();
    const userContacts = await Contact.countDocuments({ user: correctUserId });
    
    console.log(`\n📊 Final Status:`);
    console.log(`   Contacts with user: null: ${finalNullCount}`);
    console.log(`   Total contacts: ${finalTotalCount}`);
    console.log(`   Contacts for user ${correctUserId}: ${userContacts}`);

    console.log('\n🎉 Contact user assignment fix completed!');
    console.log('📝 You can now retry the Mautic sync - it should work without duplicate key errors.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 MongoDB disconnected');
  }
}

// Run the fix
fixNullUserContacts().catch(console.error);