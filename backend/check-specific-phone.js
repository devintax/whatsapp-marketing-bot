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

// Check for the specific phone number again
const checkSpecificPhone = async () => {
  try {
    const Contact = require('./models/Contact');
    
    const phoneNumber = '+13479324435';
    const userId = '68fd506f5112511adbfd8c1a';
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    console.log(`🔍 Checking for all contacts with phone: ${phoneNumber}`);
    
    // Find all contacts with this phone number
    const allContacts = await Contact.find({ phone: phoneNumber });
    console.log(`📊 Total contacts found with this phone: ${allContacts.length}`);
    
    if (allContacts.length > 0) {
      allContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact._id}`);
        console.log(`   User: ${contact.user}`);
        console.log(`   User Type: ${typeof contact.user}`);
        console.log(`   Name: ${contact.name || 'N/A'}`);
        console.log(`   Phone: ${contact.phone}`);
        console.log(`   isActive: ${contact.isActive}`);
        console.log(`   Created: ${contact.createdAt}`);
        console.log('');
      });
    }
    
    // Check specifically for your user
    const userContacts = await Contact.find({ 
      phone: phoneNumber, 
      user: userObjectId 
    });
    console.log(`🎯 Contacts with this phone for your user: ${userContacts.length}`);
    
    // Check for null user contacts
    const nullUserContacts = await Contact.find({ 
      phone: phoneNumber, 
      user: null 
    });
    console.log(`⚠️ Contacts with this phone and null user: ${nullUserContacts.length}`);
    
    // Delete any null user contacts
    if (nullUserContacts.length > 0) {
      const deleteResult = await Contact.deleteMany({ 
        phone: phoneNumber, 
        user: null 
      });
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} null user contacts`);
    }
    
    // Check very recent contacts (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentContacts = await Contact.find({
      phone: phoneNumber,
      createdAt: { $gte: fiveMinutesAgo }
    });
    console.log(`⏰ Contacts created in last 5 minutes: ${recentContacts.length}`);
    
    if (recentContacts.length > 0) {
      console.log('Recent contacts:');
      recentContacts.forEach((contact, index) => {
        console.log(`${index + 1}. User: ${contact.user}, Created: ${contact.createdAt}`);
      });
    }
    
    console.log('\n🎯 Phone number check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking phone number:', error.message);
    process.exit(1);
  }
};

// Run check
const runCheck = async () => {
  await connectDB();
  await checkSpecificPhone();
};

runCheck();