import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configure axios defaults for JWT authentication
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Enable sending cookies with requests

// Create a separate axios instance for FormData requests
const formDataAxios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 300000, // 5 minutes for large file uploads
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  // Don't set Content-Type - let axios set it automatically for FormData
});

// Add request interceptor to copy auth headers
formDataAxios.interceptors.request.use((config) => {
  // Copy auth headers from main axios instance
  if (axios.defaults.headers.common['Authorization']) {
    config.headers.Authorization = axios.defaults.headers.common['Authorization'];
  }
  return config;
});

// Simple API methods
export const api = {
  // GET request with query parameters
  get: async (endpoint, params = {}, config = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      console.error('API GET error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data = {}, config = {}) => {
    try {
      // Handle FormData - use separate axios instance
      if (data instanceof FormData) {
        // Ensure no Content-Type is set in config for FormData
        const formDataConfig = { ...config };
        delete formDataConfig.headers?.['Content-Type'];
        
        const response = await formDataAxios.post(endpoint, data, formDataConfig);
        return response;
      } else {
        const response = await axios.post(endpoint, data, config);
        return response;
      }
    } catch (error) {
      console.error('API POST error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // PUT request
  put: async (endpoint, data = {}, config = {}) => {
    try {
      // Handle FormData - use separate axios instance
      if (data instanceof FormData) {
        // Ensure no Content-Type is set in config for FormData
        const formDataConfig = { ...config };
        delete formDataConfig.headers?.['Content-Type'];
        
        const response = await formDataAxios.put(endpoint, data, formDataConfig);
        return response;
      } else {
        const response = await axios.put(endpoint, data, config);
        return response;
      }
    } catch (error) {
      console.error('API PUT error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint, data = {}) => {
    try {
      const response = await axios.delete(endpoint, { data });
      return response;
    } catch (error) {
      console.error('API DELETE error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // PATCH request
  patch: async (endpoint, data = {}) => {
    try {
      const response = await axios.patch(endpoint, data);
      return response;
    } catch (error) {
      console.error('API PATCH error:', error.response?.status, error.response?.data);
      throw error;
    }
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

export default api; 