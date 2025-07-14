import React from 'react';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

const StatsCard = ({ name, value, change, changeType, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-600',
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-600',
      icon: 'text-success-600',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      icon: 'text-warning-600',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="stats-card">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${colors.icon}`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {name}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {changeType === 'increase' ? (
                      <HiTrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <HiTrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {changeType === 'increase' ? 'Increased' : 'Decreased'} by
                    </span>
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard; 