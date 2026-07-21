/* src/config/api.js */
import axios from 'axios';

// Environment-based API configuration - PRODUCTION READY
const apiBase =
  process.env.REACT_APP_API_BASE ||
  (window?.location?.hostname?.endsWith('vemgootech.info')
    ? 'https://api.vemgootech.info'
    : 'http://localhost:5000');

export const API_BASE_URL = apiBase;

console.log('🌐 API Configuration - Environment:', process.env.REACT_APP_ENV || 'auto-detect');
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Hostname:', window.location.hostname);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and security headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add security headers for external domain
    if (API_BASE_URL.includes('api.vemgootech.info')) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['Accept'] = 'application/json';
    }
    
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;