// COMPREHENSIVE CRM OAUTH2 END-TO-END DIAGNOSTIC TOOL
// This will identify the root cause and provide permanent solutions

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

class CRMOAuth2Diagnostics {
  constructor() {
    this.results = {
      issues: [],
      fixes: [],
      recommendations: []
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@cluster0.ijeqwjt.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority&appName=Cluster0';
      await mongoose.connect(mongoUri);
      this.log('success', 'Connected to MongoDB');
      return true;
    } catch (error) {
      this.log('error', 'Database connection failed', error.message);
      this.results.issues.push('Database connection failed');
      return false;
    }
  }

  async step1_CheckDatabaseIntegrations() {
    this.log('info', '🔍 STEP 1: Checking database CRM integrations...');
    
    try {
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
      this.log('info', `Found ${integrations.length} CRM integrations in database`);
      
      if (integrations.length === 0) {
        this.results.issues.push('❌ No CRM integrations found in database');
        this.results.fixes.push('CREATE: Need to create Mautic integration record');
        return false;
      }

      // Check each integration
      for (let integration of integrations) {
        this.log('info', `Checking integration: ${integration.name} (${integration.type})`);
        this.log('info', `Status: ${integration.status}`);
        this.log('info', `Credentials structure:`, Object.keys(integration.credentials || {}));
        
        if (integration.type === 'mautic') {
          const creds = integration.credentials || {};
          
          // Check required fields
          const requiredFields = ['apiUrl', 'clientId', 'clientSecret'];
          const missingFields = requiredFields.filter(field => !creds[field]);
          
          if (missingFields.length > 0) {
            this.results.issues.push(`❌ Missing Mautic credentials: ${missingFields.join(', ')}`);
            this.results.fixes.push(`FIX: Add missing credentials: ${missingFields.join(', ')}`);
          }

          // Check if values are placeholder/empty
          if (creds.apiUrl === 'https://your-mautic-domain.com') {
            this.results.issues.push('❌ Mautic API URL is still placeholder');
            this.results.fixes.push('FIX: Update API URL to: https://dfgbusiness.com/mautic');
          }

          if (creds.clientId === 'your-client-id' || !creds.clientId) {
            this.results.issues.push('❌ Mautic Client ID is placeholder or missing');
            this.results.fixes.push('FIX: Set proper Client ID from Mautic API Credentials');
          }

          if (creds.clientSecret === 'your-client-secret' || !creds.clientSecret) {
            this.results.issues.push('❌ Mautic Client Secret is placeholder or missing');
            this.results.fixes.push('FIX: Set proper Client Secret from Mautic API Credentials');
          }

          return integration;
        }
      }
    } catch (error) {
      this.log('error', 'Database query failed', error.message);
      this.results.issues.push('❌ Database query failed');
      return false;
    }
  }

  async step2_TestMauticServerConnectivity() {
    this.log('info', '🌐 STEP 2: Testing Mautic server connectivity...');
    
    const mauticUrl = 'https://dfgbusiness.com/mautic';
    
    try {
      // Test basic connectivity
      const response = await axios.get(mauticUrl, { timeout: 10000 });
      this.log('success', `Mautic server accessible: ${response.status}`);
      
      // Test API endpoint
      try {
        const apiResponse = await axios.get(`${mauticUrl}/api`, { timeout: 10000 });
        this.log('success', 'Mautic API endpoint accessible');
      } catch (apiError) {
        if (apiError.response?.status === 401) {
          this.log('info', 'API endpoint requires authentication (expected)');
        } else {
          this.log('warning', 'API endpoint test failed', apiError.message);
        }
      }
      
    } catch (error) {
      this.log('error', 'Mautic server connectivity failed', error.message);
      this.results.issues.push('❌ Cannot connect to Mautic server');
      this.results.fixes.push('FIX: Check Mautic server availability and URL');
      return false;
    }
    
    return true;
  }

  async step3_TestOAuth2Configuration() {
    this.log('info', '🔑 STEP 3: Testing OAuth2 configuration...');
    
    // Test OAuth2 endpoints
    const mauticUrl = 'https://dfgbusiness.com/mautic';
    const authUrl = `${mauticUrl}/oauth/v2/authorize`;
    const tokenUrl = `${mauticUrl}/oauth/v2/token`;
    
    try {
      // Test authorization endpoint
      const authResponse = await axios.get(authUrl, { 
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: () => true
      });
      
      if (authResponse.status === 302 || authResponse.status === 200) {
        this.log('success', 'OAuth2 authorization endpoint accessible');
      } else {
        this.log('warning', `OAuth2 auth endpoint returned: ${authResponse.status}`);
      }
      
    } catch (error) {
      this.log('error', 'OAuth2 endpoint test failed', error.message);
      this.results.issues.push('❌ OAuth2 endpoints not accessible');
    }
  }

  async step4_TestBackendAPI() {
    this.log('info', '🔌 STEP 4: Testing backend API endpoints...');
    
    try {
      // Test login first to get token
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!'
      });
      
      const token = loginResponse.data.token;
      this.log('success', 'Backend authentication successful');
      
      // Test CRM endpoints
      const crmResponse = await axios.get('http://localhost:5000/api/crm', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.log('info', `Found ${crmResponse.data.integrations?.length || 0} integrations via API`);
      
      if (crmResponse.data.integrations?.length > 0) {
        const integration = crmResponse.data.integrations[0];
        
        // Test connection endpoint
        const testResponse = await axios.post(
          `http://localhost:5000/api/crm/${integration._id}/test`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        this.log('info', 'Connection test result:', testResponse.data);
        
        if (testResponse.data.errors && testResponse.data.errors.length > 0) {
          const error = testResponse.data.errors[0];
          if (error.message.includes('error #500')) {
            this.results.issues.push('❌ Mautic returning generic error #500');
            this.results.fixes.push('FIX: Check Mautic OAuth2 app configuration');
          }
        }
        
        return testResponse.data;
      }
      
    } catch (error) {
      this.log('error', 'Backend API test failed', error.message);
      this.results.issues.push('❌ Backend API communication failed');
      return false;
    }
  }

  async step5_AnalyzeMauticConfiguration() {
    this.log('info', '⚙️ STEP 5: Analyzing Mautic configuration requirements...');
    
    const requiredSettings = {
      'OAuth2 App Name': 'WhatsApp Marketing Bot',
      'Redirect URI': 'https://connect.vemgootech.info/api/auth/mautic/callback',
      'Grant Types': 'authorization_code, refresh_token',
      'Scopes': 'contacts:read contacts:write campaigns:read',
      'API Access': 'Enabled',
      'Published': 'Yes'
    };
    
    this.log('info', 'Required Mautic OAuth2 App Configuration:');
    Object.entries(requiredSettings).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    this.results.recommendations.push('VERIFY: Mautic OAuth2 app has correct redirect URI');
    this.results.recommendations.push('VERIFY: Mautic OAuth2 app is published and active');
    this.results.recommendations.push('VERIFY: API access is enabled in Mautic');
  }

  async step6_GenerateFixes() {
    this.log('info', '🔧 STEP 6: Generating comprehensive fixes...');
    
    // Always recommend database recreation for safety
    this.results.fixes.push('RECREATE: Clean CRM integration database record');
    this.results.fixes.push('UPDATE: Set correct Mautic credentials');
    this.results.fixes.push('VERIFY: Mautic OAuth2 app configuration');
    this.results.fixes.push('TEST: Complete OAuth2 flow end-to-end');
  }

  async generateFixScript() {
    this.log('info', '📝 Generating automatic fix script...');
    
    const fixScript = `
// AUTOMATIC CRM INTEGRATION FIX SCRIPT
const mongoose = require('mongoose');

async function fixCRMIntegration() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://vemgoo:wms123@whatsappmarketingbot.v3ovu.mongodb.net/whatsapp_marketing_bot');
  
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

  // Delete existing integrations
  await CRMIntegration.deleteMany({});
  console.log('✅ Cleared existing CRM integrations');

  // Create new Mautic integration with correct settings
  const newIntegration = new CRMIntegration({
    userId: new mongoose.Types.ObjectId('68f414cbf6ad6398e4e159f9'), // Support user ID
    type: 'mautic',
    name: 'Mautic CRM - DFG Business',
    credentials: {
      apiUrl: 'https://dfgbusiness.com/mautic',
      clientId: 'YOUR_ACTUAL_CLIENT_ID_FROM_MAUTIC',
      clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET_FROM_MAUTIC',
      redirectUri: 'https://connect.vemgootech.info/api/auth/mautic/callback',
      scopes: 'contacts:read contacts:write campaigns:read'
    },
    status: 'pending_auth',
    settings: {
      syncEnabled: true,
      syncInterval: 3600000,
      webhookUrl: 'https://api.vemgootech.info/webhook/mautic-contact'
    }
  });

  await newIntegration.save();
  console.log('✅ Created new Mautic integration record');
  console.log('📝 Integration ID:', newIntegration._id);
  
  await mongoose.disconnect();
}

fixCRMIntegration().catch(console.error);
`;

    require('fs').writeFileSync('fix-crm-integration-auto.js', fixScript);
    this.log('success', 'Fix script generated: fix-crm-integration-auto.js');
  }

  async runDiagnostics() {
    console.log('🚀 STARTING COMPREHENSIVE CRM OAUTH2 DIAGNOSTICS');
    console.log('==================================================\n');
    
    const dbConnected = await this.connectToDatabase();
    if (!dbConnected) return this.generateReport();
    
    await this.step1_CheckDatabaseIntegrations();
    await this.step2_TestMauticServerConnectivity();
    await this.step3_TestOAuth2Configuration();
    await this.step4_TestBackendAPI();
    await this.step5_AnalyzeMauticConfiguration();
    await this.step6_GenerateFixes();
    await this.generateFixScript();
    
    await mongoose.disconnect();
    return this.generateReport();
  }

  generateReport() {
    console.log('\n🔍 COMPREHENSIVE DIAGNOSTIC REPORT');
    console.log('=====================================\n');
    
    if (this.results.issues.length > 0) {
      console.log('❌ ISSUES FOUND:');
      this.results.issues.forEach(issue => console.log(`  ${issue}`));
      console.log('');
    }
    
    if (this.results.fixes.length > 0) {
      console.log('🔧 FIXES REQUIRED:');
      this.results.fixes.forEach(fix => console.log(`  ${fix}`));
      console.log('');
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach(rec => console.log(`  ${rec}`));
      console.log('');
    }
    
    console.log('📋 NEXT STEPS:');
    console.log('  1. Run: node fix-crm-integration-auto.js');
    console.log('  2. Update CLIENT_ID and CLIENT_SECRET in the fix script');
    console.log('  3. Verify Mautic OAuth2 app configuration');
    console.log('  4. Test OAuth2 flow in frontend');
    console.log('  5. Check browser console for any remaining errors');
    
    return this.results;
  }
}

// Run diagnostics
const diagnostics = new CRMOAuth2Diagnostics();
diagnostics.runDiagnostics();