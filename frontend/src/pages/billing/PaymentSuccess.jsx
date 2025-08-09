import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { fetchBillingData } from '../../store/slices/billingSlice';
import billingService from '../../services/billingService';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('processing');

  const subscriptionId = searchParams.get('subscription');

  useEffect(() => {
    if (!subscriptionId) {
      toast.error('Invalid subscription reference');
      navigate('/billing');
      return;
    }

    // Fetch subscription details
    const fetchSubscriptionDetails = async () => {
      try {
        const response = await billingService.getSubscription(subscriptionId);
        setSubscription(response);
        
        // Determine payment status based on subscription status
        switch (response.status) {
          case 'active':
            setPaymentStatus('confirmed');
            break;
          case 'confirming':
            setPaymentStatus('confirming');
            break;
          case 'processing':
            setPaymentStatus('processing');
            break;
          case 'pending':
            setPaymentStatus('pending');
            break;
          default:
            setPaymentStatus('unknown');
        }
      } catch (error) {
        console.error('Failed to fetch subscription details:', error);
        toast.error('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();

    // Poll for status updates if payment is still processing
    const interval = setInterval(async () => {
      if (paymentStatus === 'processing' || paymentStatus === 'confirming' || paymentStatus === 'pending') {
        try {
          const response = await billingService.getSubscription(subscriptionId);
          setSubscription(response);
          
          if (response.status === 'active') {
            setPaymentStatus('confirmed');
            clearInterval(interval);
            toast.success('Payment confirmed! Your subscription is now active.');
            // Refresh billing data
            dispatch(fetchBillingData());
          } else if (response.status === 'confirming') {
            setPaymentStatus('confirming');
          }
        } catch (error) {
          console.error('Failed to poll subscription status:', error);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [subscriptionId, navigate, dispatch, paymentStatus]);

  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500" />,
          title: 'Payment Confirmed!',
          subtitle: 'Your subscription is now active',
          description: 'Your Bitcoin payment has been confirmed with the required number of confirmations. You now have full access to all features.',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800'
        };
      case 'confirming':
        return {
          icon: <ClockIcon className="h-16 w-16 text-yellow-500" />,
          title: 'Payment Confirming',
          subtitle: 'Waiting for blockchain confirmations',
          description: subscription?.payment_data?.btc_confirmations 
            ? `Current confirmations: ${subscription.payment_data.btc_confirmations}/${subscription.payment_data.required_confirmations || 2}`
            : 'Your payment has been received and is being confirmed on the Bitcoin network. This usually takes 10-60 minutes.',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800'
        };
      case 'processing':
        return {
          icon: <ClockIcon className="h-16 w-16 text-blue-500" />,
          title: 'Payment Processing',
          subtitle: 'Your payment is being processed',
          description: 'Your payment has been received and is being processed. Please wait while we confirm the transaction.',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800'
        };
      case 'pending':
        return {
          icon: <ClockIcon className="h-16 w-16 text-gray-500" />,
          title: 'Payment Pending',
          subtitle: 'Waiting for payment',
          description: 'Your subscription has been created. Please complete the payment to activate your subscription.',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800'
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />,
          title: 'Payment Status Unknown',
          subtitle: 'Unable to determine payment status',
          description: 'There was an issue determining your payment status. Please contact support if this persists.',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${statusDisplay.bgColor} rounded-lg p-8 shadow-lg`}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center">
              {statusDisplay.icon}
            </div>
            <h2 className={`mt-6 text-3xl font-extrabold ${statusDisplay.textColor}`}>
              {statusDisplay.title}
            </h2>
            <p className={`mt-2 text-sm ${statusDisplay.textColor} opacity-80`}>
              {statusDisplay.subtitle}
            </p>
            <p className={`mt-4 text-sm ${statusDisplay.textColor}`}>
              {statusDisplay.description}
            </p>

            {subscription && (
              <div className="mt-6 bg-white rounded-lg p-4 text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Subscription Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">{subscription.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      subscription.status === 'active' ? 'text-green-600' :
                      subscription.status === 'confirming' ? 'text-yellow-600' :
                      subscription.status === 'processing' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
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
                  {subscription.payment_data?.btc_confirmations !== undefined && (
                    <div className="flex justify-between">
                      <span>Confirmations:</span>
                      <span className="font-medium">
                        {subscription.payment_data.btc_confirmations}/{subscription.payment_data.required_confirmations || 2}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/billing')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Billing Dashboard
              </button>
              
              {(paymentStatus === 'processing' || paymentStatus === 'confirming') && (
                <p className="text-xs text-gray-500 text-center">
                  This page will automatically update when your payment is confirmed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
