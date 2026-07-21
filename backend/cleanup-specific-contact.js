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

// Clean up specific phone number with null user
const cleanupSpecificContact = async () => {
  try {
    const Contact = require('./models/Contact');
    
    const phoneNumber = '+13479324435';
    
    console.log(`🔍 Checking for contacts with phone: ${phoneNumber} and user: null`);
    
    // Find and delete contacts with this phone number and null user
    const result = await Contact.deleteMany({ 
      user: null, 
      phone: phoneNumber 
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} contacts with phone ${phoneNumber} and null user`);
    
    // Also check for any contacts with this phone number
    const remainingContacts = await Contact.find({ phone: phoneNumber });
    console.log(`📊 Remaining contacts with phone ${phoneNumber}: ${remainingContacts.length}`);
    
    if (remainingContacts.length > 0) {
      remainingContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact._id}, User: ${contact.user}, Phone: ${contact.phone}`);
      });
    }
    
    console.log('🎯 Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in cleanup:', error.message);
    process.exit(1);
  }
};

// Run cleanup
const runCleanup = async () => {
  await connectDB();
  await cleanupSpecificContact();
};

runCleanup();