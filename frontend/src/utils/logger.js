/**
 * Production-safe logging utility
 * Replaces console.log statements with configurable logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    // Only log in development, or when explicitly enabled
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true';
    this.level = this.parseLogLevel(import.meta.env.VITE_LOG_LEVEL || 'INFO');
  }

  parseLogLevel(levelString) {
    return LOG_LEVELS[levelString.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  shouldLog(level) {
    return this.enabled && level <= this.level;
  }

  error(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    
    // In production, send errors to monitoring service
    if (!import.meta.env.DEV) {
      this.sendToMonitoring('error', message, args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // API-specific logging
  apiError(operation, error) {
    const errorInfo = {
      operation,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };

    this.error(`API ${operation} failed:`, errorInfo);
    return errorInfo;
  }

  // Performance logging
  performance(operation, duration) {
    if (duration > 1000) { // Log slow operations
      this.warn(`Slow operation: ${operation} took ${duration}ms`);
    } else if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      this.debug(`Operation: ${operation} completed in ${duration}ms`);
    }
  }

  // Send to monitoring service in production
  sendToMonitoring(level, message, args) {
    // Placeholder for production monitoring integration
    // Could integrate with Sentry, LogRocket, etc.
    if (window.Sentry) {
      window.Sentry.captureMessage(message, level);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Convenience exports
export const { error, warn, info, debug, apiError, performance } = logger;
