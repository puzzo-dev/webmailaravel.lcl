import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

// Configure axios defaults for JWT authentication
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Enable sending cookies with requests

// Cookie-based authentication - no local storage needed
const secureStorage = {
  setToken: (token) => {
    // Tokens are handled by HTTP-only cookies from the backend
    // No local storage needed
  },

  getToken: () => {
    // Tokens are sent automatically via cookies
    return null;
  },

  removeToken: () => {
    // Token removal is handled by the backend logout endpoint
  },

  setUser: (user) => {
    // User data is managed by Redux state, no local storage needed
  },

  getUser: () => {
    // User data is managed by Redux state
    return null;
  },

  clearAuth: () => {
    // Auth state is managed by Redux and HTTP-only cookies
  }
};

// Request interceptor - ensure credentials are sent with requests
axios.interceptors.request.use(
  (config) => {
    // Ensure credentials (cookies) are sent with every request
    config.withCredentials = true;
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
      return Promise.reject(error);
    }

    // Skip automatic redirects for auth initialization calls
    if (originalRequest.url?.includes('/user/me') && originalRequest._isAuthInit) {
      return Promise.reject(error);
    }

    // If we get a 401 (Unauthorized) and haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          // Token is automatically sent via cookies
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
        
        // Token is automatically set in HTTP-only cookie by backend
        // Process queued requests
        processQueue(null, 'refreshed');
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login (Redux will handle state clearing)
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // If we get a 403 (Forbidden), redirect to login
    if (error.response?.status === 403) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Common API methods
export const api = {
  // GET request with query parameters
  get: async (endpoint, params = {}, config = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const response = await axios.get(url, config);
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
  delete: async (endpoint, data = {}) => {
    const response = await axios.delete(endpoint, { data });
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

  // Check if user is authenticated (this should be handled by Redux state)
  isAuthenticated: () => {
    // This will be handled by Redux state, not local storage
    return false;
  },

  // Set user data (handled by Redux)
  setUser: (user) => {
    // User data is managed by Redux
  },

  // Get user data (handled by Redux)
  getUser: () => {
    // User data is managed by Redux
    return null;
  },

  // Clear all auth data (handled by Redux and logout endpoint)
  clearAuth: () => {
    // Auth clearing is handled by Redux and backend logout
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await axios.post('/auth/refresh');
      // Token is automatically set in HTTP-only cookie by backend
      return response.data;
    } catch (error) {
      // Token refresh failed, let Redux handle state clearing
      throw error;
    }
  },
};

export default api; 