const mongoose = require('mongoose');
require('dotenv').config();

async function debugSupportUserIntegration() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const User = require('./models/User');
    
    // CRM Integration Schema (defined in routes/crm.js)
    const crmIntegrationSchema = new mongoose.Schema({
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['mautic', 'suitecrm', 'zoho', 'hubspot', 'google']
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'error'],
        default: 'inactive'
      },
      credentials: {
        apiUrl: String,
        apiKey: String,
        clientId: String,
        clientSecret: String,
        username: String,
        password: String,
        accessToken: String,
        refreshToken: String,
        tokenExpiresAt: Date,
        dataCenter: String
      },
      settings: {
        syncDirection: {
          type: String,
          enum: ['import', 'export', 'bidirectional'],
          default: 'import'
        },
        syncFrequency: {
          type: String,
          enum: ['manual', 'hourly', 'daily', 'weekly'],
          default: 'manual'
        },
        fieldMapping: {
          type: Map,
          of: String
        }
      },
      lastSync: Date,
      lastSyncResults: {
        imported: { type: Number, default: 0 },
        updated: { type: Number, default: 0 },
        skipped: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        errors: [String]
      }
    }, {
      timestamps: true
    });

    const CRMIntegration = mongoose.model('CRMIntegration', crmIntegrationSchema);
    
    // Find support user
    console.log('\n🔍 Finding support user...');
    const supportUser = await User.findOne({ email: 'support@dfgbusiness.com' });
    
    if (!supportUser) {
      console.log('❌ Support user not found');
      return;
    }
    
    console.log('✅ Support user found:', {
      id: supportUser._id,
      email: supportUser.email,
      role: supportUser.role
    });
    
    // Find their integrations
    console.log('\n🔍 Finding support user integrations...');
    const integrations = await CRMIntegration.find({ user: supportUser._id });
    
    console.log(`📋 Found ${integrations.length} integrations for support user`);
    
    for (const integration of integrations) {
      console.log('\n📊 Integration Details:');
      console.log('- ID:', integration._id);
      console.log('- Type:', integration.type);
      console.log('- Status:', integration.status);
      console.log('- Created:', integration.createdAt);
      console.log('- Updated:', integration.updatedAt);
      
      // Check credentials without exposing sensitive data
      const credentialKeys = Object.keys(integration.credentials || {});
      console.log('- Credential Keys:', credentialKeys);
      
      // Check specific credential availability
      const credentials = integration.credentials || {};
      console.log('- Credential Status:');
      console.log('  * apiUrl:', credentials.apiUrl || 'Missing');
      console.log('  * username:', credentials.username ? 'Present' : 'Missing');
      console.log('  * password:', credentials.password ? 'Present' : 'Missing');
      console.log('  * accessToken:', credentials.accessToken ? 'Present' : 'Missing');
      console.log('  * refreshToken:', credentials.refreshToken ? 'Present' : 'Missing');
      console.log('  * clientId:', credentials.clientId ? 'Present' : 'Missing');
      console.log('  * clientSecret:', credentials.clientSecret ? 'Present' : 'Missing');
    }
    
    // Check if we need to create/fix the integration
    const mauticIntegration = integrations.find(i => i.type === 'mautic');
    
    if (!mauticIntegration) {
      console.log('\n❌ No Mautic integration found for support user');
      console.log('🔧 Creating Mautic integration with proper credentials...');
      
      const newIntegration = new CRMIntegration({
        user: supportUser._id,
        type: 'mautic',
        status: 'active',
        credentials: {
          apiUrl: 'https://dfgbusiness.com/mautic',
          username: 'admin@dfgbusiness.com',
          password: 'GISpcServer2017$!',
          clientId: '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o',
          clientSecret: '4bh40uggxekg8sws48sccs8g0oks4ok8c8gskk84gwgwskwsko'
        },
        settings: {
          syncFrequency: 'manual',
          lastSync: null,
          autoSync: false
        }
      });
      
      await newIntegration.save();
      console.log('✅ Created new Mautic integration for support user');
      
    } else if (!mauticIntegration.credentials?.username || !mauticIntegration.credentials?.password) {
      console.log('\n🔧 Fixing existing Mautic integration credentials...');
      
      mauticIntegration.credentials = {
        ...mauticIntegration.credentials,
        apiUrl: 'https://dfgbusiness.com/mautic',
        username: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!',
        clientId: '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o',
        clientSecret: '4bh40uggxekg8sws48sccs8g0oks4ok8c8gskk84gwgwskwsko'
      };
      
      await mauticIntegration.save();
      console.log('✅ Updated Mautic integration credentials');
    } else {
      console.log('\n✅ Mautic integration appears to have credentials');
    }
    
    // Test the credentials by making a simple API call
    console.log('\n🧪 Testing Mautic API credentials...');
    const axios = require('axios');
    
    try {
      const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
        auth: {
          username: 'admin@dfgbusiness.com',
          password: 'GISpcServer2017$!'
        },
        params: {
          limit: 1
        },
        timeout: 15000
      });
      
      const contacts = response.data.contacts || {};
      const contactCount = Object.keys(contacts).length;
      console.log(`✅ API test successful - found ${contactCount} contacts (limited to 1)`);
      
    } catch (apiError) {
      console.error('❌ API test failed:', apiError.message);
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n🔚 Debug complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugSupportUserIntegration();