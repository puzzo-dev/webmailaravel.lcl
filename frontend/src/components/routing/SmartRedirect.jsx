import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Smart redirect component that handles routing based on user role and current view
 */
const SmartRedirect = () => {
  const { user, currentView } = useSelector((state) => state.auth);
  const location = useLocation();

  // Don't redirect if user is not authenticated (handled elsewhere)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin';
  const isAdminView = currentView === 'admin';

  // If user is on root path, redirect based on current view
  if (location.pathname === '/') {
    if (isAdmin && isAdminView) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If admin user is in admin view but on a non-admin route, redirect to admin
  if (isAdmin && isAdminView && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  // If admin user is in user view but on an admin route, redirect to dashboard
  if (isAdmin && !isAdminView && location.pathname.startsWith('/admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  // No redirect needed
  return null;
};

export default SmartRedirect;
