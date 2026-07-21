const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect('mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@cluster0.ijeqwjt.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority&appName=Cluster0');
    
    const User = require('./models/User');
    const Contact = require('./models/Contact');
    
    // Find the user
    const user = await User.findOne({ email: 'vkgbewonyo@gmail.com' });
    console.log('👤 User found:', user ? user._id.toString() : 'Not found');
    
    if (user) {
      // Find contacts for this user
      const userContacts = await Contact.find({ user: user._id });
      console.log(`📞 Contacts for user ${user._id}:`, userContacts.length);
      
      // Check all contacts in database
      const allContacts = await Contact.find({});
      console.log('📊 Total contacts in database:', allContacts.length);
      
      console.log('\n📋 All contacts user IDs:');
      allContacts.forEach((contact, index) => {
        console.log(`${index + 1}. Contact: ${contact.name} | User ID: ${contact.user.toString()}`);
      });
      
      console.log('\n🔍 User ID match check:');
      console.log('JWT User ID:', user._id.toString());
      console.log('Contacts with matching user ID:', userContacts.length);
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();