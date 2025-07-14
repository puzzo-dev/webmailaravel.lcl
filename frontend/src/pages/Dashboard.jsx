import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '../store/slices/analyticsSlice';
import { fetchRecentCampaigns } from '../store/slices/campaignSlice';
import { fetchNotifications } from '../store/slices/notificationSlice';
import { formatDate } from '../utils/helpers';
import {
  HiChartBar,
  HiInbox,
  HiUsers,
  HiEye,
  HiCursorClick,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiBell,
  HiPlus,
  HiArrowRight,
} from 'react-icons/hi';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading } = useSelector((state) => state.analytics);
  const { campaigns } = useSelector((state) => state.campaigns);
  const { notifications } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    dispatch(fetchDashboardStats({ period: selectedPeriod }));
    dispatch(fetchRecentCampaigns({ page: 1, limit: 5 }));
    dispatch(fetchNotifications({ page: 1, limit: 5 }));
  }, [dispatch, selectedPeriod]);

  const stats = [
    {
      name: 'Total Campaigns',
      value: dashboardStats?.total_campaigns || 0,
      change: '+12%',
      changeType: 'increase',
      icon: HiInbox,
      color: 'primary',
    },
    {
      name: 'Active Campaigns',
      value: dashboardStats?.active_campaigns || 0,
      change: '+5%',
      changeType: 'increase',
      icon: HiCheckCircle,
      color: 'success',
    },
    {
      name: 'Total Emails Sent',
      value: dashboardStats?.total_emails_sent || 0,
      change: '+23%',
      changeType: 'increase',
      icon: HiInbox,
      color: 'info',
    },
    {
      name: 'Average Open Rate',
      value: `${dashboardStats?.average_open_rate || 0}%`,
      change: '+2.1%',
      changeType: 'increase',
      icon: HiEye,
      color: 'warning',
    },
    {
      name: 'Average Click Rate',
      value: `${dashboardStats?.average_click_rate || 0}%`,
      change: '+1.5%',
      changeType: 'increase',
      icon: HiCursorClick,
      color: 'success',
    },
    {
      name: 'Total Recipients',
      value: dashboardStats?.total_recipients || 0,
      change: '+18%',
      changeType: 'increase',
      icon: HiUsers,
      color: 'info',
    },
  ];

  const quickActions = [
    {
      name: 'Create Campaign',
      description: 'Start a new email campaign',
      icon: HiPlus,
      href: '/campaigns/new',
      color: 'primary',
    },
    {
      name: 'View Analytics',
      description: 'Check campaign performance',
      icon: HiChartBar,
      href: '/analytics',
      color: 'success',
    },
    {
      name: 'Manage Users',
      description: 'Admin user management',
      icon: HiUsers,
      href: '/admin/users',
      color: 'warning',
    },
    {
      name: 'Settings',
      description: 'Configure system settings',
      icon: HiArrowRight,
      href: '/settings',
      color: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your campaigns today.</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input w-auto"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-8 w-8 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                </div>
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
                      stat.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group relative bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
            >
              <div>
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-${action.color}-100 text-${action.color}-600`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="mt-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Campaigns</h2>
            <Link to="/campaigns" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <HiInbox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first campaign.
              </p>
              <div className="mt-6">
                <Link to="/campaigns/new" className="btn btn-primary">
                  Create Campaign
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">{campaign.subject}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <HiClock className="h-3 w-3 mr-1" />
                      {formatDate(campaign.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-success-100 text-success-800' :
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-warning-100 text-warning-800'
                    }`}>
                      {campaign.status}
                    </span>
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <HiEye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Notifications</h2>
            <Link to="/notifications" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <HiBell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <HiBell className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-500">{notification.message}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <HiClock className="h-3 w-3 mr-1" />
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {dashboardStats?.total_emails_sent || 0}
            </div>
            <div className="text-sm text-gray-500">Emails Sent</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {dashboardStats?.average_open_rate || 0}%
            </div>
            <div className="text-sm text-gray-500">Average Open Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">
              {dashboardStats?.average_click_rate || 0}%
            </div>
            <div className="text-sm text-gray-500">Average Click Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 