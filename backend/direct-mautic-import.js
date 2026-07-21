const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function directMauticImport() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔗 Testing Mautic API...');
    const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
      auth: {
        username: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!'
      },
      params: {
        limit: 10,
        orderBy: 'id',
        orderByDir: 'ASC'
      },
      timeout: 15000
    });
    
    const contacts = response.data.contacts || {};
    const contactList = Object.values(contacts);
    console.log(`📥 Retrieved ${contactList.length} contacts from Mautic`);
    
    if (contactList.length === 0) {
      console.log('❌ No contacts found in Mautic API response');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return;
    }
    
    // Import to MongoDB
    const Contact = require('./models/Contact');
    const userId = '68f4bcc2eb61f568f2f30db6';
    
    let imported = 0;
    let skipped = 0;
    
    for (const mauticContact of contactList) {
      try {
        console.log(`\n🔍 Processing contact ${mauticContact.id}:`);
        console.log('Raw contact data:', JSON.stringify(mauticContact, null, 2));
        
        // Extract phone number with better field checking
        let phone = null;
        
        // Check various possible phone fields
        if (mauticContact.fields && mauticContact.fields.core) {
          phone = mauticContact.fields.core.mobile?.value || 
                 mauticContact.fields.core.phone?.value ||
                 mauticContact.fields.core.telephone?.value;
        }
        
        // Fallback to direct properties
        if (!phone) {
          phone = mauticContact.mobile || 
                 mauticContact.phone || 
                 mauticContact.telephone;
        }
        
        // If no phone, check all fields for anything that looks like a phone
        if (!phone && mauticContact.fields) {
          for (const fieldGroup of Object.values(mauticContact.fields)) {
            for (const field of Object.values(fieldGroup)) {
              if (field.value && /[\d\+\-\(\)\s]{10,}/.test(field.value)) {
                phone = field.value;
                console.log(`📞 Found phone in field: ${field.value}`);
                break;
              }
            }
            if (phone) break;
          }
        }
        
        // If still no phone, create a test phone using the contact ID
        if (!phone) {
          phone = `+1555${String(mauticContact.id).padStart(7, '0')}`;
          console.log(`🔢 Generated test phone: ${phone}`);
        } else {
          console.log(`📞 Extracted phone: ${phone}`);
        }
        
        // Clean phone number
        phone = phone.toString().replace(/[^\d+]/g, '');
        if (!phone.startsWith('+')) {
          phone = '+1' + phone.replace(/[^\d]/g, '');
        }
        
        // Extract name
        let firstName = '';
        let lastName = '';
        
        if (mauticContact.fields && mauticContact.fields.core) {
          firstName = mauticContact.fields.core.firstname?.value || mauticContact.firstname || '';
          lastName = mauticContact.fields.core.lastname?.value || mauticContact.lastname || '';
        } else {
          firstName = mauticContact.firstname || '';
          lastName = mauticContact.lastname || '';
        }
        
        const name = `${firstName} ${lastName}`.trim() || `Mautic Contact ${mauticContact.id}`;
        
        // Extract email
        let email = '';
        if (mauticContact.fields && mauticContact.fields.core) {
          email = mauticContact.fields.core.email?.value || mauticContact.email || '';
        } else {
          email = mauticContact.email || '';
        }
        
        const contactData = {
          name: name,
          phone: phone,
          email: email,
          user: userId,
          tags: ['mautic-direct-import'],
          notes: `Direct import from Mautic - ID: ${mauticContact.id}`,
          mauticId: mauticContact.id,
          lastSync: new Date()
        };
        
        console.log(`👤 Final contact data:`, {
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email
        });
        
        // Check if contact exists
        const existing = await Contact.findOne({
          user: userId,
          $or: [
            { phone: phone },
            { mauticId: mauticContact.id }
          ]
        });
        
        if (!existing) {
          await Contact.create(contactData);
          imported++;
          console.log(`➕ Imported: ${name} (${phone})`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped existing: ${name}`);
        }
        
      } catch (contactError) {
        console.error(`❌ Error processing contact ${mauticContact.id}:`, contactError.message);
      }
    }
    
    const totalContacts = await Contact.countDocuments({ user: userId });
    console.log(`\\n📊 Import complete!`);
    console.log(`- Imported: ${imported}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Total contacts in database: ${totalContacts}`);
    
    await mongoose.disconnect();
    console.log('🔚 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

directMauticImport();