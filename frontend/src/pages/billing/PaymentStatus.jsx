import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiClock, 
  HiExclamation,
  HiRefresh,
  HiArrowLeft
} from 'react-icons/hi';
import { fetchSubscriptions } from '../../store/slices/billingSlice';
import { billingService } from '../../services/api';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const subscriptionId = searchParams.get('subscription');
  const status = searchParams.get('status') || 'processing'; // success, cancelled, failed, processing

  useEffect(() => {
    if (!subscriptionId) {
      toast.error('Invalid subscription reference');
      navigate('/billing');
      return;
    }

    fetchSubscriptionDetails();
  }, [subscriptionId, retryCount]);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const response = await billingService.getSubscriptions();
      const sub = response.data?.find(s => s.id == subscriptionId) || response.find?.(s => s.id == subscriptionId);
      
      if (sub) {
        setSubscription(sub);
        // Auto-redirect to billing if payment is confirmed active
        if (sub.status === 'active') {
          setTimeout(() => {
            navigate('/billing');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error('Failed to fetch payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (subscription?.payment_url) {
      window.location.href = subscription.payment_url;
    } else {
      setRetryCount(prev => prev + 1);
      fetchSubscriptionDetails();
    }
  };

  const getStatusDisplay = () => {
    if (loading) {
      return {
        icon: HiClock,
        title: 'Loading...',
        message: 'Checking payment status...',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        iconColor: 'text-blue-500'
      };
    }

    const subStatus = subscription?.status || status;

    switch (subStatus) {
      case 'active':
        return {
          icon: HiCheckCircle,
          title: 'Payment Successful!',
          message: 'Your subscription has been activated successfully.',
          bgColor: 'bg-green-50',
          textColor: 'text-green-600',
          iconColor: 'text-green-500'
        };
      
      case 'processing':
      case 'confirming':
        return {
          icon: HiClock,
          title: 'Payment Processing',
          message: 'Your payment is being confirmed. This may take a few minutes.',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-600',
          iconColor: 'text-yellow-500'
        };
      
      case 'cancelled':
      case 'canceled':
        return {
          icon: HiXCircle,
          title: 'Payment Cancelled',
          message: 'Your payment was cancelled. You can try again anytime.',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          iconColor: 'text-gray-500'
        };
      
      case 'failed':
      case 'expired':
        return {
          icon: HiExclamation,
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          iconColor: 'text-red-500'
        };
      
      default:
        return {
          icon: HiClock,
          title: 'Processing Payment',
          message: 'Please wait while we confirm your payment.',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          iconColor: 'text-blue-500'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const canRetry = ['cancelled', 'failed', 'expired'].includes(subscription?.status || status);
  const isProcessing = ['processing', 'confirming'].includes(subscription?.status || status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className={`${statusDisplay.bgColor} rounded-lg p-8 text-center`}>
          <StatusIcon className={`mx-auto h-16 w-16 ${statusDisplay.iconColor} mb-4`} />
          
          <h1 className={`text-2xl font-bold ${statusDisplay.textColor} mb-2`}>
            {statusDisplay.title}
          </h1>
          
          <p className={`${statusDisplay.textColor} mb-6`}>
            {statusDisplay.message}
          </p>

          {subscription && (
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Subscription Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{subscription.plan?.name || subscription.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">
                    ${subscription.payment_amount || subscription.plan?.price} {subscription.payment_currency || subscription.plan?.currency || 'USD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium capitalize ${
                    subscription.status === 'active' ? 'text-green-600' : 
                    subscription.status === 'processing' ? 'text-yellow-600' : 
                    'text-gray-600'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                {subscription.expiry && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="font-medium">
                      {new Date(subscription.expiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {isProcessing && (
              <button
                onClick={() => setRetryCount(prev => prev + 1)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <HiRefresh className="h-4 w-4 mr-2" />
                Refresh Status
              </button>
            )}

            {canRetry && (
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <HiRefresh className="h-4 w-4 mr-2" />
                Retry Payment
              </button>
            )}

            <button
              onClick={() => navigate('/billing')}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="text-center text-sm text-gray-500">
            <p>This page will automatically refresh every 30 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
