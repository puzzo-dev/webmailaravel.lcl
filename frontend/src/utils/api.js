import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

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

  // Debug: Log what's being sent
  console.log('formDataAxios request interceptor - config:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data instanceof FormData ? 'FormData object' : config.data
  });

  return config;
});

// Simple API methods
export const api = {
  // GET request with query parameters
  get: async (endpoint, params = {}, config = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      console.log('API GET request:', url, config);
      const response = await axios.get(url, config);
      console.log('API GET response:', response.status, response.data);
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
        console.log('API POST - FormData detected, using formDataAxios');
        console.log('API POST - FormData contents:');
        for (let [key, value] of data.entries()) {
          console.log(key, value);
        }

        // Debug: Check what headers will be sent
        console.log('API POST - Config headers:', config.headers);
        console.log('API POST - formDataAxios defaults:', formDataAxios.defaults.headers);

        const response = await formDataAxios.post(endpoint, data, config);
        console.log('API POST response (FormData):', response.status, response.data);
        return response;
      } else {
        console.log('API POST - JSON data detected');
        console.log('API POST request (JSON):', endpoint, data);
        const response = await axios.post(endpoint, data, config);
        console.log('API POST response:', response.status, response.data);
        return response;
      }
    } catch (error) {
      console.error('API POST error:', error.response?.status, error.response?.data);

      // Debug: Log detailed error information
      if (error.response) {
        console.error('API POST error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            data: error.config?.data instanceof FormData ? 'FormData object' : error.config?.data
          }
        });
      }

      throw error;
    }
  },

  // PUT request
  put: async (endpoint, data = {}) => {
    try {
      console.log('API PUT request:', endpoint, data);
      const response = await axios.put(endpoint, data);
      console.log('API PUT response:', response.status, response.data);
      return response;
    } catch (error) {
      console.error('API PUT error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint, data = {}) => {
    try {
      console.log('API DELETE request:', endpoint, data);
      const response = await axios.delete(endpoint, { data });
      console.log('API DELETE response:', response.status, response.data);
      return response;
    } catch (error) {
      console.error('API DELETE error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // PATCH request
  patch: async (endpoint, data = {}) => {
    try {
      console.log('API PATCH request:', endpoint, data);
      const response = await axios.patch(endpoint, data);
      console.log('API PATCH response:', response.status, response.data);
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