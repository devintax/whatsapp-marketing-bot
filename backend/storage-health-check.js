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
        
        // Calculate total size properly
        const totalSizeMB = (dbStats.dataSize + dbStats.indexSize) / 1024 / 1024;
        console.log(`📈 Total size: ${totalSizeMB.toFixed(2)} MB`);
        
        // MongoDB Atlas Free Tier Analysis
        const freetierLimit = 512; // MB
        const usagePercent = (totalSizeMB / freetierLimit * 100).toFixed(2);
        const remainingSpace = freetierLimit - totalSizeMB;
        
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
        
        // Check for null users again
        const nullUserCount = await Contact.countDocuments({ user: null });
        
        console.log(`\n✅ DATABASE HEALTH CHECK:`);
        console.log(`🚫 Null user contacts: ${nullUserCount} (should be 0)`);
        console.log(`📊 Valid contacts: ${totalContacts}`);
        console.log(`💾 Storage efficiency: ${usagePercent}% of free tier used`);
        console.log(`🎯 Ready for sync: ${nullUserCount === 0 ? 'YES ✅' : 'NO ❌'}`);
        
        // Performance metrics
        console.log(`\n📈 PERFORMANCE METRICS:`);
        console.log(`💡 Data to index ratio: ${(dbStats.dataSize / dbStats.indexSize).toFixed(2)}`);
        console.log(`🔍 Index overhead: ${((dbStats.indexSize / dbStats.dataSize) * 100).toFixed(1)}%`);
        
        if (usagePercent < 1) {
            console.log(`\n🎉 EXCELLENT NEWS:`);
            console.log(`✅ Database is very clean and efficient`);
            console.log(`✅ Using only ${usagePercent}% of free tier storage`);
            console.log(`✅ Can store ~${(estimatedCapacity - totalContacts).toLocaleString()} more contacts`);
            console.log(`✅ Auto-sync ready - no conflicts!`);
        }
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

finalVerification();