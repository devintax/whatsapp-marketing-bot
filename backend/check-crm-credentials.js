require('dotenv').config();
const mongoose = require('mongoose');

async function checkCurrentCRMCredentials() {
    try {
        console.log('🔍 CHECKING CURRENT CRM CREDENTIALS');
        console.log('=====================================\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const CRMIntegration = mongoose.model('CRMIntegration', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            type: String,
            name: String,
            credentials: mongoose.Schema.Types.Mixed,
            status: String,
            settings: mongoose.Schema.Types.Mixed,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }));

        const integrations = await CRMIntegration.find({});
        console.log(`Found ${integrations.length} CRM integrations:\n`);

        integrations.forEach((integration, index) => {
            console.log(`${index + 1}. ${integration.name} (${integration.type})`);
            console.log(`   Status: ${integration.status}`);
            console.log(`   User ID: ${integration.userId}`);
            console.log(`   Created: ${integration.createdAt}`);
            console.log(`   Credentials:`);
            
            if (integration.credentials) {
                Object.keys(integration.credentials).forEach(key => {
                    const value = integration.credentials[key];
                    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
                        console.log(`     ${key}: ${value ? '***HIDDEN***' : 'NOT SET'}`);
                    } else {
                        console.log(`     ${key}: ${value || 'NOT SET'}`);
                    }
                });
            } else {
                console.log(`     No credentials found`);
            }
            console.log('');
        });

        console.log('🎯 MAUTIC OAUTH2 SETUP REQUIREMENTS:');
        console.log('====================================');
        console.log('Go to: https://dfgbusiness.com/mautic/s/credentials');
        console.log('1. Create new OAuth2 API Credentials');
        console.log('2. Set Name: "WhatsApp Marketing Bot"');
        console.log('3. Set Redirect URI: "https://connect.vemgootech.info/api/auth/mautic/callback"');
        console.log('4. Select Scopes: contacts:read, contacts:write, campaigns:read');
        console.log('5. Save and copy the Client ID and Client Secret');
        console.log('6. Come back here with those credentials\n');

        await mongoose.disconnect();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkCurrentCRMCredentials();