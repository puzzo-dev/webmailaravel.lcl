import { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { recordFrontendMetric, trackFrontendPerformance } from '../store/slices/performanceSlice';

/**
 * Custom hook for tracking frontend performance metrics
 */
export const usePerformanceTracking = () => {
  const dispatch = useDispatch();
  const timingRef = useRef({});

  // Track page load performance
  const trackPageLoad = useCallback((pageName) => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        // Store in Redux for local tracking
        dispatch(recordFrontendMetric({
          type: 'pageLoad',
          data: {
            page: pageName,
            duration: loadTime,
            timestamp: new Date().toISOString()
          }
        }));

        // Send to backend for centralized tracking
        dispatch(trackFrontendPerformance({
          component: 'page',
          action: 'load',
          duration: loadTime,
          metadata: {
            page: pageName,
            dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp_connect: navigation.connectEnd - navigation.connectStart,
            request_response: navigation.responseEnd - navigation.requestStart,
            dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load_complete: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
          }
        }));
      }
    }
  }, [dispatch]);

  // Start timing a component render or operation
  const startTiming = useCallback((operation) => {
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    timingRef.current[operation] = {
      startTime,
      startMemory,
      operation
    };
    
    return operation;
  }, []);

  // End timing and record the metric
  const endTiming = useCallback((operation, metadata = {}) => {
    if (!timingRef.current[operation]) {
      console.warn(`No timing started for operation: ${operation}`);
      return;
    }

    const timing = timingRef.current[operation];
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const duration = endTime - timing.startTime;
    const memoryUsed = endMemory - timing.startMemory;

    // Store in Redux for local tracking
    dispatch(recordFrontendMetric({
      type: 'componentRender',
      data: {
        operation,
        duration,
        memoryUsed,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }));

    // Send to backend for centralized tracking
    dispatch(trackFrontendPerformance({
      component: metadata.component || 'unknown',
      action: metadata.action || 'render',
      duration,
      metadata: {
        operation,
        memory_used: memoryUsed,
        ...metadata
      }
    }));

    // Clean up
    delete timingRef.current[operation];
    
    return duration;
  }, [dispatch]);

  // Track API call performance
  const trackApiCall = useCallback((endpoint, method, duration, status, metadata = {}) => {
    // Store in Redux for local tracking
    dispatch(recordFrontendMetric({
      type: 'apiResponse',
      data: {
        endpoint,
        method,
        duration,
        status,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }));

    // Send to backend for centralized tracking
    dispatch(trackFrontendPerformance({
      component: 'api',
      action: 'request',
      duration,
      metadata: {
        endpoint,
        method,
        status,
        success: status >= 200 && status < 300,
        ...metadata
      }
    }));
  }, [dispatch]);

  // Track errors
  const trackError = useCallback((error, component = 'unknown', metadata = {}) => {
    // Store in Redux for local tracking
    dispatch(recordFrontendMetric({
      type: 'error',
      data: {
        component,
        error: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }));

    // Send to backend for centralized tracking
    dispatch(trackFrontendPerformance({
      component,
      action: 'error',
      duration: 0,
      metadata: {
        error_message: error.message || error,
        error_type: error.name || 'Error',
        ...metadata
      }
    }));
  }, [dispatch]);

  // Track user interactions
  const trackInteraction = useCallback((action, element, metadata = {}) => {
    const duration = 0; // Interactions are instantaneous
    
    dispatch(trackFrontendPerformance({
      component: 'user_interaction',
      action,
      duration,
      metadata: {
        element,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }));
  }, [dispatch]);

  // Auto-track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden
        dispatch(trackFrontendPerformance({
          component: 'page',
          action: 'hidden',
          duration: 0,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }));
      } else {
        // Page became visible
        dispatch(trackFrontendPerformance({
          component: 'page',
          action: 'visible',
          duration: 0,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dispatch]);

  // Auto-track unhandled errors
  useEffect(() => {
    const handleError = (event) => {
      trackError(event.error, 'global', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event) => {
      trackError(event.reason, 'promise', {
        type: 'unhandled_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  return {
    trackPageLoad,
    startTiming,
    endTiming,
    trackApiCall,
    trackError,
    trackInteraction
  };
};

/**
 * HOC for automatically tracking component render performance
 */
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    const { startTiming, endTiming } = usePerformanceTracking();
    
    useEffect(() => {
      const timingId = startTiming(`${componentName}_render`);
      
      return () => {
        endTiming(timingId, {
          component: componentName,
          action: 'render'
        });
      };
    }, [startTiming, endTiming]);

    return <WrappedComponent {...props} />;
  };
};

export default usePerformanceTracking;
