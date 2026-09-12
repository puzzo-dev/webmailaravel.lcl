/**
 * Extract a human-readable error message from an API error response.
 */
export const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

/**
 * Serialize an error into a plain object for Redux storage.
 */
export const serializeError = (error) => {
    if (!error) return { message: 'Unknown error' };
    return {
        message: getErrorMessage(error),
        status: error.response?.status || 0,
        data: error.response?.data || null,
    };
};

export default getErrorMessage;
