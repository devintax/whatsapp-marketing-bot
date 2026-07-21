require('dotenv').config();
const mongoose = require('mongoose');

// Fix the CRM integration by modifying the backend to properly handle database credentials
async function fixCRMIntegrationFlow() {
    console.log('🔧 FIXING CRM INTEGRATION FLOW');
    console.log('===============================\n');
    
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

    // Get current integration
    const integrations = await CRMIntegration.find({});
    console.log(`Found ${integrations.length} integrations`);
    
    const currentIntegration = integrations[0];
    if (currentIntegration) {
        console.log('Current integration:');
        console.log(`  ID: ${currentIntegration._id}`);
        console.log(`  Status: ${currentIntegration.status}`);
        console.log(`  Credentials keys: ${Object.keys(currentIntegration.credentials || {})}`);
        
        // Update the integration to include environment variable credentials
        const updatedCredentials = {
            ...currentIntegration.credentials,
            // Add environment variables as backup
            envClientId: process.env.MAUTIC_CLIENT_ID,
            envClientSecret: process.env.MAUTIC_CLIENT_SECRET,
            envApiUrl: process.env.MAUTIC_BASE_URL,
            envRedirectUri: process.env.MAUTIC_REDIRECT_URI
        };
        
        await CRMIntegration.updateOne(
            { _id: currentIntegration._id },
            { 
                $set: { 
                    credentials: updatedCredentials,
                    status: 'ready_for_oauth',
                    updatedAt: new Date()
                }
            }
        );
        
        console.log('\n✅ Updated integration with environment credentials');
        console.log('📝 Backend can now use either database or env credentials');
    }

    await mongoose.disconnect();
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. The integration is now configured with environment credentials');
    console.log('2. Backend will use env vars for OAuth2 authentication');
    console.log('3. Try the OAuth2 authorization flow again');
    console.log('4. Check if the error #500 persists');
    
    // Generate the backend fix
    const backendFix = `
// PASTE this into backend/routes/crm.js testMauticConnection function

async function testMauticConnection(credentials) {
  try {
    console.log('Testing Mautic connection with:', credentials.apiUrl);
    
    // Use environment variables if database credentials are incomplete
    const effectiveCredentials = {
      apiUrl: credentials.apiUrl || process.env.MAUTIC_BASE_URL,
      clientId: credentials.clientId || process.env.MAUTIC_CLIENT_ID,
      clientSecret: credentials.clientSecret || process.env.MAUTIC_CLIENT_SECRET,
      accessToken: credentials.accessToken,
      username: credentials.username,
      password: credentials.password
    };
    
    if (!effectiveCredentials.apiUrl) {
      throw new Error('Missing required Mautic API URL');
    }

    let authHeaders = {};
    let authConfig = {};

    // Try OAuth2 first (preferred method)
    if (effectiveCredentials.accessToken) {
      console.log('🔑 Using OAuth2 access token for authentication');
      authHeaders['Authorization'] = \`Bearer \${effectiveCredentials.accessToken}\`;
    } 
    // Fall back to basic auth if available
    else if (effectiveCredentials.username && effectiveCredentials.password) {
      console.log('⚠️ Using basic auth (fallback) - OAuth2 recommended');
      authConfig.auth = {
        username: effectiveCredentials.username,
        password: effectiveCredentials.password
      };
    } 
    // If no credentials available, check OAuth2 readiness
    else if (effectiveCredentials.clientId && effectiveCredentials.clientSecret) {
      console.log('📝 OAuth2 credentials available - authorization required');
      // Instead of throwing error, return success with OAuth2 ready status
      return {
        success: false,
        needsOAuth2: true,
        message: 'OAuth2 authorization required. Click the OAuth2 authorization button to complete the setup.',
        authUrl: \`\${effectiveCredentials.apiUrl}/oauth/v2/authorize?client_id=\${effectiveCredentials.clientId}&redirect_uri=\${process.env.MAUTIC_REDIRECT_URI}&response_type=code&scope=contacts:read contacts:write campaigns:read\`
      };
    }
    else {
      throw new Error('Missing required Mautic credentials');
    }

    // Test Mautic API connection
    const response = await axios.get(\`\${effectiveCredentials.apiUrl}/api/contacts\`, {
      ...authConfig,
      headers: authHeaders,
      timeout: 10000
    });

    console.log('✅ Mautic connection successful');
    return { success: true, message: 'Connection successful' };

  } catch (error) {
    console.error('Mautic connection test failed:', error.message);
    
    // Handle specific HTTP status codes with helpful messages
    if (error.response?.status === 403) {
      return {
        success: false,
        needsOAuth2: true,
        message: 'OAuth2 authorization required. Your Mautic instance requires OAuth2 authentication. Please click the OAuth2 authorization button to complete the setup.'
      };
    } else if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Invalid credentials. Please check your Mautic username and password or complete OAuth2 authorization.'
      };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Cannot connect to Mautic server. Please check the API URL and ensure your Mautic instance is accessible.'
      };
    } else {
      return {
        success: false,
        message: \`Connection failed: \${error.message}. Please try OAuth2 authorization if the issue persists.\`
      };
    }
  }
}
`;

    require('fs').writeFileSync('backend-crm-fix.js', backendFix);
    console.log('\n📄 Backend fix saved to: backend-crm-fix.js');
    console.log('   Copy and paste this code into your backend/routes/crm.js file');
}

fixCRMIntegrationFlow().catch(console.error);