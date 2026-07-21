#!/usr/bin/env node

/**
 * Fix CRM Integration Database Records
 * This script fixes the CRM integration records with proper credentials
 */

const mongoose = require('mongoose');
require('dotenv').config();

// CRM Integration Schema (matching the backend)
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
    fieldMapping: mongoose.Schema.Types.Mixed,
    filters: mongoose.Schema.Types.Mixed
  },
  syncStats: {
    lastSync: Date,
    totalContacts: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  }
}, { timestamps: true });

const CRMIntegration = mongoose.model('CRMIntegration', crmIntegrationSchema);

async function fixCRMDatabase() {
  console.log('🔧 FIXING CRM DATABASE RECORDS');
  console.log('='.repeat(50));

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user ID (support@dfgbusiness.com)
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      name: String,
      role: String
    }));

    const user = await User.findOne({ email: 'support@dfgbusiness.com' });
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);

    // Delete existing broken integrations
    const deletedCount = await CRMIntegration.deleteMany({ user: user._id });
    console.log(`🗑️ Deleted ${deletedCount.deletedCount} existing integrations`);

    // Create new working integration
    const newIntegration = new CRMIntegration({
      user: user._id,
      name: 'DFG Business Mautic CRM',
      type: 'mautic',
      status: 'inactive', // Will be set to active after OAuth2
      credentials: {
        apiUrl: process.env.MAUTIC_BASE_URL,
        clientId: process.env.MAUTIC_CLIENT_ID,
        clientSecret: process.env.MAUTIC_CLIENT_SECRET,
        username: 'admin@dfgbusiness.com', // For fallback basic auth
        password: 'GISpcServer2017$!' // For fallback basic auth
      },
      settings: {
        syncDirection: 'import',
        syncFrequency: 'manual'
      },
      syncStats: {
        totalContacts: 0,
        imported: 0,
        updated: 0,
        failed: 0
      }
    });

    await newIntegration.save();
    console.log(`✅ Created new CRM integration: ${newIntegration._id}`);
    console.log(`   Name: ${newIntegration.name}`);
    console.log(`   Type: ${newIntegration.type}`);
    console.log(`   API URL: ${newIntegration.credentials.apiUrl}`);
    console.log(`   Client ID: ${newIntegration.credentials.clientId?.substring(0, 10)}...`);
    console.log(`   Username: ${newIntegration.credentials.username}`);

    // Test the new integration
    await testNewIntegration(newIntegration);

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function testNewIntegration(integration) {
  console.log('\n🧪 Testing new integration...');
  
  const axios = require('axios');
  
  try {
    // Test basic auth first (fallback method)
    console.log('   Testing basic authentication...');
    const response = await axios.get(`${integration.credentials.apiUrl}/api/contacts`, {
      auth: {
        username: integration.credentials.username,
        password: integration.credentials.password
      },
      params: {
        limit: 1
      },
      timeout: 10000
    });
    
    console.log(`   ✅ Basic auth test passed (Status: ${response.status})`);
    console.log(`   📊 API Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('   ⚠️ Basic auth failed (403) - OAuth2 required');
      console.log('   📝 This is expected - Mautic likely requires OAuth2');
    } else {
      console.log(`   ❌ Basic auth test failed: ${error.message}`);
    }
  }
  
  // Test OAuth2 authorization URL generation
  console.log('   Testing OAuth2 URL generation...');
  try {
    const oauthUrl = `${integration.credentials.apiUrl}/oauth/v2/authorize?` +
      `client_id=${encodeURIComponent(integration.credentials.clientId)}&` +
      `redirect_uri=${encodeURIComponent(process.env.MAUTIC_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=contacts:read contacts:write campaigns:read`;
    
    console.log(`   ✅ OAuth2 URL generated successfully`);
    console.log(`   🔗 URL: ${oauthUrl.substring(0, 100)}...`);
    
  } catch (error) {
    console.log(`   ❌ OAuth2 URL generation failed: ${error.message}`);
  }
}

// Run fix
fixCRMDatabase().catch(console.error);