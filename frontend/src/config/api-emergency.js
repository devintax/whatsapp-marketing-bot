// EMERGENCY FIX: Force localhost mode to bypass broken Cloudflare tunnel
// This will temporarily fix the 400 campaign creation errors

const getApiBaseUrl = () => {
  // TEMPORARY FIX: Force localhost until tunnel is restored
  console.log('🚨 EMERGENCY MODE: Using localhost to bypass tunnel issue');
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔧 EMERGENCY API URL:', API_BASE_URL);

export { API_BASE_URL };

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`
  },
  CAMPAIGNS: {
    LIST: `${API_BASE_URL}/api/campaigns`,
    CREATE: `${API_BASE_URL}/api/campaigns`,
    UPLOAD_MEDIA: `${API_BASE_URL}/api/campaigns/upload-media`,
    DELETE: (id) => `${API_BASE_URL}/api/campaigns/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/campaigns/${id}`,
    SEND: (id) => `${API_BASE_URL}/api/campaigns/${id}/send`,
    STATS: (id) => `${API_BASE_URL}/api/campaigns/${id}/stats`
  },
  CONTACTS: {
    LIST: `${API_BASE_URL}/api/contacts`,
    CREATE: `${API_BASE_URL}/api/contacts`,
    IMPORT: `${API_BASE_URL}/api/contacts/import`,
    DELETE: (id) => `${API_BASE_URL}/api/contacts/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/contacts/${id}`
  },
  BUSINESS_DATA: {
    GET: `${API_BASE_URL}/api/business-data`,
    UPDATE: `${API_BASE_URL}/api/business-data`,
    UPLOAD: `${API_BASE_URL}/api/business-data/upload`
  },
  WHATSAPP: {
    STATUS: `${API_BASE_URL}/api/whatsapp/status`,
    QR: `${API_BASE_URL}/api/whatsapp/qr`,
    CONNECT: `${API_BASE_URL}/api/whatsapp/connect`,
    DISCONNECT: `${API_BASE_URL}/api/whatsapp/disconnect`
  },
  ANALYTICS: {
    CAMPAIGNS: `${API_BASE_URL}/api/analytics/campaigns`,
    CONTACTS: `${API_BASE_URL}/api/analytics/contacts`,
    MESSAGES: `${API_BASE_URL}/api/analytics/messages`
  }
};

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;