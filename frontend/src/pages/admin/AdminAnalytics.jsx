import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ChartBarIcon, 
  UsersIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { fetchAdminAnalytics } from '../../store/slices/analyticsSlice';
import { formatNumber, formatDate } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';

const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, loading, error } = useSelector(state => state.analytics);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    dispatch(fetchAdminAnalytics({ timeRange }));
  }, [dispatch, timeRange]);

  const getMetricIcon = (metric) => {
    const icons = {
      total_campaigns: EnvelopeIcon,
      total_users: UsersIcon,
      total_emails_sent: EnvelopeIcon,
      open_rate: ChartBarIcon,
      click_rate: ChartBarIcon,
      bounce_rate: XCircleIcon,
      unsubscribe_rate: ExclamationTriangleIcon,
      revenue: TrendingUpIcon
    };
    return icons[metric] || ChartBarIcon;
  };

  const getMetricColor = (metric, value) => {
    const colors = {
      open_rate: value > 20 ? 'text-green-600' : value > 10 ? 'text-yellow-600' : 'text-red-600',
      click_rate: value > 5 ? 'text-green-600' : value > 2 ? 'text-yellow-600' : 'text-red-600',
      bounce_rate: value < 5 ? 'text-green-600' : value < 10 ? 'text-yellow-600' : 'text-red-600',
      unsubscribe_rate: value < 1 ? 'text-green-600' : value < 3 ? 'text-yellow-600' : 'text-red-600'
    };
    return colors[metric] || 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <ClockIcon className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">System-wide performance metrics and insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics?.overview?.map((metric) => {
          const Icon = getMetricIcon(metric.key);
          return (
            <div key={metric.key} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {metric.key.includes('rate') ? `${metric.value}%` : formatNumber(metric.value)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.key.includes('rate') ? 'bg-gray-100' : 'bg-blue-100'}`}>
                  <Icon className={`w-6 h-6 ${metric.key.includes('rate') ? 'text-gray-600' : 'text-blue-600'}`} />
                </div>
              </div>
              {metric.trend && (
                <div className="flex items-center mt-2">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm ml-1 ${metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {Math.abs(metric.trend)}% from last period
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analytics?.campaign_performance?.map((campaign) => (
              <div key={campaign.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                  <span className="text-xs text-gray-500">{campaign.user_name}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Sent</span>
                    <p className="font-medium">{formatNumber(campaign.sent_count)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Opens</span>
                    <p className="font-medium">{formatNumber(campaign.open_count)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Clicks</span>
                    <p className="font-medium">{formatNumber(campaign.click_count)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate</span>
                    <p className={`font-medium ${getMetricColor('open_rate', campaign.open_rate)}`}>
                      {campaign.open_rate}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <UsersIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analytics?.user_activity?.map((user) => (
              <div key={user.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(user.last_activity)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Campaigns</span>
                    <p className="font-medium">{user.campaigns_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sent</span>
                    <p className="font-medium">{formatNumber(user.total_sent)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Delivery Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Delivery Stats</h3>
            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {analytics?.delivery_stats?.map((stat) => (
              <div key={stat.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <span className={`text-sm font-medium ${getMetricColor(stat.key, stat.value)}`}>
                  {stat.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Locations</h3>
            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {analytics?.geographic_stats?.map((location) => (
              <div key={location.country} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{location.country}</span>
                <span className="text-sm font-medium text-gray-900">{formatNumber(location.count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
          </div>
          
          <div className="space-y-3">
            {analytics?.system_health?.map((health) => (
              <div key={health.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{health.label}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  health.status === 'good' ? 'bg-green-100 text-green-800' :
                  health.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {health.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {analytics?.recent_activity?.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${
                activity.type === 'campaign' ? 'bg-blue-100' :
                activity.type === 'user' ? 'bg-green-100' :
                activity.type === 'system' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                {activity.type === 'campaign' && <EnvelopeIcon className="w-4 h-4 text-blue-600" />}
                {activity.type === 'user' && <UsersIcon className="w-4 h-4 text-green-600" />}
                {activity.type === 'system' && <CheckCircleIcon className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 