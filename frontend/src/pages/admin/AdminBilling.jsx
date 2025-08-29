import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiCreditCard,
  HiUsers,
  HiCurrencyDollar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiDownload,
  HiCog,
  HiShieldCheck,
  HiCalendar,
  HiDocumentText,
  HiChartBar,
  HiExclamation,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import { toast } from 'react-hot-toast';
import PageSubscriptionOverlay from '../../components/common/PageSubscriptionOverlay';
import {
  fetchPlans,
  fetchBillingStats,
  fetchAllSubscriptions,
  createPlan,
  updatePlan,
  deletePlan,
  processManualPayment,
  clearError,
} from '../../store/slices/billingSlice';

const AdminBilling = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    plans,
    billingStats,
    allSubscriptions,
    isLoading,
    error,
  } = useSelector((state) => state.billing);

  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Form states
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    duration_days: 30,
    max_domains: 1,
    max_senders_per_domain: 2,
    max_total_campaigns: 10,
    max_live_campaigns: 1,
    daily_sending_limit: 1000,
    features: [],
    is_active: true
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const loadAdminBillingData = async () => {
      if (!user?.id) return;

      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('AdminBilling: Loading timeout reached, forcing completion');
            dispatch(clearError());
          }
        }, 15000); // 15 second timeout

        // Load admin billing data sequentially to avoid overwhelming the backend
        const results = await Promise.allSettled([
          dispatch(fetchPlans()),
          dispatch(fetchBillingStats()),
          dispatch(fetchAllSubscriptions())
        ]);

        // Clear timeout if all requests completed
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Log any failed requests
        results.forEach((result, index) => {
          const actions = ['fetchPlans', 'fetchBillingStats', 'fetchAllSubscriptions'];
          if (result.status === 'rejected') {
            console.error(`AdminBilling: ${actions[index]} failed:`, result.reason);
          }
        });

      } catch (error) {
        console.error('Failed to load admin billing data:', error);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    loadAdminBillingData();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch, user?.id]); // Remove isLoading dependency to prevent infinite loop

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Debug billing stats structure
  useEffect(() => {
    if (billingStats && Object.keys(billingStats).length > 0) {
      console.log('AdminBilling - billingStats structure:', billingStats);
    }
  }, [billingStats]);

  // Debug allSubscriptions structure
  useEffect(() => {
    if (allSubscriptions) {
      console.log('AdminBilling - allSubscriptions structure:', allSubscriptions);
      console.log('AdminBilling - allSubscriptions length:', Array.isArray(allSubscriptions) ? allSubscriptions.length : 'Not an array');
    }
  }, [allSubscriptions]);

  // Get the actual subscriptions array from the response
  const subscriptionsData = React.useMemo(() => {
    if (!allSubscriptions) return [];

    // If allSubscriptions is already an array, use it
    if (Array.isArray(allSubscriptions)) {
      return allSubscriptions;
    }

    // If it has a data property with an array, use that
    if (allSubscriptions.data && Array.isArray(allSubscriptions.data)) {
      return allSubscriptions.data;
    }

    // If it's an object with subscription properties, try to extract them
    if (typeof allSubscriptions === 'object') {
      const keys = Object.keys(allSubscriptions);
      const arrayKey = keys.find(key => Array.isArray(allSubscriptions[key]));
      if (arrayKey) {
        return allSubscriptions[arrayKey];
      }
    }

    return [];
  }, [allSubscriptions]);

  // Calculate subscription metrics from actual data
  const subscriptionMetrics = React.useMemo(() => {
    const active = subscriptionsData.filter(sub => sub.status === 'active').length;
    const pending = subscriptionsData.filter(sub => sub.status === 'pending').length;
    const cancelled = subscriptionsData.filter(sub => sub.status === 'cancelled').length;
    const expired = subscriptionsData.filter(sub => sub.status === 'expired').length;

    // Calculate expiring soon (5-7 days from now)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));

    const expiringSoon = subscriptionsData.filter(sub => {
      if (sub.status !== 'active') return false;

      const expiryDate = new Date(sub.expiry || sub.ends_at);
      if (isNaN(expiryDate.getTime())) return false;

      // Expiring between 5-7 days from now
      return expiryDate >= fiveDaysFromNow && expiryDate <= sevenDaysFromNow;
    }).length;

    return { active, pending, cancelled, expired, expiringSoon, total: subscriptionsData.length };
  }, [subscriptionsData]);

  // Helper function to check if subscription is expiring soon
  const isExpiringSoon = (subscription) => {
    if (subscription.status !== 'active') return false;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));

    const expiryDate = new Date(subscription.expiry || subscription.ends_at);
    if (isNaN(expiryDate.getTime())) return false;

    return expiryDate >= fiveDaysFromNow && expiryDate <= sevenDaysFromNow;
  };

  const handleCreatePlan = async () => {
    try {
      await dispatch(createPlan(planForm)).unwrap();
      toast.success('Plan created successfully');
      setShowPlanModal(false);
      setPlanForm({
        name: '',
        description: '',
        price: '',
        currency: 'USD',
        duration_days: 30,
        max_domains: 1,
        max_senders_per_domain: 2,
        max_total_campaigns: 10,
        max_live_campaigns: 1,
        daily_sending_limit: 1000,
        features: [],
        is_active: true
      });
    } catch (error) {
      toast.error(error || 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async (planId) => {
    try {
      await dispatch(updatePlan({ id: planId, planData: planForm })).unwrap();
      toast.success('Plan updated successfully');
      setShowPlanModal(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error(error || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await dispatch(deletePlan(planId)).unwrap();
      toast.success('Plan deleted successfully');
    } catch (error) {
      toast.error(error || 'Failed to delete plan');
    }
  };

  const handleManualPayment = async (subscriptionId, paymentData) => {
    try {
      await dispatch(processManualPayment({ subscriptionId, paymentData })).unwrap();
      toast.success('Manual payment processed successfully');
      setShowSubscriptionModal(false);
    } catch (error) {
      toast.error(error || 'Failed to process payment');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'green', icon: HiCheckCircle },
      pending: { color: 'yellow', icon: HiClock },
      expired: { color: 'red', icon: HiXCircle },
      cancelled: { color: 'gray', icon: HiXCircle },
      failed: { color: 'red', icon: HiXCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      btcpay: { color: 'blue', label: 'BTCPay' },
      cash: { color: 'green', label: 'Cash' },
      bank_transfer: { color: 'purple', label: 'Bank Transfer' },
      check: { color: 'yellow', label: 'Check' },
      paypal: { color: 'blue', label: 'PayPal' },
      other: { color: 'gray', label: 'Other' }
    };

    const config = methodConfig[method] || methodConfig.other;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading billing data...</span>
      </div>
    );
  }

  // Show error state if there's an error and no data
  if (error && (!billingStats || Object.keys(billingStats).length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">
          <HiExclamation className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Billing Data</h3>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <button
          onClick={() => {
            dispatch(fetchPlans());
            dispatch(fetchBillingStats());
            dispatch(fetchAllSubscriptions());
          }}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <PageSubscriptionOverlay
        feature="billing management"
        adminOnly={true}
        customMessage="Admin privileges required to access billing management features."
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
              <p className="text-gray-600 mt-1">Manage plans, subscriptions, and billing settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setShowPlanModal(true);
                }}
                className="btn btn-primary"
              >
                <HiPlus className="h-4 w-4 mr-2" />
                Add Plan
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiCurrencyDollar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${formatNumber(billingStats?.data?.monthly_revenue || billingStats?.monthly_revenue || 0, 2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiChartBar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(billingStats?.data?.conversion_rate || billingStats?.conversion_rate || 0, 1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptionMetrics.total}
                </p>
                <p className="text-xs text-gray-500">
                  All subscription statuses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'plans', name: 'Plans', icon: HiCog },
                { id: 'subscriptions', name: 'Subscriptions', icon: HiCreditCard },
                { id: 'analytics', name: 'Analytics', icon: HiChartBar },
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
            {/* Plans Tab */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Subscription Plans</h3>
                  <button
                    onClick={() => {
                      setSelectedPlan(null);
                      setShowPlanModal(true);
                    }}
                    className="btn btn-primary"
                  >
                    <HiPlus className="h-4 w-4 mr-2" />
                    Add Plan
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Limits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plans && plans.length > 0 ? plans.map((plan) => (
                        <tr key={plan.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                              <div className="text-sm text-gray-500">{plan.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${formatNumber(plan.price, 2)} {plan.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {plan.duration_days} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>Domains: {plan.max_domains}</div>
                              <div>Campaigns: {plan.max_total_campaigns}</div>
                              <div>Daily Limit: {formatNumber(plan.daily_sending_limit)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(plan.is_active ? 'active' : 'inactive')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setPlanForm(plan);
                                  setShowPlanModal(true);
                                }}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit"
                              >
                                <HiPencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            No plans found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">User Subscriptions</h3>
                  <div className="text-sm text-gray-500">
                    Total: {subscriptionMetrics.total} subscriptions
                  </div>
                </div>

                {/* Subscription Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <HiCheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Active</p>
                        <p className="text-2xl font-bold text-green-900">{subscriptionMetrics.active}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <HiClock className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">Pending</p>
                        <p className="text-2xl font-bold text-yellow-900">{subscriptionMetrics.pending}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <HiCalendar className="h-8 w-8 text-orange-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-orange-800">Expiring Soon</p>
                        <p className="text-2xl font-bold text-orange-900">{subscriptionMetrics.expiringSoon}</p>
                        <p className="text-xs text-orange-600">5-7 days</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <HiXCircle className="h-8 w-8 text-gray-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">Cancelled</p>
                        <p className="text-2xl font-bold text-gray-900">{subscriptionMetrics.cancelled}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <HiXCircle className="h-8 w-8 text-red-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">Expired</p>
                        <p className="text-2xl font-bold text-red-900">{subscriptionMetrics.expired}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptionsData && subscriptionsData.length > 0 ? subscriptionsData.map((subscription) => (
                        <tr
                          key={subscription.id}
                          className={isExpiringSoon(subscription) ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user?.name || subscription.user?.email}
                                {isExpiringSoon(subscription) && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    Expiring Soon
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{subscription.user?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.plan?.name || subscription.plan_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${formatNumber(subscription.payment_amount || subscription.plan?.price, 2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(subscription.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {subscription.payment_method ? (
                                getPaymentMethodBadge(subscription.payment_method)
                              ) : (
                                <span className="text-gray-500">BTCPay</span>
                              )}
                            </div>
                            {subscription.payment_reference && (
                              <div className="text-sm text-gray-500">
                                Ref: {subscription.payment_reference}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              {subscription.expiry ? formatDate(subscription.expiry) : 'N/A'}
                              {isExpiringSoon(subscription) && (
                                <div className="text-xs text-orange-600 font-medium">
                                  ⚠️ Expires in 5-7 days
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedPlan(subscription);
                                  setShowSubscriptionModal(true);
                                }}
                                className="text-primary-600 hover:text-primary-900"
                                title="View Details"
                              >
                                <HiEye className="h-4 w-4" />
                              </button>
                              {subscription.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setSelectedPlan(subscription);
                                    setShowSubscriptionModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Process Payment"
                                >
                                  <HiCheckCircle className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            {allSubscriptions ? 'No subscriptions found' : 'Loading subscriptions...'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Billing Analytics</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Overview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="text-sm font-medium">
                          ${formatNumber(billingStats?.data?.monthly_revenue || billingStats?.monthly_revenue || 0, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Month</span>
                        <span className="text-sm font-medium">
                          ${formatNumber(billingStats?.data?.last_month_revenue || billingStats?.last_month_revenue || 0, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <span className="text-sm font-medium">
                          ${formatNumber(billingStats?.data?.total_revenue || billingStats?.total_revenue || 0, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Revenue/User</span>
                        <span className="text-sm font-medium">
                          ${formatNumber(billingStats?.data?.avg_revenue_per_user || billingStats?.avg_revenue_per_user || 0, 2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Subscription Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Subscriptions</span>
                        <span className="text-sm font-medium">
                          {subscriptionMetrics.active}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Payments</span>
                        <span className="text-sm font-medium">
                          {subscriptionMetrics.pending}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expiring Soon</span>
                        <span className="text-sm font-medium">
                          {subscriptionMetrics.expiringSoon}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cancelled This Month</span>
                        <span className="text-sm font-medium">
                          {billingStats?.data?.cancelled_this_month || billingStats?.cancelled_this_month || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversion Rate</span>
                        <span className="text-sm font-medium">
                          {formatNumber(billingStats?.data?.conversion_rate || billingStats?.conversion_rate || 0, 1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Churn Rate</span>
                        <span className="text-sm font-medium">
                          {formatNumber(billingStats?.data?.churn_rate || billingStats?.churn_rate || 0, 1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed Payments</span>
                        <span className="text-sm font-medium">
                          {billingStats?.data?.failed_payments || billingStats?.failed_payments || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Renewal Rate</span>
                        <span className="text-sm font-medium">
                          {formatNumber(billingStats?.data?.renewal_rate || billingStats?.renewal_rate || 0, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Analytics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Plan Distribution</h4>
                    <div className="space-y-3">
                      {billingStats?.data?.plan_distribution && Object.entries(billingStats.data.plan_distribution).length > 0 ? (
                        Object.entries(billingStats.data.plan_distribution).map(([planName, count]) => (
                          <div key={planName} className="flex justify-between">
                            <span className="text-sm text-gray-600">{planName}</span>
                            <span className="text-sm font-medium">{count} users</span>
                          </div>
                        ))
                      ) : billingStats?.plan_distribution && Object.entries(billingStats.plan_distribution).length > 0 ? (
                        Object.entries(billingStats.plan_distribution).map(([planName, count]) => (
                          <div key={planName} className="flex justify-between">
                            <span className="text-sm text-gray-600">{planName}</span>
                            <span className="text-sm font-medium">{count} users</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No plan distribution data available</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Payment Methods</h4>
                    <div className="space-y-3">
                      {billingStats?.data?.payment_methods && Object.entries(billingStats.data.payment_methods).length > 0 ? (
                        Object.entries(billingStats.data.payment_methods).map(([method, count]) => (
                          <div key={method} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                            <span className="text-sm font-medium">{count} payments</span>
                          </div>
                        ))
                      ) : billingStats?.payment_methods && Object.entries(billingStats.payment_methods).length > 0 ? (
                        Object.entries(billingStats.payment_methods).map(([method, count]) => (
                          <div key={method} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                            <span className="text-sm font-medium">{count} payments</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No payment method data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planForm.price}
                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        value={planForm.currency}
                        onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
                      <input
                        type="number"
                        value={planForm.duration_days}
                        onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Domains</label>
                      <input
                        type="number"
                        value={planForm.max_domains}
                        onChange={(e) => setPlanForm({ ...planForm, max_domains: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Campaigns</label>
                      <input
                        type="number"
                        value={planForm.max_total_campaigns}
                        onChange={(e) => setPlanForm({ ...planForm, max_total_campaigns: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Daily Limit</label>
                      <input
                        type="number"
                        value={planForm.daily_sending_limit}
                        onChange={(e) => setPlanForm({ ...planForm, daily_sending_limit: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planForm.is_active}
                      onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active Plan</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedPlan ? handleUpdatePlan(selectedPlan.id) : handleCreatePlan()}
                    className="btn btn-primary"
                  >
                    {selectedPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        {showSubscriptionModal && selectedPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedPlan.user?.name} ({selectedPlan.user?.email})
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedPlan.plan?.name} - ${formatNumber(selectedPlan.plan?.price, 2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedPlan.status)}
                    </div>
                  </div>

                  {selectedPlan.status === 'pending' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="check">Check</option>
                          <option value="paypal">PayPal</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Reference</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Transaction ID or reference"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          rows="3"
                          placeholder="Additional notes about the payment"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  {selectedPlan.status === 'pending' && (
                    <button
                      onClick={() => handleManualPayment(selectedPlan.id, {})}
                      className="btn btn-primary"
                    >
                      Process Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBilling; 