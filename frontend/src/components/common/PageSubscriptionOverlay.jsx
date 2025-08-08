import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showSubscriptionOverlay } from '../../store/slices/uiSlice';
import { fetchSubscriptions } from '../../store/slices/billingSlice';

/**
 * PageSubscriptionOverlay - Component to automatically show subscription overlay on page load
 * for pages that require active subscription. Add this component to any page that should
 * be subscription-protected.
 */
const PageSubscriptionOverlay = ({ 
  feature = 'this page',
  adminOnly = false,
  delay = 500, // Delay in ms before showing overlay (to allow page to load)
  customMessage
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { subscriptions } = useSelector((state) => state.billing);
  const { subscriptionOverlay } = useSelector((state) => state.ui);
  
  // Track if we've already fetched subscriptions to prevent infinite loops
  const hasFetchedSubscriptions = useRef(false);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    // Admin users bypass subscription checks
    if (user?.role === 'admin') {
      return true;
    }

    // Check if user has any active subscription
    return subscriptions?.some(sub => sub.status === 'active') || false;
  };

  // Check if user meets role requirements
  const hasRequiredRole = () => {
    if (adminOnly) {
      return user?.role === 'admin';
    }
    return true; // No role requirement
  };

  useEffect(() => {
    // Skip subscription fetching for admin users on admin-only pages
    if (adminOnly && user?.role === 'admin') {
      return;
    }
    
    // Fetch subscription data if user is authenticated and we haven't fetched yet
    if (user && !hasFetchedSubscriptions.current && subscriptions.length === 0) {
      hasFetchedSubscriptions.current = true;
      dispatch(fetchSubscriptions());
    }
  }, [user, adminOnly, dispatch]); // Removed subscriptions.length dependency

  useEffect(() => {
    // Skip overlay for admin users on admin-only pages
    if (adminOnly && user?.role === 'admin') {
      return;
    }
    
    // Don't show overlay if already visible or if user has subscription and required role
    if (subscriptionOverlay.isVisible || (hasActiveSubscription() && hasRequiredRole())) {
      return;
    }

    // Show overlay after delay
    const timer = setTimeout(() => {
      const message = customMessage || 
        (adminOnly 
          ? 'Admin access required for this feature'
          : `Active subscription required to access ${feature}`
        );
      
      dispatch(showSubscriptionOverlay({ message }));
    }, delay);

    return () => clearTimeout(timer);
  }, [user?.role, adminOnly, subscriptionOverlay.isVisible]); // Simplified dependencies

  // This component doesn't render anything - it just triggers the overlay
  return null;
};

export default PageSubscriptionOverlay;
