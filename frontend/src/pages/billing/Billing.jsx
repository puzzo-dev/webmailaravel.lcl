import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  HiCog,
  HiShieldCheck,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import {
  fetchSubscriptions,
  fetchPaymentHistory,
  fetchPaymentRates,
  createSubscription,
  cancelSubscription,
  clearError,
} from '../../store/slices/billingSlice';

const Billing = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    subscriptions,
    currentSubscription,
    paymentHistory,
    paymentRates,
    invoices,
    isLoading,
    error,
  } = useSelector((state) => state.billing);
  
  const [activeTab, setActiveTab] = useState('subscription');

  useEffect(() => {
    dispatch(fetchSubscriptions());
    dispatch(fetchPaymentHistory());
    dispatch(fetchPaymentRates());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleUpgrade = async (planName) => {
    try {
      await dispatch(createSubscription({ plan: planName })).unwrap();
    } catch (error) {
      console.error('Plan upgrade failed:', error);
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

  const handleDownloadInvoice = (invoiceId) => {
    // Implement invoice download
    console.log('Downloading invoice:', invoiceId);
  };

  const handleViewInvoice = (invoiceId) => {
    // Implement invoice view
    console.log('Viewing invoice:', invoiceId);
  };

  // Mock plans data - replace with actual API call
  const plans = [
    {
      name: 'Starter',
      price: 19.99,
      features: [
        '1,000 emails/month',
        'Basic Analytics',
        'Email Support',
        'Standard Templates',
      ],
      current: currentSubscription?.plan === 'Starter',
    },
    {
      name: 'Professional',
      price: 49.99,
      features: [
        '10,000 emails/month',
        'Advanced Analytics',
        'Priority Support',
        'Custom Domains',
        'API Access',
      ],
      current: currentSubscription?.plan === 'Professional',
    },
    {
      name: 'Enterprise',
      price: 99.99,
      features: [
        'Unlimited emails',
        'Advanced Analytics',
        'Dedicated Support',
        'Custom Domains',
        'API Access',
        'White-label Options',
      ],
      current: currentSubscription?.plan === 'Enterprise',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
            <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
          </div>
          <div className="flex space-x-3">
            <button className="btn btn-secondary flex items-center">
              <HiCog className="h-5 w-5 mr-2" />
              Billing Settings
            </button>
          </div>
        </div>
      </div>

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
          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Subscription */}
              {currentSubscription && (
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
                      <p className="text-2xl font-bold text-primary-600">{currentSubscription.plan}</p>
                      <p className="text-gray-600 mt-1">
                        ${currentSubscription.amount}/{currentSubscription.currency} per month
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        currentSubscription.status === 'active' 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {currentSubscription.status === 'active' ? (
                          <HiCheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <HiClock className="h-4 w-4 mr-1" />
                        )}
                        {currentSubscription.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Next billing: {formatDate(currentSubscription.next_billing_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Features */}
              {currentSubscription && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSubscription.features?.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    )) || (
                      <div className="text-gray-500">No features listed</div>
                    )}
                  </div>
                </div>
              )}

              {/* Available Plans */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`border rounded-lg p-6 ${
                        plan.current
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-gray-900">
                            ${plan.price}
                          </span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        {plan.current && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 mt-2">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <ul className="mt-6 space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <HiCheckCircle className="h-4 w-4 text-success-500 mr-3" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {!plan.current && (
                        <button
                          onClick={() => handleUpgrade(plan.name)}
                          className="w-full mt-6 btn btn-primary"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Processing...' : `Upgrade to ${plan.name}`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${formatNumber(payment.amount, 2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'completed'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}>
                              {payment.status === 'completed' ? (
                                <HiCheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <HiClock className="h-3 w-3 mr-1" />
                              )}
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.invoice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewInvoice(payment.invoice)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              <HiEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(payment.invoice)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <HiDownload className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
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
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${formatNumber(invoice.amount, 2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.status === 'paid'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}>
                              {invoice.status === 'paid' ? (
                                <HiCheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <HiClock className="h-3 w-3 mr-1" />
                              )}
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewInvoice(invoice.id)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              <HiEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <HiDownload className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
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