const mongoose = require('mongoose');
require('dotenv').config();

async function transferContactsToVinnyAccount() {
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
    
    if (!sourceUser || !targetUser) {
      console.error('❌ Could not find source or target user');
      return;
    }
    
    console.log(`\n👤 SOURCE USER: ${sourceUser.email} (${sourceUserId})`);
    console.log(`👤 TARGET USER: ${targetUser.email} (${targetUserId})`);
    
    // Get current contact counts
    const sourceContactCount = await Contact.countDocuments({ user: sourceUserId });
    const targetContactCount = await Contact.countDocuments({ user: targetUserId });
    
    console.log(`\n📊 BEFORE TRANSFER:`);
    console.log(`   ${sourceUser.email}: ${sourceContactCount} contacts`);
    console.log(`   ${targetUser.email}: ${targetContactCount} contacts`);
    
    // First, let's backup the target user's existing contacts by tagging them
    console.log(`\n📋 Tagging existing contacts for ${targetUser.email}...`);
    await Contact.updateMany(
      { user: targetUserId },
      { 
        $addToSet: { 
          tags: 'vinny-original-contacts' 
        }
      }
    );
    
    // Now transfer ALL contacts from admin to vinny
    console.log(`\n🔄 Transferring ALL contacts from ${sourceUser.email} to ${targetUser.email}...`);
    
    const transferResult = await Contact.updateMany(
      { user: sourceUserId },
      { 
        $set: { 
          user: targetUserId 
        },
        $addToSet: { 
          tags: 'transferred-from-admin' 
        }
      }
    );
    
    console.log(`✅ Transfer completed: ${transferResult.modifiedCount} contacts transferred`);
    
    // Verify the transfer
    const newSourceCount = await Contact.countDocuments({ user: sourceUserId });
    const newTargetCount = await Contact.countDocuments({ user: targetUserId });
    
    console.log(`\n📊 AFTER TRANSFER:`);
    console.log(`   ${sourceUser.email}: ${newSourceCount} contacts`);
    console.log(`   ${targetUser.email}: ${newTargetCount} contacts`);
    
    // Show breakdown of contacts for vinny
    const vinnyOriginalContacts = await Contact.countDocuments({ 
      user: targetUserId, 
      tags: 'vinny-original-contacts' 
    });
    
    const vinnyTransferredContacts = await Contact.countDocuments({ 
      user: targetUserId, 
      tags: 'transferred-from-admin' 
    });
    
    const vinnyMauticContacts = await Contact.countDocuments({ 
      user: targetUserId, 
      mauticId: { $exists: true } 
    });
    
    console.log(`\n📋 CONTACT BREAKDOWN FOR ${targetUser.email}:`);
    console.log(`   Original contacts: ${vinnyOriginalContacts}`);
    console.log(`   Transferred from admin: ${vinnyTransferredContacts}`);
    console.log(`   From Mautic sync: ${vinnyMauticContacts}`);
    console.log(`   Total contacts: ${newTargetCount}`);
    
    // Test login credentials
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
    
    console.log(`\n🎉 TRANSFER COMPLETE!`);
    console.log(`\nYou can now login with:`);
    console.log(`   Email: vkgbewonyo@gmail.com`);
    console.log(`   Password: BIDOpc2017$!`);
    console.log(`   Expected Contacts: ${newTargetCount}`);
    
    await mongoose.disconnect();
    console.log('🔚 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

transferContactsToVinnyAccount();