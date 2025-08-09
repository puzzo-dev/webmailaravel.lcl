import React from 'react';
import { formatNumber } from '../../utils/helpers';

/**
 * Reusable PlanCard component for displaying subscription plans
 * @param {Object} plan - Plan data
 * @param {boolean} isCurrentPlan - Whether this is the user's current plan
 * @param {boolean} isLoading - Loading state
 * @param {Function} onUpgrade - Callback for upgrading to this plan
 */
const PlanCard = ({ plan, isCurrentPlan = false, isLoading = false, onUpgrade }) => {
  if (!plan) return null;

  const handleUpgrade = () => {
    if (onUpgrade && !isCurrentPlan && !isLoading) {
      onUpgrade(plan.id);
    }
  };

  return (
    <div
      className={`border rounded-lg p-6 ${
        isCurrentPlan
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
        {isCurrentPlan && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 mt-2">
            Current Plan
          </span>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Max Domains:</span>
            <span className="font-medium">
              {plan.max_domains > 0 ? plan.max_domains : 'Unlimited'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Max Campaigns:</span>
            <span className="font-medium">
              {plan.max_total_campaigns > 0 ? plan.max_total_campaigns : 'Unlimited'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Daily Limit:</span>
            <span className="font-medium">
              {plan.daily_sending_limit > 0 ? formatNumber(plan.daily_sending_limit) : 'Unlimited'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Max Senders/Domain:</span>
            <span className="font-medium">
              {plan.max_senders_per_domain > 0 ? plan.max_senders_per_domain : 'Unlimited'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full btn btn-secondary disabled:opacity-50"
          >
            Current Plan
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            className="w-full btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : `Upgrade to ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanCard;
