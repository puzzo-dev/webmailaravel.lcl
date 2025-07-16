import React from 'react';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import { formatNumber } from '../../utils/helpers';

const MetricCard = ({ 
  title, 
  value, 
  previous, 
  icon, 
  color = 'blue',
  formatValue = (val) => formatNumber(val),
  showChange = true 
}) => {
  const getMetricChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const change = showChange ? getMetricChange(value, previous) : null;
  
  return (
    <div className={`bg-${color}-50 p-6 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          {showChange && change && previous !== undefined && (
            <div className="flex items-center mt-2">
              {change.isPositive ? (
                <HiTrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <HiTrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {change.value.toFixed(1)}% from last period
              </span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MetricCard; 