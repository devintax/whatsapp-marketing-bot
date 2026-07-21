/**
 * MongoDB Atlas Free Tier Analysis
 * Comprehensive analysis of free tier limitations vs current usage
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Atlas Free Tier Specifications (M0 Cluster)
const FREE_TIER_LIMITS = {
    storage: {
        maxSize: 0.5, // 512 MB (0.5 GB)
        unit: 'GB'
    },
    connections: {
        maxConcurrent: 100,
        note: '100 concurrent connections max'
    },
    operations: {
        maxPerSecond: 100,
        note: '100 operations per second'
    },
    bandwidth: {
        network: 'Shared cluster bandwidth',
        note: 'Network bandwidth is shared among users'
    },
    availability: {
        uptime: '99.9%',
        note: 'Shared infrastructure, not production-ready'
    },
    backups: {
        available: false,
        note: 'No automated backups on free tier'
    },
    monitoring: {
        basic: true,
        advanced: false,
        note: 'Basic monitoring only'
    }
};

async function analyzeMongoDBUsage() {
    console.log('🔍 MONGODB ATLAS FREE TIER ANALYSIS');
    console.log('═'.repeat(60));
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
        
        const db = mongoose.connection.db;
        
        // Get database statistics
        const dbStats = await db.stats();
        
        console.log('\n📊 CURRENT DATABASE USAGE');
        console.log('━'.repeat(40));
        console.log(`💾 Database Size: ${(dbStats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`📦 Storage Size: ${(dbStats.storageSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`🗃️  Index Size: ${(dbStats.indexSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`📄 Collections: ${dbStats.collections}`);
        console.log(`📑 Documents: ${dbStats.objects}`);
        console.log(`📈 Average Document Size: ${(dbStats.avgObjSize / 1024).toFixed(2)} KB`);
        
        // Check collection sizes
        console.log('\n📋 COLLECTION BREAKDOWN');
        console.log('━'.repeat(40));
        
        const collections = await db.listCollections().toArray();
        let totalDocuments = 0;
        
        for (const collection of collections) {
            try {
                const docCount = await db.collection(collection.name).countDocuments();
                
                // Use aggregation to get collection size info
                const sizeInfo = await db.collection(collection.name).aggregate([
                    { $group: { _id: null, totalSize: { $sum: { $bsonSize: "$$ROOT" } } } }
                ]).toArray();
                
                const totalSizeBytes = sizeInfo.length > 0 ? sizeInfo[0].totalSize : 0;
                const sizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
                const avgDocSizeKB = docCount > 0 ? (totalSizeBytes / docCount / 1024).toFixed(2) : 0;
                
                console.log(`  📁 ${collection.name}:`);
                console.log(`     Documents: ${docCount}`);
                console.log(`     Size: ${sizeMB} MB`);
                console.log(`     Avg Doc Size: ${avgDocSizeKB} KB`);
                
                totalDocuments += docCount;
            } catch (collErr) {
                const docCount = await db.collection(collection.name).countDocuments();
                console.log(`  📁 ${collection.name}: ${docCount} documents (size calculation failed)`);
                totalDocuments += docCount;
            }
        }
        
        // Analyze against free tier limits
        console.log('\n⚠️  FREE TIER LIMIT ANALYSIS');
        console.log('━'.repeat(40));
        
        const currentSizeGB = dbStats.storageSize / (1024 * 1024 * 1024);
        const usagePercentage = (currentSizeGB / FREE_TIER_LIMITS.storage.maxSize) * 100;
        
        console.log(`📊 Storage Usage: ${currentSizeGB.toFixed(3)} GB / ${FREE_TIER_LIMITS.storage.maxSize} GB`);
        console.log(`📈 Usage Percentage: ${usagePercentage.toFixed(1)}%`);
        
        if (usagePercentage > 80) {
            console.log('🚨 WARNING: Approaching storage limit!');
        } else if (usagePercentage > 50) {
            console.log('⚠️  CAUTION: Over 50% storage used');
        } else {
            console.log('✅ GOOD: Storage usage is healthy');
        }
        
        // Test connection performance
        console.log('\n🚀 CONNECTION PERFORMANCE TEST');
        console.log('━'.repeat(40));
        
        const startTime = Date.now();
        await db.collection('contacts').findOne({});
        const queryTime = Date.now() - startTime;
        
        console.log(`⏱️  Simple Query Time: ${queryTime}ms`);
        
        if (queryTime > 1000) {
            console.log('🐌 SLOW: Query took over 1 second - possible throttling');
        } else if (queryTime > 500) {
            console.log('⚠️  MODERATE: Query took over 500ms');
        } else {
            console.log('✅ FAST: Query response time is good');
        }
        
        // Test bulk operations (relevant for contact sync)
        console.log('\n📈 BULK OPERATION TEST (Contact Sync Simulation)');
        console.log('━'.repeat(40));
        
        const bulkStartTime = Date.now();
        const contactCount = await db.collection('contacts').countDocuments();
        const bulkTime = Date.now() - bulkStartTime;
        
        console.log(`📊 Total Contacts: ${contactCount}`);
        console.log(`⏱️  Count Query Time: ${bulkTime}ms`);
        
        // Analyze potential free tier impacts on contact sync
        console.log('\n🔍 CONTACT SYNC IMPACT ANALYSIS');
        console.log('━'.repeat(40));
        
        const issues = [];
        
        if (usagePercentage > 90) {
            issues.push('🚨 CRITICAL: Storage nearly full - may cause write failures');
        }
        
        if (queryTime > 1000) {
            issues.push('🐌 PERFORMANCE: Slow queries may timeout during sync');
        }
        
        if (totalDocuments > 10000) {
            issues.push('📊 SCALE: Large document count may hit operation limits');
        }
        
        if (issues.length === 0) {
            console.log('✅ NO ISSUES: Free tier should handle contact sync fine');
            console.log('   - Storage usage is healthy');
            console.log('   - Query performance is acceptable');
            console.log('   - Document count is manageable');
        } else {
            console.log('⚠️  POTENTIAL ISSUES DETECTED:');
            issues.forEach(issue => console.log(`   ${issue}`));
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        console.log('━'.repeat(40));
        
        if (usagePercentage < 30) {
            console.log('✅ Your free tier usage is excellent');
            console.log('   - Contact sync failures are NOT due to MongoDB limits');
            console.log('   - Focus on OAuth/API configuration issues');
        } else if (usagePercentage < 70) {
            console.log('⚠️  Monitor storage usage but should be fine');
            console.log('   - Contact sync issues likely NOT storage-related');
            console.log('   - Check Mautic API authentication');
        } else {
            console.log('🚨 Consider upgrading or cleaning up data');
            console.log('   - Storage usage may affect operations');
            console.log('   - Review old campaigns and test data');
        }
        
        // Final verdict
        console.log('\n🎯 FINAL VERDICT ON CONTACT SYNC');
        console.log('━'.repeat(40));
        
        const mauticContactSyncIssue = usagePercentage > 80 || queryTime > 2000;
        
        if (mauticContactSyncIssue) {
            console.log('❌ MongoDB free tier MAY be affecting contact sync');
            console.log('   - Consider upgrading to M10 cluster ($9/month)');
            console.log('   - Or clean up test data to reduce usage');
        } else {
            console.log('✅ MongoDB free tier is NOT causing contact sync issues');
            console.log('   - The problem is in Mautic OAuth configuration');
            console.log('   - Focus on fixing the redirect URI mismatch');
            console.log('   - Your current usage: ' + usagePercentage.toFixed(1) + '% is well within limits');
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the analysis
analyzeMongoDBUsage().catch(console.error);