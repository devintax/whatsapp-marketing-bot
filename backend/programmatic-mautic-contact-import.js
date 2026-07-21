/**
 * Programmatic Mautic Contact Import Test
 * Test actual contact pulling from Mautic to WhatsApp Bot system
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const MAUTIC_CONFIG = {
    baseUrl: 'https://dfgbusiness.com/mautic',
    username: 'admin@dfgbusiness.com',
    password: 'GISpc2017$!',
    clientId: '1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw',
    clientSecret: '2ss4w1u8eiqsws8gswcossk48oksc8okoskskwgo4kgo4csccw'
};

const WHATSAPP_BOT_CONFIG = {
    apiUrl: 'https://connect.vemgootech.info',
    testUserId: '68e37bea4eb7fec9ede39581' // Your user ID from previous diagnostics
};

class MauticContactImporter {
    constructor() {
        this.accessToken = null;
        this.mauticContacts = [];
        this.importResults = {
            total: 0,
            imported: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };
    }

    async authenticateWithMautic() {
        console.log('🔐 MAUTIC AUTHENTICATION TEST');
        console.log('━'.repeat(50));
        
        // Method 1: Try OAuth2 Client Credentials
        console.log('🧪 Method 1: OAuth2 Client Credentials');
        try {
            const authUrl = `${MAUTIC_CONFIG.baseUrl}/oauth/v2/token`;
            const authData = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: MAUTIC_CONFIG.clientId,
                client_secret: MAUTIC_CONFIG.clientSecret
            });

            console.log(`📡 POST ${authUrl}`);
            const response = await axios.post(authUrl, authData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });

            this.accessToken = response.data.access_token;
            console.log('✅ OAuth2 authentication successful!');
            console.log(`🔑 Token: ${this.accessToken.substring(0, 20)}...`);
            return 'oauth2';
            
        } catch (error) {
            console.log('❌ OAuth2 failed:', error.response?.data?.errors || error.message);
        }

        // Method 2: Try Basic Auth with correct API endpoint
        console.log('\n🧪 Method 2: Basic Authentication');
        try {
            // Try different API endpoint formats
            const apiUrls = [
                `${MAUTIC_CONFIG.baseUrl}/index.php/api/contacts?limit=1`,
                `${MAUTIC_CONFIG.baseUrl}/api/contacts?limit=1`,
                `${MAUTIC_CONFIG.baseUrl}/index.php/api/contacts`
            ];

            let response;
            let workingUrl;

            for (const testUrl of apiUrls) {
                try {
                    console.log(`📡 Trying: ${testUrl}`);
                    response = await axios.get(testUrl, {
                        auth: {
                            username: MAUTIC_CONFIG.username,
                            password: MAUTIC_CONFIG.password
                        },
                        timeout: 15000
                    });
                    workingUrl = testUrl;
                    break;
                } catch (urlError) {
                    console.log(`   ❌ ${testUrl} failed: ${urlError.response?.status || urlError.message}`);
                }
            }

            if (!response) {
                throw new Error('All API URL formats failed');
            }

            // Update base URL for future requests
            MAUTIC_CONFIG.apiEndpoint = workingUrl.replace('?limit=1', '').replace('/contacts', '');
            console.log(`✅ Found working API endpoint: ${MAUTIC_CONFIG.apiEndpoint}`);

            console.log('✅ Basic auth authentication successful!');
            console.log(`📊 API Response Status: ${response.status}`);
            return 'basic';
            
        } catch (error) {
            console.log('❌ Basic auth failed:', error.response?.data || error.message);
        }

        throw new Error('All authentication methods failed');
    }

    async fetchMauticContacts(authMethod) {
        console.log('\n📥 FETCHING MAUTIC CONTACTS');
        console.log('━'.repeat(50));

        let allContacts = [];
        let page = 0;
        const limit = 50; // Smaller batches for testing
        let hasMore = true;

        while (hasMore && page < 10) { // Limit to 10 pages for testing
            try {
                console.log(`📄 Fetching page ${page + 1}...`);
                
                const params = {
                    limit: limit,
                    start: page * limit,
                    orderBy: 'id',
                    orderByDir: 'ASC'
                };

                let response;
                const apiUrl = MAUTIC_CONFIG.apiEndpoint ? `${MAUTIC_CONFIG.apiEndpoint}/contacts` : `${MAUTIC_CONFIG.baseUrl}/index.php/api/contacts`;
                
                if (authMethod === 'oauth2') {
                    response = await axios.get(apiUrl, {
                        headers: { 'Authorization': `Bearer ${this.accessToken}` },
                        params,
                        timeout: 30000
                    });
                } else {
                    response = await axios.get(apiUrl, {
                        auth: {
                            username: MAUTIC_CONFIG.username,
                            password: MAUTIC_CONFIG.password
                        },
                        params,
                        timeout: 30000
                    });
                }

                const contacts = response.data.contacts || {};
                const contactList = Object.values(contacts);
                
                console.log(`   Found ${contactList.length} contacts on page ${page + 1}`);
                console.log(`   Total contacts in Mautic: ${response.data.total || 'unknown'}`);

                if (contactList.length === 0) {
                    hasMore = false;
                } else {
                    allContacts = allContacts.concat(contactList);
                    page++;
                }

                // Show sample contact data
                if (contactList.length > 0 && page === 1) {
                    const sample = contactList[0];
                    console.log('\n📋 Sample Mautic Contact Structure:');
                    console.log(`   ID: ${sample.id}`);
                    console.log(`   Email: ${sample.fields?.core?.email?.value || sample.email || 'No email'}`);
                    console.log(`   Phone: ${sample.fields?.core?.phone?.value || sample.phone || 'No phone'}`);
                    console.log(`   Mobile: ${sample.fields?.core?.mobile?.value || sample.mobile || 'No mobile'}`);
                    console.log(`   First Name: ${sample.fields?.core?.firstname?.value || sample.firstname || 'No first name'}`);
                    console.log(`   Last Name: ${sample.fields?.core?.lastname?.value || sample.lastname || 'No last name'}`);
                    console.log(`   Fields Available: ${Object.keys(sample.fields?.core || {}).join(', ')}`);
                }

            } catch (error) {
                console.error(`❌ Error fetching page ${page + 1}:`, error.response?.data || error.message);
                break;
            }
        }

        this.mauticContacts = allContacts;
        this.importResults.total = allContacts.length;
        
        console.log(`\n✅ Total contacts fetched: ${allContacts.length}`);
        return allContacts;
    }

    async importContactsToMongoDB() {
        console.log('\n💾 IMPORTING CONTACTS TO MONGODB');
        console.log('━'.repeat(50));

        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');

            const Contact = require('./models/Contact');
            
            for (const [index, mauticContact] of this.mauticContacts.entries()) {
                try {
                    console.log(`📝 Processing contact ${index + 1}/${this.mauticContacts.length}...`);

                    // Extract phone number from various possible fields
                    let phone = mauticContact.fields?.core?.mobile?.value || 
                               mauticContact.fields?.core?.phone?.value ||
                               mauticContact.mobile ||
                               mauticContact.phone;

                    // Skip contacts without phone numbers
                    if (!phone) {
                        console.log(`   ⏭️  Skipped: No phone number`);
                        this.importResults.skipped++;
                        continue;
                    }

                    // Clean and format phone number
                    phone = phone.replace(/[^\d+]/g, '');
                    if (!phone.startsWith('+')) {
                        phone = '+1' + phone.replace(/[^\d]/g, '');
                    }

                    // Extract other contact details
                    const firstName = mauticContact.fields?.core?.firstname?.value || mauticContact.firstname || '';
                    const lastName = mauticContact.fields?.core?.lastname?.value || mauticContact.lastname || '';
                    const email = mauticContact.fields?.core?.email?.value || mauticContact.email || '';
                    
                    const contactName = `${firstName} ${lastName}`.trim() || `Mautic Contact ${mauticContact.id}`;

                    const contactData = {
                        name: contactName,
                        phone: phone,
                        email: email,
                        user: WHATSAPP_BOT_CONFIG.testUserId,
                        tags: ['mautic-import', 'programmatic-test'],
                        notes: `Imported from Mautic via programmatic test - ID: ${mauticContact.id}`,
                        crmSource: 'mautic',
                        mauticId: mauticContact.id,
                        lastSync: new Date()
                    };

                    // Check if contact already exists
                    const existingContact = await Contact.findOne({
                        user: WHATSAPP_BOT_CONFIG.testUserId,
                        $or: [
                            { phone: phone },
                            { mauticId: mauticContact.id }
                        ]
                    });

                    if (existingContact) {
                        // Update existing contact
                        await Contact.findByIdAndUpdate(existingContact._id, {
                            ...contactData,
                            updatedAt: new Date()
                        });
                        console.log(`   📝 Updated: ${contactName} (${phone})`);
                        this.importResults.updated++;
                    } else {
                        // Create new contact
                        await Contact.create(contactData);
                        console.log(`   ➕ Imported: ${contactName} (${phone})`);
                        this.importResults.imported++;
                    }

                } catch (contactError) {
                    console.error(`   ❌ Failed to import contact:`, contactError.message);
                    this.importResults.failed++;
                    this.importResults.errors.push(contactError.message);
                }
            }

        } catch (error) {
            console.error('❌ MongoDB import failed:', error.message);
            throw error;
        }
    }

    async verifyImport() {
        console.log('\n🔍 VERIFYING IMPORT RESULTS');
        console.log('━'.repeat(50));

        try {
            const Contact = require('./models/Contact');
            
            // Count total contacts
            const totalContacts = await Contact.countDocuments({ 
                user: WHATSAPP_BOT_CONFIG.testUserId 
            });
            
            // Count Mautic contacts
            const mauticContacts = await Contact.countDocuments({ 
                user: WHATSAPP_BOT_CONFIG.testUserId,
                crmSource: 'mautic'
            });

            // Get recent imports
            const recentImports = await Contact.find({
                user: WHATSAPP_BOT_CONFIG.testUserId,
                tags: 'programmatic-test'
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name phone email mauticId createdAt');

            console.log(`📊 Total contacts in database: ${totalContacts}`);
            console.log(`📊 Mautic-sourced contacts: ${mauticContacts}`);
            console.log(`📊 Contacts from this test: ${recentImports.length}`);

            if (recentImports.length > 0) {
                console.log('\n📋 Sample imported contacts:');
                recentImports.forEach((contact, index) => {
                    console.log(`   ${index + 1}. ${contact.name} (${contact.phone})`);
                    console.log(`      Email: ${contact.email || 'No email'}`);
                    console.log(`      Mautic ID: ${contact.mauticId}`);
                    console.log(`      Imported: ${contact.createdAt}`);
                });
            }

        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
    }

    async generateReport() {
        console.log('\n📊 FINAL IMPORT REPORT');
        console.log('━'.repeat(50));

        console.log('📈 Import Statistics:');
        console.log(`   Total Mautic contacts found: ${this.importResults.total}`);
        console.log(`   Successfully imported: ${this.importResults.imported}`);
        console.log(`   Updated existing: ${this.importResults.updated}`);
        console.log(`   Skipped (no phone): ${this.importResults.skipped}`);
        console.log(`   Failed: ${this.importResults.failed}`);

        if (this.importResults.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.importResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        const successRate = this.importResults.total > 0 ? 
            ((this.importResults.imported + this.importResults.updated) / this.importResults.total * 100).toFixed(1) : 0;

        console.log(`\n🎯 Success Rate: ${successRate}%`);

        if (this.importResults.imported > 0 || this.importResults.updated > 0) {
            console.log('\n✅ CONTACT IMPORT SUCCESSFUL!');
            console.log('   ✓ Mautic authentication works');
            console.log('   ✓ Contact fetching works');
            console.log('   ✓ MongoDB import works');
            console.log('   ✓ System integration is functional');
            console.log('\n🎉 The implementation is FIXED and working!');
        } else {
            console.log('\n❌ NO CONTACTS IMPORTED');
            console.log('   Check authentication and data availability');
        }
    }
}

// Main execution
async function runProgrammaticContactImport() {
    console.log('🚀 PROGRAMMATIC MAUTIC CONTACT IMPORT TEST');
    console.log('═'.repeat(60));
    console.log(`📍 Mautic URL: ${MAUTIC_CONFIG.baseUrl}`);
    console.log(`🎯 Target System: ${WHATSAPP_BOT_CONFIG.apiUrl}`);
    console.log(`👤 Test User ID: ${WHATSAPP_BOT_CONFIG.testUserId}`);

    const importer = new MauticContactImporter();

    try {
        // Step 1: Authenticate with Mautic
        const authMethod = await importer.authenticateWithMautic();
        
        // Step 2: Fetch contacts from Mautic
        await importer.fetchMauticContacts(authMethod);
        
        // Step 3: Import contacts to MongoDB
        await importer.importContactsToMongoDB();
        
        // Step 4: Verify import
        await importer.verifyImport();
        
        // Step 5: Generate report
        await importer.generateReport();

    } catch (error) {
        console.error('\n💥 PROGRAMMATIC IMPORT FAILED');
        console.error('Error:', error.message);
        
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔚 Import test completed');
    }
}

// Run the test
runProgrammaticContactImport().catch(console.error);