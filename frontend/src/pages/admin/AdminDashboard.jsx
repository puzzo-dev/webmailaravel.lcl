import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAnalytics } from '../../store/slices/analyticsSlice';
import { fetchCampaigns } from '../../store/slices/campaignSlice';
import { fetchUsers } from '../../store/slices/userSlice';
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
} from 'react-icons/hi';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { analytics, isLoading } = useSelector((state) => state.analytics);
  const { campaigns } = useSelector((state) => state.campaigns);
  const { users } = useSelector((state) => state.user);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    dispatch(fetchAnalytics({ period: selectedPeriod }));
    dispatch(fetchCampaigns({ page: 1, limit: 10 }));
    dispatch(fetchUsers({ page: 1, limit: 10 }));
  }, [dispatch, selectedPeriod]);

  const systemStats = [
    {
      name: 'Total Users',
      value: users?.length || 0,
      change: '+12%',
      changeType: 'increase',
      icon: HiUsers,
      color: 'blue',
      href: '/admin/users',
    },
    {
      name: 'Active Campaigns',
      value: campaigns?.filter(c => c.status === 'active').length || 0,
      change: '+5%',
      changeType: 'increase',
      icon: HiMail,
      color: 'green',
      href: '/admin/campaigns',
    },
    {
      name: 'Total Revenue',
      value: `$${analytics?.total_revenue || 0}`,
      change: '+23%',
      changeType: 'increase',
      icon: HiCurrencyDollar,
      color: 'yellow',
      href: '/admin/billing',
    },
    {
      name: 'System Health',
      value: '98%',
      change: '+2%',
      changeType: 'increase',
      icon: HiServer,
      color: 'green',
      href: '/admin/system',
    },
    {
      name: 'Active Domains',
      value: analytics?.active_domains || 0,
      change: '+8%',
      changeType: 'increase',
      icon: HiGlobe,
      color: 'purple',
      href: '/admin/domains',
    },
    {
      name: 'API Requests',
      value: analytics?.api_requests || 0,
      change: '+15%',
      changeType: 'increase',
      icon: HiKey,
      color: 'indigo',
      href: '/admin/api',
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

  const recentActivities = [
    {
      id: 1,
      type: 'user',
      action: 'User registered',
      user: 'john@example.com',
      time: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'campaign',
      action: 'Campaign started',
      user: 'admin@example.com',
      time: '5 minutes ago',
      status: 'success',
    },
    {
      id: 3,
      type: 'system',
      action: 'System backup completed',
      user: 'system',
      time: '1 hour ago',
      status: 'success',
    },
    {
      id: 4,
      type: 'billing',
      action: 'Payment received',
      user: 'jane@example.com',
      time: '2 hours ago',
      status: 'success',
    },
    {
      id: 5,
      type: 'security',
      action: 'Failed login attempt',
      user: 'unknown@example.com',
      time: '3 hours ago',
      status: 'warning',
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">1.2s</div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">99.9%</div>
            <div className="text-sm text-gray-500">Email Delivery Rate</div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <HiExclamation className="h-5 w-5 text-yellow-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">High CPU Usage</p>
              <p className="text-sm text-yellow-700">Server CPU usage is at 85%</p>
            </div>
            <button className="text-yellow-600 hover:text-yellow-800">
              <HiEye className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <HiCheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Backup Completed</p>
              <p className="text-sm text-green-700">Daily backup completed successfully</p>
            </div>
            <button className="text-green-600 hover:text-green-800">
              <HiEye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 