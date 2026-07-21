// API Configuration for different environments - MOBILE & EXTERNAL DOMAIN SUPPORT
import axios from 'axios';

// DO NOT CACHE - Always compute fresh to prevent stale localhost URLs
// This prevents external domains from falling back to local-only API URLs.

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Always check current hostname (no caching to prevent issues)
  const hostname = window.location.hostname;
  
  console.log('🔍 API URL Detection - Hostname:', hostname);
  
  // PRIORITY 1: External domain detection FIRST
  if (hostname === 'bot.dfgworld.net') {
    const apiUrl = 'https://bot.dfgworld.net';
    console.log('BOT DOMAIN DETECTED - Using same-origin API:', apiUrl);
    return apiUrl;
  }

  if (hostname === 'connect.vemgootech.info') {
    const apiUrl = 'https://api.vemgootech.info';
    console.log('🌐 EXTERNAL DOMAIN DETECTED - Using tunnel API:', apiUrl);
    return apiUrl;
  } 
  
  // PRIORITY 2: Mobile/tablet access via network IP
  if (hostname === '10.0.0.181') {
    const apiUrl = 'http://10.0.0.181:5010';
    console.log('📱 MOBILE/TABLET ACCESS DETECTED:', apiUrl);
    return apiUrl;
  }
  
  // PRIORITY 3: Local development (localhost/127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiUrl = 'http://localhost:5010';
    console.log('🔧 LOCAL DEVELOPMENT:', apiUrl);
    return apiUrl;
  }
  
  // FALLBACK: If unknown hostname, log and use localhost
  const apiUrl = 'http://localhost:5010';
  console.log('⚠️ UNKNOWN HOSTNAME, using localhost fallback:', hostname, '→', apiUrl);
  return apiUrl;
};

// Single initialization log
console.log('🌐 API Configuration initialized:', new Date().toISOString());

// Export the API base URL (computed fresh each time)
export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and security headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add security headers for external API calls
    if (config.baseURL?.includes('api.vemgootech.info')) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['X-Client-Domain'] = window.location.hostname;
      console.log('🔐 Adding security headers for external API call');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - Clearing token and reloading');
      localStorage.removeItem('token');
      // Instead of redirecting to /login, just reload the page
      // This will trigger the authentication check in App.js
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Export the axios instance as default
export default api;

// Export API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    PROFILE: `${API_BASE_URL}/api/auth/me`
  },
  
  // Profile endpoints (NEW - User Profile Management)
  PROFILE: {
    GET: `${API_BASE_URL}/api/profile`,
    UPDATE: `${API_BASE_URL}/api/profile`,
    UPLOAD_AVATAR: `${API_BASE_URL}/api/profile/avatar`,
    UPLOAD_LOGO: `${API_BASE_URL}/api/profile/logo`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/profile/password`
  },
  
  // Campaign endpoints
  CAMPAIGNS: {
    LIST: `${API_BASE_URL}/api/campaigns`,
    CREATE: `${API_BASE_URL}/api/campaigns`,
    UPDATE: (id) => `${API_BASE_URL}/api/campaigns/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/campaigns/${id}`,
    UPLOAD_MEDIA: `${API_BASE_URL}/api/campaigns/upload-media`,
    PROGRESS: (id) => `${API_BASE_URL}/api/campaigns/${id}/progress`,
    MESSAGES: (id) => `${API_BASE_URL}/api/campaigns/${id}/messages`,
    RETRY: (id) => `${API_BASE_URL}/api/campaigns/${id}/retry`
  },
  
  // Contact endpoints
  CONTACTS: {
    LIST: `${API_BASE_URL}/api/contacts`,
    CREATE: `${API_BASE_URL}/api/contacts`,
    UPDATE: (id) => `${API_BASE_URL}/api/contacts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/contacts/${id}`,
    PREVIEW_IMPORT: `${API_BASE_URL}/api/contacts/preview-import`,
    IMPORT: `${API_BASE_URL}/api/contacts/import`
  },

  // CRM Integration endpoints
  CRM: {
    LIST: `${API_BASE_URL}/api/crm`,
    CREATE: `${API_BASE_URL}/api/crm`,
    UPDATE: (id) => `${API_BASE_URL}/api/crm/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/crm/${id}`,
    TEST: (id) => `${API_BASE_URL}/api/crm/${id}/test`,
    SYNC: (id) => `${API_BASE_URL}/api/crm/${id}/sync`,
    MAUTIC_AUTH: `${API_BASE_URL}/api/crm/mautic/auth`
  },
  
  // WhatsApp endpoints
  WHATSAPP: {
    STATUS: `${API_BASE_URL}/api/whatsapp/status`,
    INIT: `${API_BASE_URL}/api/whatsapp/init`,
    QR: `${API_BASE_URL}/api/whatsapp/qr`,
    DISCONNECT: `${API_BASE_URL}/api/whatsapp/disconnect`,
    SEND_MESSAGE: `${API_BASE_URL}/api/whatsapp/send-message`,
    SEND_CAMPAIGN: `${API_BASE_URL}/api/whatsapp/send-campaign`,
    CAMPAIGN_PROGRESS: `${API_BASE_URL}/api/whatsapp/campaign-progress`,
    SIMULATE_SCAN: `${API_BASE_URL}/api/whatsapp/simulate-scan`
  },
  
  // AI endpoints
  AI: {
    GENERATE_CAMPAIGN: `${API_BASE_URL}/api/ai/generate-campaign`,
    GENERATE_DESIGN: `${API_BASE_URL}/api/ai/generate-campaign-design`,
    APPROVE_CAMPAIGN: `${API_BASE_URL}/api/ai/approve-campaign`,
    TRAIN: `${API_BASE_URL}/api/ai/train`
  },
  
  // Business endpoints
  BUSINESS: {
    LIST: `${API_BASE_URL}/api/business`,
    CREATE: `${API_BASE_URL}/api/business`,
    UPDATE: (id) => `${API_BASE_URL}/api/business/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/business/${id}`,
    UPLOAD: `${API_BASE_URL}/api/business/upload`,
    BULK_TRAIN: `${API_BASE_URL}/api/business/bulk-train`
  },
  
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: `${API_BASE_URL}/api/analytics/dashboard`,
    CAMPAIGNS: `${API_BASE_URL}/api/analytics/campaigns`,
    EVENTS: `${API_BASE_URL}/api/analytics/events`,
    MESSAGES: `${API_BASE_URL}/api/analytics/messages`,
    CONTACTS: `${API_BASE_URL}/api/analytics/contacts`,
    TRACK_EVENT: `${API_BASE_URL}/api/analytics/track`,
    REALTIME: `${API_BASE_URL}/api/analytics/realtime`
  }
};

// Debug logging
console.log('🌐 API Configuration:');
console.log('Hostname:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL);
