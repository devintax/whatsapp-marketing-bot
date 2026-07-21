const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function comprehensiveMauticSync() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // First, let's see how many contacts are in Mautic
    console.log('🔍 Checking total contacts in Mautic...');
    
    const initialResponse = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
      auth: {
        username: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!'
      },
      params: {
        limit: 1,
        orderBy: 'id',
        orderByDir: 'DESC'
      },
      timeout: 15000
    });
    
    const totalAvailable = initialResponse.data.total || 0;
    console.log(`📊 Total contacts available in Mautic: ${totalAvailable}`);
    
    if (totalAvailable === 0) {
      console.log('❌ No contacts found in Mautic');
      return;
    }
    
    // Import all contacts in batches
    const Contact = require('./models/Contact');
    const userId = '68f4bcc2eb61f568f2f30db6'; // Main admin user
    const batchSize = 100; // Larger batches for efficiency
    const totalBatches = Math.ceil(totalAvailable / batchSize);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    console.log(`🚀 Starting comprehensive sync: ${totalBatches} batches of ${batchSize} contacts each`);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const start = batch * batchSize;
      console.log(`\n📦 Processing batch ${batch + 1}/${totalBatches} (contacts ${start + 1}-${Math.min(start + batchSize, totalAvailable)})`);
      
      try {
        const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
          auth: {
            username: 'admin@dfgbusiness.com',
            password: 'GISpcServer2017$!'
          },
          params: {
            limit: batchSize,
            start: start,
            orderBy: 'id',
            orderByDir: 'ASC'
          },
          timeout: 30000 // Longer timeout for larger batches
        });
        
        const contacts = response.data.contacts || {};
        const contactList = Object.values(contacts);
        console.log(`📥 Retrieved ${contactList.length} contacts from batch ${batch + 1}`);
        
        if (contactList.length === 0) {
          console.log('⚠️ Empty batch, skipping...');
          continue;
        }
        
        let batchImported = 0;
        let batchSkipped = 0;
        let batchErrors = 0;
        
        for (const mauticContact of contactList) {
          try {
            // Extract phone number with comprehensive field checking
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
            
            // If still no phone, create a unique phone using the contact ID
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
              tags: ['mautic-comprehensive-sync', new Date().toISOString().split('T')[0]],
              notes: `Comprehensive Mautic sync - ID: ${mauticContact.id}, Added: ${mauticContact.dateAdded}`,
              mauticId: mauticContact.id,
              lastSync: new Date()
            };
            
            // Check if contact exists (check by mauticId first, then phone)
            const existing = await Contact.findOne({
              $or: [
                { mauticId: mauticContact.id },
                { user: userId, phone: phone }
              ]
            });
            
            if (!existing) {
              await Contact.create(contactData);
              batchImported++;
              if (batchImported % 10 === 0) {
                console.log(`   ➕ Imported ${batchImported} contacts so far in this batch...`);
              }
            } else {
              batchSkipped++;
              // Update lastSync date for existing contacts
              await Contact.updateOne(
                { _id: existing._id },
                { 
                  lastSync: new Date(),
                  mauticId: mauticContact.id // Ensure mauticId is set
                }
              );
            }
            
          } catch (contactError) {
            batchErrors++;
            console.error(`❌ Error processing contact ${mauticContact.id}:`, contactError.message);
          }
        }
        
        totalImported += batchImported;
        totalSkipped += batchSkipped;
        totalErrors += batchErrors;
        
        console.log(`✅ Batch ${batch + 1} complete: ${batchImported} imported, ${batchSkipped} skipped, ${batchErrors} errors`);
        
        // Add a small delay between batches to avoid overwhelming the API
        if (batch < totalBatches - 1) {
          console.log('⏱️ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (batchError) {
        console.error(`❌ Error processing batch ${batch + 1}:`, batchError.message);
        totalErrors++;
      }
    }
    
    // Final count
    const finalContactCount = await Contact.countDocuments({ user: userId });
    const totalMauticContacts = await Contact.countDocuments({ user: userId, mauticId: { $exists: true } });
    
    console.log(`\n🎉 COMPREHENSIVE SYNC COMPLETE!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total contacts processed: ${totalAvailable}`);
    console.log(`   - New contacts imported: ${totalImported}`);
    console.log(`   - Existing contacts skipped: ${totalSkipped}`);
    console.log(`   - Errors encountered: ${totalErrors}`);
    console.log(`   - Final contact count for user: ${finalContactCount}`);
    console.log(`   - Total contacts from Mautic: ${totalMauticContacts}`);
    
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

comprehensiveMauticSync();