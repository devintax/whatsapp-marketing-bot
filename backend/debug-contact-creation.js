const mongoose = require('mongoose');
const Contact = require('./models/Contact');

// First, let's see what's in our recent problematic contact
async function debugContactCreation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/whatsapp_marketing_bot');
    console.log('Connected to MongoDB');

    // Check the problematic contact
    const problematicContact = await Contact.findById('68fd5fb018d5c00b31b3eaa9');
    console.log('\n🔍 Problematic Contact Full Details:');
    console.log('Raw object:', problematicContact.toObject());
    console.log('JSON stringified:', JSON.stringify(problematicContact, null, 2));
    
    // Let's also test creating a contact directly to see if the model works
    console.log('\n🧪 Testing direct contact creation...');
    
    const testUserId = new mongoose.Types.ObjectId('60f1b2e3d4e5f6a7b8c9d0e1'); // dummy user ID
    
    const testContactData = {
      user: testUserId,
      name: 'Test Direct Creation',
      phone: '9999999999',
      email: 'test@direct.com',
      tags: ['test'],
      isActive: true
    };
    
    console.log('Creating contact with data:', testContactData);
    
    const testContact = new Contact(testContactData);
    const savedTestContact = await testContact.save();
    
    console.log('✅ Test contact created:', savedTestContact._id);
    console.log('Test contact data:', savedTestContact.toObject());
    
    // Clean up test contact
    await Contact.findByIdAndDelete(savedTestContact._id);
    console.log('🧹 Test contact cleaned up');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugContactCreation();