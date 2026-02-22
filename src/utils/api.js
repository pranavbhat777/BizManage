// API Configuration Utility - Always use production URL for mobile apps
const getApiBaseUrl = () => {
  // Always use production API URL for mobile apps
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative) {
    // Mobile app - always use production API
    return 'https://bizmanage-api.onrender.com';
  }
  
  // Web app - use environment variable or localhost
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // If accessed via tunnel (non-localhost), use same domain
    if (!currentHost.includes('localhost') && !currentHost.includes('127.0.0.1')) {
      // Use relative URL or current domain
      return ''; // Empty string means relative URLs
    }
  }
  
  // Fallback to environment variable or localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export const API_URL = API_BASE_URL;

// Check if running in Capacitor (mobile app)
const isCapacitorApp = () => {
  return window.Capacitor && window.Capacitor.isNative;
};

// Helper function for API calls
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Platform': isCapacitorApp() ? 'mobile' : 'web',
    },
  };

  // Add Authorization header if token exists
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    console.log(`🚀 API Request: ${finalOptions.method || 'GET'} ${url}`);
    
    const response = await fetch(url, finalOptions);
    
    // Handle unauthorized responses
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Use Capacitor navigation if available
      if (isCapacitorApp()) {
        window.Capacitor.Plugins.App.openUrl({ url: '/' });
      } else {
        window.location.href = '/login';
      }
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    
    // Enhanced error handling for mobile
    if (isCapacitorApp()) {
      // Show native alert on mobile for network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        console.warn('Network error detected in mobile app');
      }
    }
    
    throw error;
  }
};

// Specific API methods
export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => apiRequest(endpoint, {
    method: 'DELETE',
  }),
};

// Export platform checker
export { isCapacitorApp };
