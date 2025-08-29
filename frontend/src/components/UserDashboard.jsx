import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  HiInbox,
  HiChartBar,
  HiUser,
  HiGlobe,
  HiMail,
  HiExclamation,
  HiCheckCircle,
  HiClock,
  HiTrendingUp,
  HiTrendingDown,
  HiPlus,
  HiRefresh,
  HiEye,
  HiCursorClick,
  HiPaperAirplane,
  HiX,
  HiShieldCheck,
  HiBan,
} from 'react-icons/hi';
import UserActivityFeed from './UserActivityFeed';

const UserDashboard = ({ data, onRefresh }) => {
  const navigate = useNavigate();
  const [SELECTED_PERIOD, SET_SELECTED_PERIOD] = useState('7d');

  // Chart colors
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Safe data access with defaults
  const safeData = data || {};
  const campaigns = safeData.campaigns || {};
  const USERS = safeData.users || {};
  const REVENUE = safeData.revenue || {};
  const REPUTATION = safeData.reputation || {};
  const bounceProcessing = safeData.bounce_processing || {};

  // Generate performance chart data using real backend data
  const getPerformanceData = () => {
    // Use real chart data from backend if available
    const chartData = safeData.charts?.campaign_performance || [];
    if (chartData.length > 0) {
      return chartData.map(item => ({
        name: item.date,
        sent: item.sent || 0,
        delivered: item.delivered || 0,
        opened: item.opened || 0,
        clicked: item.clicked || 0,
      }));
    }

    // Fallback to mock data if no real data available
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayMultiplier = i === 0 ? 1 : (7 - i) / 7;

      dates.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: Math.round((campaigns.emails_sent || 0) * dayMultiplier / 7),
        delivered: Math.round((campaigns.emails_delivered || 0) * dayMultiplier / 7),
        opened: Math.round((campaigns.opens || 0) * dayMultiplier / 7),
        clicked: Math.round((campaigns.clicks || 0) * dayMultiplier / 7),
      });
    }
    return dates;
  };

  // Generate campaign status data for pie chart using real backend data
  const getCampaignStatusData = () => {
    // Use real chart data from backend if available
    const chartData = safeData.charts?.campaign_status_distribution || [];
    if (chartData.length > 0) {
      return chartData;
    }

    // Fallback to calculated data if no real data available
    const statusData = [
      { name: 'Active', value: campaigns.active || 0, color: '#10B981' },
      { name: 'Completed', value: campaigns.completed || 0, color: '#3B82F6' },
      { name: 'Failed', value: campaigns.failed || 0, color: '#EF4444' },
    ].filter(item => item.value > 0);

    if (statusData.length === 0) {
      return [{ name: 'No Campaigns', value: 1, color: '#E5E7EB' }];
    }

    return statusData;
  };

  const performanceData = getPerformanceData();
  const campaignStatusData = getCampaignStatusData();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <p className="text-blue-100 mt-1">
              {(campaigns.total || 0) > 0
                ? `You have ${campaigns.total} campaign${campaigns.total !== 1 ? 's' : ''} total`
                : "Ready to create your first campaign?"
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-bold">{campaigns.total || 0}</div>
              <div className="text-blue-100 text-sm">Total Campaigns</div>
            </div>
            <button
              onClick={onRefresh}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              title="Refresh data"
            >
              <HiRefresh className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Line 1: Campaign Status - Full Width */}
      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Campaign Status</h2>
        <div className="flex flex-wrap gap-4 w-full">
          <div className="flex-1 min-w-[250px] bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HiPaperAirplane className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Campaigns</p>
                <p className="text-3xl font-bold text-blue-900">{campaigns.total || 0}</p>
                <div className="flex items-center mt-1">
                  <HiTrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-xs font-medium text-blue-600">
                    {campaigns.weekly_created || 0} this week
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[250px] bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HiCheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Active</p>
                <p className="text-3xl font-bold text-green-900">{campaigns.active || 0}</p>
                <div className="flex items-center mt-1">
                  <HiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs font-medium text-green-600">
                    Running now
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[250px] bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HiClock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">Completed</p>
                <p className="text-3xl font-bold text-purple-900">{campaigns.completed || 0}</p>
                <div className="flex items-center mt-1">
                  <HiTrendingUp className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs font-medium text-purple-600">
                    Finished
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[250px] bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HiX className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700">Failed</p>
                <p className="text-3xl font-bold text-red-900">{campaigns.failed || 0}</p>
                <div className="flex items-center mt-1">
                  <HiTrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-xs font-medium text-red-600">
                    Need attention
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line 2: Email Performance Trends | Bounce Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Performance Trends</h3>
              <p className="text-sm text-gray-500">Daily email metrics over the last 7 days</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiChartBar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
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
                dataKey="sent"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorSent)"
                strokeWidth={2}
                name="Sent"
              />
              <Area
                type="monotone"
                dataKey="opened"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorOpened)"
                strokeWidth={2}
                name="Opened"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bounce Processing Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bounce Processing</h3>
              <p className="text-sm text-gray-500">Daily bounce processing over the last 7 days</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <HiExclamation className="h-5 w-5 text-red-600" />
            </div>
          </div>
          {bounceProcessing.trends?.daily?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bounceProcessing.trends.daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="hard_bounces" stackId="a" fill="#EF4444" name="Hard Bounces" />
                <Bar dataKey="soft_bounces" stackId="a" fill="#F59E0B" name="Soft Bounces" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <HiExclamation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No bounce data yet</p>
                <p className="text-sm">Set up bounce processing to see trends</p>
                <button
                  onClick={() => navigate('/bounce-credentials')}
                  className="mt-4 btn btn-primary btn-sm"
                >
                  <HiPlus className="h-4 w-4 mr-2" />
                  Setup Bounce Processing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Status Distribution - Full Width */}
      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Campaign Status Distribution</h3>
            <p className="text-sm text-gray-500">Current status distribution of your campaigns</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <HiMail className="h-5 w-5 text-green-600" />
          </div>
        </div>
        {campaignStatusData.length > 0 && campaignStatusData[0].name !== 'No Campaigns' ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campaignStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {campaignStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
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
              <HiMail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No campaigns yet</p>
              <p className="text-sm">Create your first campaign to see status distribution</p>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="mt-4 btn btn-primary btn-sm"
              >
                <HiPlus className="h-4 w-4 mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Line 3: Recent Activity */}
      <UserActivityFeed limit={10} showHeader={true} />
    </div>
  );
};

export default UserDashboard;
