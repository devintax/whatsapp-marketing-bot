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

// Check the specific contact that was just created
const checkSpecificContact = async () => {
  try {
    const Contact = require('./models/Contact');
    
    // The contact ID from the logs
    const contactId = '68fd649b778102541d8a8ad9';
    
    console.log(`🔍 Checking specific contact: ${contactId}`);
    
    const contact = await Contact.findById(contactId);
    
    if (contact) {
      console.log('📋 Contact found:');
      console.log(`   ID: ${contact._id}`);
      console.log(`   Name: ${contact.name}`);
      console.log(`   Phone: ${contact.phone}`);
      console.log(`   Email: ${contact.email}`);
      console.log(`   User: ${contact.user}`);
      console.log(`   User Type: ${typeof contact.user}`);
      console.log(`   isActive: ${contact.isActive}`);
      console.log(`   Tags: ${contact.tags}`);
      console.log(`   Created: ${contact.createdAt}`);
      console.log('');
      
      // Full object inspection
      console.log('🔍 Full contact object:');
      console.log(JSON.stringify(contact.toObject(), null, 2));
      
    } else {
      console.log('❌ Contact not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Database connection closed');
  }
};

// Run check
const runCheck = async () => {
  await connectDB();
  await checkSpecificContact();
};

runCheck();