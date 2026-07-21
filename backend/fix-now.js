// Direct database fix for the integration
const mongoose = require('mongoose');
require('dotenv').config();

async function fixIntegrationNow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define the CRM Integration schema (copied from routes/crm.js)
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
        autoSync: {
          type: Boolean,
          default: false
        }
      },
      lastSync: {
        type: Date
      },
      syncStats: {
        totalSynced: {
          type: Number,
          default: 0
        },
        lastSyncCount: {
          type: Number,
          default: 0
        },
        errors: [{
          message: String,
          timestamp: {
            type: Date,
            default: Date.now
          }
        }]
      }
    }, {
      timestamps: true
    });

    const CRMIntegration = mongoose.model('CRMIntegration', crmIntegrationSchema);
    
    // Update the specific integration that's being used
    const integrationId = '68f4c592ee0de5bb2c9f567b';
    
    const result = await CRMIntegration.findByIdAndUpdate(integrationId, {
      'credentials.username': 'admin@dfgbusiness.com',
      'credentials.password': 'GISpcServer2017$!',
      'credentials.apiUrl': 'https://dfgbusiness.com/mautic',
      status: 'active'
    }, { new: true });
    
    if (result) {
      console.log('✅ Integration updated successfully');
      console.log('New credentials check:', {
        hasUsername: !!result.credentials.username,
        hasPassword: !!result.credentials.password,
        apiUrl: result.credentials.apiUrl
      });
    } else {
      console.log('❌ Integration not found');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixIntegrationNow();