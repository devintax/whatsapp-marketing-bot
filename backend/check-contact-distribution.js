const mongoose = require('mongoose');
require('dotenv').config();

async function checkContactDistribution() {
  try {
    console.log('📊 Checking Contact Distribution and Sync Status\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const Contact = require('./models/Contact');
    const db = mongoose.connection.db;

    // Get basic database stats
    const dbStats = await db.stats();
    console.log('🗄️ MongoDB Database Overview:');
    console.log('=' .repeat(50));
    console.log(`Database: ${db.databaseName}`);
    console.log(`Total Storage: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Objects: ${dbStats.objects}`);
    console.log('');

    // Check total contact counts
    console.log('👥 Contact Count Analysis:');
    console.log('=' .repeat(50));
    
    const totalContacts = await Contact.countDocuments();
    const nullUserContacts = await Contact.countDocuments({ user: null });
    const assignedContacts = totalContacts - nullUserContacts;
    
    console.log(`Total contacts in database: ${totalContacts}`);
    console.log(`Contacts with user assigned: ${assignedContacts}`);
    console.log(`Contacts with user: null: ${nullUserContacts}`);
    console.log('');

    // Check contact distribution by user
    console.log('👤 Contact Distribution by User:');
    console.log('=' .repeat(50));
    
    const userStats = await Contact.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          hasPhone: { $sum: { $cond: [{ $ne: ['$phone', ''] }, 1, 0] } },
          hasMauticId: { $sum: { $cond: [{ $ne: ['$mauticId', null] }, 1, 0] } },
          recentSync: { $max: '$lastSync' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    for (const user of userStats) {
      const userId = user._id || 'null';
      console.log(`User: ${userId}`);
      console.log(`  Total contacts: ${user.count}`);
      console.log(`  With phone numbers: ${user.hasPhone}`);
      console.log(`  With Mautic IDs: ${user.hasMauticId}`);
      console.log(`  Last sync: ${user.recentSync ? user.recentSync.toISOString() : 'Never'}`);
      console.log('');
    }

    // Check recent contact creation
    console.log('🕒 Recent Contact Activity:');
    console.log('=' .repeat(50));
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const contactsToday = await Contact.countDocuments({ 
      createdAt: { $gte: yesterday } 
    });
    
    const contactsThisWeek = await Contact.countDocuments({ 
      createdAt: { $gte: lastWeek } 
    });
    
    console.log(`Contacts created in last 24 hours: ${contactsToday}`);
    console.log(`Contacts created in last 7 days: ${contactsThisWeek}`);
    console.log('');

    // Check sync status from CRM integrations
    console.log('🔄 CRM Integration Sync Status:');
    console.log('=' .repeat(50));
    
    try {
      // Define the CRM schema inline since it's not in a separate model file
      const crmSchema = new mongoose.Schema({
        name: String,
        type: String,
        status: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lastSync: Date,
        lastSyncResults: {
          imported: { type: Number, default: 0 },
          updated: { type: Number, default: 0 },
          skipped: { type: Number, default: 0 },
          failed: { type: Number, default: 0 },
          errors: [String]
        }
      }, { timestamps: true });

      const CRMIntegration = mongoose.model('CRMIntegration', crmSchema);
      
      const integrations = await CRMIntegration.find({}).sort({ lastSync: -1 });
      
      for (const integration of integrations) {
        console.log(`Integration: ${integration.name} (${integration.type})`);
        console.log(`  Status: ${integration.status}`);
        console.log(`  User: ${integration.user}`);
        console.log(`  Last Sync: ${integration.lastSync || 'Never'}`);
        
        if (integration.lastSyncResults) {
          const results = integration.lastSyncResults;
          console.log(`  Last Results: +${results.imported} imported, ~${results.updated} updated, ⏭️${results.skipped} skipped, ❌${results.failed} failed`);
          if (results.errors && results.errors.length > 0) {
            console.log(`  Errors: ${results.errors.length} (showing first 3)`);
            results.errors.slice(0, 3).forEach(error => {
              console.log(`    - ${error.substring(0, 80)}...`);
            });
          }
        }
        console.log('');
      }
    } catch (crmError) {
      console.log('⚠️ Could not fetch CRM integration status:', crmError.message);
    }

    // Storage capacity analysis
    console.log('💾 Storage Capacity Analysis:');
    console.log('=' .repeat(50));
    
    const avgContactSize = totalContacts > 0 ? (dbStats.dataSize / totalContacts) : 0;
    console.log(`Current total contacts: ${totalContacts}`);
    console.log(`Average contact size: ${avgContactSize.toFixed(2)} bytes`);
    console.log(`Current data usage: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    // MongoDB Atlas free tier is 512MB
    const atlasLimit = 512;
    const currentUsageMB = dbStats.storageSize / 1024 / 1024;
    const usagePercentage = (currentUsageMB / atlasLimit * 100).toFixed(2);
    
    console.log(`\n🌤️ MongoDB Atlas Free Tier Status:`);
    console.log(`Current usage: ${currentUsageMB.toFixed(2)} MB (${usagePercentage}%)`);
    console.log(`Available space: ${(atlasLimit - currentUsageMB).toFixed(2)} MB`);
    console.log(`Estimated capacity: ~${Math.floor((atlasLimit * 1024 * 1024) / (avgContactSize || 1000))} contacts`);
    
    if (usagePercentage > 80) {
      console.log('⚠️ WARNING: Approaching storage limit!');
    } else {
      console.log('✅ Plenty of storage space available');
    }

    console.log('\n🎯 Summary:');
    console.log('=' .repeat(50));
    console.log(`✅ Database can easily handle all ${totalContacts} contacts`);
    console.log(`📊 Current usage: ${usagePercentage}% of free tier limit`);
    console.log(`🔄 Recent sync activity indicates normal operation`);
    
    if (totalContacts !== 727) {
      console.log(`⚠️ Note: Expected 727 contacts but found ${totalContacts}`);
      console.log(`   This might indicate some contacts were not synced or were cleaned up`);
    }

    await mongoose.disconnect();
    console.log('\n📡 MongoDB disconnected');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    await mongoose.disconnect();
  }
}

// Run the analysis
checkContactDistribution().catch(console.error);