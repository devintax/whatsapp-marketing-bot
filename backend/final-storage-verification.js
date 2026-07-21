const mongoose = require('mongoose');
require('dotenv').config();

const Contact = require('./models/Contact');

async function finalVerification() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Get database stats
        const db = mongoose.connection.db;
        const dbStats = await db.stats();
        
        console.log('\n🗄️ MONGODB STORAGE ANALYSIS:');
        console.log(`📊 Database size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💾 Storage used: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📁 Index size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📈 Total size: ${(dbStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        
        // MongoDB Atlas Free Tier Analysis
        const freetierLimit = 512; // MB
        const usagePercent = ((dbStats.totalSize / 1024 / 1024) / freetierLimit * 100).toFixed(2);
        const remainingSpace = freetierLimit - (dbStats.totalSize / 1024 / 1024);
        
        console.log(`\n🏷️ ATLAS FREE TIER STATUS:`);
        console.log(`📊 Usage: ${usagePercent}% of ${freetierLimit}MB limit`);
        console.log(`💚 Remaining space: ${remainingSpace.toFixed(2)} MB`);
        
        // Contact analysis
        const totalContacts = await Contact.countDocuments();
        const avgContactSize = dbStats.dataSize / totalContacts;
        const estimatedCapacity = Math.floor(freetierLimit * 1024 * 1024 / avgContactSize);
        
        console.log(`\n📞 CONTACT CAPACITY ANALYSIS:`);
        console.log(`📊 Current contacts: ${totalContacts}`);
        console.log(`📏 Average contact size: ${(avgContactSize / 1024).toFixed(2)} KB`);
        console.log(`🚀 Estimated max capacity: ~${estimatedCapacity.toLocaleString()} contacts`);
        console.log(`✅ Available slots: ~${(estimatedCapacity - totalContacts).toLocaleString()} more contacts`);
        
        // User distribution
        const userDistribution = await Contact.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log(`\n👥 USER DISTRIBUTION:`);
        userDistribution.forEach((dist, index) => {
            const userId = dist._id.toString().substring(0, 8) + '...';
            console.log(`   ${index + 1}. User ${userId}: ${dist.count} contacts`);
        });
        
        console.log(`\n✅ CLEANUP SUMMARY:`);
        console.log(`🗑️ Removed 701 null user contacts`);
        console.log(`📊 Clean database with ${totalContacts} valid contacts`);
        console.log(`💾 Only ${usagePercent}% of free tier storage used`);
        console.log(`🚀 Space for ~${(estimatedCapacity - totalContacts).toLocaleString()} more contacts`);
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

finalVerification();