import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../../store/slices/analyticsSlice';
import {
  HiChartBar,
  HiEye,
  HiCursorClick,
  HiMail,
  HiUsers,
  HiTrendingUp,
  HiTrendingDown,
  HiCalendar,
  HiFilter,
  HiDownload,
} from 'react-icons/hi';
import { formatDate, formatNumber, formatPercent } from '../../utils/helpers';

const Analytics = () => {
  const dispatch = useDispatch();
  const { analytics, isLoading } = useSelector((state) => state.analytics);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    dispatch(fetchAnalytics({ period: selectedPeriod, type: selectedMetric }));
  }, [dispatch, selectedPeriod, selectedMetric]);

  const periods = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  const metrics = [
    { value: 'overview', label: 'Overview' },
    { value: 'campaigns', label: 'Campaigns' },
    { value: 'deliverability', label: 'Deliverability' },
    { value: 'reputation', label: 'Reputation' },
  ];

  const statCards = [
    {
      name: 'Total Sent',
      value: analytics?.total_sent || 0,
      change: analytics?.sent_change || 0,
      changeType: analytics?.sent_change >= 0 ? 'increase' : 'decrease',
      icon: HiMail,
      color: 'blue',
    },
    {
      name: 'Open Rate',
      value: analytics?.open_rate || 0,
      change: analytics?.open_rate_change || 0,
      changeType: analytics?.open_rate_change >= 0 ? 'increase' : 'decrease',
      icon: HiEye,
      color: 'green',
      format: 'percent',
    },
    {
      name: 'Click Rate',
      value: analytics?.click_rate || 0,
      change: analytics?.click_rate_change || 0,
      changeType: analytics?.click_rate_change >= 0 ? 'increase' : 'decrease',
      icon: HiCursorClick,
      color: 'purple',
      format: 'percent',
    },
    {
      name: 'Unique Recipients',
      value: analytics?.unique_recipients || 0,
      change: analytics?.recipients_change || 0,
      changeType: analytics?.recipients_change >= 0 ? 'increase' : 'decrease',
      icon: HiUsers,
      color: 'orange',
    },
  ];

  const formatValue = (value, format) => {
    if (format === 'percent') {
      return formatPercent(value);
    }
    return formatNumber(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">View your campaign performance and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="input"
            >
              {metrics.map((metric) => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary">
              <HiDownload className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(stat.value, stat.format)}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {stat.changeType === 'increase' ? (
                <HiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <HiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(stat.change)}% from last period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <HiChartBar className="h-5 w-5 inline mr-2" />
            Email Performance Over Time
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart visualization will be implemented here
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <HiUsers className="h-5 w-5 inline mr-2" />
            Engagement Metrics
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart visualization will be implemented here
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {analytics?.recent_activity?.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <HiMail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatNumber(activity.count)} emails
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No recent activity data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 