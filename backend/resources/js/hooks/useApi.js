import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create a pre-configured axios instance that sends credentials
// (including the jwt_token cookie) with every API request.
const apiClient = axios.create({
    withCredentials: true,
});

/**
 * Fetch data from an API endpoint with loading/error states.
 */
export function useApi(url, options = {}) {
    const [data, setData] = useState(options.initialData ?? null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(url);
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData, setData };
}

/**
 * Perform a POST/PUT/DELETE API action.
 */
export function useApiAction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (method, url, payload = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient({ method, url, data: payload });
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Operation failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { execute, loading, error, setError };
}
