import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

// Configure axios defaults for session-based authentication
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Enable cookies for session authentication

// CSRF token management using Laravel Sanctum
let csrfToken = null;

// Function to fetch CSRF token using Laravel Sanctum's built-in route
const fetchCsrfToken = async () => {
  try {
    // Use Laravel Sanctum's built-in CSRF route
    const response = await axios.get('/sanctum/csrf-cookie', {
      baseURL: API_BASE_URL.replace('/api', ''), // Remove /api for Sanctum route
    });
    
    // The CSRF token is automatically set in the cookie by Sanctum
    // We need to decode the token from the cookie
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
    
    if (xsrfCookie) {
      csrfToken = decodeURIComponent(xsrfCookie.split('=')[1]);
    }
    
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// Request interceptor - add CSRF token for non-GET requests
axios.interceptors.request.use(
  async (config) => {
    // For session-based authentication, we need CSRF token for state-changing requests
    if (config.method !== 'get' && config.method !== 'GET') {
      // Fetch CSRF token if we don't have one
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      
      // Add CSRF token to headers
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 419 (CSRF token mismatch), try to refresh the token
    if (error.response?.status === 419) {
      csrfToken = null; // Clear the token so it will be refreshed
    }
    
    // Don't automatically redirect on 401 - let components handle it
    // This prevents redirect loops during auth initialization
    return Promise.reject(error);
  }
);

// Common API methods
export const api = {
  // GET request with query parameters
  get: async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const response = await axios.get(url);
    return response.data;
  },

  // POST request
  post: async (endpoint, data = {}) => {
    const response = await axios.post(endpoint, data);
    return response.data;
  },

  // PUT request
  put: async (endpoint, data = {}) => {
    const response = await axios.put(endpoint, data);
    return response.data;
  },

  // DELETE request
  delete: async (endpoint) => {
    const response = await axios.delete(endpoint);
    return response.data;
  },

  // PATCH request
  patch: async (endpoint, data = {}) => {
    const response = await axios.patch(endpoint, data);
    return response.data;
  },
};

// Common error handler
export const handleApiError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  }
  return {
    message: error.message || 'Network error',
    status: 0,
  };
};

// Common success handler
export const handleApiSuccess = (response) => {
  return {
    data: response.data || response,
    message: response.message || 'Success',
  };
};

// Auth utilities for session-based authentication
export const auth = {
  // For session auth, we don't need to manually manage tokens
  setToken: (token) => {
    // No-op for session authentication
    // The session cookie is automatically managed by the browser
  },

  removeToken: () => {
    // For session auth, we need to call logout endpoint to clear session
    // The session cookie will be cleared by the server
  },

  getToken: () => {
    // For session auth, we don't need to check for tokens
    // The session state is managed by the server
    return null;
  },
};

export default api; 