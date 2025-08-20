/**
 * Utility functions for handling API errors and extracting meaningful error messages
 */

/**
 * Serialize error for Redux store (removes non-serializable properties)
 * @param {Object} error - The error object from API call
 * @returns {Object} - Serializable error object
 */
export const serializeError = (error) => {
  if (!error) return null;
  
  return {
    message: error.message || 'An error occurred',
    status: error.response?.status || error.status,
    statusText: error.response?.statusText || error.statusText,
    data: error.response?.data || error.data,
    code: error.code,
    name: error.name
  };
};

/**
 * Extract error message from API error response
 * @param {Object} error - The error object from API call
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Handle different error response structures
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Laravel validation errors (array format)
    if (data.errors && typeof data.errors === 'object') {
      const firstErrorKey = Object.keys(data.errors)[0];
      if (firstErrorKey && Array.isArray(data.errors[firstErrorKey])) {
        return data.errors[firstErrorKey][0];
      }
    }
    
    // Error string directly in errors field (our case)
    if (data.errors && typeof data.errors === 'string') {
      return data.errors;
    }
    
    // Standard API error message
    if (data.message) {
      return data.message;
    }
    
    // Error string directly in data
    if (typeof data === 'string') {
      return data;
    }
    
    // Error with details
    if (data.error) {
      return data.error;
    }
  }
  
  // Network or other errors
  if (error?.message) {
    return error.message;
  }
  
  // HTTP status code messages
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'Access denied. You don\'t have permission for this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable.';
      default:
        return `Request failed with status ${error.response.status}`;
    }
  }
  
  // Fallback message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extract success message from API response
 * @param {Object} response - The response object from API call
 * @returns {string} - Success message
 */
export const getSuccessMessage = (response) => {
  if (response?.data?.message) {
    return response.data.message;
  }
  
  if (response?.message) {
    return response.message;
  }
  
  return 'Operation completed successfully';
};

/**
 * Check if error is a network error
 * @param {Object} error - The error object
 * @returns {boolean} - True if network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.message && error.message.includes('Network Error');
};

/**
 * Check if error is an authentication error
 * @param {Object} error - The error object
 * @returns {boolean} - True if auth error
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Check if error is a validation error
 * @param {Object} error - The error object
 * @returns {boolean} - True if validation error
 */
export const isValidationError = (error) => {
  return error?.response?.status === 422 || 
         (error?.response?.data?.errors && typeof error.response.data.errors === 'object');
};

export default {
  getErrorMessage,
  getSuccessMessage,
  isNetworkError,
  isAuthError,
  isValidationError
};
