const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('./models/Contact');

async function fixDuplicateContacts() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('\n🔍 IDENTIFYING DUPLICATE CONTACTS');
        console.log('=================================');
        
        // Find contacts with duplicate phone numbers across different users
        const duplicates = await Contact.aggregate([
            {
                $group: {
                    _id: '$phone',
                    contacts: { $push: { id: '$_id', user: '$user', name: '$name' } },
                    count: { $sum: 1 }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        console.log(`📊 Found ${duplicates.length} phone numbers with duplicate contacts`);
        
        let totalContactsToDelete = 0;
        const deleteList = [];
        
        for (const duplicate of duplicates) {
            console.log(`\n📞 Phone: ${duplicate._id}`);
            console.log(`   Duplicate count: ${duplicate.count}`);
            
            // Group by user to see distribution
            const userGroups = {};
            duplicate.contacts.forEach(contact => {
                const userId = contact.user ? contact.user.toString() : 'null';
                if (!userGroups[userId]) {
                    userGroups[userId] = [];
                }
                userGroups[userId].push(contact);
            });
            
            console.log(`   Users affected: ${Object.keys(userGroups).length}`);
            
            // Strategy: Keep the oldest contact for each user, delete the rest
            // If multiple users have the same phone, keep only one (the first user's contact)
            let keepOne = false;
            
            for (const [userId, contacts] of Object.entries(userGroups)) {
                if (!keepOne) {
                    // Keep the first contact for the first user
                    console.log(`   ✅ Keeping contact for user ${userId.substring(0, 8)}...`);
                    keepOne = true;
                } else {
                    // Delete all contacts for subsequent users
                    console.log(`   🗑️  Marking ${contacts.length} contacts for deletion (user ${userId.substring(0, 8)}...)`);
                    contacts.forEach(contact => {
                        deleteList.push(contact.id);
                        totalContactsToDelete++;
                    });
                }
            }
        }
        
        console.log(`\n📊 DELETION SUMMARY:`);
        console.log(`   Contacts to delete: ${totalContactsToDelete}`);
        console.log(`   Phone numbers with conflicts: ${duplicates.length}`);
        
        if (totalContactsToDelete > 0) {
            console.log('\n🗑️  EXECUTING DELETION...');
            const deleteResult = await Contact.deleteMany({
                _id: { $in: deleteList }
            });
            
            console.log(`✅ Deleted ${deleteResult.deletedCount} duplicate contacts`);
        } else {
            console.log('✅ No duplicates to delete');
        }
        
        // Verify the fix
        console.log('\n🔍 VERIFYING FIX...');
        const remainingDuplicates = await Contact.aggregate([
            {
                $group: {
                    _id: '$phone',
                    count: { $sum: 1 }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);
        
        console.log(`📊 Remaining phone duplicates: ${remainingDuplicates.length}`);
        
        if (remainingDuplicates.length > 0) {
            console.log('❌ Still have duplicates:');
            remainingDuplicates.slice(0, 5).forEach(dup => {
                console.log(`   ${dup._id}: ${dup.count} contacts`);
            });
        } else {
            console.log('✅ All phone number duplicates resolved!');
        }
        
        // Final stats
        const totalContacts = await Contact.countDocuments();
        const userCount = await Contact.distinct('user').then(users => users.length);
        
        console.log(`\n📈 FINAL STATISTICS:`);
        console.log(`   Total contacts: ${totalContacts}`);
        console.log(`   Users with contacts: ${userCount}`);
        console.log(`   Average contacts per user: ${(totalContacts / userCount).toFixed(1)}`);
        
    } catch (error) {
        console.error('❌ Error during duplicate contact fix:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

fixDuplicateContacts();