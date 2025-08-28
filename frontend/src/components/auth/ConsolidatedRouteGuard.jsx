import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageLoadingSpinner } from '../common/LoadingSpinner';

/**
 * Consolidated route guard component that replaces:
 * - ProtectedRoute.jsx
 * - AuthRoute.jsx 
 * - ViewGuard.jsx
 */
const ConsolidatedRouteGuard = ({ 
  requireAuth = true, 
  requireAdmin = false, 
  redirectTo = '/',
  allowedRoles = [],
  children 
}) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoadingSpinner message="Authenticating..." />;
  }

  // Handle authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Handle non-auth requirement (redirect authenticated users)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Handle admin requirement
  if (requireAdmin && (!user || user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle role-based access
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children or outlet
  return children || <Outlet />;
};

// Convenience components for backward compatibility
export const ProtectedRoute = ({ children }) => (
  <ConsolidatedRouteGuard requireAuth={true}>
    {children}
  </ConsolidatedRouteGuard>
);

export const AuthRoute = ({ children }) => (
  <ConsolidatedRouteGuard requireAuth={false} redirectTo="/dashboard">
    {children}
  </ConsolidatedRouteGuard>
);

export const AdminRoute = ({ children }) => (
  <ConsolidatedRouteGuard requireAuth={true} requireAdmin={true}>
    {children}
  </ConsolidatedRouteGuard>
);

export const RoleGuard = ({ roles, children }) => (
  <ConsolidatedRouteGuard requireAuth={true} allowedRoles={roles}>
    {children}
  </ConsolidatedRouteGuard>
);

export default ConsolidatedRouteGuard;
