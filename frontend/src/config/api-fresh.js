// API Configuration for different environments - MOBILE & EXTERNAL DOMAIN SUPPORT
import axios from 'axios';

const getApiBaseUrl = () => {
  // Check if we're running in production (external domain)
  const hostname = window.location.hostname;
  
  console.log('🔍 CHECKING HOSTNAME:', hostname);
  
  if (hostname === 'connect.vemgootech.info') {
    // Use the dedicated backend API domain
    console.log('🌐 EXTERNAL DOMAIN - Using dedicated API backend');
    console.log('🔗 Backend URL: https://api.vemgootech.info');
    return 'https://api.vemgootech.info';
  } else if (hostname === '10.0.0.181') {
    // Mobile/tablet access via network IP
    console.log('📱 MOBILE/TABLET ACCESS DETECTED');
    console.log('🌐 Using network IP for backend connection');
    return 'http://10.0.0.181:5000';
  }
  
  // Development (localhost)
  console.log('🏠 USING LOCALHOST');
  return 'http://localhost:5000';
};

console.log('🌐 API Configuration - TIMESTAMP:', new Date().toISOString());
console.log('Hostname:', window.location.hostname);
console.log('API Base URL:', getApiBaseUrl());

// Log configuration details
if (window.location.hostname === 'connect.vemgootech.info') {
  console.log('✅ PRODUCTION: Using dedicated backend API domain');
  console.log('🔗 API Domain: api.vemgootech.info');
}

// Export the API base URL
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
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  
  // Campaign endpoints
  CAMPAIGNS: {
    LIST: `${API_BASE_URL}/api/campaigns`,
    CREATE: `${API_BASE_URL}/api/campaigns`,
    UPDATE: (id) => `${API_BASE_URL}/api/campaigns/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/campaigns/${id}`
  },
  
  // Contact endpoints
  CONTACTS: {
    LIST: `${API_BASE_URL}/api/contacts`,
    CREATE: `${API_BASE_URL}/api/contacts`,
    UPDATE: (id) => `${API_BASE_URL}/api/contacts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/contacts/${id}`
  },
  
  // WhatsApp endpoints
  WHATSAPP: {
    STATUS: `${API_BASE_URL}/api/whatsapp/status`,
    INIT: `${API_BASE_URL}/api/whatsapp/init`,
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
    DASHBOARD: (days) => `${API_BASE_URL}/api/analytics/dashboard?days=${days}`
  }
};

// Debug logging
console.log('🌐 API Configuration:');
console.log('Hostname:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL);