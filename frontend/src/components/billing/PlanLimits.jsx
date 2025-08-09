import React from 'react';
import { formatNumber } from '../../utils/helpers';

/**
 * Reusable PlanLimits component for displaying plan limits and usage
 * @param {Object} plan - Plan data with limits
 * @param {Object} usage - Current usage data (optional)
 */
const PlanLimits = ({ plan, usage }) => {
  if (!plan) return null;

  const limits = [
    {
      label: 'Max Domains',
      value: plan.max_domains > 0 ? plan.max_domains : 'Unlimited',
      current: usage?.domains || 0,
    },
    {
      label: 'Max Campaigns',
      value: plan.max_total_campaigns > 0 ? plan.max_total_campaigns : 'Unlimited',
      current: usage?.campaigns || 0,
    },
    {
      label: 'Daily Limit',
      value: plan.daily_sending_limit > 0 ? formatNumber(plan.daily_sending_limit) : 'Unlimited',
      current: usage?.dailySent || 0,
    },
    {
      label: 'Senders/Domain',
      value: plan.max_senders_per_domain > 0 ? plan.max_senders_per_domain : 'Unlimited',
      current: usage?.sendersPerDomain || 0,
    },
  ];

  const getUsagePercentage = (current, max) => {
    if (max === 'Unlimited' || max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Limits</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {limits.map((limit, index) => {
          const percentage = getUsagePercentage(limit.current, limit.value);
          const showUsage = usage && limit.value !== 'Unlimited';
          
          return (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">
                {limit.value}
              </div>
              <div className="text-sm text-gray-500 mb-2">{limit.label}</div>
              
              {showUsage && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">
                    {formatNumber(limit.current)} used
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanLimits;
