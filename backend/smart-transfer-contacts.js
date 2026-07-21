const mongoose = require('mongoose');
require('dotenv').config();

async function smartTransferContactsToVinny() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Contact = require('./models/Contact');
    const User = require('./models/User');
    
    // Source and target user IDs
    const sourceUserId = '68f4bcc2eb61f568f2f30db6'; // admin@dfgbusiness.com
    const targetUserId = '68e37bea4eb7fec9ede39581'; // vkgbewonyo@gmail.com
    
    // Verify both users exist
    const sourceUser = await User.findById(sourceUserId);
    const targetUser = await User.findById(targetUserId);
    
    console.log(`\n👤 SOURCE USER: ${sourceUser.email} (${sourceUserId})`);
    console.log(`👤 TARGET USER: ${targetUser.email} (${targetUserId})`);
    
    // Get current contact counts
    const sourceContactCount = await Contact.countDocuments({ user: sourceUserId });
    const targetContactCount = await Contact.countDocuments({ user: targetUserId });
    
    console.log(`\n📊 BEFORE TRANSFER:`);
    console.log(`   ${sourceUser.email}: ${sourceContactCount} contacts`);
    console.log(`   ${targetUser.email}: ${targetContactCount} contacts`);
    
    // Get all contacts from source user
    const sourceContacts = await Contact.find({ user: sourceUserId });
    console.log(`\n📋 Found ${sourceContacts.length} contacts to transfer`);
    
    // Get existing phone numbers for target user
    const existingPhones = new Set();
    const existingTargetContacts = await Contact.find({ user: targetUserId }).select('phone');
    existingTargetContacts.forEach(contact => {
      if (contact.phone) {
        existingPhones.add(contact.phone);
      }
    });
    
    console.log(`📱 Target user has ${existingPhones.size} existing phone numbers`);
    
    let transferred = 0;
    let skipped = 0;
    let updated = 0;
    
    // Process each contact individually
    for (const contact of sourceContacts) {
      try {
        if (existingPhones.has(contact.phone)) {
          // Phone number already exists, update existing contact with new data
          const existingContact = await Contact.findOne({ 
            user: targetUserId, 
            phone: contact.phone 
          });
          
          if (existingContact) {
            // Merge tags and update with latest data
            const mergedTags = [...new Set([
              ...(existingContact.tags || []),
              ...(contact.tags || []),
              'merged-from-admin'
            ])];
            
            await Contact.updateOne(
              { _id: existingContact._id },
              {
                $set: {
                  name: contact.name || existingContact.name,
                  email: contact.email || existingContact.email,
                  tags: mergedTags,
                  mauticId: contact.mauticId || existingContact.mauticId,
                  lastSync: new Date(),
                  notes: `Merged from admin: ${contact.notes || ''}`
                }
              }
            );
            updated++;
          }
          
          // Delete the original contact from source
          await Contact.deleteOne({ _id: contact._id });
          skipped++;
        } else {
          // No duplicate, safe to transfer
          await Contact.updateOne(
            { _id: contact._id },
            { 
              $set: { user: targetUserId },
              $addToSet: { tags: 'transferred-from-admin' }
            }
          );
          transferred++;
        }
        
        if ((transferred + skipped + updated) % 100 === 0) {
          console.log(`   📈 Progress: ${transferred} transferred, ${updated} updated, ${skipped} duplicates handled`);
        }
        
      } catch (contactError) {
        console.error(`❌ Error processing contact ${contact._id}:`, contactError.message);
      }
    }
    
    // Verify the transfer
    const newSourceCount = await Contact.countDocuments({ user: sourceUserId });
    const newTargetCount = await Contact.countDocuments({ user: targetUserId });
    
    console.log(`\n✅ TRANSFER COMPLETE!`);
    console.log(`   📊 ${transferred} contacts transferred`);
    console.log(`   🔄 ${updated} contacts updated/merged`);
    console.log(`   ⏭️  ${skipped} duplicates handled`);
    
    console.log(`\n📊 AFTER TRANSFER:`);
    console.log(`   ${sourceUser.email}: ${newSourceCount} contacts`);
    console.log(`   ${targetUser.email}: ${newTargetCount} contacts`);
    
    // Show breakdown of contacts for vinny
    const vinnyMauticContacts = await Contact.countDocuments({ 
      user: targetUserId, 
      mauticId: { $exists: true } 
    });
    
    const vinnyTransferredContacts = await Contact.countDocuments({ 
      user: targetUserId, 
      tags: 'transferred-from-admin' 
    });
    
    console.log(`\n📋 CONTACT BREAKDOWN FOR ${targetUser.email}:`);
    console.log(`   From Mautic sync: ${vinnyMauticContacts}`);
    console.log(`   Transferred from admin: ${vinnyTransferredContacts}`);
    console.log(`   Total contacts: ${newTargetCount}`);
    
    // Verify login credentials
    console.log(`\n🔐 LOGIN VERIFICATION:`);
    const bcrypt = require('bcryptjs');
    const testPassword = 'BIDOpc2017$!';
    const isValidPassword = await bcrypt.compare(testPassword, targetUser.password);
    
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Password Valid: ${isValidPassword ? '✅' : '❌'}`);
    console.log(`   Contact Count: ${newTargetCount}`);
    
    if (!isValidPassword) {
      console.log(`\n🔧 UPDATING PASSWORD...`);
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await User.updateOne(
        { _id: targetUserId },
        { password: hashedPassword }
      );
      console.log(`✅ Password updated for ${targetUser.email}`);
    }
    
    console.log(`\n🎉 SUCCESS! You now have access to all contacts!`);
    console.log(`\nLogin with:`);
    console.log(`   📧 Email: vkgbewonyo@gmail.com`);
    console.log(`   🔑 Password: BIDOpc2017$!`);
    console.log(`   📱 Expected Contacts: ${newTargetCount}`);
    
    await mongoose.disconnect();
    console.log('🔚 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

smartTransferContactsToVinny();