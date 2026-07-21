const mongoose = require('mongoose');
const Contact = require('./models/Contact');

async function checkUserFieldType() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@cluster0.ijeqwjt.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log('✅ Connected to MongoDB');
    
    const userId = '68e37bea4eb7fec9ede39581';
    
    // Check contacts with different query types
    console.log('\n🔍 Testing different user field query types:');
    
    // 1. Query as string
    const stringQuery = await Contact.find({ user: userId });
    console.log(`📊 Query as string: ${stringQuery.length} contacts`);
    
    // 2. Query as ObjectId
    const ObjectId = mongoose.Types.ObjectId;
    const objectIdQuery = await Contact.find({ user: new ObjectId(userId) });
    console.log(`📊 Query as ObjectId: ${objectIdQuery.length} contacts`);
    
    // 3. Get first contact to see user field type
    const firstContact = await Contact.findOne({});
    if (firstContact) {
      console.log('\n📋 Sample contact user field:');
      console.log(`  Type: ${typeof firstContact.user}`);
      console.log(`  Value: ${firstContact.user}`);
      console.log(`  Constructor: ${firstContact.user.constructor.name}`);
      console.log(`  IsObjectId: ${mongoose.isValidObjectId(firstContact.user)}`);
    }
    
    // 4. Get all contacts and check user field types
    const allContacts = await Contact.find({});
    console.log(`\n📊 All contacts in database: ${allContacts.length}`);
    
    // Group by user field value
    const userGroups = {};
    allContacts.forEach(contact => {
      const userStr = contact.user.toString();
      userGroups[userStr] = (userGroups[userStr] || 0) + 1;
    });
    
    console.log('\n👥 Contacts grouped by user field:');
    Object.entries(userGroups).forEach(([user, count]) => {
      console.log(`  ${user}: ${count} contacts`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserFieldType();