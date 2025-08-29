import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  HiCreditCard,
  HiDocumentText,
  HiCalendar,
  HiCurrencyDollar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiDownload,
  HiEye,
  HiPlus,

  HiShieldCheck,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import { billingService } from '../../services/api';
import {
  fetchSubscriptions,
  fetchPaymentHistory,
  fetchPaymentRates,
  fetchPlans,
  createSubscription,
  cancelSubscription,
  clearError,
} from '../../store/slices/billingSlice';

const Billing = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    currentSubscription,
    paymentHistory,
    invoices,
    plans,
    isLoading,
    error,
  } = useSelector((state) => state.billing);

  // Debug: Log Redux state to identify data structure issues
  useEffect(() => {
    console.log('Billing Debug - Redux State:', {
      currentSubscription,
      paymentHistory,
      invoices,
      plans,
      isLoading,
      error
    });

    // Log detailed subscription structure
    if (currentSubscription) {
      console.log('Current Subscription Detailed Structure:', {
        subscription: currentSubscription,
        keys: Object.keys(currentSubscription),
        plan: currentSubscription.plan,
        planKeys: currentSubscription.plan ? Object.keys(currentSubscription.plan) : null
      });
    }
  }, [currentSubscription, paymentHistory, invoices, plans, isLoading, error]);

  // Derive current subscription from payment history if needed
  const currentActiveSubscription = useMemo(() => {
    // First try to use currentSubscription from Redux
    if (currentSubscription && currentSubscription.status === 'active') {
      return currentSubscription;
    }

    // If not available, derive from payment history (active payment)
    if (Array.isArray(paymentHistory) && paymentHistory.length > 0) {
      const activePayment = paymentHistory.find(payment => payment.status === 'active');
      if (activePayment) {
        return {
          id: activePayment.subscription_id,
          plan_name: activePayment.plan_name,
          payment_amount: activePayment.amount,
          payment_currency: activePayment.currency,
          status: activePayment.status,
          expiry: activePayment.expiry,
          payment_method: activePayment.payment_method || activePayment.method,
          created_at: activePayment.created_at,
          paid_at: activePayment.paid_at
        };
      }
    }

    return null;
  }, [currentSubscription, paymentHistory]);

  // Derive invoices from payment history if needed
  const derivedInvoices = useMemo(() => {
    if (Array.isArray(invoices) && invoices.length > 0) {
      return invoices;
    }

    // Extract invoices from payment history
    if (Array.isArray(paymentHistory) && paymentHistory.length > 0) {
      return paymentHistory
        .filter(payment => payment.invoice || payment.invoice_id || payment.invoice_number)
        .map(payment => ({
          id: payment.invoice || payment.invoice_id || payment.invoice_number,
          number: payment.invoice_number || payment.invoice || payment.invoice_id,
          date: payment.date || payment.created_at || payment.payment_date,
          amount: payment.amount || payment.total || payment.price,
          status: payment.status || payment.payment_status,
          due_date: payment.due_date || payment.date || payment.created_at
        }));
    }

    return [];
  }, [invoices, paymentHistory]);

  const [activeTab, setActiveTab] = useState('subscription');
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(null); // Track which invoice is being processed

  useEffect(() => {
    const loadBillingData = async () => {
      if (!user?.id || hasLoadedOnce) return;

      console.log('Loading billing data for user:', user.id);
      setHasLoadedOnce(true);
      try {
        // Load all billing data
        const results = await Promise.allSettled([
          dispatch(fetchSubscriptions()),
          dispatch(fetchPaymentHistory()),
          dispatch(fetchPaymentRates()),
          dispatch(fetchPlans())
        ]);

        console.log('Billing data load results:', results);

        // Check for failed API calls
        results.forEach((result, index) => {
          const endpoints = ['fetchSubscriptions', 'fetchPaymentHistory', 'fetchPaymentRates', 'fetchPlans'];
          if (result.status === 'rejected') {
            console.error(`${endpoints[index]} failed:`, result.reason);
          } else {
            console.log(`${endpoints[index]} success:`, result.value);
          }
        });

        // Extract invoices from payment history
        const paymentHistoryResult = results[1];
        if (paymentHistoryResult.status === 'fulfilled' && paymentHistoryResult.value?.data) {
          console.log('Payment history data:', paymentHistoryResult.value.data);
        }
      } catch (error) {
        console.error('Failed to load billing data:', error);
        setHasLoadedOnce(false); // Reset on error so it can retry
      }
    };

    loadBillingData();

    // Check if user just registered and came from pricing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      setShowWelcome(true);
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }

  }, [dispatch, user?.id, hasLoadedOnce]); // Simple dependency management

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleUpgrade = async (planId) => {
    try {
      await dispatch(createSubscription({ plan_id: planId })).unwrap();
      toast.success('Subscription created successfully! Check your email for payment instructions.');
    } catch (error) {
      console.error('Plan upgrade failed:', error);
      toast.error('Failed to create subscription. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      if (currentSubscription) {
        await dispatch(cancelSubscription(currentSubscription.id)).unwrap();
      }
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId) {
      toast.error('Invoice ID is required');
      return;
    }

    setLoadingInvoice(`download-${invoiceId}`);
    try {
      const response = await billingService.downloadInvoice(invoiceId);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoice-${invoiceId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice download failed:', error);

      // Fallback for missing endpoint: show informative message
      if (error.response?.status === 404) {
        toast.error('Invoice download is not available yet. Please contact support for your invoice.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to download invoice');
      }
    } finally {
      setLoadingInvoice(null);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    if (!invoiceId) {
      toast.error('Invoice ID is required');
      return;
    }

    setLoadingInvoice(`view-${invoiceId}`);
    try {
      // First try to get invoice status/details
      const invoiceData = await billingService.getInvoice(invoiceId);

      if (invoiceData.invoice_url) {
        // If there's a direct URL, open it in a new tab
        window.open(invoiceData.invoice_url, '_blank');
      } else {
        // Otherwise, try to view the invoice data in a modal or new page
        console.log('Invoice data:', invoiceData);

        // For now, show invoice details in an alert (can be replaced with a modal)
        const details = `
Invoice ID: ${invoiceData.id || invoiceId}
Status: ${invoiceData.status || 'Unknown'}
Amount: ${invoiceData.amount ? '$' + invoiceData.amount : 'N/A'}
Date: ${invoiceData.date ? formatDate(invoiceData.date) : 'N/A'}
        `.trim();

        alert(`Invoice Details:\n\n${details}`);
      }

      toast.success('Invoice loaded successfully');
    } catch (error) {
      console.error('Invoice view failed:', error);

      // Fallback: try to open BTCPay invoice URL if it's a BTCPay invoice
      if (error.response?.status === 404) {
        // Try different BTCPay URL formats
        const btcpayUrls = [
          `${window.location.origin}/btcpay/invoice/${invoiceId}`,
          `https://btcpay.yoursite.com/invoice/${invoiceId}`, // Replace with actual BTCPay URL
          `${window.location.protocol}//${window.location.hostname}:23001/invoice/${invoiceId}` // Common BTCPay port
        ];

        // Try the first BTCPay URL
        window.open(btcpayUrls[0], '_blank');
        toast.info('Opening BTCPay invoice... If this doesn\'t work, please contact support.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to view invoice');
      }
    } finally {
      setLoadingInvoice(null);
    }
  };



  const handleRefresh = async () => {
    setHasLoadedOnce(false); // Reset the flag to allow reload
    try {
      const results = await Promise.allSettled([
        dispatch(fetchSubscriptions()),
        dispatch(fetchPaymentHistory()),
        dispatch(fetchPaymentRates()),
        dispatch(fetchPlans())
      ]);
      console.log('Refresh results:', results);
      toast.success('Billing data refreshed');
    } catch (error) {
      console.error('Failed to refresh billing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Debug logging to understand what data we have
  console.log('Billing component state:', {
    currentSubscription,
    plans: plans,
    plansLength: Array.isArray(plans) ? plans.length : 'not array',
    paymentHistory: paymentHistory?.length || 0,
    isLoading,
    error,
    hasLoadedOnce
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
            <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Welcome Message for New Users */}
      {showWelcome && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <HiCheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Welcome to EmailCampaign! 🎉</h3>
              <div className="mt-2 text-sm text-green-700">
                Your account has been created successfully. Choose a plan below to unlock premium features and start creating powerful email campaigns.
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowWelcome(false)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiXCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'subscription', name: 'Subscription', icon: HiCreditCard },
              { id: 'payment-history', name: 'Payment History', icon: HiDocumentText },
              { id: 'invoices', name: 'Invoices', icon: HiCalendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Subscription */}
              {currentActiveSubscription ? (
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
                      <p className="text-2xl font-bold text-primary-600">
                        {currentActiveSubscription.plan?.name ||
                          currentActiveSubscription.plan_name ||
                          'Unknown Plan'}
                      </p>
                      <p className="text-gray-600 mt-1">
                        ${formatNumber(
                          currentActiveSubscription.payment_amount ||
                          currentActiveSubscription.plan?.price ||
                          0,
                          2
                        )}/{currentActiveSubscription.payment_currency || currentActiveSubscription.plan?.currency || 'USD'} per {
                          currentActiveSubscription.plan?.duration_days ?
                            (currentActiveSubscription.plan.duration_days === 30 ? 'month' :
                              currentActiveSubscription.plan.duration_days === 365 ? 'year' :
                                `${currentActiveSubscription.plan.duration_days} days`) :
                            'month'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentActiveSubscription.status === 'active'
                        ? 'bg-success-100 text-success-800'
                        : currentActiveSubscription.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-warning-100 text-warning-800'
                        }`}>
                        {currentActiveSubscription.status === 'active' ? (
                          <HiCheckCircle className="h-4 w-4 mr-1" />
                        ) : currentActiveSubscription.status === 'expired' ? (
                          <HiXCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <HiClock className="h-4 w-4 mr-1" />
                        )}
                        {currentActiveSubscription.status?.charAt(0).toUpperCase() + currentActiveSubscription.status?.slice(1) || 'Unknown'}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {currentActiveSubscription.status === 'active' ? 'Expires' : 'Expired'}: {
                          formatDate(currentActiveSubscription.expiry) || 'Not set'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-4">You don't have an active subscription yet. Choose a plan below to get started.</p>

                  {/* Debug: Show available subscription data */}
                  {import.meta.env.DEV && (
                    <details className="mt-4 text-left">
                      <summary className="cursor-pointer text-sm text-blue-600">Debug: View subscription data</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify({
                          currentSubscription,
                          currentActiveSubscription,
                          paymentHistory: paymentHistory?.slice(0, 2), // Show first 2 for brevity
                          invoices,
                          plans: plans?.slice(0, 2) // Show first 2 for brevity
                        }, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Plan Features */}
              {currentSubscription && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Features & Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Show features from plan if available */}
                    {Array.isArray(currentSubscription.plan?.features) && currentSubscription.plan.features.length > 0 ? (
                      currentSubscription.plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))
                    ) : (
                      /* Show plan limits if features aren't available */
                      <>
                        {currentSubscription.plan?.max_domains && (
                          <div className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">Max Domains: {formatNumber(currentSubscription.plan.max_domains)}</span>
                          </div>
                        )}
                        {currentSubscription.plan?.max_total_campaigns && (
                          <div className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">Max Campaigns: {formatNumber(currentSubscription.plan.max_total_campaigns)}</span>
                          </div>
                        )}
                        {currentSubscription.plan?.max_live_campaigns && (
                          <div className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">Max Live Campaigns: {formatNumber(currentSubscription.plan.max_live_campaigns)}</span>
                          </div>
                        )}
                        {currentSubscription.plan?.daily_sending_limit && (
                          <div className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">Daily Sending Limit: {formatNumber(currentSubscription.plan.daily_sending_limit)}</span>
                          </div>
                        )}
                        {currentSubscription.plan?.max_senders_per_domain && (
                          <div className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">Max Senders per Domain: {formatNumber(currentSubscription.plan.max_senders_per_domain)}</span>
                          </div>
                        )}
                        {currentSubscription.plan?.duration_days && (
                          <div className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">Plan Duration: {currentSubscription.plan.duration_days} days</span>
                          </div>
                        )}
                        {!currentSubscription.plan?.max_domains && !currentSubscription.plan?.features && (
                          <div className="text-gray-500 col-span-2">No features or limits information available</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Available Plans */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.isArray(plans) && plans.length > 0 ? (
                      plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`border rounded-lg p-6 ${currentSubscription?.plan?.id === plan.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="text-center">
                            <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                            <div className="mt-2">
                              <span className="text-3xl font-bold text-gray-900">
                                ${formatNumber(plan.price, 2)}
                              </span>
                              <span className="text-gray-500">/{plan.duration_days} days</span>
                            </div>
                            {currentSubscription?.plan?.id === plan.id && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 mt-2">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <div className="mt-6 space-y-3">
                            <div className="text-sm text-gray-700">
                              <div className="flex justify-between">
                                <span>Max Domains:</span>
                                <span className="font-medium">{plan.max_domains}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max Campaigns:</span>
                                <span className="font-medium">{plan.max_total_campaigns}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Daily Limit:</span>
                                <span className="font-medium">{formatNumber(plan.daily_sending_limit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max Senders/Domain:</span>
                                <span className="font-medium">{plan.max_senders_per_domain}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6">
                            {currentSubscription?.plan?.id === plan.id ? (
                              <button
                                disabled
                                className="w-full btn btn-secondary disabled:opacity-50"
                              >
                                Current Plan
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpgrade(plan.id)}
                                className="w-full btn btn-primary"
                                disabled={isLoading}
                              >
                                {isLoading ? 'Processing...' : `Upgrade to ${plan.name}`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No plans available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cancel Subscription */}
              {currentSubscription && currentSubscription.status === 'active' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Subscription</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Cancel your subscription to stop future billing. You'll continue to have access until the end of your current billing period.
                  </p>
                  <button
                    onClick={handleCancelSubscription}
                    className="btn btn-danger"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'payment-history' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(paymentHistory) && paymentHistory.length > 0 ? (
                        paymentHistory.map((payment) => (
                          <tr key={payment.id || payment.payment_id || Math.random()}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(payment.date || payment.created_at || payment.payment_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${formatNumber(payment.amount || payment.total || payment.price || 0, 2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(payment.status || payment.payment_status) === 'completed' || (payment.status || payment.payment_status) === 'paid'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warning-100 text-warning-800'
                                }`}>
                                {((payment.status || payment.payment_status) === 'completed' || (payment.status || payment.payment_status) === 'paid') ? (
                                  <HiCheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <HiClock className="h-3 w-3 mr-1" />
                                )}
                                {payment.status || payment.payment_status || 'unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.method || payment.payment_method || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.invoice || payment.invoice_id || payment.reference || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewInvoice(payment.invoice || payment.invoice_id)}
                                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${(!payment.invoice && !payment.invoice_id) || loadingInvoice === `view-${payment.invoice || payment.invoice_id}`
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                  disabled={(!payment.invoice && !payment.invoice_id) || loadingInvoice === `view-${payment.invoice || payment.invoice_id}`}
                                  title={!payment.invoice && !payment.invoice_id ? 'No invoice available' : 'View invoice'}
                                >
                                  {loadingInvoice === `view-${payment.invoice || payment.invoice_id}` ? (
                                    <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <HiEye className="h-3 w-3 mr-1" />
                                  )}
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(payment.invoice || payment.invoice_id)}
                                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${(!payment.invoice && !payment.invoice_id) || loadingInvoice === `download-${payment.invoice || payment.invoice_id}`
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  disabled={(!payment.invoice && !payment.invoice_id) || loadingInvoice === `download-${payment.invoice || payment.invoice_id}`}
                                  title={!payment.invoice && !payment.invoice_id ? 'No invoice available' : 'Download invoice'}
                                >
                                  {loadingInvoice === `download-${payment.invoice || payment.invoice_id}` ? (
                                    <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <HiDownload className="h-3 w-3 mr-1" />
                                  )}
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <HiDocumentText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
                              <p className="text-sm">Your payment history will appear here once you make your first payment.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(derivedInvoices) && derivedInvoices.length > 0 ? (
                        derivedInvoices.map((invoice) => (
                          <tr key={invoice.id || invoice.invoice_id || invoice.number || Math.random()}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.number || invoice.invoice_number || invoice.id || invoice.invoice_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(invoice.date || invoice.created_at || invoice.invoice_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${formatNumber(invoice.amount || invoice.total || invoice.amount_due || 0, 2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(invoice.status === 'paid' || invoice.status === 'completed')
                                ? 'bg-success-100 text-success-800'
                                : (invoice.status === 'pending' || invoice.status === 'due')
                                  ? 'bg-warning-100 text-warning-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                {(invoice.status === 'paid' || invoice.status === 'completed') ? (
                                  <HiCheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <HiClock className="h-3 w-3 mr-1" />
                                )}
                                {invoice.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(invoice.due_date || invoice.due) || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewInvoice(invoice.id || invoice.invoice_id || invoice.number)}
                                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${(!invoice.id && !invoice.invoice_id && !invoice.number) || loadingInvoice === `view-${invoice.id || invoice.invoice_id || invoice.number}`
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                  disabled={(!invoice.id && !invoice.invoice_id && !invoice.number) || loadingInvoice === `view-${invoice.id || invoice.invoice_id || invoice.number}`}
                                  title={!invoice.id && !invoice.invoice_id && !invoice.number ? 'No invoice ID available' : 'View invoice'}
                                >
                                  {loadingInvoice === `view-${invoice.id || invoice.invoice_id || invoice.number}` ? (
                                    <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <HiEye className="h-3 w-3 mr-1" />
                                  )}
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(invoice.id || invoice.invoice_id || invoice.number)}
                                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${(!invoice.id && !invoice.invoice_id && !invoice.number) || loadingInvoice === `download-${invoice.id || invoice.invoice_id || invoice.number}`
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  disabled={(!invoice.id && !invoice.invoice_id && !invoice.number) || loadingInvoice === `download-${invoice.id || invoice.invoice_id || invoice.number}`}
                                  title={!invoice.id && !invoice.invoice_id && !invoice.number ? 'No invoice ID available' : 'Download invoice'}
                                >
                                  {loadingInvoice === `download-${invoice.id || invoice.invoice_id || invoice.number}` ? (
                                    <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <HiDownload className="h-3 w-3 mr-1" />
                                  )}
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <HiDocumentText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices</h3>
                              <p className="text-sm">Your invoices will appear here when generated.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing; 