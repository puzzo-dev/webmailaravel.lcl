import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiChartBar,
  HiMail,
  HiCursorClick,
  HiEye,
  HiExclamation,
} from 'react-icons/hi';
import { formatDate, formatNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { fetchAnalytics } from '../../store/slices/analyticsSlice';
import MetricCard from '../../components/shared/MetricCard';
import PageSubscriptionOverlay from '../../components/common/PageSubscriptionOverlay';

const Analytics = () => {
  const dispatch = useDispatch();
  const { analytics, isLoading } = useSelector((state) => state.analytics);
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    // Fetch analytics data from backend
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoadingData(true);
    try {
      await dispatch(fetchAnalytics({ timeRange })).unwrap();
    } catch (_error) {
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner h-8 w-8"></div>
            <span className="ml-2 text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSubscriptionOverlay 
        feature="advanced analytics"
        customMessage="Upgrade to Pro to unlock detailed analytics, campaign performance insights, and advanced reporting features."
      />
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
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              disabled={isLoadingData}
              className="btn btn-secondary flex items-center"
            >
              <HiChartBar className="h-5 w-5 mr-2" />
              {isLoadingData ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Emails Sent"
            value={analytics.total_sent || 0}
            previous={analytics.previous_total_sent}
            icon={<HiMail className="h-6 w-6 text-blue-600" />}
            color="blue"
          />
          <MetricCard
            title="Open Rate"
            value={analytics.open_rate || 0}
            previous={analytics.previous_open_rate}
            icon={<HiEye className="h-6 w-6 text-green-600" />}
            color="green"
            formatValue={(val) => `${val.toFixed(1)}%`}
          />
          <MetricCard
            title="Click Rate"
            value={analytics.click_rate || 0}
            previous={analytics.previous_click_rate}
            icon={<HiCursorClick className="h-6 w-6 text-purple-600" />}
            color="purple"
            formatValue={(val) => `${val.toFixed(1)}%`}
          />
          <MetricCard
            title="Bounce Rate"
            value={analytics.bounce_rate || 0}
            previous={analytics.previous_bounce_rate}
            icon={<HiExclamation className="h-6 w-6 text-red-600" />}
            color="red"
            formatValue={(val) => `${val.toFixed(1)}%`}
          />
        </div>
      )}

      {/* Campaign Performance */}
      {analytics?.campaigns && analytics.campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performing Campaigns</h2>
          <div className="space-y-4">
            {analytics.campaigns.slice(0, 5).map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-medium">{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">
                      Sent: {formatDate(campaign.sent_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Sent</div>
                    <div className="font-medium">{formatNumber(campaign.total_sent)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Opens</div>
                    <div className="font-medium">{formatNumber(campaign.opens)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Clicks</div>
                    <div className="font-medium">{formatNumber(campaign.clicks)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Rate</div>
                    <div className="font-medium">{(campaign.open_rate || 0).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Analytics Sections */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Performance */}
          {analytics.geographic_data && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Geographic Performance</h2>
              <div className="space-y-3">
                {analytics.geographic_data.slice(0, 5).map((region) => (
                  <div key={region.country} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{region.country}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">{formatNumber(region.sent)}</span>
                      <span className="text-sm text-gray-500">{(region.open_rate || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device Performance */}
          {analytics.device_data && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Device Performance</h2>
              <div className="space-y-3">
                {analytics.device_data.slice(0, 5).map((device) => (
                  <div key={device.type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{device.type}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">{formatNumber(device.sent)}</span>
                      <span className="text-sm text-gray-500">{(device.open_rate || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default Analytics; 