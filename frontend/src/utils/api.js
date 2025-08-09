import axios from 'axios';
import logger from './logger';

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
      
      // Merge params into axios config properly
      const axiosConfig = {
        ...config,
        params: Object.keys(params).length > 0 ? params : undefined
      };
      
      // For blob responses, ensure proper handling of binary data
      if (config.responseType === 'blob') {
        axiosConfig.responseEncoding = 'binary';
      }
      
      const response = await axios.get(endpoint, axiosConfig);
      
      return response;
    } catch (error) {
      // Don't log 401 errors during auth initialization
      if (!(config._isAuthInit && error.response?.status === 401)) {
        logger.apiError('GET', error);
      }
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data = {}, config = {}) => {
    try {
      // Handle FormData - use separate axios instance
      if (data instanceof FormData) {
        const response = await formDataAxios.post(endpoint, data, config);
        return response;
      } else {
        const response = await axios.post(endpoint, data, config);
        return response;
      }
    } catch (error) {
      logger.apiError('POST', error);

      throw error;
    }
  },

  // PUT request
  put: async (endpoint, data = {}, config = {}) => {
    try {
      // Handle FormData - use separate axios instance
      if (data instanceof FormData) {
        const response = await formDataAxios.put(endpoint, data, config);
        return response;
      } else {
        const response = await axios.put(endpoint, data, config);
        return response;
      }
    } catch (error) {
      logger.apiError('PUT', error);
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint, data = {}, config = {}) => {
    try {
      const response = await axios.delete(endpoint, { data, ...config });
      return response;
    } catch (error) {
      logger.apiError('DELETE', error);
      throw error;
    }
  },

  // PATCH request
  patch: async (endpoint, data = {}, config = {}) => {
    try {
      // Handle FormData - use separate axios instance
      if (data instanceof FormData) {
        const response = await formDataAxios.patch(endpoint, data, config);
        return response;
      } else {
        const response = await axios.patch(endpoint, data, config);
        return response;
      }
    } catch (error) {
      logger.apiError('PATCH', error);
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