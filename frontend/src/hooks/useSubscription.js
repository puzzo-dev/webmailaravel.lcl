import { useSelector, useDispatch } from 'react-redux';
import { showSubscriptionOverlay } from '../store/slices/uiSlice';
import {
  createSubscription,
  cancelSubscription,
  fetchSubscriptions,
  clearError,
} from '../store/slices/billingSlice';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Custom hook for managing subscription state and operations
 * Consolidates subscription logic from SubscriptionGuard and Billing components
 */
const useSubscription = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    subscriptions, 
    currentSubscription,
    plans,
    isLoading,
    error 
  } = useSelector((state) => state.billing);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    // Admin users bypass subscription checks
    if (user?.role === 'admin') {
      return true;
    }
    // Check if user has any active subscription
    return subscriptions?.some(sub => sub.status === 'active') || false;
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user meets role requirements
  const hasRequiredRole = (adminOnly = false) => {
    if (adminOnly) {
      return isAdmin;
    }
    return true; // No role requirement
  };

  // Show subscription overlay with custom message
  const showSubscriptionModal = (message, feature = 'this feature') => {
    const defaultMessage = `Active subscription required to access ${feature}`;
    dispatch(showSubscriptionOverlay({ message: message || defaultMessage }));
  };

  // Require subscription check with optional custom message
  const requireSubscription = (feature = 'this feature', customMessage) => {
    if (!hasActiveSubscription()) {
      const message = customMessage || `Active subscription required to access ${feature}`;
      showSubscriptionModal(message, feature);
      return false;
    }
    return true;
  };

  // Upgrade to a plan
  const upgradeToPlan = async (planId) => {
    try {
      const result = await dispatch(createSubscription({ plan_id: planId })).unwrap();
      
      if (result?.checkout_url) {
        toast.success('Redirecting to BTCPay to complete payment...');
        window.location.href = result.checkout_url;
      } else {
        toast.success('Subscription created. Please check your email for payment instructions.');
        console.warn('No checkout_url returned from subscription creation result:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Plan upgrade failed:', error);
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  // Cancel subscription
  const cancelUserSubscription = async (subscriptionId) => {
    if (!subscriptionId && currentSubscription?.id) {
      subscriptionId = currentSubscription.id;
    }

    if (!subscriptionId) {
      toast.error('No subscription found to cancel');
      return false;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? This action cannot be undone.'
    );
    
    if (!confirmed) return false;
    
    try {
      await dispatch(cancelSubscription(subscriptionId)).unwrap();
      toast.success('Subscription cancelled successfully');
      // Refresh subscriptions
      await dispatch(fetchSubscriptions());
      return true;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  // Clear billing errors
  const clearBillingError = () => {
    dispatch(clearError());
  };

  // Get subscription status details
  const getSubscriptionStatus = () => {
    if (!currentSubscription) {
      return { status: 'none', message: 'No active subscription' };
    }

    const status = currentSubscription.status;
    const statusMessages = {
      active: 'Your subscription is active',
      pending: 'Payment pending - please complete payment',
      processing: 'Payment is being processed',
      cancelled: 'Subscription has been cancelled',
      expired: 'Subscription has expired',
    };

    return {
      status,
      message: statusMessages[status] || 'Unknown subscription status',
      subscription: currentSubscription,
    };
  };

  // Get plan features in a standardized format
  const getPlanFeatures = (plan = currentSubscription?.plan) => {
    if (!plan) return [];

    let features = [];
    
    if (Array.isArray(plan.features)) {
      features = plan.features;
    } else if (typeof plan.features === 'string') {
      try {
        features = JSON.parse(plan.features);
      } catch {
        features = [plan.features];
      }
    }

    return features.map(feature => 
      typeof feature === 'string' ? feature : feature.name || 'Feature'
    );
  };

  // Get plan limits in a standardized format
  const getPlanLimits = (plan = currentSubscription?.plan) => {
    if (!plan) return {};

    return {
      maxDomains: plan.max_domains > 0 ? plan.max_domains : 'Unlimited',
      maxCampaigns: plan.max_total_campaigns > 0 ? plan.max_total_campaigns : 'Unlimited',
      dailyLimit: plan.daily_sending_limit > 0 ? plan.daily_sending_limit : 'Unlimited',
      sendersPerDomain: plan.max_senders_per_domain > 0 ? plan.max_senders_per_domain : 'Unlimited',
    };
  };

  // Check if current plan is same as given plan
  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan?.id === planId;
  };

  return {
    // State
    subscriptions,
    currentSubscription,
    plans,
    isLoading,
    error,
    
    // Status checks
    hasActiveSubscription,
    isAdmin,
    hasRequiredRole,
    
    // Actions
    requireSubscription,
    showSubscriptionModal,
    upgradeToPlan,
    cancelUserSubscription,
    clearBillingError,
    
    // Utilities
    getSubscriptionStatus,
    getPlanFeatures,
    getPlanLimits,
    isCurrentPlan,
  };
};

export default useSubscription;
