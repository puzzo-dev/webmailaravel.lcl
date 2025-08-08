import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ViewGuard component that ensures users are on the correct routes based on their current view
 * This component should be rendered within the main Layout to handle view-based routing
 */
const ViewGuard = () => {
  const { user, currentView } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const isAdmin = user.role === 'admin';
    const isAdminView = currentView === 'admin';
    const isOnAdminRoute = location.pathname.startsWith('/admin');

    // Only redirect admin users based on their current view
    if (isAdmin) {
      // If admin is in admin view but on a non-admin route
      if (isAdminView && !isOnAdminRoute && location.pathname !== '/') {
        navigate('/admin', { replace: true });
      }
      // If admin is in user view but on an admin route
      else if (!isAdminView && isOnAdminRoute) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, currentView, location.pathname, navigate]);

  // This component doesn't render anything
  return null;
};

export default ViewGuard;
