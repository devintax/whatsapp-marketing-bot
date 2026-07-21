const mongoose = require('mongoose');
const MauticToken = require('../models/MauticToken');

// Mautic Service following best practices guide from provided documentation
class MauticService {
  constructor() {
    this.baseUrl = process.env.MAUTIC_BASE_URL;
    this.clientId = process.env.MAUTIC_CLIENT_ID;
    this.clientSecret = process.env.MAUTIC_CLIENT_SECRET;
    this.redirectUri = process.env.MAUTIC_REDIRECT_URI;
    
    // Basic Auth credentials (fallback)
    this.basicUsername = process.env.MAUTIC_USERNAME;
    this.basicPassword = process.env.MAUTIC_PASSWORD;
    this.useBasicAuth = process.env.MAUTIC_USE_BASIC === 'true';
    
    // Token cache for performance (still backed by MongoDB)
    this.tokenCache = new Map();
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(userId) {
    if (!this.clientId) {
      throw new Error('Mautic OAuth not configured. Please set MAUTIC_CLIENT_ID environment variable.');
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ 
      userId: userId, 
      timestamp: Date.now() 
    })).toString('base64');

    const authUrl = `${this.baseUrl}/oauth/v2/authorize?` +
      `client_id=${encodeURIComponent(this.clientId)}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=code&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=contacts:read contacts:write`;

    return { authUrl, state };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    try {
      console.log('🔄 Exchanging code for token...');
      
      // Prepare form data using URLSearchParams (as recommended in guide)
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code
      });

      const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Mautic OAuth error: ${data.error_description || data.error}`);
      }

      const { access_token, refresh_token, expires_in } = data;
      
      // Calculate expiration time
      const expiresAt = Date.now() + (expires_in * 1000);
      
      // Decode state to get user ID
      let userId;
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = stateData.userId;
      } catch (error) {
        console.warn('Could not decode state parameter');
      }

      // Store tokens using the new MauticToken model
      const tokenData = {
        userId: userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
        scope: 'contacts:read contacts:write'
      };

      if (userId) {
        this.tokenCache.set(userId, tokenData);
        await this.persistTokens(userId, tokenData);
      }

      console.log('✅ OAuth2 tokens received and stored');
      return tokenData;
      
    } catch (error) {
      console.error('❌ Token exchange error:', error.message);
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token when expired
   */
  async refreshAccessToken(userId) {
    try {
      const tokens = this.tokenCache.get(userId) || await this.loadTokensFromDb(userId);
      
      if (!tokens || !tokens.refreshToken) {
        throw new Error('No refresh token available. Need to re-authenticate.');
      }

      console.log('🔄 Refreshing access token...');
      
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: tokens.refreshToken
      });

      const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Mautic token refresh error: ${data.error_description || data.error}`);
      }

      const { access_token, refresh_token, expires_in } = data;
      const expiresAt = Date.now() + (expires_in * 1000);

      const newTokenData = {
        userId: userId,
        accessToken: access_token,
        refreshToken: refresh_token || tokens.refreshToken, // Keep old refresh token if not provided
        expiresAt: expiresAt,
        scope: tokens.scope || 'contacts:read contacts:write'
      };

      // Update cache and database
      this.tokenCache.set(userId, newTokenData);
      await this.persistTokens(userId, newTokenData);

      console.log('✅ Access token refreshed successfully');
      return newTokenData;
      
    } catch (error) {
      console.error('❌ Token refresh error:', error.message);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId) {
    let tokens = this.tokenCache.get(userId) || await this.loadTokensFromDb(userId);
    
    if (!tokens) {
      throw new Error('No tokens found. User needs to authenticate first.');
    }

    // Check if token is expired (with 60 second buffer)
    if (Date.now() >= (tokens.expiresAt - 60000)) {
      console.log('🔄 Token expired, refreshing...');
      tokens = await this.refreshAccessToken(userId);
    }

    return tokens.accessToken;
  }

  /**
   * Make authenticated API call to Mautic
   */
  async apiCall(userId, endpoint, options = {}) {
    try {
      const url = new URL(`${this.baseUrl}/api/${endpoint}`);
      
      // Add query parameters if provided
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      };

      // Choose authentication method
      if (this.useBasicAuth && this.basicUsername && this.basicPassword) {
        // Use Basic Auth as fallback
        console.log('🔑 Using Basic Auth for Mautic API call');
        const auth = Buffer.from(`${this.basicUsername}:${this.basicPassword}`).toString('base64');
        fetchOptions.headers['Authorization'] = `Basic ${auth}`;
      } else {
        // Use OAuth2 Bearer token
        console.log('🔐 Using OAuth2 Bearer token for Mautic API call');
        const accessToken = await this.getValidAccessToken(userId);
        fetchOptions.headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Add body for POST/PUT/PATCH requests
      if (options.data && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
        if (options.headers?.['Content-Type'] === 'application/x-www-form-urlencoded') {
          fetchOptions.body = new URLSearchParams(options.data);
        } else {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(options.data);
        }
      }

      console.log(`🌐 Making Mautic API call: ${fetchOptions.method} ${endpoint}`);
      const response = await fetch(url.toString(), fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Mautic API error ${response.status}:`, errorText);
        
        // If 401 Unauthorized and using OAuth2, try refreshing token once
        if (response.status === 401 && !this.useBasicAuth) {
          try {
            console.log('🔄 Received 401, attempting token refresh...');
            await this.refreshAccessToken(userId);
            
            // Retry the API call with new token
            const newAccessToken = await this.getValidAccessToken(userId);
            fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            const retryResponse = await fetch(url.toString(), fetchOptions);
            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text();
              throw new Error(`Mautic API error ${retryResponse.status}: ${retryErrorText}`);
            }
            return await retryResponse.json();
            
          } catch (refreshError) {
            throw new Error('Authentication failed. User needs to re-authorize.');
          }
        }
        
        throw new Error(`Mautic API error ${response.status}: ${errorText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error(`❌ Mautic API call failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Get contacts from Mautic
   */
  async getContacts(userId, { limit = 50, offset = 0, search = null } = {}) {
    const params = { limit, start: offset };
    if (search) {
      params.search = search;
    }

    return await this.apiCall(userId, 'contacts', {
      method: 'GET',
      params: params
    });
  }

  /**
   * Test connection to Mautic
   */
  async testConnection(userId) {
    try {
      // Try to fetch just one contact to test the connection
      const result = await this.getContacts(userId, { limit: 1 });
      return {
        success: true,
        message: 'Connection successful',
        contactCount: result.total || 0
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Persist tokens to database using MauticToken model
   */
  async persistTokens(userId, tokenData) {
    try {
      await MauticToken.findOneAndUpdate(
        { userId: userId, type: 'mautic' },
        {
          userId: userId,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope || 'contacts:read contacts:write',
          lastUsed: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log('✅ Tokens persisted to database');
      
    } catch (error) {
      console.error('❌ Error persisting tokens:', error);
      throw error;
    }
  }

  /**
   * Load tokens from database using MauticToken model
   */
  async loadTokensFromDb(userId) {
    try {
      const tokenRecord = await MauticToken.findOne({ 
        userId: userId, 
        type: 'mautic' 
      });
      
      if (!tokenRecord || !tokenRecord.accessToken) {
        return null;
      }

      // Update last used timestamp
      tokenRecord.lastUsed = new Date();
      await tokenRecord.save();

      return {
        userId: tokenRecord.userId,
        accessToken: tokenRecord.accessToken,
        refreshToken: tokenRecord.refreshToken,
        expiresAt: tokenRecord.expiresAt,
        scope: tokenRecord.scope
      };
      
    } catch (error) {
      console.error('❌ Error loading tokens from database:', error);
      return null;
    }
  }
}

module.exports = new MauticService();