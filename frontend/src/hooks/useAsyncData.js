import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for async data fetching with loading, error, and retry states
 * Handles common patterns for API calls and data loading
 */
export const useAsyncData = (asyncFunction, dependencies = [], options = {}) => {
  const {
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);

  // Track if component is mounted to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction(...args);
      
      if (isMountedRef.current) {
        setData(result);
        setRetryAttempts(0);
        onSuccess?.(result);
      }
      
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        onError?.(err);

        // Auto retry if configured
        if (retryAttempts < retryCount) {
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setRetryAttempts(prev => prev + 1);
              execute(...args);
            }
          }, retryDelay);
        }
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction, retryAttempts, retryCount, retryDelay, onSuccess, onError]);

  const retry = useCallback(() => {
    setRetryAttempts(0);
    execute();
  }, [execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
    setRetryAttempts(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [initialData]);

  const mutate = useCallback((newData) => {
    setData(newData);
  }, []);

  // Auto-execute on mount and dependency changes
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
    mutate,
    retryAttempts,
    isRetrying: retryAttempts > 0
  };
};

export default useAsyncData;
