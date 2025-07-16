import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
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
  HiExclamation,
} from 'react-icons/hi';

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

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
      fetchSystemStatus();
    }
  }, [user, selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAnalytics({ period: selectedPeriod })
      ]);
      
      setDashboardData(dashboardResponse.data);
      
      // Generate recent activities from the data
      const activities = generateRecentActivities(
        dashboardResponse.data.recent_users,
        dashboardResponse.data.recent_campaigns
      );
      setRecentActivities(activities);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await adminService.getSystemStatus();
      setSystemStatus(response.data);
    } catch (error) {
      console.error('System status error:', error);
    }
  };

  const generateRecentActivities = (users, campaigns) => {
    const activities = [];
    
    // Add recent user registrations
    users.slice(0, 3).forEach((user, index) => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: 'User registered',
        user: user.email,
        time: formatTimeAgo(user.created_at),
        status: 'success',
      });
    });

    // Add recent campaigns
    campaigns.slice(0, 2).forEach((campaign, index) => {
      activities.push({
        id: `campaign-${campaign.id}`,
        type: 'campaign',
        action: `Campaign ${campaign.status}`,
        user: campaign.user?.email || 'System',
        time: formatTimeAgo(campaign.created_at),
        status: campaign.status === 'active' ? 'success' : campaign.status === 'failed' ? 'error' : 'warning',
      });
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const systemStats = [
    {
      name: 'Total Users',
      value: dashboardData.stats.total_users || 0,
      change: '+12%',
      changeType: 'increase',
      icon: HiUsers,
      color: 'blue',
      href: '/admin/users',
    },
    {
      name: 'Total Campaigns',
      value: dashboardData.stats.total_campaigns || 0,
      change: '+5%',
      changeType: 'increase',
      icon: HiMail,
      color: 'green',
      href: '/admin/campaigns',
    },
    {
      name: 'Active Campaigns',
      value: dashboardData.stats.active_campaigns || 0,
      change: '+8%',
      changeType: 'increase',
      icon: HiPlay,
      color: 'yellow',
      href: '/admin/campaigns',
    },
    {
      name: 'Emails Sent',
      value: dashboardData.stats.total_emails_sent || 0,
      change: '+23%',
      changeType: 'increase',
      icon: HiMail,
      color: 'purple',
      href: '/admin/analytics',
    },
    {
      name: 'Avg Open Rate',
      value: `${Math.round(dashboardData.stats.avg_open_rate || 0)}%`,
      change: '+2%',
      changeType: 'increase',
      icon: HiEye,
      color: 'green',
      href: '/admin/analytics',
    },
    {
      name: 'Avg Click Rate',
      value: `${Math.round(dashboardData.stats.avg_click_rate || 0)}%`,
      change: '+1%',
      changeType: 'increase',
      icon: HiTrendingUp,
      color: 'indigo',
      href: '/admin/analytics',
    },
  ];

  const quickActions = [
    {
      name: 'Add User',
      description: 'Create a new user account',
      icon: HiUsers,
      href: '/admin/users/new',
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
      description: 'Configure system parameters',
      icon: HiCog,
      href: '/admin/settings',
      color: 'gray',
    },
    {
      name: 'View Logs',
      description: 'Check system activity logs',
      icon: HiDocumentText,
      href: '/admin/logs',
      color: 'orange',
    },
    {
      name: 'Billing Overview',
      description: 'Manage subscriptions and payments',
      icon: HiCurrencyDollar,
      href: '/admin/billing',
      color: 'yellow',
    },
    {
      name: 'Security Audit',
      description: 'Review security settings and access',
      icon: HiShieldCheck,
      href: '/admin/security',
      color: 'red',
    },
  ];

  // recentActivities is now populated from live data in fetchDashboardData

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

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamationTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to access the admin dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg h-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-indigo-100 mt-1">System overview and management controls</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
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
  );
};

export default AdminDashboard; 