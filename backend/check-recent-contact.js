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

// Check the recently created contact
const checkRecentContact = async () => {
  try {
    const Contact = require('./models/Contact');
    
    const contactId = '68fd5fb018d5c00b31b3eaa9'; // From the logs
    const userId = '68fd506f5112511adbfd8c1a';
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    console.log(`🔍 Checking contact: ${contactId}`);
    
    // Find the specific contact by ID
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
      
      // Check if user field matches our ObjectId
      console.log(`🎯 User ObjectId: ${userObjectId}`);
      console.log(`🔄 User field equals ObjectId: ${contact.user?.toString() === userObjectId.toString()}`);
    } else {
      console.log('❌ Contact not found');
    }
    
    // Check for contacts by name 'Edwina Adaku'
    const nameContacts = await Contact.find({ name: 'Edwina Adaku' });
    console.log(`📝 Contacts with name 'Edwina Adaku': ${nameContacts.length}`);
    
    if (nameContacts.length > 0) {
      nameContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact._id}, User: ${contact.user}, Phone: ${contact.phone}`);
      });
    }
    
    // Test the GET query used by the frontend
    const getQuery = await Contact.find({ user: userObjectId, isActive: true });
    console.log(`\n🔍 GET query result: ${getQuery.length} contacts`);
    
    if (getQuery.length > 0) {
      console.log('GET query contacts:');
      getQuery.forEach((contact, index) => {
        console.log(`${index + 1}. Name: ${contact.name}, Phone: ${contact.phone}`);
      });
    }
    
    console.log('\n🎯 Contact check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking contact:', error.message);
    process.exit(1);
  }
};

// Run check
const runCheck = async () => {
  await connectDB();
  await checkRecentContact();
};

runCheck();