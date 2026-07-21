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

// Check recent contacts
const checkRecentContacts = async () => {
  try {
    const Contact = require('./models/Contact');
    
    const userId = '68fd506f5112511adbfd8c1a';
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Check contacts created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log(`🕐 Checking contacts created after: ${oneHourAgo.toISOString()}`);
    
    // Find recent contacts for your user
    const recentContacts = await Contact.find({
      user: userObjectId,
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 });
    
    console.log(`📊 Found ${recentContacts.length} recent contacts for your user`);
    
    if (recentContacts.length > 0) {
      console.log('\n📋 Recent contacts:');
      recentContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact._id}`);
        console.log(`   Name: ${contact.name || 'N/A'}`);
        console.log(`   Phone: ${contact.phone}`);
        console.log(`   Email: ${contact.email || 'N/A'}`);
        console.log(`   isActive: ${contact.isActive}`);
        console.log(`   Created: ${contact.createdAt}`);
        console.log(`   User: ${contact.user}`);
        console.log('');
      });
    }
    
    // Also check all contacts created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayContacts = await Contact.find({
      user: userObjectId,
      createdAt: { $gte: todayStart }
    }).sort({ createdAt: -1 });
    
    console.log(`📅 Total contacts created today for your user: ${todayContacts.length}`);
    
    // Check if any contacts exist with different user field formats
    const allUserContacts = await Contact.find({
      $or: [
        { user: userId }, // String format
        { user: userObjectId }, // ObjectId format
      ]
    });
    
    console.log(`🔍 All contacts with your user ID (any format): ${allUserContacts.length}`);
    
    // Check the exact query that the GET endpoint uses
    const getEndpointQuery = await Contact.find({ user: userObjectId, isActive: true });
    console.log(`🎯 Contacts found by GET endpoint query: ${getEndpointQuery.length}`);
    
    console.log('\n🎯 Recent contacts check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking recent contacts:', error.message);
    process.exit(1);
  }
};

// Run check
const runCheck = async () => {
  await connectDB();
  await checkRecentContacts();
};

runCheck();