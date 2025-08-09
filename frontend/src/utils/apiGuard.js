// API Guard utility to handle missing methods gracefully
import logger from './logger';

export const createApiGuard = (service, serviceName) => {
  return new Proxy(service, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return target[prop];
      }
      
      if (typeof prop === 'string' && prop !== 'constructor') {
        logger.error(`Missing API method: ${serviceName}.${prop}`);
        // Return a function that throws a user-friendly error
        return () => {
          throw new Error(`The ${serviceName}.${prop} method is temporarily unavailable. Please refresh the page.`);
        };
      }
      
      return target[prop];
    }
  });
};
