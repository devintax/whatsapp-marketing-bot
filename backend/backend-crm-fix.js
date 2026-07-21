
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
      authHeaders['Authorization'] = `Bearer ${effectiveCredentials.accessToken}`;
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
        authUrl: `${effectiveCredentials.apiUrl}/oauth/v2/authorize?client_id=${effectiveCredentials.clientId}&redirect_uri=${process.env.MAUTIC_REDIRECT_URI}&response_type=code&scope=contacts:read contacts:write campaigns:read`
      };
    }
    else {
      throw new Error('Missing required Mautic credentials');
    }

    // Test Mautic API connection
    const response = await axios.get(`${effectiveCredentials.apiUrl}/api/contacts`, {
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
        message: `Connection failed: ${error.message}. Please try OAuth2 authorization if the issue persists.`
      };
    }
  }
}
