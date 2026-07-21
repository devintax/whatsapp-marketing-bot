require('dotenv').config();
const mongoose = require('mongoose');

async function analyzeCRMIntegrationState() {
    try {
        console.log('🔍 ANALYZING CURRENT CRM INTEGRATION STATE');
        console.log('===========================================\n');

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

        const integrations = await CRMIntegration.find({}).sort({ updatedAt: -1 });
        console.log(`📊 Found ${integrations.length} CRM integrations:\n`);

        integrations.forEach((integration, index) => {
            const timeDiff = Date.now() - integration.updatedAt.getTime();
            const isRecent = timeDiff < 300000; // 5 minutes
            
            console.log(`${index + 1}. ${integration.name} (${integration.type}) ${isRecent ? '🔥 RECENT' : ''}`);
            console.log(`   ID: ${integration._id}`);
            console.log(`   Status: ${integration.status}`);
            console.log(`   User ID: ${integration.userId || 'NOT SET'}`);
            console.log(`   Created: ${integration.createdAt}`);
            console.log(`   Updated: ${integration.updatedAt} (${Math.round(timeDiff/1000)}s ago)`);
            
            if (integration.credentials) {
                console.log('   📋 Credentials:');
                Object.keys(integration.credentials).forEach(key => {
                    const value = integration.credentials[key];
                    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
                        console.log(`     ${key}: ${value ? `${value.substring(0, 8)}***` : 'NOT SET'}`);
                    } else {
                        console.log(`     ${key}: ${value || 'NOT SET'}`);
                    }
                });
            }
            
            if (integration.settings) {
                console.log('   ⚙️ Settings:', Object.keys(integration.settings));
            }
            console.log('');
        });

        // Check for the most recent integration that was tested
        const mostRecent = integrations[0];
        if (mostRecent) {
            console.log('🎯 ANALYZING MOST RECENT INTEGRATION:');
            console.log('=====================================');
            console.log(`Integration ID: ${mostRecent._id}`);
            console.log(`Status: ${mostRecent.status}`);
            
            if (mostRecent.credentials) {
                console.log('\n🔑 CREDENTIAL ANALYSIS:');
                const creds = mostRecent.credentials;
                console.log(`✓ API URL: ${creds.apiUrl ? 'SET' : 'MISSING'}`);
                console.log(`✓ Client ID: ${creds.clientId ? 'SET' : 'MISSING'}`);
                console.log(`✓ Client Secret: ${creds.clientSecret ? 'SET' : 'MISSING'}`);
                console.log(`✓ Redirect URI: ${creds.redirectUri ? 'SET' : 'MISSING'}`);
                
                if (creds.clientSecret === 'PLEASE_SET_YOUR_CLIENT_SECRET_HERE') {
                    console.log('❌ CLIENT SECRET IS PLACEHOLDER - THIS IS THE ISSUE!');
                }
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Analysis complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzeCRMIntegrationState();