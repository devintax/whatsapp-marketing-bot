require('dotenv').config();
const mongoose = require('mongoose');

async function fixMauticCredentials() {
    try {
        console.log('🔧 FIXING MAUTIC CRM CREDENTIALS');
        console.log('=================================\n');

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

        // 1. Delete all existing Mautic integrations (duplicates)
        const deleteResult = await CRMIntegration.deleteMany({ type: 'mautic' });
        console.log(`✅ Deleted ${deleteResult.deletedCount} existing Mautic integrations\n`);

        // 2. Create a single, clean Mautic integration
        const newIntegration = new CRMIntegration({
            userId: new mongoose.Types.ObjectId(), // Will be assigned to first user who logs in
            type: 'mautic',
            name: 'Mautic CRM - DFG Business',
            credentials: {
                apiUrl: 'https://dfgbusiness.com/mautic',
                clientId: '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o',
                clientSecret: 'PLEASE_SET_YOUR_CLIENT_SECRET_HERE', // User needs to provide this
                redirectUri: 'https://connect.vemgootech.info/api/auth/mautic/callback',
                scopes: 'contacts:read contacts:write campaigns:read'
            },
            status: 'pending_auth',
            settings: {
                syncEnabled: true,
                syncInterval: 3600000, // 1 hour
                webhookUrl: 'https://connect.vemgootech.info/api/webhook/mautic-contact'
            }
        });

        await newIntegration.save();
        console.log('✅ Created clean Mautic integration record');
        console.log(`📝 Integration ID: ${newIntegration._id}\n`);

        console.log('🎯 NEXT STEPS:');
        console.log('==============');
        console.log('1. Go to: https://dfgbusiness.com/mautic/s/credentials');
        console.log('2. Find the OAuth2 app with Client ID: 1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o');
        console.log('3. Copy the Client Secret');
        console.log('4. Run: node update-mautic-secret.js');
        console.log('5. Paste the Client Secret when prompted\n');

        // Create the update script
        const updateScript = `require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function updateMauticSecret() {
    await mongoose.connect(process.env.MONGODB_URI);
    
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

    rl.question('Enter your Mautic Client Secret: ', async (clientSecret) => {
        if (!clientSecret || clientSecret.trim() === '') {
            console.log('❌ No client secret provided');
            process.exit(1);
        }

        await CRMIntegration.updateOne(
            { type: 'mautic' },
            { 
                $set: { 
                    'credentials.clientSecret': clientSecret.trim(),
                    'status': 'ready',
                    'updatedAt': new Date()
                }
            }
        );

        console.log('✅ Mautic Client Secret updated successfully!');
        console.log('🚀 You can now test the OAuth2 flow in the frontend');
        
        await mongoose.disconnect();
        rl.close();
    });
}

updateMauticSecret().catch(console.error);`;

        require('fs').writeFileSync('update-mautic-secret.js', updateScript);
        console.log('📝 Created update-mautic-secret.js script\n');

        await mongoose.disconnect();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixMauticCredentials();