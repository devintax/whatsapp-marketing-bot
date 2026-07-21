const mongoose = require('mongoose');
const Contact = require('./models/Contact');

async function checkContactStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@cluster0.ijeqwjt.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('✅ Connected to MongoDB');
    
    const userId = '68e37bea4eb7fec9ede39581';
    
    // Check all contacts for user
    const allContacts = await Contact.find({ user: userId });
    console.log(`📊 Total contacts for user: ${allContacts.length}`);
    
    // Check active contacts
    const activeContacts = await Contact.find({ user: userId, isActive: true });
    console.log(`📊 Active contacts for user: ${activeContacts.length}`);
    
    // Check inactive contacts
    const inactiveContacts = await Contact.find({ user: userId, isActive: false });
    console.log(`📊 Inactive contacts for user: ${inactiveContacts.length}`);
    
    // Check contacts without isActive field
    const noActiveField = await Contact.find({ user: userId, isActive: { $exists: false } });
    console.log(`📊 Contacts without isActive field: ${noActiveField.length}`);
    
    // Show details of first few contacts
    console.log('\n📋 Contact Details:');
    allContacts.slice(0, 3).forEach((contact, index) => {
      console.log(`Contact ${index + 1}:`);
      console.log(`  Name: ${contact.name}`);
      console.log(`  Phone: ${contact.phone}`);
      console.log(`  IsActive: ${contact.isActive}`);
      console.log(`  User: ${contact.user}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkContactStatus();