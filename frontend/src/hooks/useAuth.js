import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults for external domain support
const configureAxios = () => {
  const hostname = window.location.hostname;
  const isExternal = hostname === 'connect.vemgootech.info';
  
  console.log('🔧 Configuring axios for:', { hostname, isExternal });
  
  // Set base URL and other defaults
  axios.defaults.withCredentials = true;
  axios.defaults.timeout = isExternal ? 30000 : 10000; // Longer timeout for external
  
  // Add request interceptor for debugging
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['x-auth-token'] = token;
      }
      
      console.log('🚀 Request:', {
        method: config.method,
        url: config.url,
        hasAuth: !!config.headers.Authorization,
        environment: isExternal ? 'external' : 'local'
      });
      
      return config;
    },
    (error) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for debugging
  axios.interceptors.response.use(
    (response) => {
      console.log('✅ Response:', {
        status: response.status,
        url: response.config.url,
        environment: isExternal ? 'external' : 'local'
      });
      return response;
    },
    (error) => {
      console.error('❌ Response error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        environment: isExternal ? 'external' : 'local'
      });
      return Promise.reject(error);
    }
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // REMOVED: configureAxios() call to prevent conflicts
    // The App.js handles authentication separately
    
    const token = localStorage.getItem('token');
    if (token) {
      // Simple token check without API call to prevent loops
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const { token, user } = response.data;
      
      console.log('✅ Login successful:', { user: user.email, hasToken: !!token });
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook without context requirement for App component
export const useAuthState = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(API_ENDPOINTS.AUTH.PROFILE)
        .then(response => {
          setUser(response.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  return { isAuthenticated, loading };
};