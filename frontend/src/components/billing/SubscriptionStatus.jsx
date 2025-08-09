import React from 'react';
import { HiCheckCircle, HiClock, HiXCircle, HiCreditCard } from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';

/**
 * Reusable SubscriptionStatus component for displaying current subscription details
 * @param {Object} subscription - Current subscription data
 * @param {boolean} isLoading - Loading state
 * @param {Function} onCancel - Callback for canceling subscription
 */
const SubscriptionStatus = ({ subscription, isLoading = false, onCancel }) => {
  if (!subscription) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiCreditCard className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-600">Subscribe to a plan to unlock premium features</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <HiCheckCircle className="h-4 w-4 mr-1" />;
      case 'processing':
        return <HiClock className="h-4 w-4 mr-1" />;
      default:
        return <HiClock className="h-4 w-4 mr-1" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const planName = subscription.plan?.name || subscription.plan_name || 'Unknown Plan';
  const amount = subscription.payment_amount || subscription.plan?.price || 0;
  const currency = subscription.payment_currency || subscription.plan?.currency || 'USD';
  const duration = subscription.plan?.duration_days;

  return (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
          <p className="text-2xl font-bold text-primary-600">
            {typeof planName === 'string' && planName ? planName : 'Unknown Plan'}
          </p>
          <p className="text-gray-600 mt-1">
            ${formatNumber(typeof amount === 'number' ? amount : 0, 2)} {typeof currency === 'string' ? currency : 'USD'}
            {(typeof duration === 'number' && duration > 0) && (
              <span> / {duration} days</span>
            )}
          </p>
          {subscription.invoice && (
            <p className="text-sm text-gray-500 mt-1">
              Invoice: {subscription.invoice}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(subscription.status)}`}>
            {getStatusIcon(subscription.status)}
            {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1) || 'Unknown'}
          </span>
          
          <p className="text-sm text-gray-500 mt-1">
            {subscription.expiry ? (
              <>Expires: {formatDate(subscription.expiry)}</>
            ) : subscription.next_billing_date ? (
              <>Next billing: {formatDate(subscription.next_billing_date)}</>
            ) : (
              'No expiry date'
            )}
          </p>
          
          {subscription.paid_at && (
            <p className="text-xs text-gray-400 mt-1">
              Paid: {formatDate(subscription.paid_at)}
            </p>
          )}

          {/* Payment URL for pending subscriptions */}
          {subscription.payment_url && subscription.status === 'pending' && (
            <div className="mt-3">
              <a
                href={subscription.payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                <HiCreditCard className="h-4 w-4 mr-1" />
                Complete Payment
              </a>
            </div>
          )}
          
          {/* Cancel Subscription Button */}
          {subscription.status === 'active' && onCancel && (
            <div className="mt-3">
              <button
                onClick={() => onCancel(subscription.id)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HiXCircle className="h-4 w-4 mr-1" />
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
