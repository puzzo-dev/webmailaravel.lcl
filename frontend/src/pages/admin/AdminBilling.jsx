import React, { useEffect, useState, useRef } from 'react';
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

  // Manual payment form state for processing pending subscriptions (top up)
  const [manualPaymentForm, setManualPaymentForm] = useState({
    payment_method: 'cash',
    payment_reference: '',
    amount_paid: 0,
    currency: 'USD',
    notes: ''
  });

  // Helper to generate a unique payment reference client-side
  const generatePaymentReference = (subscriptionId) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const rand = Math.random().toString(16).slice(2, 10).toUpperCase();
    return `TOPUP-${y}${m}${d}${hh}${mm}${ss}-${subscriptionId}-${rand}`;
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const loadAdminBillingData = async () => {
      // Only proceed if we have a user ID
      if (!user?.id) return;
      
      // Prevent concurrent loading attempts
      if (isLoading) return;
      
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('AdminBilling: Loading timeout reached, forcing completion');
            dispatch(clearError());
          }
        }, 15000); // 15 second timeout
        
        // Load admin billing data - always fetch fresh data
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
  }, [dispatch, user?.id]); // Only depend on dispatch and user.id

  useEffect(() => {
    if (error) {
      // Ensure error is a string for toast display
      const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
      toast.error(errorMessage);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // When opening the subscription modal for a pending subscription, prefill manual payment form
  useEffect(() => {
    if (showSubscriptionModal && selectedPlan?.status === 'pending') {
      setManualPaymentForm({
        payment_method: 'cash',
        payment_reference: generatePaymentReference(selectedPlan.id),
        amount_paid: selectedPlan?.plan?.price ?? 0,
        currency: selectedPlan?.plan?.currency ?? 'USD',
        notes: ''
      });
    }
  }, [showSubscriptionModal, selectedPlan]);

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
      // Ensure error is a string for toast display
        const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to create plan';
        toast.error(errorMessage);
    }
  };

  const handleUpdatePlan = async (planId) => {
    try {
      await dispatch(updatePlan({ id: planId, planData: planForm })).unwrap();
      toast.success('Plan updated successfully');
      setShowPlanModal(false);
      setSelectedPlan(null);
    } catch (error) {
      // Ensure error is a string for toast display
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to update plan';
      toast.error(errorMessage);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await dispatch(deletePlan(planId)).unwrap();
      toast.success('Plan deleted successfully');
    } catch (error) {
      // Ensure error is a string for toast display
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to delete plan';
      toast.error(errorMessage);
    }
  };

  const handleManualPayment = async (subscriptionId, paymentData) => {
    try {
      await dispatch(processManualPayment({ subscriptionId, paymentData })).unwrap();
      toast.success('Manual payment processed successfully');
      setShowSubscriptionModal(false);
    } catch (error) {
      // Ensure error is a string for toast display
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to process payment';
      toast.error(errorMessage);
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

  return (
    <>
      <PageSubscriptionOverlay 
        feature="billing management"
        adminOnly={true}
        customMessage="Admin privileges required to access billing management features."
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiUsers className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{billingStats.active_subscriptions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiCurrencyDollar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${formatNumber(billingStats.monthly_revenue || 0, 2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatNumber(billingStats.conversion_rate || 0, 1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiCalendar className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{billingStats.expiring_soon || 0}</p>
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
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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
                    {allSubscriptions && allSubscriptions.length > 0 ? allSubscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.user?.name || subscription.user?.email}
                            </div>
                            <div className="text-sm text-gray-500">{subscription.user?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.plan?.name}
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
                          {subscription.expiry ? formatDate(subscription.expiry) : 'N/A'}
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
                          No subscriptions found
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="text-sm font-medium">${formatNumber(billingStats.monthly_revenue || 0, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Month</span>
                      <span className="text-sm font-medium">${formatNumber(billingStats.last_month_revenue || 0, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="text-sm font-medium">${formatNumber(billingStats.total_revenue || 0, 2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Subscription Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Subscriptions</span>
                      <span className="text-sm font-medium">{billingStats.active_subscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Payments</span>
                      <span className="text-sm font-medium">{billingStats.pending_payments || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expiring Soon</span>
                      <span className="text-sm font-medium">{billingStats.expiring_soon || 0}</span>
                    </div>
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
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
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
                      onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={planForm.currency}
                      onChange={(e) => setPlanForm({...planForm, currency: e.target.value})}
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
                      onChange={(e) => setPlanForm({...planForm, duration_days: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Domains</label>
                    <input
                      type="number"
                      value={planForm.max_domains}
                      onChange={(e) => setPlanForm({...planForm, max_domains: e.target.value})}
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
                      onChange={(e) => setPlanForm({...planForm, max_total_campaigns: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Daily Limit</label>
                    <input
                      type="number"
                      value={planForm.daily_sending_limit}
                      onChange={(e) => setPlanForm({...planForm, daily_sending_limit: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm({...planForm, is_active: e.target.checked})}
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
                      <select
                        value={manualPaymentForm.payment_method}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, payment_method: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
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
                        value={manualPaymentForm.payment_reference}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, payment_reference: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Transaction ID or reference"
                      />
                      <p className="mt-1 text-xs text-gray-500">Auto-generated. You can modify if needed.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualPaymentForm.amount_paid}
                          onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, amount_paid: Number(e.target.value) })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <input
                          type="text"
                          value={manualPaymentForm.currency}
                          onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, currency: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        rows="3"
                        value={manualPaymentForm.notes}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, notes: e.target.value })}
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
                    onClick={() => handleManualPayment(selectedPlan.id, manualPaymentForm)}
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
    </>
  );
};

export default AdminBilling; 