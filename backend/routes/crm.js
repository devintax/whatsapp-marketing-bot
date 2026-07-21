const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const mauticService = require('../services/mauticService');

const router = express.Router();

// CRM Integration Schema
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

// Get all CRM integrations for user
router.get('/', auth, async (req, res) => {
  try {
    const integrations = await CRMIntegration.find({ user: req.user.id })
      .select('-credentials.password -credentials.apiKey -credentials.clientSecret -credentials.accessToken -credentials.refreshToken')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      integrations
    });
  } catch (error) {
    console.error('Error fetching CRM integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CRM integrations'
    });
  }
});

// Initiate Mautic OAuth authentication
router.get('/mautic/auth', auth, async (req, res) => {
  try {
    console.log('🔧 Initiating Mautic OAuth for user:', req.user.id);
    
    const { authUrl, state } = mauticService.getAuthorizationUrl(req.user.id);
    
    console.log('🚀 Generated OAuth URL:', authUrl);

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL for Mautic authorization'
    });
  } catch (error) {
    console.error('Error initiating Mautic OAuth:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Mautic authentication'
    });
  }
});

// OAuth callback handler for Mautic
router.get('/mautic/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    console.log('🔄 Processing OAuth callback...');
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }
    
    // Exchange code for tokens using the service
    const tokenData = await mauticService.exchangeCodeForToken(code, state);
    
    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'https://connect.vemgootech.info';
    res.redirect(`${frontendUrl}/contacts?mautic_success=true&message=OAuth+authorization+successful`);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    
    // Redirect to frontend with error message
    const frontendUrl = process.env.FRONTEND_URL || 'https://connect.vemgootech.info';
    const errorMessage = encodeURIComponent(error.message || 'OAuth authorization failed');
    res.redirect(`${frontendUrl}/contacts?mautic_error=true&message=${errorMessage}`);
  }
});

// Create new CRM integration
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('type').isIn(['mautic', 'suitecrm', 'zoho', 'hubspot', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, type, apiUrl, apiKey, clientId, clientSecret, username, password, dataCenter } = req.body;

    const integration = new CRMIntegration({
      user: req.user.id,
      name,
      type,
      credentials: {
        apiUrl,
        apiKey,
        clientId,
        clientSecret,
        username,
        password,
        dataCenter
      }
    });

    await integration.save();

    // Remove sensitive data before sending response
    const responseIntegration = integration.toObject();
    delete responseIntegration.credentials.password;
    delete responseIntegration.credentials.apiKey;
    delete responseIntegration.credentials.clientSecret;

    res.json({
      success: true,
      message: 'CRM integration created successfully',
      integration: responseIntegration
    });
  } catch (error) {
    console.error('Error creating CRM integration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create CRM integration'
    });
  }
});

// Update CRM integration
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, apiUrl, apiKey, clientId, clientSecret, username, password, dataCenter } = req.body;

    const integration = await CRMIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'CRM integration not found'
      });
    }

    integration.name = name || integration.name;
    if (apiUrl) integration.credentials.apiUrl = apiUrl;
    if (apiKey) integration.credentials.apiKey = apiKey;
    if (clientId) integration.credentials.clientId = clientId;
    if (clientSecret) integration.credentials.clientSecret = clientSecret;
    if (username) integration.credentials.username = username;
    if (password) integration.credentials.password = password;
    if (dataCenter) integration.credentials.dataCenter = dataCenter;

    await integration.save();

    // Remove sensitive data before sending response
    const responseIntegration = integration.toObject();
    delete responseIntegration.credentials.password;
    delete responseIntegration.credentials.apiKey;
    delete responseIntegration.credentials.clientSecret;

    res.json({
      success: true,
      message: 'CRM integration updated successfully',
      integration: responseIntegration
    });
  } catch (error) {
    console.error('Error updating CRM integration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update CRM integration'
    });
  }
});

// Delete CRM integration
router.delete('/:id', auth, async (req, res) => {
  try {
    const integration = await CRMIntegration.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'CRM integration not found'
      });
    }

    res.json({
      success: true,
      message: 'CRM integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting CRM integration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete CRM integration'
    });
  }
});

// Test CRM connection
router.post('/:id/test', auth, async (req, res) => {
  try {
    const integration = await CRMIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'CRM integration not found'
      });
    }

    let testResult = false;
    let errorMessage = '';

    try {
      switch (integration.type) {
        case 'mautic':
          const connectionResult = await mauticService.testConnection(req.user.id);
          testResult = connectionResult.success;
          errorMessage = connectionResult.message;
          break;
        case 'suitecrm':
          testResult = await testSuiteCRMConnection(integration.credentials);
          break;
        case 'zoho':
          testResult = await testZohoConnection(integration.credentials);
          break;
        case 'hubspot':
          testResult = await testHubSpotConnection(integration.credentials);
          break;
        case 'google':
          testResult = await testGoogleConnection(integration.credentials);
          break;
        default:
          throw new Error('Unsupported CRM type');
      }

      // Update integration status
      integration.status = testResult ? 'active' : 'error';
      await integration.save();

    } catch (error) {
      console.error(`Error testing ${integration.type} connection:`, error);
      errorMessage = error.message;
      testResult = false;
      integration.status = 'error';
      await integration.save();
    }

    res.json({
      success: testResult,
      message: testResult ? 'Connection test successful' : `Connection test failed: ${errorMessage}`,
      errors: testResult ? [] : [{ message: errorMessage, code: 500, type: 'connection_error' }]
    });
  } catch (error) {
    console.error('Error testing CRM connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test CRM connection'
    });
  }
});

// Sync contacts from CRM
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const integration = await CRMIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'CRM integration not found'
      });
    }

    let syncResults = {
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    try {
      switch (integration.type) {
        case 'mautic':
          syncResults = await syncMauticContacts(integration, req.user.id);
          break;
        case 'suitecrm':
          syncResults = await syncSuiteCRMContacts(integration, req.user.id);
          break;
        case 'zoho':
          syncResults = await syncZohoContacts(integration, req.user.id);
          break;
        case 'hubspot':
          syncResults = await syncHubSpotContacts(integration, req.user.id);
          break;
        case 'google':
          syncResults = await syncGoogleContacts(integration, req.user.id);
          break;
        default:
          throw new Error('Unsupported CRM type');
      }

      // Update integration with sync results
      integration.lastSync = new Date();
      integration.lastSyncResults = syncResults;
      await integration.save();

    } catch (error) {
      console.error(`Error syncing ${integration.type} contacts:`, error);
      syncResults.errors.push(error.message);
    }

    res.json({
      success: true,
      message: 'Contact sync completed',
      results: syncResults
    });
  } catch (error) {
    console.error('Error syncing CRM contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync CRM contacts'
    });
  }
});

// Update sync settings (NEW ENDPOINT)
router.put('/:id/sync-settings', auth, async (req, res) => {
  try {
    const { syncFrequency, syncDirection } = req.body;
    
    const integration = await CRMIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ 
        success: false,
        message: 'CRM integration not found' 
      });
    }

    // Validate sync frequency
    const validFrequencies = ['manual', 'hourly', 'daily', 'weekly'];
    if (syncFrequency && !validFrequencies.includes(syncFrequency)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid sync frequency. Must be: manual, hourly, daily, or weekly' 
      });
    }

    // Validate sync direction
    const validDirections = ['import', 'export', 'bidirectional'];
    if (syncDirection && !validDirections.includes(syncDirection)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid sync direction. Must be: import, export, or bidirectional' 
      });
    }

    // Update settings
    if (!integration.settings) integration.settings = {};
    if (syncFrequency) integration.settings.syncFrequency = syncFrequency;
    if (syncDirection) integration.settings.syncDirection = syncDirection;
    
    await integration.save();

    // Update the auto-sync schedule
    const autoSyncService = require('../services/autoSyncService');
    if (syncFrequency) {
      await autoSyncService.updateIntegrationSchedule(req.params.id, syncFrequency);
    }

    res.json({
      success: true,
      message: 'Sync settings updated successfully',
      settings: integration.settings
    });

  } catch (error) {
    console.error('❌ Update sync settings error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get sync status (NEW ENDPOINT)
router.get('/:id/sync-status', auth, async (req, res) => {
  try {
    const integration = await CRMIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ 
        success: false,
        message: 'CRM integration not found' 
      });
    }

    const autoSyncService = require('../services/autoSyncService');
    const autoSyncStatus = await autoSyncService.getStatus();

    res.json({
      success: true,
      integration: {
        id: integration._id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        settings: integration.settings,
        lastSync: integration.lastSync,
        lastSyncResults: integration.lastSyncResults
      },
      autoSync: {
        enabled: integration.settings?.syncFrequency !== 'manual',
        frequency: integration.settings?.syncFrequency || 'manual',
        direction: integration.settings?.syncDirection || 'import',
        systemStatus: autoSyncStatus
      }
    });

  } catch (error) {
    console.error('❌ Get sync status error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// CRM-specific helper functions (mock implementations for demo)
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
      // Return a specific message for OAuth2 setup needed
      throw new Error('OAuth2 authorization required. Click the OAuth2 button to authorize.');
    }
    else {
      throw new Error('Missing required Mautic credentials');
    }

    // Test Mautic API connection
    const response = await axios.get(`${effectiveCredentials.apiUrl}/api/contacts`, {
      ...authConfig,
      headers: authHeaders,
      params: {
        limit: 1 // Just test connection with 1 contact
      },
      timeout: 10000
    });

    return response.status === 200;
  } catch (error) {
    console.error('Mautic connection test failed:', error.message);
    
    // Check if Mautic returned its own error structure
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const mauticError = error.response.data.errors[0];
      if (mauticError?.message && mauticError.message.includes('error #500')) {
        throw new Error('Mautic server error. This usually indicates OAuth2 authorization is required. Please click the OAuth2 authorization button to complete the setup.');
      }
    }
    
    // Handle specific HTTP status codes with helpful messages
    if (error.response?.status === 403) {
      throw new Error('OAuth2 authorization required. Your Mautic instance requires OAuth2 authentication. Please click the OAuth2 authorization button to complete the setup.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid credentials. Please check your Mautic username and password or complete OAuth2 authorization.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to Mautic server. Please check the API URL and ensure your Mautic instance is accessible.');
    } else if (error.message.includes('OAuth2 authorization required')) {
      throw new Error('OAuth2 authorization required. Please click the OAuth2 authorization button to complete the setup.');
    } else {
      throw new Error(`Connection failed: ${error.message}. Please try OAuth2 authorization if the issue persists.`);
    }
  }
}

async function testSuiteCRMConnection(credentials) {
  // Mock implementation - replace with actual SuiteCRM API call
  console.log('Testing SuiteCRM connection with:', credentials.apiUrl);
  return credentials.apiUrl && credentials.apiKey;
}

async function testZohoConnection(credentials) {
  // Mock implementation - replace with actual Zoho API call
  console.log('Testing Zoho connection with:', credentials.clientId);
  return credentials.clientId && credentials.clientSecret;
}

async function testHubSpotConnection(credentials) {
  // Mock implementation - replace with actual HubSpot API call
  console.log('Testing HubSpot connection with API key');
  return credentials.apiKey && credentials.apiKey.length > 10;
}

async function testGoogleConnection(credentials) {
  // Mock implementation - replace with actual Google API call
  console.log('Testing Google connection with:', credentials.clientId);
  return credentials.clientId && credentials.clientSecret;
}

async function syncMauticContacts(integration, userId) {
  try {
    console.log('🔄 Syncing Mautic contacts for user:', userId);
    console.log('🔍 UserID type:', typeof userId);
    console.log('🔍 UserID is null?', userId === null);
    console.log('🔍 UserID is undefined?', userId === undefined);
    console.log('🔍 Integration ID:', integration._id);
    console.log('🔍 Integration type:', integration.type);
    console.log('🔍 Integration status:', integration.status);
    console.log('🔍 Integration credentials keys:', Object.keys(integration.credentials || {}));
    
    const Contact = require('../models/Contact');
    const credentials = integration.credentials || {};
    
    console.log('🔍 Credential details:', {
      hasAccessToken: !!credentials.accessToken,
      hasUsername: !!credentials.username,
      hasPassword: !!credentials.password,
      apiUrl: credentials.apiUrl
    });
    
    // Check for OAuth2 access token first (preferred method)
    if (credentials.accessToken) {
      console.log('🔑 Using OAuth2 access token for authentication');
    } else if (credentials.username && credentials.password) {
      console.log('⚠️ Using basic auth (fallback) - OAuth2 recommended');
    } else {
      console.log('❌ Missing credentials. Available keys:', Object.keys(credentials));
      throw new Error('Missing Mautic credentials: Need either OAuth2 access token or username/password');
    }

    let allContacts = [];
    let page = 0;
    const limit = 100;
    let hasMore = true;

    // Fetch all contacts from Mautic API
    while (hasMore) {
      let response;
      
      try {
        // Try OAuth2 first (if access token available)
        if (credentials.accessToken) {
          response = await axios.get(`${credentials.apiUrl}/api/contacts`, {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              limit: limit,
              start: page * limit,
              orderBy: 'id',
              orderByDir: 'ASC'
            },
            timeout: 30000
          });
        } else {
          // Fallback to basic auth
          response = await axios.get(`${credentials.apiUrl}/api/contacts`, {
            auth: {
              username: credentials.username,
              password: credentials.password
            },
            params: {
              limit: limit,
              start: page * limit,
              orderBy: 'id',
              orderByDir: 'ASC'
            },
            timeout: 30000
          });
        }
      } catch (authError) {
        if (authError.response?.status === 401 && credentials.accessToken) {
          console.log('🔄 OAuth2 token expired, attempting to refresh...');
          
          // Try to refresh the token
          const refreshed = await refreshMauticToken(integration);
          if (refreshed) {
            // Retry with new token
            response = await axios.get(`${credentials.apiUrl}/api/contacts`, {
              headers: {
                'Authorization': `Bearer ${integration.credentials.accessToken}`,
                'Content-Type': 'application/json'
              },
              params: {
                limit: limit,
                start: page * limit,
                orderBy: 'id',
                orderByDir: 'ASC'
              },
              timeout: 30000
            });
          } else {
            throw new Error('OAuth2 token expired and refresh failed. Please re-authorize Mautic integration.');
          }
        } else {
          throw authError;
        }
      }

      const contacts = response.data.contacts || {};
      const contactList = Object.values(contacts);
      
      if (contactList.length === 0) {
        hasMore = false;
      } else {
        allContacts = allContacts.concat(contactList);
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 100) {
          console.log('⚠️ Reached safety limit of 100 pages');
          break;
        }
      }
    }

    console.log(`📥 Found ${allContacts.length} contacts in Mautic`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    // Process each contact
    for (const mauticContact of allContacts) {
      try {
        // Extract phone number from various fields
        let phone = mauticContact.fields?.core?.mobile?.value || 
                   mauticContact.fields?.core?.phone?.value ||
                   mauticContact.mobile ||
                   mauticContact.phone;

        // Skip contacts without phone numbers
        if (!phone) {
          skipped++;
          continue;
        }

        // Clean and format phone number
        phone = phone.replace(/[^\d+]/g, '');
        if (!phone.startsWith('+')) {
          // Assume US number if no country code
          phone = '+1' + phone.replace(/[^\d]/g, '');
        }

        // Ensure userId is valid and convert to ObjectId if needed
        if (!userId) {
          console.error(`❌ Invalid userId: ${userId} - skipping contact ${mauticContact.id}`);
          failed++;
          errors.push(`Invalid userId for contact ${mauticContact.id}`);
          continue;
        }

        // Convert userId to ObjectId to ensure proper format
        const userObjectId = new mongoose.Types.ObjectId(userId);
        console.log(`🔍 Processing contact for user: ${userId} -> ObjectId: ${userObjectId}`);

        // Extract contact details
        const contactData = {
          name: `${mauticContact.fields?.core?.firstname?.value || mauticContact.firstname || ''} ${mauticContact.fields?.core?.lastname?.value || mauticContact.lastname || ''}`.trim() || `Mautic Contact ${mauticContact.id}`,
          phone: phone,
          email: mauticContact.fields?.core?.email?.value || mauticContact.email || '',
          user: userObjectId,
          tags: ['mautic-import'],
          notes: `Imported from Mautic - ID: ${mauticContact.id}`,
          mauticId: mauticContact.id,
          crmSource: 'mautic',
          lastSync: new Date()
        };

        console.log(`🔍 Contact data prepared:`, {
          name: contactData.name,
          phone: contactData.phone,
          user: contactData.user,
          userType: typeof contactData.user
        });

        // Check if contact already exists
        const existingContact = await Contact.findOne({
          user: userObjectId,
          $or: [
            { phone: phone },
            { mauticId: mauticContact.id }
          ]
        });

        if (existingContact) {
          // Update existing contact
          await Contact.findByIdAndUpdate(existingContact._id, {
            ...contactData,
            updatedAt: new Date()
          });
          updated++;
          console.log(`📝 Updated contact: ${contactData.name} (${phone})`);
        } else {
          // Create new contact
          await Contact.create(contactData);
          imported++;
          console.log(`➕ Imported contact: ${contactData.name} (${phone})`);
        }

      } catch (contactError) {
        failed++;
        const errorMsg = `Failed to process contact ${mauticContact.id}: ${contactError.message}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    const results = {
      imported,
      updated,
      skipped,
      failed,
      errors,
      totalProcessed: allContacts.length
    };

    console.log('📊 Mautic sync results:', results);
    return results;

  } catch (error) {
    console.error('❌ Mautic sync failed:', error.message);
    throw error;
  }
}

// Helper function to refresh Mautic OAuth2 token
async function refreshMauticToken(integration) {
  try {
    const credentials = integration.credentials;
    
    if (!credentials.refreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }
    
    const tokenResponse = await axios.post(`${credentials.apiUrl}/oauth/v2/token`, {
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken,
      client_id: process.env.MAUTIC_CLIENT_ID,
      client_secret: process.env.MAUTIC_CLIENT_SECRET
    });
    
    // Update integration with new tokens
    integration.credentials.accessToken = tokenResponse.data.access_token;
    if (tokenResponse.data.refresh_token) {
      integration.credentials.refreshToken = tokenResponse.data.refresh_token;
    }
    
    await integration.save();
    console.log('✅ OAuth2 token refreshed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error.response?.data || error.message);
    return false;
  }
}

async function syncSuiteCRMContacts(integration, userId) {
  // Mock implementation - replace with actual SuiteCRM API calls
  console.log('Syncing SuiteCRM contacts for user:', userId);
  return {
    imported: 25,
    updated: 5,
    skipped: 1,
    failed: 1,
    errors: ['Contact missing phone number']
  };
}

async function syncZohoContacts(integration, userId) {
  // Mock implementation - replace with actual Zoho API calls
  console.log('Syncing Zoho contacts for user:', userId);
  return {
    imported: 18,
    updated: 2,
    skipped: 3,
    failed: 0,
    errors: []
  };
}

async function syncHubSpotContacts(integration, userId) {
  // Mock implementation - replace with actual HubSpot API calls
  console.log('Syncing HubSpot contacts for user:', userId);
  return {
    imported: 32,
    updated: 8,
    skipped: 4,
    failed: 1,
    errors: ['Rate limit exceeded']
  };
}

async function syncGoogleContacts(integration, userId) {
  // Mock implementation - replace with actual Google API calls
  console.log('Syncing Google contacts for user:', userId);
  return {
    imported: 12,
    updated: 1,
    skipped: 0,
    failed: 0,
    errors: []
  };
}

// Export sync functions for use by autoSyncService
module.exports = router;
module.exports.syncMauticContacts = syncMauticContacts;
module.exports.syncSuiteCRMContacts = syncSuiteCRMContacts;
module.exports.syncZohoContacts = syncZohoContacts;
module.exports.syncHubSpotContacts = syncHubSpotContacts;
module.exports.syncGoogleContacts = syncGoogleContacts;