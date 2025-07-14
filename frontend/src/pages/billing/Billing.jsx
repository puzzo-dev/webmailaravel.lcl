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

const Billing = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('subscription');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  const subscription = {
    plan: 'Professional',
    status: 'active',
    nextBilling: '2024-02-15',
    amount: 49.99,
    currency: 'USD',
    features: [
      'Unlimited Campaigns',
      'Advanced Analytics',
      'Priority Support',
      'Custom Domains',
      'API Access',
    ],
  };

  const paymentHistory = [
    {
      id: 1,
      date: '2024-01-15',
      amount: 49.99,
      status: 'completed',
      method: 'Credit Card',
      invoice: 'INV-2024-001',
    },
    {
      id: 2,
      date: '2023-12-15',
      amount: 49.99,
      status: 'completed',
      method: 'Credit Card',
      invoice: 'INV-2023-012',
    },
  ];

  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: 49.99,
      status: 'paid',
      dueDate: '2024-01-15',
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-15',
      amount: 49.99,
      status: 'paid',
      dueDate: '2023-12-15',
    },
  ];

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
      current: false,
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
      current: true,
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
      current: false,
    },
  ];

  const handleUpgrade = (planName) => {
    // Implement plan upgrade logic
    console.log('Upgrading to:', planName);
  };

  const handleDownloadInvoice = (invoiceId) => {
    // Implement invoice download
    console.log('Downloading invoice:', invoiceId);
  };

  const handleViewInvoice = (invoiceId) => {
    // Implement invoice view
    console.log('Viewing invoice:', invoiceId);
  };

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
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
                    <p className="text-2xl font-bold text-primary-600">{subscription.plan}</p>
                    <p className="text-gray-600 mt-1">
                      ${subscription.amount}/{subscription.currency} per month
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'active' 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {subscription.status === 'active' ? (
                        <HiCheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <HiClock className="h-4 w-4 mr-1" />
                      )}
                      {subscription.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Next billing: {formatDate(subscription.nextBilling)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                        >
                          Upgrade to {plan.name}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
                            {formatDate(invoice.dueDate)}
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