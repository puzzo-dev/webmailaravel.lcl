import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...', className = '', inline = false, color = 'blue' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-t-blue-600',
    primary: 'border-t-primary-600',
    green: 'border-t-green-600',
    red: 'border-t-red-600',
    white: 'border-t-white'
  };

  const containerClass = inline 
    ? `flex items-center justify-center ${className}` 
    : `flex flex-col items-center justify-center min-h-[200px] space-y-3 ${className}`;

  return (
    <div className={containerClass}>
      <div className={`animate-spin rounded-full border-4 border-gray-200 ${colorClasses[color]} ${sizeClasses[size]}`}></div>
      {message && !inline && (
        <p className="text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

// Consolidated spinner variants to replace hardcoded spinners throughout the app
export const PageLoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" message={message} />
  </div>
);

export const InlineLoadingSpinner = ({ message = '' }) => (
  <LoadingSpinner size="sm" message={message} inline className="py-4" />
);

export const ButtonLoadingSpinner = ({ color = 'white' }) => (
  <LoadingSpinner size="sm" color={color} inline />
);

export default LoadingSpinner;
