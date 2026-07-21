#!/usr/bin/env node

/**
 * Quick test for CRM connection fix
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000';

async function quickTest() {
  console.log('🧪 TESTING CRM CONNECTION FIX');
  console.log('='.repeat(40));

  try {
    // 1. Login
    const authResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'support@dfgbusiness.com',
      password: 'GISpc2017$!'
    });
    
    console.log('✅ Login successful');
    const token = authResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // 2. Get CRM integrations
    const crmResponse = await axios.get(`${API_BASE}/api/crm`, { headers });
    const integration = crmResponse.data.integrations[0];
    
    console.log(`✅ Found integration: ${integration.name}`);

    // 3. Test connection (this should now give a proper error message)
    console.log('\n🔌 Testing connection...');
    try {
      const testResponse = await axios.post(`${API_BASE}/api/crm/${integration._id}/test`, {}, { headers });
      console.log('✅ Connection test response:', testResponse.data);
    } catch (testError) {
      console.log('⚠️ Connection test failed (expected):');
      console.log('   Response:', testError.response?.data);
      
      // Check if we get a proper error message now (not the generic 500)
      const errorData = testError.response?.data;
      if (errorData && errorData.message && !errorData.message.includes('error #500')) {
        console.log('✅ Error message is now descriptive!');
      } else {
        console.log('❌ Still getting generic error message');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest().catch(console.error);