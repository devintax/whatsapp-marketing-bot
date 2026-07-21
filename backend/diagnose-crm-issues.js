#!/usr/bin/env node

/**
 * Diagnose CRM Authentication Issues
 * This script checks database credentials and tests API access
 */

const mongoose = require('mongoose');
require('dotenv').config();

// CRM Integration model (simplified)
const crmIntegrationSchema = new mongoose.Schema({
  name: String,
  type: String,
  userId: mongoose.Schema.Types.ObjectId,
  apiUrl: String,
  clientId: String,
  clientSecret: String,
  username: String,
  password: String,
  accessToken: String,
  refreshToken: String,
  status: String,
  lastSync: Date,
  syncStats: Object
}, { timestamps: true });

const CRMIntegration = mongoose.model('CRMIntegration', crmIntegrationSchema);

async function diagnoseCRMIssues() {
  console.log('🔍 DIAGNOSING CRM AUTHENTICATION ISSUES');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all CRM integrations
    const integrations = await CRMIntegration.find({});
    console.log(`\n📊 Found ${integrations.length} CRM integration(s)`);

    for (const integration of integrations) {
      console.log(`\n🔧 Integration: ${integration.name}`);
      console.log(`   ID: ${integration._id}`);
      console.log(`   Type: ${integration.type}`);
      console.log(`   API URL: ${integration.apiUrl}`);
      console.log(`   Status: ${integration.status}`);
      console.log(`   Created: ${integration.createdAt}`);
      
      // Check credentials (masked for security)
      console.log(`\n🔐 Credentials Check:`);
      console.log(`   Client ID: ${integration.clientId ? integration.clientId.substring(0, 10) + '...' : '❌ Missing'}`);
      console.log(`   Client Secret: ${integration.clientSecret ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Username: ${integration.username || '❌ Missing'}`);
      console.log(`   Password: ${integration.password ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Access Token: ${integration.accessToken ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Refresh Token: ${integration.refreshToken ? '✅ Present' : '❌ Missing'}`);
      
      if (integration.lastSync) {
        console.log(`   Last Sync: ${integration.lastSync}`);
      }
      
      if (integration.syncStats) {
        console.log(`   Sync Stats: ${JSON.stringify(integration.syncStats, null, 2)}`);
      }
    }

    // Test environment variables
    console.log(`\n🌍 Environment Variables Check:`);
    console.log(`   MAUTIC_BASE_URL: ${process.env.MAUTIC_BASE_URL || '❌ Missing'}`);
    console.log(`   MAUTIC_CLIENT_ID: ${process.env.MAUTIC_CLIENT_ID ? process.env.MAUTIC_CLIENT_ID.substring(0, 10) + '...' : '❌ Missing'}`);
    console.log(`   MAUTIC_CLIENT_SECRET: ${process.env.MAUTIC_CLIENT_SECRET ? '✅ Present' : '❌ Missing'}`);
    console.log(`   MAUTIC_REDIRECT_URI: ${process.env.MAUTIC_REDIRECT_URI || '❌ Missing'}`);

    // Test basic connectivity
    console.log(`\n🌐 Testing Basic Connectivity:`);
    await testMauticConnectivity();

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function testMauticConnectivity() {
  const axios = require('axios');
  
  try {
    // Test 1: Basic URL accessibility
    console.log('   Testing basic URL accessibility...');
    const response = await axios.get(process.env.MAUTIC_BASE_URL, {
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log(`   ✅ Mautic URL accessible (Status: ${response.status})`);
    
    // Test 2: API endpoint structure
    console.log('   Testing API endpoint structure...');
    const apiResponse = await axios.get(`${process.env.MAUTIC_BASE_URL}/api`, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`   ✅ API endpoint accessible (Status: ${apiResponse.status})`);
    
    // Test 3: OAuth2 endpoint
    console.log('   Testing OAuth2 endpoint...');
    const oauthUrl = `${process.env.MAUTIC_BASE_URL}/oauth/v2/authorize`;
    const oauthResponse = await axios.get(oauthUrl, {
      timeout: 10000,
      validateStatus: () => true,
      params: {
        client_id: process.env.MAUTIC_CLIENT_ID,
        redirect_uri: process.env.MAUTIC_REDIRECT_URI,
        response_type: 'code'
      }
    });
    
    console.log(`   ✅ OAuth2 endpoint accessible (Status: ${oauthResponse.status})`);
    
  } catch (error) {
    console.log(`   ❌ Connectivity test failed: ${error.message}`);
  }
}

// Run diagnosis
diagnoseCRMIssues().catch(console.error);