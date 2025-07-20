import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthRoute = () => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Check if we have a preserved location from login flow
    const from = location.state?.from?.pathname;
    if (from) {
      return <Navigate to={from} replace />;
    }
    
    // Default redirect to appropriate dashboard based on user role
    const redirectPath = user?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <Outlet />;
};

export default AuthRoute; 