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

// Check the most recently created contact
const checkRecentContact = async () => {
  try {
    const Contact = require('./models/Contact');
    
    console.log('🔍 Checking most recently created contact...');
    
    // Find the most recent contact (by creation time)
    const recentContact = await Contact.findOne().sort({ createdAt: -1 });
    
    if (recentContact) {
      console.log('📋 Most recent contact:');
      console.log(`   ID: ${recentContact._id}`);
      console.log(`   Name: ${recentContact.name}`);
      console.log(`   Phone: ${recentContact.phone}`);
      console.log(`   Email: ${recentContact.email}`);
      console.log(`   User: ${recentContact.user}`);
      console.log(`   User Type: ${typeof recentContact.user}`);
      console.log(`   isActive: ${recentContact.isActive}`);
      console.log(`   Tags: ${recentContact.tags}`);
      console.log(`   Created: ${recentContact.createdAt}`);
      console.log('');
      
      // Check if this user ID exists in the system
      const User = require('./models/User');
      const user = await User.findById(recentContact.user);
      if (user) {
        console.log(`✅ User found: ${user.email} (${user.name})`);
      } else {
        console.log(`❌ User NOT found for ID: ${recentContact.user}`);
      }
      
      // Count all contacts for this user
      const userContactCount = await Contact.countDocuments({ 
        user: recentContact.user,
        isActive: true 
      });
      console.log(`📊 Total active contacts for this user: ${userContactCount}`);
      
      // Test the exact query used by the frontend
      const frontendQuery = await Contact.find({ 
        user: recentContact.user,
        isActive: true 
      }).limit(1000);
      console.log(`🔍 Frontend query result: ${frontendQuery.length} contacts found`);
      
    } else {
      console.log('❌ No contacts found in database');
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
  await checkRecentContact();
};

runCheck();