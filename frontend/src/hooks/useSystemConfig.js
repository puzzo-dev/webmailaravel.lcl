import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSystemConfig, 
  selectAppName, 
  selectIsLoading, 
  selectError,
  selectNeedsRefresh 
} from '../store/slices/systemConfigSlice';

/**
 * Custom hook to manage system configuration
 * Automatically fetches config if needed and provides easy access to app name
 */
export const useSystemConfig = () => {
  const dispatch = useDispatch();
  const appName = useSelector(selectAppName);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const needsRefresh = useSelector(selectNeedsRefresh);

  useEffect(() => {
    // Fetch system config if it needs refresh or hasn't been loaded
    if (needsRefresh) {
      dispatch(fetchSystemConfig());
    }
  }, [dispatch, needsRefresh]);

  return {
    appName,
    isLoading,
    error,
    needsRefresh,
    refreshConfig: () => dispatch(fetchSystemConfig()),
  };
};

/**
 * Simple hook to just get the app name without automatic fetching
 * Useful for components that don't need the full config management
 */
export const useAppName = () => {
  return useSelector(selectAppName);
};

export default useSystemConfig;
