const mongoose = require('mongoose');
require('dotenv').config();

async function checkMongoDBStatus() {
  try {
    console.log('📊 Checking MongoDB Storage and Contact Status\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Get database statistics
    const db = mongoose.connection.db;
    const dbStats = await db.stats();
    const Contact = require('./models/Contact');

    console.log('🗄️ MongoDB Database Statistics:');
    console.log('=' .repeat(50));
    console.log(`Database: ${db.databaseName}`);
    console.log(`Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Collections: ${dbStats.collections}`);
    console.log(`Objects: ${dbStats.objects}`);
    console.log(`Average Object Size: ${(dbStats.avgObjSize / 1024).toFixed(2)} KB`);
    console.log('');

    // Get collection statistics for contacts
    const contactStats = await db.collection('contacts').stats();
    console.log('👥 Contacts Collection Statistics:');
    console.log('=' .repeat(50));
    console.log(`Total Documents: ${contactStats.count}`);
    console.log(`Storage Size: ${(contactStats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`Data Size: ${(contactStats.size / 1024).toFixed(2)} KB`);
    console.log(`Average Document Size: ${(contactStats.avgObjSize).toFixed(2)} bytes`);
    console.log(`Indexes: ${contactStats.nindexes}`);
    console.log(`Index Size: ${(contactStats.totalIndexSize / 1024).toFixed(2)} KB`);
    console.log('');

    // Check contact distribution by user
    console.log('👤 Contact Distribution by User:');
    console.log('=' .repeat(50));
    
    const contactsByUser = await Contact.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          lastSync: { $max: '$lastSync' },
          firstContact: { $min: '$createdAt' },
          lastContact: { $max: '$createdAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    for (const userGroup of contactsByUser) {
      const userId = userGroup._id;
      console.log(`User ID: ${userId || 'null'}`);
      console.log(`  Contacts: ${userGroup.count}`);
      console.log(`  Last Sync: ${userGroup.lastSync || 'N/A'}`);
      console.log(`  Date Range: ${userGroup.firstContact?.toISOString().split('T')[0]} to ${userGroup.lastContact?.toISOString().split('T')[0]}`);
      console.log('');
    }

    // Check recent sync activity
    console.log('🔄 Recent Contact Activity:');
    console.log('=' .repeat(50));
    
    const recentContacts = await Contact.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name phone user createdAt lastSync mauticId');
    
    console.log('Last 10 contacts created:');
    recentContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name || 'No Name'} (${contact.phone})`);
      console.log(`   User: ${contact.user}`);
      console.log(`   Created: ${contact.createdAt?.toISOString().split('T')[0]}`);
      console.log(`   Mautic ID: ${contact.mauticId || 'N/A'}`);
      console.log('');
    });

    // Check for any storage limitations
    console.log('💾 Storage Capacity Analysis:');
    console.log('=' .repeat(50));
    
    const totalContacts = await Contact.countDocuments();
    const estimatedSizePerContact = contactStats.avgObjSize;
    const currentUsage = (contactStats.size / 1024 / 1024).toFixed(2);
    
    console.log(`Current contacts: ${totalContacts}`);
    console.log(`Average size per contact: ${estimatedSizePerContact.toFixed(2)} bytes`);
    console.log(`Current storage usage: ${currentUsage} MB`);
    console.log(`Estimated capacity for 10,000 contacts: ${(10000 * estimatedSizePerContact / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Estimated capacity for 100,000 contacts: ${(100000 * estimatedSizePerContact / 1024 / 1024).toFixed(2)} MB`);
    
    // MongoDB Atlas free tier limit is 512MB
    const atlasLimit = 512; // MB
    const currentPercentage = ((dbStats.storageSize / 1024 / 1024) / atlasLimit * 100).toFixed(2);
    
    console.log(`\n🌤️ MongoDB Atlas Status:`);
    console.log(`Total DB size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Atlas free tier limit: ${atlasLimit} MB`);
    console.log(`Current usage: ${currentPercentage}% of free tier`);
    console.log(`Remaining space: ${(atlasLimit - (dbStats.storageSize / 1024 / 1024)).toFixed(2)} MB`);
    
    if (currentPercentage > 80) {
      console.log('⚠️ WARNING: Approaching storage limit!');
    } else {
      console.log('✅ Plenty of storage space available');
    }

    // Check if there are any database indexes
    console.log('\n📑 Database Indexes:');
    console.log('=' .repeat(50));
    const indexes = await db.collection('contacts').listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`Index: ${index.name}`);
      console.log(`  Keys: ${JSON.stringify(index.key)}`);
      console.log(`  Unique: ${index.unique || false}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('📡 MongoDB disconnected');

  } catch (error) {
    console.error('❌ Check failed:', error);
    await mongoose.disconnect();
  }
}

// Run the check
checkMongoDBStatus().catch(console.error);