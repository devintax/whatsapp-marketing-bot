const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function comprehensiveMauticImport() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Contact = require('./models/Contact');
    const userId = '68f4bcc2eb61f568f2f30db6'; // Fixed user ID
    
    let allContacts = [];
    let page = 0;
    const limit = 100;
    let hasMore = true;

    console.log('🔗 Fetching all contacts from Mautic...');
    
    // Fetch all contacts from Mautic API
    while (hasMore) {
      try {
        console.log(`📥 Fetching page ${page + 1} (limit: ${limit})...`);
        
        const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
          auth: {
            username: 'admin@dfgbusiness.com',
            password: 'GISpcServer2017$!'
          },
          params: {
            limit: limit,
            start: page * limit,
            orderBy: 'id',
            orderByDir: 'ASC'
          },
          timeout: 30000
        });
        
        const contacts = response.data.contacts || {};
        const contactList = Object.values(contacts);
        
        if (contactList.length === 0) {
          hasMore = false;
          console.log('📋 No more contacts found');
        } else {
          allContacts = allContacts.concat(contactList);
          console.log(`✅ Fetched ${contactList.length} contacts from page ${page + 1}`);
          page++;
          
          // Safety limit to prevent infinite loops
          if (page > 100) {
            console.log('⚠️ Reached safety limit of 100 pages');
            break;
          }
        }
      } catch (pageError) {
        console.error(`❌ Error fetching page ${page + 1}:`, pageError.message);
        hasMore = false;
      }
    }

    console.log(`📊 Total contacts retrieved: ${allContacts.length}`);
    
    if (allContacts.length === 0) {
      console.log('❌ No contacts found in Mautic');
      return;
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    console.log('🚀 Starting contact processing...');
    
    for (let i = 0; i < allContacts.length; i++) {
      const mauticContact = allContacts[i];
      
      if (i % 50 === 0) {
        console.log(`📊 Progress: ${i + 1}/${allContacts.length} (${Math.round(((i + 1) / allContacts.length) * 100)}%)`);
      }
      
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

        // Skip contacts without phone numbers
        if (!phone) {
          skipped++;
          continue;
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
          tags: ['mautic-comprehensive-import'],
          notes: `Comprehensive import from Mautic - ID: ${mauticContact.id}`,
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
        
        if (existing) {
          // Update existing contact
          await Contact.findByIdAndUpdate(existing._id, {
            ...contactData,
            updatedAt: new Date()
          });
          updated++;
          
          if (i % 10 === 0) {
            console.log(`📝 Updated: ${name} (${phone})`);
          }
        } else {
          // Create new contact
          await Contact.create(contactData);
          imported++;
          
          if (i % 10 === 0) {
            console.log(`➕ Imported: ${name} (${phone})`);
          }
        }

      } catch (contactError) {
        failed++;
        const errorMsg = `Failed to process contact ${mauticContact.id}: ${contactError.message}`;
        errors.push(errorMsg);
        
        if (failed <= 10) { // Only log first 10 errors to avoid spam
          console.error('❌', errorMsg);
        }
      }
    }

    const totalContacts = await Contact.countDocuments({ user: userId });
    
    console.log(`\n🎉 Comprehensive import complete!`);
    console.log(`📊 Results:`);
    console.log(`  - Imported: ${imported}`);
    console.log(`  - Updated: ${updated}`);
    console.log(`  - Skipped: ${skipped}`);
    console.log(`  - Failed: ${failed}`);
    console.log(`  - Total processed: ${allContacts.length}`);
    console.log(`  - Total contacts in database: ${totalContacts}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️ First 5 errors:`);
      errors.slice(0, 5).forEach(error => console.log(`  - ${error}`));
    }

    await mongoose.disconnect();
    console.log('🔚 Import process complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

comprehensiveMauticImport();