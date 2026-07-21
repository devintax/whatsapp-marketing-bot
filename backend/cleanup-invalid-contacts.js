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

// Clean up contacts with null user field
const cleanupInvalidContacts = async () => {
  try {
    const Contact = require('./models/Contact');
    
    // Find contacts with null user field
    const invalidContacts = await Contact.find({ user: null });
    console.log(`🔍 Found ${invalidContacts.length} contacts with null user field`);
    
    if (invalidContacts.length > 0) {
      // List the invalid contacts
      invalidContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact._id}, Phone: ${contact.phone}, Name: ${contact.name || 'N/A'}`);
      });
      
      // Delete invalid contacts
      const deleteResult = await Contact.deleteMany({ user: null });
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} invalid contacts`);
    } else {
      console.log('✅ No invalid contacts found');
    }
    
    console.log('🎯 Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    process.exit(1);
  }
};

// Run cleanup
const runCleanup = async () => {
  await connectDB();
  await cleanupInvalidContacts();
};

runCleanup();