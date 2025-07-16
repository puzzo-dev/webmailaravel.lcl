import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

// Configure axios defaults for JWT authentication
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Secure token storage using httpOnly cookies (if available) or sessionStorage
const secureStorage = {
  setToken: (token) => {
    // Try to use httpOnly cookie first, fallback to sessionStorage
    try {
      // For JWT, we'll use sessionStorage (more secure than localStorage)
      sessionStorage.setItem('jwt_token', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  },

  getToken: () => {
    try {
      return sessionStorage.getItem('jwt_token');
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  removeToken: () => {
    try {
      sessionStorage.removeItem('jwt_token');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },

  setUser: (user) => {
    try {
      sessionStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  },

  getUser: () => {
    try {
      const user = sessionStorage.getItem('user_data');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  clearAuth: () => {
    try {
      sessionStorage.removeItem('jwt_token');
      sessionStorage.removeItem('user_data');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }
};

// Request interceptor - add JWT token for authenticated requests
axios.interceptors.request.use(
  (config) => {
    const token = secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for error handling and token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      secureStorage.clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If we get a 401 (Unauthorized) and haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post('/auth/refresh');
        const newToken = response.data.data.token;
        
        // Store the new token
        secureStorage.setToken(newToken);
        
        // Process queued requests
        processQueue(null, newToken);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        processQueue(refreshError, null);
        secureStorage.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // If we get a 403 (Forbidden), clear auth and redirect to login
    if (error.response?.status === 403) {
      secureStorage.clearAuth();
      window.location.href = '/login';
    }

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
  post: async (endpoint, data = {}, config = {}) => {
    // Handle FormData - axios will set content-type automatically
    if (data instanceof FormData) {
      config.headers = { ...config.headers };
      delete config.headers['Content-Type']; // Let axios set this
    }
    const response = await axios.post(endpoint, data, config);
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

// Auth utilities for JWT authentication
export const auth = {
  // Set token in secure storage
  setToken: (token) => {
    secureStorage.setToken(token);
  },

  // Remove token from secure storage
  removeToken: () => {
    secureStorage.removeToken();
  },

  // Get token from secure storage
  getToken: () => {
    return secureStorage.getToken();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!secureStorage.getToken();
  },

  // Set user data
  setUser: (user) => {
    secureStorage.setUser(user);
  },

  // Get user data
  getUser: () => {
    return secureStorage.getUser();
  },

  // Clear all auth data
  clearAuth: () => {
    secureStorage.clearAuth();
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await axios.post('/auth/refresh');
      const newToken = response.data.data.token;
      secureStorage.setToken(newToken);
      return newToken;
    } catch (error) {
      secureStorage.clearAuth();
      throw error;
    }
  },
};

export default api; 