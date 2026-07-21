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

// Check contacts for specific user
const checkUserContacts = async () => {
  try {
    const Contact = require('./models/Contact');
    
    // Check for your test user
    const userId = '68fd506f5112511adbfd8c1a'; // Your user ID from the logs
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    console.log(`🔍 Checking contacts for user: ${userId}`);
    
    // Find all contacts for this user
    const userContacts = await Contact.find({ user: userObjectId });
    console.log(`📊 Found ${userContacts.length} contacts for this user`);
    
    if (userContacts.length > 0) {
      console.log('\n📋 Contact Details:');
      userContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact._id}`);
        console.log(`   Name: ${contact.name || 'N/A'}`);
        console.log(`   Phone: ${contact.phone}`);
        console.log(`   Email: ${contact.email || 'N/A'}`);
        console.log(`   User: ${contact.user}`);
        console.log(`   Active: ${contact.isActive}`);
        console.log(`   Created: ${contact.createdAt}`);
        console.log('');
      });
    }
    
    // Also check contacts with different user field types
    const allContacts = await Contact.find({});
    console.log(`\n🌍 Total contacts in database: ${allContacts.length}`);
    
    // Check for contacts with your user ID as string vs ObjectId
    const stringUserContacts = await Contact.find({ user: userId });
    console.log(`📝 Contacts with user ID as string: ${stringUserContacts.length}`);
    
    const objectIdUserContacts = await Contact.find({ user: userObjectId });
    console.log(`🎯 Contacts with user ID as ObjectId: ${objectIdUserContacts.length}`);
    
    // Check isActive field
    const activeContacts = await Contact.find({ user: userObjectId, isActive: true });
    console.log(`✅ Active contacts for user: ${activeContacts.length}`);
    
    const inactiveContacts = await Contact.find({ user: userObjectId, isActive: { $ne: true } });
    console.log(`❌ Inactive/undefined contacts for user: ${inactiveContacts.length}`);
    
    console.log('\n🎯 Diagnosis completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking contacts:', error.message);
    process.exit(1);
  }
};

// Run diagnosis
const runDiagnosis = async () => {
  await connectDB();
  await checkUserContacts();
};

runDiagnosis();