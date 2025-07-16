import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  HiCog,
  HiBell,
  HiRefresh,
  HiEye,
  HiCursorClick,
} from 'react-icons/hi';
import '../styles/animations.css';

const SmartDashboard = () => {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // Mock data - replace with actual Redux state
  const campaigns = useSelector(state => state.campaigns?.campaigns || []);
  const senders = useSelector(state => state.senders?.senders || []);
  const domains = useSelector(state => state.domains?.domains || []);

  // Chart colors
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // Sample chart data - this would come from analytics API
  const performanceData = [
    { name: 'Jan', sent: 4000, delivered: 3800, opened: 1200, clicked: 240 },
    { name: 'Feb', sent: 3000, delivered: 2900, opened: 900, clicked: 180 },
    { name: 'Mar', sent: 2000, delivered: 1950, opened: 650, clicked: 130 },
    { name: 'Apr', sent: 2780, delivered: 2700, opened: 810, clicked: 162 },
    { name: 'May', sent: 1890, delivered: 1850, opened: 555, clicked: 111 },
    { name: 'Jun', sent: 2390, delivered: 2300, opened: 690, clicked: 138 },
  ];

  const campaignTypeData = [
    { name: 'Newsletter', value: 45, color: '#8884d8' },
    { name: 'Promotional', value: 30, color: '#82ca9d' },
    { name: 'Transactional', value: 15, color: '#ffc658' },
    { name: 'Welcome Series', value: 10, color: '#ff7c7c' },
  ];

  const deviceData = [
    { name: 'Desktop', value: 60 },
    { name: 'Mobile', value: 35 },
    { name: 'Tablet', value: 5 },
  ];

  useEffect(() => {
    // Generate contextual suggestions based on system state
    const newSuggestions = [];
    
    if (campaigns.length === 0) {
      newSuggestions.push({
        type: 'create_campaign',
        title: 'Create Your First Campaign',
        description: 'Start sending emails to your audience',
        action: () => navigate('/campaigns/new'),
        priority: 'high',
        icon: HiPlus,
      });
    }
    
    if (senders.length === 0) {
      newSuggestions.push({
        type: 'add_sender',
        title: 'Add a Sender Account',
        description: 'Configure your first sender to start sending emails',
        action: () => navigate('/senders'),
        priority: 'high',
        icon: HiUser,
      });
    }
    
    if (domains.length === 0) {
      newSuggestions.push({
        type: 'add_domain',
        title: 'Configure a Domain',
        description: 'Set up your sending domain for better deliverability',
        action: () => navigate('/domains'),
        priority: 'medium',
        icon: HiGlobe,
      });
    }
    
    // Check for campaigns that need attention
    const campaignsNeedingAttention = campaigns.filter(c => 
      c.status === 'draft' || c.status === 'paused' || c.status === 'failed'
    );
    
    if (campaignsNeedingAttention.length > 0) {
      newSuggestions.push({
        type: 'review_campaigns',
        title: `${campaignsNeedingAttention.length} Campaign${campaignsNeedingAttention.length > 1 ? 's' : ''} Need Attention`,
        description: 'Review and fix issues with your campaigns',
        action: () => navigate('/campaigns'),
        priority: 'medium',
        icon: HiExclamation,
      });
    }
    
    // Performance suggestions
    const lowPerformingCampaigns = campaigns.filter(c => 
      c.open_rate < 15 || c.click_rate < 2
    );
    
    if (lowPerformingCampaigns.length > 0) {
      newSuggestions.push({
        type: 'optimize_campaigns',
        title: 'Optimize Campaign Performance',
        description: `${lowPerformingCampaigns.length} campaign${lowPerformingCampaigns.length > 1 ? 's' : ''} with low engagement`,
        action: () => navigate('/analytics'),
        priority: 'low',
        icon: HiTrendingDown,
      });
    }
    
    setSuggestions(newSuggestions);
  }, [campaigns, senders, domains, navigate]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <HiExclamation className="h-5 w-5 text-red-500" />;
      case 'medium': return <HiClock className="h-5 w-5 text-yellow-500" />;
      case 'low': return <HiTrendingUp className="h-5 w-5 text-blue-500" />;
      default: return <HiBell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-blue-100 mt-1">
              Ready to send some amazing emails today?
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{campaigns.length}</div>
            <div className="text-blue-100 text-sm">Active Campaigns</div>
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Smart Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start">
                  {getPriorityIcon(suggestion.priority)}
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    <button
                      onClick={suggestion.action}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Take Action →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 hover-lift animate-fadeInUp">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-bounceIn">
                <HiInbox className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 animate-scaleIn">{campaigns.length}</p>
              <div className="flex items-center mt-1">
                <HiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">+12% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <HiUser className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Senders</p>
              <p className="text-2xl font-bold text-gray-900">{senders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiGlobe className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Configured Domains</p>
              <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <HiChartBar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">24.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Performance Trends</h3>
              <p className="text-sm text-gray-500">Monthly email metrics overview</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg animate-float">
              <HiChartBar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
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
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorSent)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="opened" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorOpened)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Types Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaign Types</h3>
              <p className="text-sm text-gray-500">Distribution of campaign categories</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg animate-float" style={{ animationDelay: '0.5s' }}>
              <HiMail className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campaignTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {campaignTypeData.map((entry, index) => (
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
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Engagement Rates</h3>
            <p className="text-sm text-gray-500">Open and click rates over time</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg animate-float" style={{ animationDelay: '1s' }}>
              <HiEye className="h-5 w-5 text-purple-600" />
            </div>
            <div className="p-2 bg-orange-100 rounded-lg animate-float" style={{ animationDelay: '1.2s' }}>
              <HiCursorClick className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
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
              formatter={(value, name) => [
                name === 'opened' ? `${((value / performanceData.find(d => d.opened === value)?.sent || 1) * 100).toFixed(1)}%` :
                name === 'clicked' ? `${((value / performanceData.find(d => d.clicked === value)?.opened || 1) * 100).toFixed(1)}%` :
                value,
                name === 'opened' ? 'Open Rate' : 'Click Rate'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="opened" 
              stroke="#8884d8" 
              strokeWidth={3}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#8884d8', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="clicked" 
              stroke="#82ca9d" 
              strokeWidth={3}
              dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#82ca9d', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <activity.icon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HiInbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No recent activity</p>
              <p className="text-sm">Start by creating your first campaign</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartDashboard; 