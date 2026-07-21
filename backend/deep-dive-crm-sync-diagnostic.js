/**
 * Deep Dive CRM Sync Diagnostic
 * Trace the exact sync process and identify failure points
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function deepDiveCRMSyncDiagnostic() {
    console.log('🔍 DEEP DIVE CRM SYNC DIAGNOSTIC');
    console.log('═'.repeat(60));
    
    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        return;
    }
    
    const BASE_URL = 'https://connect.vemgootech.info';
    
    try {
        // Step 1: Get CRM integrations from your database
        console.log('\n📊 STEP 1: Checking CRM Integrations in Database');
        console.log('━'.repeat(50));
        
        // The CRM model is defined inline in the routes file, so we need to get it differently
        const db = mongoose.connection.db;
        const crmCollection = await db.collection('crmintegrations').find({}).toArray();
        
        console.log(`Found ${crmCollection.length} CRM integrations:`);
        crmCollection.forEach((crm, index) => {
            console.log(`  ${index + 1}. ID: ${crm._id}`);
            console.log(`     Type: ${crm.type}`);
            console.log(`     Name: ${crm.name}`);
            console.log(`     Status: ${crm.status || 'unknown'}`);
            console.log(`     API URL: ${crm.credentials?.apiUrl || 'not set'}`);
            console.log(`     Has Access Token: ${crm.credentials?.accessToken ? 'YES' : 'NO'}`);
            console.log(`     Has Client ID: ${crm.credentials?.clientId ? 'YES' : 'NO'}`);
            console.log(`     Has Client Secret: ${crm.credentials?.clientSecret ? 'YES' : 'NO'}`);
            console.log(`     Last Sync: ${crm.lastSync || 'never'}`);
            console.log('');
        });
        
        if (crmCollection.length === 0) {
            console.log('❌ No CRM integrations found in database!');
            console.log('   This may be the root cause of sync failure');
            return;
        }
        
        // Step 2: Test each CRM integration
        for (const crm of crmCollection) {
            console.log(`\n🧪 STEP 2: Testing CRM Integration ${crm._id}`);
            console.log('━'.repeat(50));
            
            // Test connection
            console.log('🔍 Testing connection...');
            try {
                const testUrl = `${BASE_URL}/api/crm/${crm._id}/test`;
                console.log(`📡 POST ${testUrl}`);
                
                const testResponse = await axios.post(testUrl, {}, {
                    timeout: 15000,
                    validateStatus: () => true // Accept all status codes
                });
                
                console.log(`   Status: ${testResponse.status}`);
                console.log(`   Response: ${JSON.stringify(testResponse.data, null, 2)}`);
                
            } catch (error) {
                console.log(`   ❌ Test failed: ${error.message}`);
            }
            
            // Test sync
            console.log('\n📥 Testing sync...');
            try {
                const syncUrl = `${BASE_URL}/api/crm/${crm._id}/sync`;
                console.log(`📡 POST ${syncUrl}`);
                
                const syncResponse = await axios.post(syncUrl, {}, {
                    timeout: 30000,
                    validateStatus: () => true // Accept all status codes
                });
                
                console.log(`   Status: ${syncResponse.status}`);
                console.log(`   Response: ${JSON.stringify(syncResponse.data, null, 2)}`);
                
                // Check if contacts were actually added
                console.log('\n📊 Checking contact count after sync...');
                const Contact = require('./models/Contact');
                const contactCountBefore = await Contact.countDocuments();
                
                // Wait a moment and check again
                setTimeout(async () => {
                    const contactCountAfter = await Contact.countDocuments();
                    console.log(`   Contacts before sync: ${contactCountBefore}`);
                    console.log(`   Contacts after sync: ${contactCountAfter}`);
                    console.log(`   New contacts added: ${contactCountAfter - contactCountBefore}`);
                }, 2000);
                
            } catch (error) {
                console.log(`   ❌ Sync failed: ${error.message}`);
            }
        }
        
        // Step 3: Direct Mautic API test
        console.log('\n🎯 STEP 3: Direct Mautic API Test');
        console.log('━'.repeat(50));
        
        console.log('🔐 Testing Mautic authentication...');
        const mauticConfig = {
            baseUrl: process.env.MAUTIC_BASE_URL,
            clientId: process.env.MAUTIC_CLIENT_ID,
            clientSecret: process.env.MAUTIC_CLIENT_SECRET
        };
        
        try {
            const authUrl = `${mauticConfig.baseUrl}/oauth/v2/token`;
            const authData = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: mauticConfig.clientId,
                client_secret: mauticConfig.clientSecret
            });
            
            const authResponse = await axios.post(authUrl, authData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });
            
            console.log('✅ Mautic authentication successful');
            const accessToken = authResponse.data.access_token;
            
            // Get Mautic contacts
            console.log('📊 Fetching Mautic contacts...');
            const contactsUrl = `${mauticConfig.baseUrl}/api/contacts?limit=5`;
            const contactsResponse = await axios.get(contactsUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                timeout: 15000
            });
            
            console.log(`   Total contacts in Mautic: ${contactsResponse.data.total}`);
            console.log(`   Retrieved sample: ${Object.keys(contactsResponse.data.contacts || {}).length}`);
            
            const contacts = Object.values(contactsResponse.data.contacts || {});
            if (contacts.length > 0) {
                console.log('\n📋 Sample Mautic contact:');
                const sample = contacts[0];
                console.log(`   ID: ${sample.id}`);
                console.log(`   Email: ${sample.fields?.core?.email?.value || 'No email'}`);
                console.log(`   Phone: ${sample.fields?.core?.phone?.value || 'No phone'}`);
                console.log(`   Name: ${sample.fields?.core?.firstname?.value || 'No name'}`);
            }
            
        } catch (error) {
            console.log('❌ Mautic API test failed');
            console.log(`   Error: ${error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message}`);
        }
        
        // Step 4: Check sync logs
        console.log('\n📄 STEP 4: Checking Recent Sync Activity');
        console.log('━'.repeat(50));
        
        try {
            const Contact = require('./models/Contact');
            const recentContacts = await Contact.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name phone email crmSource mauticId createdAt');
            
            console.log(`📊 Recent contacts in database (${recentContacts.length}):`);
            recentContacts.forEach((contact, index) => {
                console.log(`  ${index + 1}. ${contact.name || 'No name'} (${contact.phone || 'No phone'})`);
                console.log(`     Email: ${contact.email || 'No email'}`);
                console.log(`     CRM Source: ${contact.crmSource || 'unknown'}`);
                console.log(`     Mautic ID: ${contact.mauticId || 'none'}`);
                console.log(`     Created: ${contact.createdAt}`);
                console.log('');
            });
            
        } catch (error) {
            console.log(`❌ Could not check recent contacts: ${error.message}`);
        }
        
        // Step 5: Analyze the exact sync endpoint
        console.log('\n🔍 STEP 5: Analyzing Backend Sync Endpoint');
        console.log('━'.repeat(50));
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            const crmRoutePath = path.join(__dirname, 'routes', 'crm.js');
            if (fs.existsSync(crmRoutePath)) {
                console.log('📄 Reading CRM routes file...');
                const crmRoutes = fs.readFileSync(crmRoutePath, 'utf8');
                
                // Extract sync function
                const syncFunctionMatch = crmRoutes.match(/router\.post.*\/sync.*?(\{[\s\S]*?\n\});/);
                if (syncFunctionMatch) {
                    console.log('🔍 Found sync endpoint code:');
                    console.log(syncFunctionMatch[0]);
                } else {
                    console.log('⚠️ Could not find sync endpoint in routes file');
                }
            } else {
                console.log('❌ CRM routes file not found');
            }
            
        } catch (error) {
            console.log(`❌ Could not analyze backend code: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the diagnostic
deepDiveCRMSyncDiagnostic().catch(console.error);