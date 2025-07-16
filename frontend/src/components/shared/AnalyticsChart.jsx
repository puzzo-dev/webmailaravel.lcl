import React from 'react';
import { formatDate, formatNumber } from '../../utils/helpers';

const AnalyticsChart = ({
  title,
  data,
  type = 'line',
  height = 300,
  className = '',
  showLegend = true,
  showGrid = true,
  color = 'blue'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center text-gray-500">
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));

  const renderLineChart = () => (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={`var(--color-${color}-500)`} stopOpacity="0.3" />
            <stop offset="100%" stopColor={`var(--color-${color}-500)`} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {showGrid && (
          <g className="text-gray-200">
            {[...Array(5)].map((_, i) => {
              const y = (i * height) / 4;
              return (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}
        
        {/* Data line */}
        <polyline
          fill="none"
          stroke={`var(--color-${color}-500)`}
          strokeWidth="2"
          points={data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = height - ((item.value - minValue) / (maxValue - minValue)) * height;
            return `${x}%,${y}`;
          }).join(' ')}
        />
        
        {/* Area fill */}
        <polygon
          fill={`url(#gradient-${color})`}
          points={`0,${height} ${data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = height - ((item.value - minValue) / (maxValue - minValue)) * height;
            return `${x}%,${y}`;
          }).join(' ')} 100%,${height}`}
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = height - ((item.value - minValue) / (maxValue - minValue)) * height;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={y}
              r="4"
              fill={`var(--color-${color}-500)`}
              className="hover:r-6 transition-all"
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        {data.map((item, index) => (
          <span key={index} className="text-center">
            {formatDate(item.date, 'MMM dd')}
          </span>
        ))}
      </div>
    </div>
  );

  const renderBarChart = () => (
    <div className="relative" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full space-x-1">
        {data.map((item, index) => {
          const heightPercent = ((item.value - minValue) / (maxValue - minValue)) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full bg-${color}-500 rounded-t transition-all hover:bg-${color}-600`}
                style={{ height: `${heightPercent}%` }}
              />
              <span className="text-xs text-gray-500 mt-1">
                {formatDate(item.date, 'MMM dd')}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
        {[...Array(5)].map((_, i) => {
          const value = maxValue - (i * (maxValue - minValue)) / 4;
          return (
            <span key={i} className="text-right pr-2">
              {formatNumber(value)}
            </span>
          );
        })}
      </div>
    </div>
  );

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const radius = Math.min(height, 200) / 2;
            const centerX = 50;
            const centerY = 50;
            
            const x1 = centerX + radius * Math.cos(currentAngle * Math.PI / 180);
            const y1 = centerY + radius * Math.sin(currentAngle * Math.PI / 180);
            const x2 = centerX + radius * Math.cos((currentAngle + angle) * Math.PI / 180);
            const y2 = centerY + radius * Math.sin((currentAngle + angle) * Math.PI / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={`hsl(${(index * 137.5) % 360}, 70%, 60%)`}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="flex flex-wrap justify-center space-x-4">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                  />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {renderChart()}
    </div>
  );
};

export default AnalyticsChart; 