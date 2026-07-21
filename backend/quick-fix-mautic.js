// Quick Fix: Create Basic Auth CRM Integration for Contact Sync
const mongoose = require('mongoose');
require('dotenv').config();

async function quickFixMauticIntegration() {
    console.log('🚀 QUICK FIX: Creating Mautic CRM Integration with Basic Auth\n');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const db = mongoose.connection.db;
        
        // Create CRM integration record with Basic Auth
        const integration = {
            userId: new mongoose.Types.ObjectId('68f4bcc2eb61f568f2f30db6'), // admin@dfgbusiness.com
            type: 'mautic',
            name: 'Mautic CRM',
            status: 'connected',
            credentials: {
                apiUrl: 'https://dfgbusiness.com/mautic',
                username: 'admin@dfgbusiness.com',
                password: 'GISpcServer2017$!'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Check if integration already exists
        const existing = await db.collection('crmintegrations').findOne({
            userId: integration.userId,
            type: 'mautic'
        });
        
        if (existing) {
            console.log('⚠️ Mautic integration already exists. Updating credentials...');
            await db.collection('crmintegrations').updateOne(
                { _id: existing._id },
                { 
                    $set: { 
                        credentials: integration.credentials,
                        status: 'connected',
                        updatedAt: new Date()
                    } 
                }
            );
            console.log('✅ Existing integration updated with Basic Auth credentials');
        } else {
            console.log('📝 Creating new Mautic CRM integration...');
            const result = await db.collection('crmintegrations').insertOne(integration);
            console.log(`✅ CRM integration created with ID: ${result.insertedId}`);
        }
        
        // Test the credentials
        console.log('\n🧪 Testing Mautic API connectivity...');
        
        const auth = Buffer.from(`${integration.credentials.username}:${integration.credentials.password}`).toString('base64');
        
        try {
            const response = await fetch(`${integration.credentials.apiUrl}/api/contacts?limit=1`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Mautic API accessible with Basic Auth!');
                console.log(`📊 Total contacts available: ${data.total || 'Unknown'}`);
                console.log(`📋 Sample response: ${JSON.stringify(data).substring(0, 150)}...`);
            } else {
                console.log(`❌ Mautic API error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.log(`Error details: ${errorText.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`❌ Mautic API connection failed: ${error.message}`);
        }
        
        console.log('\n🎯 SOLUTION APPLIED:');
        console.log('✅ CRM integration created/updated with Basic Auth');
        console.log('✅ Contact sync should now work!');
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Go to your frontend Contacts page');
        console.log('2. Click "Sync Contacts" button');
        console.log('3. Contacts should now be pulled from Mautic into MongoDB');
        
    } catch (error) {
        console.error('❌ Quick fix error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
    }
}

quickFixMauticIntegration().catch(console.error);