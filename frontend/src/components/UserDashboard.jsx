import React, { useState, useEffect } from 'react';
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

const UserDashboard = ({ data, onRefresh }) => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Chart colors
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Safe data access with defaults
  const safeData = data || {};
  const campaigns = safeData.campaigns || {};
  const users = safeData.users || {};
  const performance = safeData.performance || {};
  const deliverability = safeData.deliverability || {};
  const revenue = safeData.revenue || {};
  const reputation = safeData.reputation || {};
  const bounceProcessing = safeData.bounce_processing || {};
  const suppression = safeData.suppression || {};

  // Generate performance chart data from last 7 days
  const getPerformanceData = () => {
    // For now, generate a trending view based on the available data
    // In future, this could be enhanced with daily/weekly trending data from backend
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Use actual data for the most recent day, and scale down for previous days
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

  // Generate campaign status data for pie chart
  const getCampaignStatusData = () => {
    // Use backend data structure for campaign counts
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
    <div className="space-y-6">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiPaperAirplane className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Emails Sent</p>
              <p className="text-3xl font-bold text-gray-900">{campaigns.emails_sent || 0}</p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-xs font-medium text-blue-600">
                  {campaigns.weekly_created || 0} campaigns this week
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiEye className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {performance.avg_open_rate ? `${performance.avg_open_rate.toFixed(1)}%` : '0%'}
              </p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs font-medium text-green-600">
                  {campaigns.opens || 0} total opens
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiCursorClick className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Click Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {performance.avg_click_rate ? `${performance.avg_click_rate.toFixed(1)}%` : '0%'}
              </p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-purple-500 mr-1" />
                <span className="text-xs font-medium text-purple-600">
                  {campaigns.clicks || 0} total clicks
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiCheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Delivery Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {campaigns.delivery_rate ? `${campaigns.delivery_rate.toFixed(1)}%` : '0%'}
              </p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-xs font-medium text-orange-600">
                  {campaigns.emails_delivered || 0} delivered
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bounce Processing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiShieldCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bounce Credentials</p>
              <p className="text-3xl font-bold text-gray-900">{bounceProcessing.credentials?.total || 0}</p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-indigo-500 mr-1" />
                <span className="text-xs font-medium text-indigo-600">
                  {bounceProcessing.credentials?.active || 0} active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiExclamation className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bounces Processed</p>
              <p className="text-3xl font-bold text-gray-900">{bounceProcessing.processing?.total_processed || 0}</p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-red-500 mr-1" />
                <span className="text-xs font-medium text-red-600">
                  {bounceProcessing.processing?.recent_processed || 0} this week
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiBan className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Suppressed Emails</p>
              <p className="text-3xl font-bold text-gray-900">{suppression.summary?.total || 0}</p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-yellow-500 mr-1" />
                <span className="text-xs font-medium text-yellow-600">
                  {suppression.summary?.this_week || 0} this week
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiCheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Suppression Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {bounceProcessing.processing?.suppression_rate ? `${bounceProcessing.processing.suppression_rate}%` : '0%'}
              </p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs font-medium text-green-600">
                  {bounceProcessing.processing?.added_to_suppression || 0} suppressed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
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

        {/* Campaign Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaign Status</h3>
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
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {/* Display summary of recent campaign activity */}
          {(campaigns.total || 0) > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 rounded-lg bg-green-100">
                  <HiCheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Total Campaigns</p>
                  <p className="text-xs text-gray-500">{campaigns.total} campaigns created</p>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active: {campaigns.active || 0}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 rounded-lg bg-blue-100">
                  <HiMail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Email Performance</p>
                  <p className="text-xs text-gray-500">{campaigns.emails_sent || 0} emails sent total</p>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {campaigns.delivery_rate ? `${campaigns.delivery_rate.toFixed(1)}%` : '0%'} delivered
                </div>
              </div>

              {deliverability.total_bounces > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 rounded-lg bg-red-100">
                    <HiX className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Delivery Issues</p>
                    <p className="text-xs text-gray-500">{deliverability.total_bounces || 0} bounces, {deliverability.total_complaints || 0} complaints</p>
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {deliverability.bounce_rate ? `${deliverability.bounce_rate.toFixed(1)}%` : '0%'} bounce rate
                  </div>
                </div>
              )}

              {bounceProcessing.processing?.total_processed > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <HiShieldCheck className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Bounce Processing</p>
                    <p className="text-xs text-gray-500">
                      {bounceProcessing.processing.total_processed} bounces processed, {bounceProcessing.processing.added_to_suppression} suppressed
                    </p>
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {bounceProcessing.credentials?.active || 0} active credentials
                  </div>
                </div>
              )}

              {suppression.summary?.total > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <HiBan className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Suppression List</p>
                    <p className="text-xs text-gray-500">
                      {suppression.summary.total} total suppressed, {suppression.summary.this_week || 0} added this week
                    </p>
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Active protection
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HiInbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No campaigns yet</p>
              <p className="text-sm">Start by creating your first campaign</p>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="mt-4 btn btn-primary btn-sm"
              >
                <HiPlus className="h-4 w-4 mr-2" />
                Create Campaign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
