const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function syncNewMauticContacts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔗 Testing Mautic API for newer contacts...');
    
    // Get contacts from different pages and with more recent ordering
    const pages = [1, 2, 3]; // Check first 3 pages
    let totalImported = 0;
    let totalSkipped = 0;
    
    for (const page of pages) {
      console.log(`\n📄 Fetching page ${page}...`);
      
      const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
        auth: {
          username: 'admin@dfgbusiness.com',
          password: 'GISpcServer2017$!'
        },
        params: {
          limit: 50, // Larger batch
          start: (page - 1) * 50,
          orderBy: 'date_modified', // Order by most recently modified
          orderByDir: 'DESC'
        },
        timeout: 15000
      });
      
      const contacts = response.data.contacts || {};
      const contactList = Object.values(contacts);
      console.log(`📥 Retrieved ${contactList.length} contacts from page ${page}`);
      
      if (contactList.length === 0) {
        console.log('❌ No contacts found on this page');
        break;
      }
      
      // Import to MongoDB
      const Contact = require('./models/Contact');
      const userId = '68f4bcc2eb61f568f2f30db6'; // Main admin user
      
      let pageImported = 0;
      let pageSkipped = 0;
      
      for (const mauticContact of contactList) {
        try {
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
          
          // If no phone, create a test phone using the contact ID
          if (!phone) {
            phone = `+1555${String(mauticContact.id).padStart(7, '0')}`;
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
            tags: ['mautic-sync-' + new Date().toISOString().split('T')[0]],
            notes: `Sync from Mautic - ID: ${mauticContact.id}, Modified: ${mauticContact.dateModified}`,
            mauticId: mauticContact.id,
            lastSync: new Date()
          };
          
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
            pageImported++;
            console.log(`➕ Imported: ${name} (${phone}) - Modified: ${mauticContact.dateModified}`);
          } else {
            pageSkipped++;
            // Update lastSync date for existing contacts
            await Contact.updateOne(
              { _id: existing._id },
              { lastSync: new Date() }
            );
          }
          
        } catch (contactError) {
          console.error(`❌ Error processing contact ${mauticContact.id}:`, contactError.message);
        }
      }
      
      totalImported += pageImported;
      totalSkipped += pageSkipped;
      
      console.log(`📄 Page ${page} summary: ${pageImported} imported, ${pageSkipped} skipped`);
      
      // If we imported some contacts, continue to next page
      if (pageImported > 0) {
        console.log('✅ Found new contacts, checking next page...');
      } else if (page > 1) {
        console.log('📝 No new contacts found, stopping pagination');
        break;
      }
    }
    
    const totalContacts = await Contact.countDocuments({ user: userId });
    console.log(`\n📊 Sync complete!`);
    console.log(`- Total imported: ${totalImported}`);
    console.log(`- Total skipped: ${totalSkipped}`);
    console.log(`- Total contacts for user: ${totalContacts}`);
    
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

syncNewMauticContacts();