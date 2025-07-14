import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiChartBar,
  HiTrendingUp,
  HiTrendingDown,
  HiUsers,
  HiMail,
  HiCursorClick,
  HiEye,
  HiStar,
  HiClock,
  HiCalendar,
  HiDownload,
  HiRefresh,
  HiFilter,
  HiCog,
  HiLightningBolt,
  HiGlobe,
  HiDeviceMobile,
  HiDesktopComputer,
} from 'react-icons/hi';

const AdvancedAnalytics = () => {
  const dispatch = useDispatch();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Mock data - replace with actual API calls
  const analyticsData = {
    overview: {
      total_campaigns: 45,
      total_emails_sent: 125000,
      total_opens: 31250,
      total_clicks: 6250,
      total_conversions: 1250,
      total_revenue: 125000,
      avg_open_rate: 25.0,
      avg_click_rate: 5.0,
      avg_conversion_rate: 1.0,
    },
    trends: {
      daily: [
        { date: '2024-01-15', sent: 5000, opens: 1250, clicks: 250, conversions: 50 },
        { date: '2024-01-16', sent: 5200, opens: 1300, clicks: 260, conversions: 52 },
        { date: '2024-01-17', sent: 4800, opens: 1200, clicks: 240, conversions: 48 },
        { date: '2024-01-18', sent: 5500, opens: 1375, clicks: 275, conversions: 55 },
        { date: '2024-01-19', sent: 5300, opens: 1325, clicks: 265, conversions: 53 },
        { date: '2024-01-20', sent: 5100, opens: 1275, clicks: 255, conversions: 51 },
        { date: '2024-01-21', sent: 5400, opens: 1350, clicks: 270, conversions: 54 },
      ],
      weekly: [
        { week: 'Week 1', sent: 35000, opens: 8750, clicks: 1750, conversions: 350 },
        { week: 'Week 2', sent: 38000, opens: 9500, clicks: 1900, conversions: 380 },
        { week: 'Week 3', sent: 42000, opens: 10500, clicks: 2100, conversions: 420 },
        { week: 'Week 4', sent: 10000, opens: 2500, clicks: 500, conversions: 100 },
      ],
    },
    demographics: {
      age_groups: [
        { age: '18-24', percentage: 15, opens: 4687, clicks: 937 },
        { age: '25-34', percentage: 30, opens: 9375, clicks: 1875 },
        { age: '35-44', percentage: 25, opens: 7812, clicks: 1562 },
        { age: '45-54', percentage: 20, opens: 6250, clicks: 1250 },
        { age: '55+', percentage: 10, opens: 3125, clicks: 625 },
      ],
      devices: [
        { device: 'Desktop', percentage: 45, opens: 14062, clicks: 2812 },
        { device: 'Mobile', percentage: 40, opens: 12500, clicks: 2500 },
        { device: 'Tablet', percentage: 15, opens: 4687, clicks: 937 },
      ],
      locations: [
        { country: 'United States', percentage: 60, opens: 18750, clicks: 3750 },
        { country: 'Canada', percentage: 15, opens: 4687, clicks: 937 },
        { country: 'United Kingdom', percentage: 10, opens: 3125, clicks: 625 },
        { country: 'Australia', percentage: 8, opens: 2500, clicks: 500 },
        { country: 'Other', percentage: 7, opens: 2187, clicks: 437 },
      ],
    },
    predictions: {
      next_week: {
        sent: 55000,
        opens: 13750,
        clicks: 2750,
        conversions: 550,
        revenue: 137500,
      },
      next_month: {
        sent: 220000,
        opens: 55000,
        clicks: 11000,
        conversions: 2200,
        revenue: 550000,
      },
      trends: {
        open_rate_trend: 'up',
        click_rate_trend: 'stable',
        conversion_rate_trend: 'up',
        revenue_trend: 'up',
      },
    },
    top_campaigns: [
      {
        id: 1,
        name: 'Welcome Series',
        sent: 15000,
        opens: 4500,
        clicks: 900,
        conversions: 180,
        revenue: 18000,
        open_rate: 30.0,
        click_rate: 6.0,
        conversion_rate: 1.2,
      },
      {
        id: 2,
        name: 'Product Launch',
        sent: 12000,
        opens: 3000,
        clicks: 600,
        conversions: 120,
        revenue: 12000,
        open_rate: 25.0,
        click_rate: 5.0,
        conversion_rate: 1.0,
      },
      {
        id: 3,
        name: 'Newsletter',
        sent: 10000,
        opens: 2000,
        clicks: 400,
        conversions: 80,
        revenue: 8000,
        open_rate: 20.0,
        click_rate: 4.0,
        conversion_rate: 0.8,
      },
    ],
  };

  const handleExportData = async (format = 'csv') => {
    setIsLoading(true);
    try {
      // Implement export analytics data API call
      console.log('Exporting analytics data:', format);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // Implement refresh analytics data API call
      console.log('Refreshing analytics data');
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <HiTrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <HiTrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <HiTrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics and insights for your email campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="btn btn-secondary flex items-center"
            >
              <HiRefresh className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleExportData()}
              disabled={isLoading}
              className="btn btn-primary flex items-center"
            >
              <HiDownload className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <HiMail className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.total_emails_sent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                <HiEye className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Opens</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.total_opens)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-info-100 rounded-lg flex items-center justify-center">
                <HiCursorClick className="h-5 w-5 text-info-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.total_clicks)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <HiStar className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.total_revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Open Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{analyticsData.overview.avg_open_rate}%</span>
                {getTrendIcon('up')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Click Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{analyticsData.overview.avg_click_rate}%</span>
                {getTrendIcon('up')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{analyticsData.overview.avg_conversion_rate}%</span>
                {getTrendIcon('up')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue per Email</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {formatCurrency(analyticsData.overview.total_revenue / analyticsData.overview.total_emails_sent)}
                </span>
                {getTrendIcon('up')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Predictive Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Week Revenue</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{formatCurrency(analyticsData.predictions.next_week.revenue)}</span>
                {getTrendIcon(analyticsData.predictions.trends.revenue_trend)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Month Revenue</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{formatCurrency(analyticsData.predictions.next_month.revenue)}</span>
                {getTrendIcon(analyticsData.predictions.trends.revenue_trend)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Predicted Open Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">26.5%</span>
                {getTrendIcon(analyticsData.predictions.trends.open_rate_trend)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Predicted Click Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">5.2%</span>
                {getTrendIcon(analyticsData.predictions.trends.click_rate_trend)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Age Groups</h3>
          <div className="space-y-3">
            {analyticsData.demographics.age_groups.map((group) => (
              <div key={group.age} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{group.age}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{group.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Devices</h3>
          <div className="space-y-3">
            {analyticsData.demographics.devices.map((device) => (
              <div key={device.device} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {device.device === 'Mobile' ? (
                    <HiDeviceMobile className="h-4 w-4 text-gray-400" />
                  ) : device.device === 'Desktop' ? (
                    <HiDesktopComputer className="h-4 w-4 text-gray-400" />
                  ) : (
                    <HiDeviceMobile className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">{device.device}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-info-600 h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{device.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Locations</h3>
          <div className="space-y-3">
            {analyticsData.demographics.locations.map((location) => (
              <div key={location.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HiGlobe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{location.country}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-success-600 h-2 rounded-full"
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{location.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Click Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.top_campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(campaign.sent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(campaign.opens)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(campaign.clicks)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(campaign.conversions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(campaign.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.open_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.click_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Real-time Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">2,450</div>
            <div className="text-sm text-gray-500">Emails sent today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">612</div>
            <div className="text-sm text-gray-500">Opens in last hour</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">123</div>
            <div className="text-sm text-gray-500">Clicks in last hour</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">25</div>
            <div className="text-sm text-gray-500">Conversions today</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 