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

// Check for contacts created in the last few minutes
const checkRecentManualContacts = async () => {
  try {
    const Contact = require('./models/Contact');
    
    console.log('🔍 Checking for manually created contacts in the last 10 minutes...');
    
    // Find contacts created in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentContacts = await Contact.find({
      createdAt: { $gte: tenMinutesAgo }
    }).sort({ createdAt: -1 });
    
    console.log(`📋 Found ${recentContacts.length} contacts created in the last 10 minutes:`);
    
    if (recentContacts.length > 0) {
      recentContacts.forEach((contact, index) => {
        console.log(`\\n${index + 1}. Contact ID: ${contact._id}`);
        console.log(`   Name: ${contact.name || 'No Name'}`);
        console.log(`   Phone: ${contact.phone}`);
        console.log(`   Email: ${contact.email || 'No Email'}`);
        console.log(`   User: ${contact.user}`);
        console.log(`   User Type: ${typeof contact.user}`);
        console.log(`   isActive: ${contact.isActive}`);
        console.log(`   Tags: ${contact.tags}`);
        console.log(`   Created: ${contact.createdAt}`);
        
        // Check if this looks like a manually created contact
        const isManual = !contact.tags || !contact.tags.some(tag => 
          tag.includes('mautic') || tag.includes('sync') || tag.includes('auto')
        );
        console.log(`   Manual Contact: ${isManual ? '✅ YES' : '❌ NO (auto-sync)'}`);
      });
      
      // Look specifically for the user from the frontend session
      const frontendUserId = '68fd506f5112511adbfd8c1a'; // From the logs
      const frontendUserContacts = recentContacts.filter(contact => 
        contact.user && contact.user.toString() === frontendUserId
      );
      
      console.log(`\\n🎯 Contacts for frontend user (${frontendUserId}): ${frontendUserContacts.length}`);
      
      if (frontendUserContacts.length > 0) {
        console.log('\\n🔍 Frontend user contacts:');
        frontendUserContacts.forEach((contact, index) => {
          console.log(`   ${index + 1}. ${contact.name} - ${contact.phone} (Created: ${contact.createdAt})`);
        });
      }
      
    } else {
      console.log('❌ No contacts created in the last 10 minutes');
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
  await checkRecentManualContacts();
};

runCheck();