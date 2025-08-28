import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configure axios defaults for JWT authentication
axios.defaults.baseURL = API_BASE_URL;
// DO NOT set global Content-Type - let each request set its own
axios.defaults.withCredentials = true; // Enable sending cookies with requests

// Add interceptor to main axios instance to debug
axios.interceptors.request.use(
  (config) => {
    console.log('=== MAIN AXIOS REQUEST INTERCEPTOR ===');
    console.log('config.data instanceof FormData:', config.data instanceof FormData);
    console.log('config.headers:', config.headers);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure FormData requests don't get Content-Type set
    if (config.data instanceof FormData) {
      console.log('WARNING: FormData detected in main axios - should use formDataAxios instead');
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Create axios instance for FormData uploads
const formDataAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add auth token to FormData requests
formDataAxios.interceptors.request.use(
  (config) => {
    console.log('=== FORMDATA AXIOS REQUEST INTERCEPTOR ===');
    console.log('config.data instanceof FormData:', config.data instanceof FormData);
    console.log('config.headers:', config.headers);
    console.log('config.data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure Content-Type is not set for FormData
    if (config.data instanceof FormData) {
      console.log('Removing Content-Type header for FormData');
      delete config.headers['Content-Type'];
    }
    
    console.log('Final config.headers:', config.headers);
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to debug what's actually sent
formDataAxios.interceptors.response.use(
  (response) => {
    console.log('=== FORMDATA AXIOS RESPONSE INTERCEPTOR ===');
    console.log('response.config.headers:', response.config.headers);
    console.log('response.config.data instanceof FormData:', response.config.data instanceof FormData);
    return response;
  },
  (error) => {
    console.log('=== FORMDATA AXIOS ERROR INTERCEPTOR ===');
    console.log('error.config.headers:', error.config?.headers);
    console.log('error.config.data instanceof FormData:', error.config?.data instanceof FormData);
    console.log('error.response?.headers:', error.response?.headers);
    return Promise.reject(error);
  }
);

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
      console.log('=== API POST DEBUG ===');
      console.log('data type:', typeof data);
      console.log('data instanceof FormData:', data instanceof FormData);
      console.log('data:', data);
      
      // Handle FormData - use separate axios instance
      if (data instanceof FormData) {
        console.log('Using formDataAxios for FormData');
        console.log('FormData entries:');
        for (let [key, value] of data.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }
        
        // Ensure no Content-Type is set in config for FormData
        const formDataConfig = { ...config };
        delete formDataConfig.headers?.['Content-Type'];
        
        const response = await formDataAxios.post(endpoint, data, formDataConfig);
        return response;
      } else {
        console.log('Using regular axios for non-FormData');
        // Explicitly set Content-Type for JSON requests
        const jsonConfig = {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          }
        };
        const response = await axios.post(endpoint, data, jsonConfig);
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
        console.log('Using formDataAxios for PUT FormData');
        // Ensure no Content-Type is set in config for FormData
        const formDataConfig = { ...config };
        delete formDataConfig.headers?.['Content-Type'];
        
        const response = await formDataAxios.put(endpoint, data, formDataConfig);
        return response;
      } else {
        console.log('Using regular axios for PUT non-FormData');
        // Explicitly set Content-Type for JSON requests
        const jsonConfig = {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          }
        };
        const response = await axios.put(endpoint, data, jsonConfig);
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