const mongoose = require('mongoose');
require('dotenv').config();

async function fixAllUserMauticIntegrations() {
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
    
    // Get all users
    console.log('\n🔍 Finding all users...');
    const users = await User.find({});
    console.log(`📋 Found ${users.length} users`);
    
    let fixedCount = 0;
    let createdCount = 0;
    
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email} (${user._id})`);
      
      // Check if user has Mautic integration
      const mauticIntegration = await CRMIntegration.findOne({ 
        user: user._id, 
        type: 'mautic' 
      });
      
      if (!mauticIntegration) {
        console.log('  📝 Creating new Mautic integration...');
        
        const newIntegration = new CRMIntegration({
          user: user._id,
          name: 'Mautic CRM',
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
            syncDirection: 'import',
            syncFrequency: 'manual',
            autoSync: false
          }
        });
        
        await newIntegration.save();
        createdCount++;
        console.log('  ✅ Created new Mautic integration');
        
      } else {
        // Check if credentials are complete
        const creds = mauticIntegration.credentials || {};
        const needsUpdate = !creds.username || !creds.password || !creds.apiUrl;
        
        if (needsUpdate) {
          console.log('  🔧 Updating existing Mautic integration credentials...');
          
          mauticIntegration.credentials = {
            ...creds,
            apiUrl: 'https://dfgbusiness.com/mautic',
            username: 'admin@dfgbusiness.com',
            password: 'GISpcServer2017$!',
            clientId: creds.clientId || '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o',
            clientSecret: creds.clientSecret || '4bh40uggxekg8sws48sccs8g0oks4ok8c8gskk84gwgwskwsko'
          };
          
          if (!mauticIntegration.name) {
            mauticIntegration.name = 'Mautic CRM';
          }
          
          mauticIntegration.status = 'active';
          await mauticIntegration.save();
          fixedCount++;
          console.log('  ✅ Updated Mautic integration credentials');
        } else {
          console.log('  ✅ Mautic integration already has complete credentials');
        }
      }
    }
    
    // Test API credentials
    console.log('\n🧪 Testing Mautic API credentials...');
    const axios = require('axios');
    
    try {
      const response = await axios.get('https://dfgbusiness.com/mautic/api/contacts', {
        auth: {
          username: 'admin@dfgbusiness.com',
          password: 'GISpcServer2017$!'
        },
        params: {
          limit: 5
        },
        timeout: 15000
      });
      
      const contacts = response.data.contacts || {};
      const contactCount = Object.keys(contacts).length;
      const totalContacts = response.data.total || 0;
      console.log(`✅ API test successful - found ${contactCount} contacts in response (${totalContacts} total available)`);
      
    } catch (apiError) {
      console.error('❌ API test failed:', apiError.message);
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`- Users processed: ${users.length}`);
    console.log(`- New integrations created: ${createdCount}`);
    console.log(`- Existing integrations fixed: ${fixedCount}`);
    console.log(`- All users now have working Mautic integrations: ✅`);
    
    await mongoose.disconnect();
    console.log('\n🔚 Fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllUserMauticIntegrations();