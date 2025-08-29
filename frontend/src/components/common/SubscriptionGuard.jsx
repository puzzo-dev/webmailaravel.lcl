import React, { useEffect } from 'react';
import { useSubscription } from '../../hooks';

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
  const {
    hasActiveSubscription,
    hasRequiredRole,
    showSubscriptionModal
  } = useSubscription();

  useEffect(() => {
    if (immediate && (!hasActiveSubscription() || !hasRequiredRole(adminOnly))) {
      const message = fallbackMessage ||
        (adminOnly
          ? 'Admin access required for this feature'
          : `Active subscription required to access ${feature}`
        );

      showSubscriptionModal(message, feature);
    }
  }, [immediate, feature, adminOnly, fallbackMessage, hasActiveSubscription, hasRequiredRole, showSubscriptionModal]);

  // Show children if user has subscription and required role
  if (hasActiveSubscription() && hasRequiredRole(adminOnly)) {
    return children;
  }

  // For non-immediate guards, just render children and let individual actions trigger the overlay
  if (!immediate) {
    return children;
  }

  // For immediate guards, render nothing (overlay will be shown)
  return null;
};

export default SubscriptionGuard;
