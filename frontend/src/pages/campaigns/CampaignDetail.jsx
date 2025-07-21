import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { analyticsService } from '../../services/api';
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
  HiDuplicate,
} from 'react-icons/hi';
import { fetchCampaign, fetchCampaignStats, fetchCampaignTracking, deleteCampaign, startCampaign, pauseCampaign, stopCampaign, resumeCampaign, duplicateCampaign } from '../../store/slices/campaignSlice';
import toast from 'react-hot-toast';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentCampaign, campaignStats, campaignTracking, isLoading } = useSelector((state) => state.campaigns);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [senderPerformance, setSenderPerformance] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCampaign(id));
      dispatch(fetchCampaignStats(id));
      dispatch(fetchCampaignTracking(id));
    }
  }, [dispatch, id]);

  // Auto-refresh for running campaigns
  useEffect(() => {
    let intervalId;
    
    if (currentCampaign && (
      currentCampaign.status?.toLowerCase() === 'running' || 
      currentCampaign.status?.toLowerCase() === 'active'
    )) {
      // Refresh every 30 seconds for running campaigns
      intervalId = setInterval(() => {
        dispatch(fetchCampaign(id));
        dispatch(fetchCampaignStats(id));
        dispatch(fetchCampaignTracking(id));
      }, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentCampaign?.status, dispatch, id]);

  // Load sender analytics when analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics' && id && currentCampaign) {
      loadSenderAnalytics();
    }
  }, [activeTab, id, currentCampaign]);

  const loadSenderAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const performance = await analyticsService.getCampaignSenderPerformance(id);
      setSenderPerformance(performance.data || []);
    } catch (error) {
      console.error('Failed to load sender analytics:', error);
      setSenderPerformance([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

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

  const handleDuplicate = async () => {
    if (window.confirm('This will create a copy of this campaign with all its settings and contacts. Continue?')) {
      setActionLoading(true);
      try {
        const result = await dispatch(duplicateCampaign(id)).unwrap();
        toast.success('Campaign duplicated successfully');
        // Navigate to the duplicated campaign
        const duplicatedCampaignId = result.data?.id || result.id;
        navigate(`/campaigns/${duplicatedCampaignId}`);
      } catch (error) {
        toast.error('Failed to duplicate campaign');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
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
        case 'resume':
          await dispatch(resumeCampaign(id)).unwrap();
          toast.success('Campaign resumed successfully');
          break;
        case 'stop':
          await dispatch(stopCampaign(id)).unwrap();
          toast.success('Campaign stopped successfully');
          break;
        default:
          break;
      }
      // Refresh campaign data after action
      await Promise.all([
        dispatch(fetchCampaign(id)),
        dispatch(fetchCampaignStats(id)),
        dispatch(fetchCampaignTracking(id))
      ]);
    } catch (error) {
      toast.error(`Failed to ${action} campaign`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'scheduled': { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      'running': { color: 'bg-green-100 text-green-800', label: 'Running' },
      'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'paused': { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
      'stopped': { color: 'bg-red-100 text-red-800', label: 'Stopped' },
      'completed': { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' },
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
            {(currentCampaign.status?.toLowerCase() === 'draft') && (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="btn btn-success flex items-center disabled:opacity-50"
              >
                <HiPlay className="h-5 w-5 mr-2" />
                {actionLoading ? 'Starting...' : 'Start'}
              </button>
            )}
            
            {(currentCampaign.status?.toLowerCase() === 'running' || currentCampaign.status?.toLowerCase() === 'active') && (
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading}
                className="btn btn-warning flex items-center disabled:opacity-50"
              >
                <HiPause className="h-5 w-5 mr-2" />
                {actionLoading ? 'Pausing...' : 'Pause'}
              </button>
            )}
            
            {currentCampaign.status?.toLowerCase() === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading}
                className="btn btn-success flex items-center disabled:opacity-50"
              >
                <HiPlay className="h-5 w-5 mr-2" />
                {actionLoading ? 'Resuming...' : 'Resume'}
              </button>
            )}
            
            {(currentCampaign.status?.toLowerCase() === 'running' || 
              currentCampaign.status?.toLowerCase() === 'active' || 
              currentCampaign.status?.toLowerCase() === 'paused') && (
              <button
                onClick={() => handleAction('stop')}
                disabled={actionLoading}
                className="btn btn-danger flex items-center disabled:opacity-50"
              >
                <HiStop className="h-5 w-5 mr-2" />
                {actionLoading ? 'Stopping...' : 'Stop'}
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
              onClick={handleDuplicate}
              disabled={actionLoading}
              className="btn btn-secondary flex items-center disabled:opacity-50"
            >
              <HiDuplicate className="h-5 w-5 mr-2" />
              {actionLoading ? 'Duplicating...' : 'Duplicate'}
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
              <span className="text-sm font-medium text-gray-900">{currentCampaign.bounces || 0}</span>
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
            {['overview', 'content', 'senders', 'recipients', 'tracking', 'analytics'].map((tab) => (
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
                    {currentCampaign.senders && currentCampaign.senders.length > 1 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Sender shuffling: {currentCampaign.senders.length} senders rotating
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">From Email</h4>
                    <p className="text-gray-600">{currentCampaign.from_email || 'Not set'}</p>
                    {currentCampaign.senders && currentCampaign.senders.length > 1 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500">All sender emails:</p>
                        <div className="text-xs text-gray-600">
                          {currentCampaign.senders.map((sender, idx) => (
                            <div key={idx}>{sender.email}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Reply To</h4>
                    <p className="text-gray-600">{currentCampaign.reply_to || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCampaign.senders && currentCampaign.senders.length > 1}
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Sender Shuffling {currentCampaign.senders && currentCampaign.senders.length > 1 ? `(${currentCampaign.senders.length} senders)` : ''}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCampaign.enable_content_switching}
                      disabled
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Content Switching {currentCampaign.contents && currentCampaign.contents.length > 1 ? `(${currentCampaign.contents.length} variations)` : ''}
                    </span>
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
                      checked={currentCampaign.enable_unsubscribe_link}
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
              
              {currentCampaign.enable_content_switching && currentCampaign.contents && currentCampaign.contents.length > 1 ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Content Switching Enabled:</strong> This campaign uses {currentCampaign.contents.length} content variations for A/B testing
                    </p>
                  </div>
                  
                  {currentCampaign.contents.map((content, index) => (
                    <div key={content.id || index} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">
                          {content.name || `Variation ${index + 1}`}
                        </h4>
                        {content.subject && (
                          <p className="text-sm text-gray-600">Subject: {content.subject}</p>
                        )}
                      </div>
                      <div className="p-4">
                        <div dangerouslySetInnerHTML={{ 
                          __html: content.html_body || content.body || content.content || 'No content available' 
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentCampaign.contents && currentCampaign.contents.length === 1 ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {currentCampaign.contents[0].name || 'Campaign Content'}
                    </h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: currentCampaign.contents[0].html_body || 
                               currentCampaign.contents[0].body || 
                               currentCampaign.email_content || 
                               'No content available' 
                    }} />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div dangerouslySetInnerHTML={{ __html: currentCampaign.email_content || 'No content available' }} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'senders' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sender Configuration</h3>
              
              {currentCampaign.senders && currentCampaign.senders.length > 0 ? (
                <div className="space-y-4">
                  {currentCampaign.senders.length > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Sender Shuffling Active:</strong> Campaign is rotating between {currentCampaign.senders.length} senders to improve deliverability
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentCampaign.senders.map((sender, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Sender {index + 1}</h4>
                          {currentCampaign.senders.length > 1 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Active in rotation
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Name:</span>
                            <span className="ml-2 text-gray-900">{sender.name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Email:</span>
                            <span className="ml-2 text-gray-900">{sender.email}</span>
                          </div>
                          {sender.reply_to && (
                            <div>
                              <span className="font-medium text-gray-500">Reply To:</span>
                              <span className="ml-2 text-gray-900">{sender.reply_to}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No senders configured for this campaign</p>
              )}
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
              {campaignTracking || currentCampaign ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiEye className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Opens</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-blue-900">
                        {campaignTracking?.opens || currentCampaign?.opens || 0}
                      </div>
                      {currentCampaign?.open_rate && (
                        <div className="text-xs text-blue-700 mt-1">
                          Rate: {currentCampaign.open_rate}%
                        </div>
                      )}
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiCursorClick className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-900">Clicks</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-green-900">
                        {campaignTracking?.clicks || currentCampaign?.clicks || 0}
                      </div>
                      {currentCampaign?.click_rate && (
                        <div className="text-xs text-green-700 mt-1">
                          Rate: {currentCampaign.click_rate}%
                        </div>
                      )}
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiMail className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-900">Bounces</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-red-900">
                        {campaignTracking?.bounces || currentCampaign?.bounces || 0}
                      </div>
                      {currentCampaign?.bounce_rate && (
                        <div className="text-xs text-red-700 mt-1">
                          Rate: {currentCampaign.bounce_rate}%
                        </div>
                      )}
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <HiMail className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-900">Sent</span>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-yellow-900">
                        {campaignTracking?.total_sent || currentCampaign?.emails_sent || currentCampaign?.total_sent || 0}
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">
                        of {currentCampaign?.total_recipients || 0} recipients
                      </div>
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
              {campaignStats || currentCampaign ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Performance Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Delivery Rate</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaignStats?.delivery_rate || 
                             (currentCampaign?.total_recipients > 0 ? 
                              ((currentCampaign.emails_sent - currentCampaign.bounces - currentCampaign.failed) / currentCampaign.total_recipients * 100).toFixed(2) : 0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Open Rate</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaignStats?.open_rate || currentCampaign?.open_rate || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Click Rate</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaignStats?.click_rate || currentCampaign?.click_rate || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Bounce Rate</span>
                          <span className="text-sm font-medium text-gray-900">
                            {campaignStats?.bounce_rate || currentCampaign?.bounce_rate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Recipients</span>
                          <span className="text-sm font-medium text-gray-900">{currentCampaign?.total_recipients || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Emails Sent</span>
                          <span className="text-sm font-medium text-gray-900">{currentCampaign?.emails_sent || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Opens</span>
                          <span className="text-sm font-medium text-gray-900">{currentCampaign?.opens || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Clicks</span>
                          <span className="text-sm font-medium text-gray-900">{currentCampaign?.clicks || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {currentCampaign?.enable_content_switching && currentCampaign?.contents?.length > 1 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">A/B Testing Results</h4>
                      <p className="text-sm text-gray-600">
                        This campaign uses {currentCampaign.contents.length} content variations. 
                        Detailed A/B testing analytics will be available after sufficient data collection.
                      </p>
                    </div>
                  )}
                  
                  {currentCampaign?.senders?.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Sender Performance</h4>
                        {loadingAnalytics && (
                          <div className="text-sm text-gray-500">Loading...</div>
                        )}
                      </div>
                      
                      {senderPerformance.length > 0 ? (
                        <div className="space-y-3">
                          {senderPerformance.map((sender) => (
                            <div key={sender.sender_id} className="border border-gray-100 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900">{sender.sender_name}</h5>
                                  <p className="text-xs text-gray-500">{sender.sender_email}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    Score: {sender.reputation_score}/100
                                  </div>
                                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                    sender.deliverability_rating === 'Excellent' ? 'bg-green-100 text-green-800' :
                                    sender.deliverability_rating === 'Good' ? 'bg-blue-100 text-blue-800' :
                                    sender.deliverability_rating === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {sender.deliverability_rating}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Sent:</span>
                                  <span className="ml-1 font-medium">{sender.sent.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Opens:</span>
                                  <span className="ml-1 font-medium">{sender.open_rate}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Clicks:</span>
                                  <span className="ml-1 font-medium">{sender.click_rate}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Bounces:</span>
                                  <span className="ml-1 font-medium">{sender.bounce_rate}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          {loadingAnalytics ? 
                            'Loading sender performance data...' : 
                            'No sender performance data available yet. Data will appear after emails are sent.'
                          }
                        </p>
                      )}
                    </div>
                  )}
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