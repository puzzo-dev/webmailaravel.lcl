import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { formatNumber } from '../../utils/helpers';

const AnalyticsChart = ({
  title,
  data,
  type = 'line',
  height = 300,
  className = '',
  showGrid = true,
  color = 'blue'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const getColorCode = (colorName) => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      red: '#ef4444',
      yellow: '#f59e0b',
      purple: '#8b5cf6',
      indigo: '#6366f1'
    };
    return colors[colorName] || colors.blue;
  };

  const chartColor = getColorCode(color);

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [formatNumber(value), 'Value']} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              fill={chartColor}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [formatNumber(value), 'Value']} />
            <Bar dataKey="value" fill={chartColor} />
          </BarChart>
        );

      default: // 'line'
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [formatNumber(value), 'Value']} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              dot={{ fill: chartColor }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
      <div style={{ width: '100%', height: `${height}px` }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
