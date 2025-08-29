import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { adminService, analyticsService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  HiUsers,
  HiMail,
  HiChartBar,
  HiShieldCheck,
  HiCog,
  HiBell,
  HiExclamation,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiTrendingUp,
  HiTrendingDown,
  HiCurrencyDollar,
  HiGlobe,
  HiServer,
  HiDatabase,
  HiKey,
  HiDocumentText,
  HiEye,
  HiPencil,
  HiTrash,
  HiPlay,
  HiPause,
  HiStop,
} from 'react-icons/hi';
import PageSubscriptionOverlay from '../../components/common/PageSubscriptionOverlay';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recent_users: [],
    recent_campaigns: [],
  });
  const [systemStatus, setSystemStatus] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    user_growth: [],
    campaign_performance: [],
    deliverability_stats: {},
    revenue_metrics: {},
  });

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const generateRecentActivities = useCallback((users, campaigns) => {
    const activities = [];

    // Ensure users and campaigns are arrays
    const safeUsers = Array.isArray(users) ? users : [];
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];

    // Add recent user registrations
    safeUsers.slice(0, 3).forEach((user) => {
      if (user && user.id && user.email) {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          action: 'User registered',
          user: user.email,
          time: formatTimeAgo(user.created_at),
          status: 'success',
        });
      }
    });

    // Add recent campaigns
    safeCampaigns.slice(0, 2).forEach((campaign) => {
      if (campaign && campaign.id) {
        activities.push({
          id: `campaign-${campaign.id}`,
          type: 'campaign',
          action: `Campaign ${campaign.status}`,
          user: campaign.user?.email || 'System',
          time: formatTimeAgo(campaign.created_at),
          status: campaign.status === 'active' ? 'success' : campaign.status === 'failed' ? 'error' : 'warning',
        });
      }
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        adminService.getDashboard(),
        analyticsService.getDashboardData()
      ]);

      setDashboardData(dashboardResponse.data);
      // Use the structured analytics data from backend
      const analyticsData = analyticsResponse.data || {};
      setAnalyticsData({
        campaigns: analyticsData.campaigns || {},
        users: analyticsData.users || {},
        revenue: analyticsData.revenue || {},
        deliverability: analyticsData.deliverability || {},
        reputation: analyticsData.reputation || {},
        performance: analyticsData.performance || {},
        charts: analyticsData.charts || {},
      });

      // Generate recent activities from the data
      const activities = generateRecentActivities(
        dashboardResponse.data.recent_users || [],
        dashboardResponse.data.recent_campaigns || []
      );
      setRecentActivities(activities);
    } catch (error) {
      toast.error(getErrorMessage(error));
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  }, [generateRecentActivities]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
      fetchSystemStatus();
    }
  }, [user, selectedPeriod, fetchDashboardData]);

  const fetchSystemStatus = async () => {
    try {
      const response = await adminService.getSystemStatus();
      setSystemStatus(response.data);
    } catch (error) {
      console.error('System status error:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <HiCheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <HiExclamation className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <HiXCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HiClock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user':
        return <HiUsers className="h-4 w-4" />;
      case 'campaign':
        return <HiMail className="h-4 w-4" />;
      case 'system':
        return <HiServer className="h-4 w-4" />;
      case 'billing':
        return <HiCurrencyDollar className="h-4 w-4" />;
      case 'security':
        return <HiShieldCheck className="h-4 w-4" />;
      default:
        return <HiDocumentText className="h-4 w-4" />;
    }
  };

  // Calculate percentage changes based on analytics data
  // Dashboard data functions



  const quickActions = [
    {
      name: 'Manage Users',
      description: 'View and manage user accounts',
      icon: HiUsers,
      href: '/admin/users',
      color: 'blue',
    },
    {
      name: 'Create Campaign',
      description: 'Start a new email campaign',
      icon: HiMail,
      href: '/campaigns/new',
      color: 'green',
    },
    {
      name: 'System Settings',
      description: 'Configure system settings',
      icon: HiCog,
      href: '/admin/system',
      color: 'gray',
    },
    {
      name: 'View Logs',
      description: 'Check system logs',
      icon: HiDocumentText,
      href: '/admin/logs',
      color: 'yellow',
    },
  ];

  // Chart data generation functions using real backend data
  const getUserGrowthData = () => {
    // Use real chart data from backend if available
    const chartData = analyticsData.charts?.user_growth || [];
    if (chartData.length > 0) {
      return chartData.map(item => ({
        name: item.date,
        users: item.value,
      }));
    }

    // Fallback to mock data if no real data available
    const dates = [];
    const weeklyUsers = analyticsData.users?.new_this_week || 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayMultiplier = i === 0 ? 0.3 : (7 - i) / 7 * 0.7;
      const dailyUsers = Math.round(weeklyUsers * dayMultiplier);

      dates.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: dailyUsers,
      });
    }
    return dates;
  };

  const getCampaignPerformanceData = () => {
    // Use real chart data from backend if available
    const chartData = analyticsData.charts?.campaign_performance || [];
    if (chartData.length > 0) {
      return chartData.map(item => ({
        name: item.date,
        campaigns: item.sent || 0,
        emails_sent: item.sent || 0,
        opens: item.opened || 0,
        clicks: item.clicked || 0,
      }));
    }

    // Fallback to mock data if no real data available
    const dates = [];
    const campaigns = analyticsData.campaigns || {};
    const weeklyCampaigns = campaigns.weekly_created || 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayMultiplier = i === 0 ? 0.4 : (7 - i) / 7 * 0.6;

      dates.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        campaigns: Math.round(weeklyCampaigns * dayMultiplier),
        emails_sent: Math.round((campaigns.emails_sent || 0) * dayMultiplier / 7),
        opens: Math.round((campaigns.opens || 0) * dayMultiplier / 7),
        clicks: Math.round((campaigns.clicks || 0) * dayMultiplier / 7),
      });
    }
    return dates;
  };

  const getDeliverabilityData = () => {
    // Use real campaign data from backend if available
    const chartData = analyticsData.charts?.deliverability_trends || [];
    if (chartData.length > 0) {
      // Return campaign-based data for bar chart
      return chartData.map(item => ({
        name: item.name,
        delivery_rate: item.delivery_rate || 0,
        bounce_rate: item.bounce_rate || 0,
        open_rate: item.open_rate || 0,
        click_rate: item.click_rate || 0,
      }));
    }

    // Return empty array when no data available
    return [];
  };

  const getCampaignStatusData = () => {
    // Use real chart data from backend if available
    const chartData = analyticsData.charts?.campaign_status_distribution || [];
    if (chartData.length > 0) {
      return chartData;
    }

    // Fallback to calculated data if no real data available
    const campaigns = analyticsData.campaigns || {};
    return [
      { name: 'Active', value: campaigns.active || 0, color: '#10b981' },
      { name: 'Completed', value: campaigns.completed || 0, color: '#3b82f6' },
      { name: 'Failed', value: campaigns.failed || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  const systemStats = [
    {
      name: 'Total Users',
      value: analyticsData.users?.total || 0,
      change: analyticsData.users?.growth_rate ? `${analyticsData.users.growth_rate.toFixed(1)}%` : 'N/A',
      changeType: (analyticsData.users?.growth_rate || 0) >= 0 ? 'increase' : 'decrease',
      icon: HiUsers,
      color: 'blue',
      href: '/admin/users',
    },
    {
      name: 'Total Campaigns',
      value: analyticsData.campaigns?.total || 0,
      change: `${analyticsData.campaigns?.weekly_created || 0} this week`,
      changeType: 'neutral',
      icon: HiMail,
      color: 'green',
      href: '/admin/campaigns',
    },
    {
      name: 'Active Campaigns',
      value: analyticsData.campaigns?.active || 0,
      change: `${((analyticsData.campaigns?.active || 0) / Math.max(analyticsData.campaigns?.total || 1, 1) * 100).toFixed(1)}%`,
      changeType: 'neutral',
      icon: HiPlay,
      color: 'yellow',
      href: '/admin/campaigns',
    },
    {
      name: 'Emails Sent',
      value: analyticsData.campaigns?.emails_sent || 0,
      change: `${analyticsData.campaigns?.delivery_rate?.toFixed(1) || 0}% delivered`,
      changeType: 'neutral',
      icon: HiMail,
      color: 'purple',
      href: '/admin/analytics',
    },
    {
      name: 'Avg Open Rate',
      value: `${analyticsData.performance?.avg_open_rate?.toFixed(1) || 0}%`,
      change: `${analyticsData.campaigns?.opens || 0} total opens`,
      changeType: 'neutral',
      icon: HiEye,
      color: 'green',
      href: '/admin/analytics',
    },
    {
      name: 'Avg Click Rate',
      value: `${analyticsData.performance?.avg_click_rate?.toFixed(1) || 0}%`,
      change: `${analyticsData.campaigns?.clicks || 0} total clicks`,
      changeType: 'neutral',
      icon: HiTrendingUp,
      color: 'indigo',
      href: '/admin/analytics',
    },
  ];

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamation className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to access the dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSubscriptionOverlay
        feature="admin dashboard"
        adminOnly={true}
        customMessage="Admin privileges required to access the administrative dashboard and system management features."
      />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">Admin Dashboard</h1>
              <p className="text-indigo-100 mt-1 text-sm sm:text-base">System overview and management controls</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {systemStats.map((stat) => (
            <Link
              key={stat.name}
              to={stat.href}
              className="group bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-12 w-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.changeType === 'increase' ? 'text-green-600' :
                        stat.changeType === 'decrease' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                >
                  <div>
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-${action.color}-100 text-${action.color}-600 group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.user}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(activity.status)}
                        <span className="text-xs text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                to="/admin/logs"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all activities →
              </Link>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${systemStatus.database?.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus.database?.status === 'connected' ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-500">Database</div>
              <div className="text-xs text-gray-400 mt-1">{systemStatus.database?.message}</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${systemStatus.cache?.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus.cache?.status === 'connected' ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-500">Cache</div>
              <div className="text-xs text-gray-400 mt-1">{systemStatus.cache?.message}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{systemStatus.memory?.current || 'N/A'}</div>
              <div className="text-sm text-gray-500">Memory Usage</div>
              <div className="text-xs text-gray-400 mt-1">Limit: {systemStatus.memory?.limit || 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${systemStatus.storage?.usage_percent < 80 ? 'text-green-600' : systemStatus.storage?.usage_percent < 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                {systemStatus.storage?.usage_percent ? `${systemStatus.storage.usage_percent}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Disk Usage</div>
              <div className="text-xs text-gray-400 mt-1">{systemStatus.storage?.free_space || 'N/A'} free</div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
                <p className="text-sm text-gray-500">New user registrations over time</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <HiUsers className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {getUserGrowthData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getUserGrowthData()}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <HiUsers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No user growth data available</p>
                  <p className="text-sm">User registration data will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Performance Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
                <p className="text-sm text-gray-500">Email metrics over time</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <HiMail className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {getCampaignPerformanceData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getCampaignPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="emails_sent"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="opens"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <HiMail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No campaign performance data available</p>
                  <p className="text-sm">Campaign metrics will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deliverability Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deliverability Stats</h3>
                <p className="text-sm text-gray-500">Email delivery performance</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <HiChartBar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            {getDeliverabilityData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDeliverabilityData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value.toFixed(2)}%`, '']}
                  />
                  <Bar
                    dataKey="delivery_rate"
                    fill="#10b981"
                    name="Delivery Rate"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="open_rate"
                    fill="#3b82f6"
                    name="Open Rate"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="click_rate"
                    fill="#f59e0b"
                    name="Click Rate"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="bounce_rate"
                    fill="#ef4444"
                    name="Bounce Rate"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <HiChartBar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No deliverability data available</p>
                  <p className="text-sm">Delivery metrics will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campaign Status</h3>
                <p className="text-sm text-gray-500">Campaign status distribution</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <HiCurrencyDollar className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            {getCampaignStatusData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCampaignStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getCampaignStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [value, 'Campaigns']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <HiCurrencyDollar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No campaign data available</p>
                  <p className="text-sm">Campaign status will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h2>
          <div className="space-y-3">
            {/* Dynamic alerts based on system status */}
            {systemStatus.storage?.usage_percent > 85 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <HiExclamation className="h-5 w-5 text-red-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">High Disk Usage</p>
                  <p className="text-sm text-red-700">Disk usage is at {systemStatus.storage.usage_percent}%</p>
                </div>
              </div>
            )}

            {systemStatus.storage?.usage_percent > 75 && systemStatus.storage?.usage_percent <= 85 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <HiExclamation className="h-5 w-5 text-yellow-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Moderate Disk Usage</p>
                  <p className="text-sm text-yellow-700">Disk usage is at {systemStatus.storage.usage_percent}%</p>
                </div>
              </div>
            )}

            {systemStatus.database?.status === 'connected' && systemStatus.cache?.status === 'connected' && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <HiCheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">System Status Good</p>
                  <p className="text-sm text-green-700">All core services are operational</p>
                </div>
              </div>
            )}

            {(systemStatus.database?.status !== 'connected' || systemStatus.cache?.status !== 'connected') && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <HiXCircle className="h-5 w-5 text-red-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Service Issues Detected</p>
                  <p className="text-sm text-red-700">One or more core services are unavailable</p>
                </div>
              </div>
            )}

            {Object.keys(systemStatus).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <HiClock className="h-8 w-8 mx-auto mb-2" />
                <p>Loading system status...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard; 