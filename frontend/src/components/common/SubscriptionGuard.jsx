import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showSubscriptionOverlay } from '../../store/slices/uiSlice';

/**
 * SubscriptionGuard component - shows subscription overlay for pages that require active subscription
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render when user has active subscription
 * @param {string} props.feature - Name of the feature requiring subscription (for custom messaging)
 * @param {boolean} props.adminOnly - Whether this feature requires admin role (defaults to false)
 * @param {boolean} props.immediate - Whether to show overlay immediately on mount (defaults to false)
 * @param {string} props.fallbackMessage - Custom message to show when subscription is required
 */
const SubscriptionGuard = ({ 
  children, 
  feature = 'this feature',
  adminOnly = false,
  immediate = false,
  fallbackMessage
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { subscriptions } = useSelector((state) => state.billing);

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
    if (immediate && (!hasActiveSubscription() || !hasRequiredRole())) {
      const message = fallbackMessage || 
        (adminOnly 
          ? 'Admin access required for this feature'
          : `Active subscription required to access ${feature}`
        );
      
      dispatch(showSubscriptionOverlay({ message }));
    }
  }, [immediate, feature, adminOnly, fallbackMessage, dispatch]);

  // Show children if user has subscription and required role
  if (hasActiveSubscription() && hasRequiredRole()) {
    return children;
  }

  // For non-immediate guards, just render children and let individual actions trigger the overlay
  if (!immediate) {
    return children;
  }

  // For immediate guards, render nothing (overlay will be shown)
  return null;
};

/**
 * Higher-order component version of SubscriptionGuard
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} guardOptions - Options for the subscription guard
 */
export const withSubscriptionGuard = (WrappedComponent, guardOptions = {}) => {
  return function SubscriptionGuardedComponent(props) {
    return (
      <SubscriptionGuard {...guardOptions} immediate>
        <WrappedComponent {...props} />
      </SubscriptionGuard>
    );
  };
};

/**
 * Custom hook for handling subscription checks in components
 */
export const useSubscriptionCheck = (feature = 'this feature') => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { subscriptions } = useSelector((state) => state.billing);

  const hasActiveSubscription = () => {
    if (user?.role === 'admin') {
      return true;
    }
    return subscriptions?.some(sub => sub.status === 'active') || false;
  };

  const requireSubscription = (customMessage) => {
    if (!hasActiveSubscription()) {
      const message = customMessage || `Active subscription required to access ${feature}`;
      dispatch(showSubscriptionOverlay({ message }));
      return false;
    }
    return true;
  };

  return {
    hasActiveSubscription,
    requireSubscription,
    isAdmin: user?.role === 'admin'
  };
};

export default SubscriptionGuard;
