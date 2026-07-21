const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function fixAndSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Fix the integration credentials
    console.log('\n🔧 Step 1: Fixing integration credentials...');
    
    const integrationId = '68f4c592ee0de5bb2c9f567b';
    
    // Use direct MongoDB update
    const result = await mongoose.connection.db.collection('crmintegrations').updateOne(
      { _id: new mongoose.Types.ObjectId(integrationId) },
      {
        $set: {
          'credentials.username': 'admin@dfgbusiness.com',
          'credentials.password': 'GISpcServer2017$!',
          'credentials.apiUrl': 'https://dfgbusiness.com/mautic',
          status: 'active'
        }
      }
    );
    
    console.log('Update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('✅ Integration credentials updated successfully');
    } else {
      console.log('⚠️ No documents were modified');
    }
    
    // Step 2: Verify the fix
    console.log('\n🔍 Step 2: Verifying the fix...');
    const updatedIntegration = await mongoose.connection.db.collection('crmintegrations').findOne(
      { _id: new mongoose.Types.ObjectId(integrationId) }
    );
    
    if (updatedIntegration) {
      console.log('✅ Integration found');
      console.log('Credentials check:', {
        hasUsername: !!updatedIntegration.credentials?.username,
        hasPassword: !!updatedIntegration.credentials?.password,
        apiUrl: updatedIntegration.credentials?.apiUrl
      });
    }
    
    // Step 3: Test Mautic API directly
    console.log('\n🔍 Step 3: Testing Mautic API...');
    const mauticResponse = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
      auth: {
        username: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!'
      },
      params: {
        limit: 5,
        orderBy: 'id',
        orderByDir: 'ASC'
      }
    });
    
    const contacts = Object.values(mauticResponse.data.contacts || {});
    console.log(`📥 Mautic API returned ${contacts.length} contacts`);
    
    // Step 4: Import a few contacts directly to test
    console.log('\n📝 Step 4: Importing sample contacts...');
    const Contact = require('./models/Contact');
    const userId = '68f4bcc2eb61f568f2f30db6';
    
    let imported = 0;
    
    for (const mauticContact of contacts.slice(0, 3)) {
      // Generate a phone number for testing
      let phone = `+1555${String(mauticContact.id).padStart(7, '0')}`;
      
      const contactData = {
        name: `Test Contact ${mauticContact.id}`,
        phone: phone,
        email: mauticContact.fields?.core?.email?.value || `test${mauticContact.id}@example.com`,
        user: userId,
        tags: ['test-fix-import'],
        notes: `Test import after fix - Mautic ID: ${mauticContact.id}`,
        mauticId: mauticContact.id,
        lastSync: new Date()
      };
      
      const existing = await Contact.findOne({
        user: userId,
        mauticId: mauticContact.id
      });
      
      if (!existing) {
        await Contact.create(contactData);
        imported++;
        console.log(`➕ Imported: ${contactData.name} (${phone})`);
      }
    }
    
    const totalContacts = await Contact.countDocuments({ user: userId });
    console.log(`\\n📊 Total contacts in database: ${totalContacts}`);
    console.log(`➕ Imported in this run: ${imported}`);
    
    await mongoose.disconnect();
    console.log('\\n🎉 Done! The integration should now work for sync.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAndSync();