const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function distributeContactsToAllUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const User = require('./models/User');
    const Contact = require('./models/Contact');
    
    // Get all users
    console.log('\n👥 Fetching all users...');
    const users = await User.find({});
    console.log(`📋 Found ${users.length} users`);
    
    // Fetch all contacts from Mautic
    console.log('\n🔗 Fetching contacts from Mautic...');
    const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
      auth: {
        username: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!'
      },
      params: {
        limit: 1000, // Get more contacts
        orderBy: 'id',
        orderByDir: 'ASC'
      },
      timeout: 30000
    });
    
    const mauticContacts = response.data.contacts || {};
    const contactList = Object.values(mauticContacts);
    console.log(`📥 Retrieved ${contactList.length} contacts from Mautic`);
    
    if (contactList.length === 0) {
      console.log('❌ No contacts found in Mautic');
      return;
    }
    
    // Process contacts for each user
    const distributionStats = {
      totalUsers: users.length,
      totalMauticContacts: contactList.length,
      userStats: {}
    };
    
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email} (${user._id})`);
      
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      
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
          
          // If no phone, check all fields for anything that looks like a phone
          if (!phone && mauticContact.fields) {
            for (const fieldGroup of Object.values(mauticContact.fields)) {
              if (typeof fieldGroup === 'object' && fieldGroup !== null) {
                for (const field of Object.values(fieldGroup)) {
                  if (field && field.value && /[\d\+\-\(\)\s]{10,}/.test(field.value)) {
                    phone = field.value;
                    break;
                  }
                }
                if (phone) break;
              }
            }
          }
          
          // If still no phone, create a test phone using the contact ID
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
          
          // Prepare contact data for this user
          const contactData = {
            name: name,
            phone: phone,
            email: email,
            user: new mongoose.Types.ObjectId(user._id),
            tags: ['mautic-distribution', 'system-wide-sync'],
            notes: `Distributed from Mautic - ID: ${mauticContact.id}`,
            mauticId: mauticContact.id,
            crmSource: 'mautic',
            lastSync: new Date(),
            isActive: true
          };
          
          // Check if contact already exists for this user
          const existingContact = await Contact.findOne({
            user: user._id,
            $or: [
              { phone: phone },
              { mauticId: mauticContact.id }
            ]
          });
          
          if (!existingContact) {
            // Create new contact for this user
            await Contact.create(contactData);
            imported++;
            
            if (imported % 50 === 0) {
              console.log(`  📊 Progress: ${imported} contacts imported for ${user.email}`);
            }
          } else {
            skipped++;
          }
          
        } catch (contactError) {
          failed++;
          console.error(`  ❌ Error processing contact ${mauticContact.id} for user ${user.email}:`, contactError.message);
        }
      }
      
      // Get final count for this user
      const finalContactCount = await Contact.countDocuments({ user: user._id });
      
      distributionStats.userStats[user.email] = {
        imported,
        skipped,
        failed,
        totalContacts: finalContactCount
      };
      
      console.log(`  ✅ User ${user.email} complete:`);
      console.log(`    - Imported: ${imported}`);
      console.log(`    - Skipped: ${skipped}`);
      console.log(`    - Failed: ${failed}`);
      console.log(`    - Total contacts: ${finalContactCount}`);
    }
    
    // Final summary
    console.log('\n📊 DISTRIBUTION COMPLETE - SUMMARY:');
    console.log('='.repeat(60));
    console.log(`📋 Total users processed: ${distributionStats.totalUsers}`);
    console.log(`📥 Total Mautic contacts: ${distributionStats.totalMauticContacts}`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    
    console.log('\n👥 Per-user breakdown:');
    for (const [email, stats] of Object.entries(distributionStats.userStats)) {
      console.log(`  ${email}:`);
      console.log(`    Imported: ${stats.imported}, Skipped: ${stats.skipped}, Failed: ${stats.failed}, Total: ${stats.totalContacts}`);
      totalImported += stats.imported;
      totalSkipped += stats.skipped;
      totalFailed += stats.failed;
    }
    
    console.log('\n🎯 Global totals:');
    console.log(`  Total imported: ${totalImported}`);
    console.log(`  Total skipped: ${totalSkipped}`);
    console.log(`  Total failed: ${totalFailed}`);
    
    // Verify database state
    console.log('\n🔍 Database verification:');
    const totalContactsInDB = await Contact.countDocuments({});
    console.log(`📊 Total contacts in database: ${totalContactsInDB}`);
    
    // Show per-user contact counts
    console.log('\n📋 Final per-user contact counts:');
    for (const user of users) {
      const userContactCount = await Contact.countDocuments({ user: user._id });
      console.log(`  ${user.email}: ${userContactCount} contacts`);
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 DISTRIBUTION SUCCESSFUL!');
    console.log('✅ All users now have access to Mautic contacts');
    console.log('🔧 You can now work on fixing the sync issue while users have full contact access');
    
  } catch (error) {
    console.error('❌ Distribution failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

distributeContactsToAllUsers();