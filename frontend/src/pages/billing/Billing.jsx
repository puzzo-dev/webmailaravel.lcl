import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  HiCreditCard,
  HiDocumentText,
  HiCalendar,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi';
import { useSubscription, useBilling } from '../../hooks';
import { 
  SubscriptionStatus, 
  PlanLimits, 
  PlanCard, 
  PaymentHistoryTable 
} from '../../components/billing';

const Billing = () => {
  const {
    currentSubscription,
    isLoading,
    error,
    upgradeToPlan,
    cancelUserSubscription,
    clearBillingError,
    isCurrentPlan,
  } = useSubscription();

  const {
    plans,
    loadBillingData,
    downloadInvoice,
    viewInvoice,
    getFormattedPaymentHistory,
    getFormattedInvoices,
  } = useBilling();
  
  const [activeTab, setActiveTab] = useState('subscription');
  const [showWelcome, setShowWelcome] = useState(false);

  // Get billing-specific loading state
  const billingState = useSelector((state) => state.billing);
  const plansLoading = billingState.loading?.plans || false;

  // Debug: Log plans data (remove in production)
  console.log('Billing component - plans:', plans, 'plansLoading:', plansLoading, 'billingState:', billingState);

  useEffect(() => {
    // Load billing data on component mount
    loadBillingData();
    
    // Check if user just registered and came from pricing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      setShowWelcome(true);
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearBillingError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearBillingError]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
            <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
          </div>

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
              <div className="mt-2 text-sm text-red-700">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</div>
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
              <SubscriptionStatus
                subscription={currentSubscription}
                isLoading={isLoading}
                onCancel={cancelUserSubscription}
              />

              {/* Plan Limits & Usage */}
              {currentSubscription?.plan && (
                <PlanLimits plan={currentSubscription.plan} />
              )}

              {/* Payment Information */}
              {currentSubscription && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {currentSubscription.payment_method || 'BTCPay'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Status</h4>
                      <div className="flex items-center">
                        {currentSubscription.paid_at ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                            <HiCheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                            <HiClock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    {currentSubscription.payment_url && currentSubscription.status === 'pending' && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Complete Payment</h4>
                        <a
                          href={currentSubscription.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                        >
                          <HiCreditCard className="h-4 w-4 mr-2" />
                          Pay with BTCPay
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Features */}
              {currentSubscription && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      // Handle different feature data structures
                      let features = [];
                      
                      if (Array.isArray(currentSubscription.features)) {
                        features = currentSubscription.features;
                      } else if (Array.isArray(currentSubscription.plan?.features)) {
                        features = currentSubscription.plan.features;
                      } else if (typeof currentSubscription.features === 'string') {
                        try {
                          features = JSON.parse(currentSubscription.features);
                        } catch {
                          features = [currentSubscription.features];
                        }
                      }
                      
                      return features.length > 0 ? (
                        features.map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <HiCheckCircle className="h-5 w-5 text-success-500 mr-3" />
                            <span className="text-gray-700">{typeof feature === 'string' ? feature : feature.name || 'Feature'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No features listed</div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Available Plans */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
                {plansLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.isArray(plans) && plans.length > 0 ? (
                      plans.map((plan, index) => (
                        <PlanCard
                          key={plan.id || `plan-${index}`}
                          plan={plan}
                          isCurrentPlan={isCurrentPlan(plan.id)}
                          isLoading={plansLoading}
                          onUpgrade={upgradeToPlan}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">
                          {billingState.error ? 
                            `Error loading plans: ${billingState.error}` : 
                            'No plans available'
                          }
                        </p>
                        {billingState.error && (
                          <button 
                            onClick={loadBillingData}
                            className="mt-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'payment-history' && (
            <div className="space-y-6">
              <PaymentHistoryTable
                paymentHistory={getFormattedPaymentHistory()}
                isLoading={isLoading}
                onViewInvoice={viewInvoice}
                onDownloadInvoice={downloadInvoice}
              />
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <PaymentHistoryTable
                paymentHistory={getFormattedInvoices().map(invoice => ({
                  id: invoice.id,
                  date: invoice.date,
                  amount: invoice.amount,
                  status: invoice.status,
                  method: 'Invoice',
                  invoice: invoice.id,
                }))}
                isLoading={isLoading}
                onViewInvoice={viewInvoice}
                onDownloadInvoice={downloadInvoice}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing; 