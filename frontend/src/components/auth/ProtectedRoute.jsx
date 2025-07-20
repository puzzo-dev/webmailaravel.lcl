import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ requireAdmin = false }) => {
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
  
  if (!isAuthenticated) {
    // Store current location for redirect after login
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login' && currentPath !== '/register') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    
    return <Navigate to="/login" replace />;
  }
  
  // Check if current route is an admin route and user is not admin
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute && (!user?.role || user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Legacy requireAdmin prop support
  if (requireAdmin && (!user?.role || user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute; 