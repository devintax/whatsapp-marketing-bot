#!/usr/bin/env node
// Deep Dive Campaign Creation 500 Error Analysis
console.log('🔍 DEEP DIVE: Campaign Creation 500 Error Analysis');
console.log('==================================================');

const https = require('https');

// Test campaign creation with detailed error capture
const testCampaignCreation = () => {
  return new Promise((resolve) => {
    // Sample campaign data that mimics what frontend sends
    const campaignData = {
      name: "Test Campaign Debug",
      message: "Hello, this is a test message for debugging purposes.",
      type: "manual",
      status: "draft",
      recipients: ["1234567890"],
      scheduledDate: new Date().toISOString(),
      mediaFiles: []
    };

    const postData = JSON.stringify(campaignData);
    
    const options = {
      hostname: 'api.vemgootech.info',
      port: 443,
      path: '/api/campaigns',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Debug-Test-Script',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 15000
    };

    console.log('\n🎯 Testing Campaign Creation...');
    console.log('📤 Request Data:', JSON.stringify(campaignData, null, 2));
    console.log(`🔗 URL: https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      console.log(`\n📊 Response Status: ${res.statusCode}`);
      console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📄 Response Body: ${data}`);
        
        if (res.statusCode === 500) {
          console.log('\n🚨 500 ERROR DETECTED!');
          try {
            const errorData = JSON.parse(data);
            console.log('🔍 Parsed Error:', JSON.stringify(errorData, null, 2));
            
            if (errorData.error) {
              console.log('\n❌ Backend Error Details:');
              console.log('Message:', errorData.error.message || errorData.message);
              console.log('Stack:', errorData.error.stack || 'No stack trace');
            }
          } catch (parseError) {
            console.log('❌ Could not parse error response as JSON');
            console.log('Raw error:', data);
          }
        } else if (res.statusCode === 401) {
          console.log('\n🔐 Authentication Required');
          console.log('Need to test with valid auth token');
        } else if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('\n✅ Campaign Created Successfully!');
        }
        
        resolve({ 
          success: res.statusCode < 400, 
          status: res.statusCode, 
          data,
          headers: res.headers 
        });
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ Request Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log('\n⏰ Request Timeout');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
};

// Test with authentication if possible
const testWithAuth = async () => {
  console.log('\n🔐 Testing with Authentication Token...');
  
  // First try to login
  const loginData = {
    email: "test@example.com",
    password: "testpassword"
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(loginData);
    
    const options = {
      hostname: 'api.vemgootech.info',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Login Status: ${res.statusCode}`);
        console.log(`Login Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.write(postData);
    req.end();
  });
};

// Analyze the backend route structure
const analyzeBackendRoutes = () => {
  console.log('\n📋 BACKEND ROUTE ANALYSIS NEEDED:');
  console.log('1. Check backend/routes/campaigns.js POST route');
  console.log('2. Verify Campaign model schema validation');
  console.log('3. Check required fields and data types');
  console.log('4. Examine middleware (auth, validation)');
  console.log('5. Check database connection and operations');
  console.log('6. Verify media upload handling');
};

// Run comprehensive test
const runAnalysis = async () => {
  console.log('\n🏁 STARTING COMPREHENSIVE ANALYSIS');
  
  // Test without auth first
  const result = await testCampaignCreation();
  
  // Test with auth
  const authResult = await testWithAuth();
  
  // Analyze backend
  analyzeBackendRoutes();
  
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('===================');
  console.log(`Campaign Creation: ${result.success ? '✅' : '❌'} (${result.status || result.error})`);
  console.log(`Auth Test: ${authResult.status || authResult.error}`);
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Examine backend campaign route implementation');
  console.log('2. Check MongoDB Campaign model requirements');
  console.log('3. Test with valid authentication token');
  console.log('4. Verify frontend data format matches backend expectations');
  console.log('5. Check backend logs for detailed error stack traces');
};

runAnalysis().catch(console.error);