import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCreditCard, HiX, HiStar, HiCheckCircle, HiShieldCheck } from 'react-icons/hi';

const SubscriptionOverlay = ({ isVisible, onClose }) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/billing');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <HiCreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Subscription Required</h2>
              <p className="text-sm text-gray-600">Upgrade to access premium features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              This feature requires an active subscription. Upgrade now to unlock all premium features and maximize your email campaign success.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Unlimited email campaigns</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Advanced analytics and reporting</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Priority customer support</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Custom domain management</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Advanced security features</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSubscribe}
            className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
          >
            <HiStar className="h-5 w-5 mr-2" />
            Subscribe Now
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            You can continue using basic features without a subscription
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOverlay; 