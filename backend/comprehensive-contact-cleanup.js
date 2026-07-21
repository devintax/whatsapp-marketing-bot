const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_marketing_bot');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Comprehensive cleanup of invalid contacts
const cleanupInvalidContacts = async () => {
  try {
    const Contact = require('./models/Contact');
    
    console.log('🔍 Starting comprehensive contact cleanup...');
    
    // Find all contacts with invalid user fields
    const invalidContacts = await Contact.find({
      $or: [
        { user: null },
        { user: undefined },
        { user: { $exists: false } }
      ]
    });
    
    console.log(`📋 Found ${invalidContacts.length} contacts with invalid user fields`);
    
    if (invalidContacts.length > 0) {
      console.log('\\n🗑️ Invalid contacts to be removed:');
      invalidContacts.forEach((contact, index) => {
        console.log(`  ${index + 1}. ${contact.name || 'No Name'} - ${contact.phone} (User: ${contact.user})`);
      });
      
      // Delete all invalid contacts
      const deleteResult = await Contact.deleteMany({
        $or: [
          { user: null },
          { user: undefined },
          { user: { $exists: false } }
        ]
      });
      
      console.log(`\\n✅ Cleanup completed! Removed ${deleteResult.deletedCount} invalid contacts`);
    } else {
      console.log('✅ No invalid contacts found - database is clean!');
    }
    
    // Verify the cleanup
    const remainingInvalid = await Contact.countDocuments({
      $or: [
        { user: null },
        { user: undefined },
        { user: { $exists: false } }
      ]
    });
    
    console.log(`\\n📊 Verification: ${remainingInvalid} invalid contacts remaining`);
    
    // Show total remaining contacts
    const totalContacts = await Contact.countDocuments();
    console.log(`📊 Total contacts in database: ${totalContacts}`);
    
    // Show contacts by user to verify data integrity
    const contactsByUser = await Contact.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          phones: { $push: '$phone' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('\\n👥 Contacts by user:');
    contactsByUser.forEach((group, index) => {
      console.log(`  ${index + 1}. User ${group._id}: ${group.count} contacts`);
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Database connection closed');
  }
};

// Run cleanup
const runCleanup = async () => {
  await connectDB();
  await cleanupInvalidContacts();
};

runCleanup();