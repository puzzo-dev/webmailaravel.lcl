import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiArrowLeft,
  HiPlay,
  HiPause,
  HiStop,
  HiPencil,
  HiTrash,
  HiEye,
  HiCursorClick,
  HiMail,
  HiDownload,
  HiCalendar,
  HiClock,
  HiUserGroup,
} from 'react-icons/hi';
import { fetchCampaign, fetchCampaignStats, fetchCampaignTracking, deleteCampaign, startCampaign, pauseCampaign, stopCampaign } from '../../store/slices/campaignSlice';
import toast from 'react-hot-toast';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentCampaign, campaignStats, campaignTracking, isLoading } = useSelector((state) => state.campaigns);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      dispatch(fetchCampaign(id));
      dispatch(fetchCampaignStats(id));
      dispatch(fetchCampaignTracking(id));
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await dispatch(deleteCampaign(id)).unwrap();
        toast.success('Campaign deleted successfully');
        navigate('/campaigns');
      } catch (error) {
        toast.error('Failed to delete campaign');
      }
    }
  };

  const handleAction = async (action) => {
    try {
      switch (action) {
        case 'start':
          await dispatch(startCampaign(id)).unwrap();
          toast.success('Campaign started successfully');
          break;
        case 'pause':
          await dispatch(pauseCampaign(id)).unwrap();
          toast.success('Campaign paused successfully');
          break;
        case 'stop':
          await dispatch(stopCampaign(id)).unwrap();
          toast.success('Campaign stopped successfully');
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Failed to ${action} campaign`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'scheduled': { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      'active': { color: 'bg-success-100 text-success-800', label: 'Active' },
      'paused': { color: 'bg-warning-100 text-warning-800', label: 'Paused' },
      'stopped': { color: 'bg-danger-100 text-danger-800', label: 'Stopped' },
      'completed': { color: 'bg-primary-100 text-primary-800', label: 'Completed' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!currentCampaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h1>
          <button
            onClick={() => navigate('/campaigns')}
            className="btn btn-primary"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/campaigns')}
              className="text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentCampaign.name}</h1>
              <p className="text-gray-600">{currentCampaign.subject}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentCampaign.status === 'draft' && (
              <button
                onClick={() => handleAction('start')}
                className="btn btn-success flex items-center"
              >
                <HiPlay className="h-5 w-5 mr-2" />
                Start
              </button>
            )}
            
            {currentCampaign.status === 'active' && (
              <button
                onClick={() => handleAction('pause')}
                className="btn btn-warning flex items-center"
              >
                <HiPause className="h-5 w-5 mr-2" />
                Pause
              </button>
            )}
            
            {(currentCampaign.status === 'active' || currentCampaign.status === 'paused') && (
              <button
                onClick={() => handleAction('stop')}
                className="btn btn-danger flex items-center"
              >
                <HiStop className="h-5 w-5 mr-2" />
                Stop
              </button>
            )}
            
            <button
              onClick={() => navigate(`/campaigns/${id}/edit`)}
              className="btn btn-secondary flex items-center"
            >
              <HiPencil className="h-5 w-5 mr-2" />
              Edit
            </button>
            
            <button
              onClick={handleDelete}
              className="btn btn-danger flex items-center"
            >
              <HiTrash className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Status</span>
              <div className="mt-1">{getStatusBadge(currentCampaign.status)}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created</span>
              <div className="mt-1 text-sm text-gray-900">{formatDate(currentCampaign.created_at)}</div>
            </div>
            {currentCampaign.scheduled_at && (
              <div>
                <span className="text-sm font-medium text-gray-500">Scheduled</span>
                <div className="mt-1 text-sm text-gray-900">{formatDate(currentCampaign.scheduled_at)}</div>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Recipients</span>
              <div className="mt-1 text-sm text-gray-900">{currentCampaign.total_recipients || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Sent</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.emails_sent || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Delivered</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.delivered || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Bounced</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.bounced || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Failed</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.failed || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Opens</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.opens || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Open Rate</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.open_rate || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Clicks</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.clicks || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Click Rate</span>
              <span className="text-sm font-medium text-gray-900">{currentCampaign.click_rate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['overview', 'content', 'recipients', 'tracking', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subject Line</h4>
                    <p className="text-gray-600">{currentCampaign.subject}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">From Name</h4>
                    <p className="text-gray-600">{currentCampaign.from_name || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">From Email</h4>
                    <p className="text-gray-600">{currentCampaign.from_email || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Reply To</h4>
                    <p className="text-gray-600">{currentCampaign.reply_to || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCampaign.enable_tracking}
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Enable Tracking</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCampaign.enable_open_tracking}
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Open Tracking</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCampaign.enable_click_tracking}
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Click Tracking</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCampaign.enable_unsubscribe}
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">Unsubscribe Link</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Content</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: currentCampaign.email_content || 'No content available' }} />
              </div>
            </div>
          )}

          {activeTab === 'recipients' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recipient Information</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Recipients</span>
                  <div className="mt-1 text-lg font-medium text-gray-900">{currentCampaign.total_recipients || 0}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">File Uploaded</span>
                  <div className="mt-1 text-sm text-gray-900">{currentCampaign.recipient_file || 'No file uploaded'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Data</h3>
              {campaignTracking ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiEye className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Opens</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-blue-900">{campaignTracking.opens || 0}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiCursorClick className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-900">Clicks</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-green-900">{campaignTracking.clicks || 0}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiMail className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-900">Bounces</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-red-900">{campaignTracking.bounces || 0}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No tracking data available</p>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
              {campaignStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Performance Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Delivery Rate</span>
                          <span className="text-sm font-medium text-gray-900">{campaignStats.delivery_rate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Open Rate</span>
                          <span className="text-sm font-medium text-gray-900">{campaignStats.open_rate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Click Rate</span>
                          <span className="text-sm font-medium text-gray-900">{campaignStats.click_rate || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Geographic Data</h4>
                      <p className="text-sm text-gray-600">Geographic analytics coming soon...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No analytics data available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail; 