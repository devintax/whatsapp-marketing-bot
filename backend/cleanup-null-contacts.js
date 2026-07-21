const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('./models/Contact');

async function cleanupNullContacts() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('📊 Checking current state...');
        const totalBefore = await Contact.countDocuments();
        const nullUsersBefore = await Contact.countDocuments({ user: null });
        
        console.log(`📈 Total contacts before cleanup: ${totalBefore}`);
        console.log(`🚫 Null user contacts before cleanup: ${nullUsersBefore}`);
        
        if (nullUsersBefore === 0) {
            console.log('✅ No null user contacts found. Database is clean!');
            return;
        }
        
        console.log('🗑️ Removing contacts with user: null...');
        const deleteResult = await Contact.deleteMany({ user: null });
        
        console.log(`✅ Deleted ${deleteResult.deletedCount} null user contacts`);
        
        const totalAfter = await Contact.countDocuments();
        const nullUsersAfter = await Contact.countDocuments({ user: null });
        
        console.log(`📊 Total contacts after cleanup: ${totalAfter}`);
        console.log(`🚫 Remaining null user contacts: ${nullUsersAfter}`);
        console.log(`📉 Contacts removed: ${totalBefore - totalAfter}`);
        
        // Show distribution by user
        const userDistribution = await Contact.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\n📊 Contact distribution by user:');
        userDistribution.forEach(dist => {
            const userId = dist._id ? dist._id.toString() : 'null';
            console.log(`   User ${userId}: ${dist.count} contacts`);
        });
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

cleanupNullContacts();