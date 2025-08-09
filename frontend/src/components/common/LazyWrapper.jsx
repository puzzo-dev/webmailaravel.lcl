import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LazyWrapper = ({ children }) => {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;
