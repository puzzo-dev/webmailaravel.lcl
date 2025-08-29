import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { analyticsService, queueService } from '../../services/api';
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
  HiX,
  HiDocumentText,
  HiPhotograph,
  HiArchive
} from 'react-icons/hi';
import { fetchCampaign, fetchCampaignStats, fetchCampaignTracking, deleteCampaign, startCampaign, pauseCampaign, stopCampaign, resumeCampaign, duplicateCampaign } from '../../store/slices/campaignSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorHandler';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentCampaign, campaignStats, campaignTracking, isLoading } = useSelector((state) => state.campaigns);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [senderPerformance, setSenderPerformance] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [failedJobs, setFailedJobs] = useState([]);
  const [loadingFailedJobs, setLoadingFailedJobs] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      loadFailedJobs();
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

  const loadFailedJobs = async () => {
    try {
      setLoadingFailedJobs(true);
      const response = await queueService.getCampaignFailedJobs(id, { limit: 10 });
      setFailedJobs(response.data || []);
    } catch (error) {
      console.error('Failed to load failed jobs:', error);
      setFailedJobs([]);
    } finally {
      setLoadingFailedJobs(false);
    }
  };

  const handleRetryFailedJob = async (jobId) => {
    try {
      await queueService.retryFailedJob(jobId);
      toast.success('Job retried successfully');
      loadFailedJobs(); // Refresh the list
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await dispatch(deleteCampaign(id)).unwrap();
        toast.success('Campaign deleted successfully');
        navigate('/campaigns');
      } catch (error) {
        toast.error(getErrorMessage(error));
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
        toast.error(getErrorMessage(error));
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
      toast.error(getErrorMessage(error));
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
      'processing': { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      'sending': { color: 'bg-green-100 text-green-800', label: 'Sending' },
      'pending': { color: 'bg-indigo-100 text-indigo-800', label: 'Pending' },
      'queued': { color: 'bg-indigo-100 text-indigo-800', label: 'Queued' },
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

  // Helper function to get icon based on file type
  const getFileIcon = (mimeType, fileName) => {
    const ext = fileName?.toLowerCase().split('.').pop() || '';

    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
      return HiPhotograph;
    }

    if (mimeType?.includes('pdf') || ext === 'pdf') {
      return HiDocumentText;
    }

    if (['doc', 'docx'].includes(ext) || mimeType?.includes('wordprocessingml')) {
      return HiDocumentText;
    }

    if (['xls', 'xlsx'].includes(ext) || mimeType?.includes('spreadsheetml')) {
      return HiDocumentText;
    }

    if (['ppt', 'pptx'].includes(ext) || mimeType?.includes('presentationml')) {
      return HiDocumentText;
    }

    if (mimeType?.includes('zip') || mimeType?.includes('archive') || ['zip', 'rar', '7z'].includes(ext)) {
      return HiArchive;
    }

    return HiDocumentText;
  };

  // Preview attachment function
  const handlePreviewAttachment = async (attachment, index) => {
    const mimeType = attachment.mime_type || attachment.mime;
    const fileName = attachment.original_name || attachment.name;

    // Enhanced file type detection
    const getFileCategory = (mimeType, fileName) => {
      const ext = fileName.toLowerCase().split('.').pop();

      if (mimeType?.startsWith('image/')) return 'image';
      if (mimeType?.includes('pdf')) return 'pdf';
      if (mimeType?.includes('text/') || ['txt', 'log', 'md'].includes(ext)) return 'text';
      if (['doc', 'docx'].includes(ext) || mimeType?.includes('wordprocessingml')) return 'word';
      if (['xls', 'xlsx'].includes(ext) || mimeType?.includes('spreadsheetml')) return 'excel';
      if (['ppt', 'pptx'].includes(ext) || mimeType?.includes('presentationml')) return 'powerpoint';

      return 'unsupported';
    };

    const fileCategory = getFileCategory(mimeType, fileName);

    setPreviewLoading(true);

    try {
      const token = localStorage.getItem('token');
      const previewUrl = `/api/campaigns/${currentCampaign.id}/attachments/${index}/download`;

      let previewData = {
        name: fileName,
        type: mimeType,
        size: attachment.size,
        category: fileCategory
      };

      if (fileCategory === 'unsupported') {
        toast.error(`Preview not supported for ${fileName}. Supported: Images, PDFs, Text files, and Microsoft Office documents.`);
        return;
      }

      // For Microsoft Office files, use different approach
      if (['word', 'excel', 'powerpoint'].includes(fileCategory)) {
        const response = await fetch(previewUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);

        previewData.downloadUrl = fileUrl;
        previewData.isOffice = true;

        setPreviewAttachment(previewData);
        return;
      }

      // Handle images, PDFs, and text files
      const response = await fetch(previewUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (fileCategory === 'image') {
        const blob = await response.blob();
        previewData.url = URL.createObjectURL(blob);
        previewData.isImage = true;
      } else if (fileCategory === 'pdf') {
        const blob = await response.blob();
        previewData.url = URL.createObjectURL(blob);
        previewData.isPdf = true;
      } else if (fileCategory === 'text') {
        const textContent = await response.text();
        previewData.content = textContent;
        previewData.isText = true;
      }

      setPreviewAttachment(previewData);
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error(`Failed to preview ${fileName}: ${error.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewAttachment?.url) {
      URL.revokeObjectURL(previewAttachment.url);
    }
    if (previewAttachment?.downloadUrl) {
      URL.revokeObjectURL(previewAttachment.downloadUrl);
    }
    setPreviewAttachment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/campaigns')}
              className="text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <HiArrowLeft className="h-6 w-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{currentCampaign.name}</h1>
              <p className="text-gray-600 text-sm lg:text-base truncate">{currentCampaign.subject}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {(currentCampaign.status?.toLowerCase() === 'draft') && (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="btn btn-success flex items-center disabled:opacity-50 text-sm lg:text-base"
              >
                <HiPlay className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">{actionLoading ? 'Starting...' : 'Start'}</span>
              </button>
            )}

            {(currentCampaign.status?.toLowerCase() === 'running' || currentCampaign.status?.toLowerCase() === 'active') && (
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading}
                className="btn btn-warning flex items-center disabled:opacity-50 text-sm lg:text-base"
              >
                <HiPause className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">{actionLoading ? 'Pausing...' : 'Pause'}</span>
              </button>
            )}

            {currentCampaign.status?.toLowerCase() === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading}
                className="btn btn-success flex items-center disabled:opacity-50 text-sm lg:text-base"
              >
                <HiPlay className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">{actionLoading ? 'Resuming...' : 'Resume'}</span>
              </button>
            )}

            {(currentCampaign.status?.toLowerCase() === 'running' ||
              currentCampaign.status?.toLowerCase() === 'active' ||
              currentCampaign.status?.toLowerCase() === 'paused') && (
                <button
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading}
                  className="btn btn-danger flex items-center disabled:opacity-50 text-sm lg:text-base"
                >
                  <HiStop className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">{actionLoading ? 'Stopping...' : 'Stop'}</span>
                </button>
              )}

            <button
              onClick={() => navigate(`/campaigns/${id}/edit`)}
              className="btn btn-secondary flex items-center text-sm lg:text-base"
            >
              <HiPencil className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              onClick={handleDuplicate}
              disabled={actionLoading}
              className="btn btn-secondary flex items-center disabled:opacity-50 text-sm lg:text-base"
            >
              <HiDuplicate className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">{actionLoading ? 'Duplicating...' : 'Duplicate'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="btn btn-danger flex items-center text-sm lg:text-base"
            >
              <HiTrash className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Delete</span>
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
          <nav className="-mb-px flex overflow-x-auto space-x-4 lg:space-x-8 px-6 scrollbar-hide">
            {['overview', 'content', 'senders', 'recipients', 'attachments', 'tracking', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 lg:px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap flex-shrink-0 ${activeTab === tab
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {currentCampaign.senders.map((sender, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 truncate">Sender {index + 1}</h4>
                          {currentCampaign.senders.length > 1 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
                              Active in rotation
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Name:</span>
                            <span className="ml-2 text-gray-900 break-words">{sender.name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Email:</span>
                            <span className="ml-2 text-gray-900 break-all">{sender.email}</span>
                          </div>
                          {sender.reply_to && (
                            <div>
                              <span className="font-medium text-gray-500">Reply To:</span>
                              <span className="ml-2 text-gray-900 break-all">{sender.reply_to}</span>
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

          {activeTab === 'attachments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Attachments</h3>
              <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <strong>Debug Info:</strong><br />
                Attachments field exists: {currentCampaign?.attachments ? 'Yes' : 'No'}<br />
                Attachments type: {typeof currentCampaign?.attachments}<br />
                Attachments value: {JSON.stringify(currentCampaign?.attachments)}<br />
                Is array: {Array.isArray(currentCampaign?.attachments) ? 'Yes' : 'No'}<br />
                Length: {currentCampaign?.attachments?.length || 'N/A'}
              </div>
              {(() => {
                // Parse attachments if it's a JSON string
                let attachments = currentCampaign?.attachments;
                if (typeof attachments === 'string') {
                  try {
                    attachments = JSON.parse(attachments);
                  } catch (e) {
                    console.error('Failed to parse attachments JSON:', e);
                    attachments = null;
                  }
                }

                return attachments && Array.isArray(attachments) && attachments.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> These attachments were included with every email sent in this campaign.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              {/* File Type Icon */}
                              <div className="flex-shrink-0">
                                {(() => {
                                  const IconComponent = getFileIcon(
                                    attachment.mime_type || attachment.mime,
                                    attachment.original_name || attachment.name
                                  );
                                  return <IconComponent className="h-8 w-8 text-gray-400" />;
                                })()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate" title={attachment.original_name || attachment.name}>
                                  {attachment.original_name || attachment.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  Size: {(attachment.size / 1024).toFixed(1)} KB
                                </p>
                                <p className="text-xs text-gray-500">
                                  Type: {attachment.mime_type || attachment.mime}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <button
                                onClick={() => handlePreviewAttachment(attachment, index)}
                                disabled={previewLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                              >
                                <HiEye className="h-3 w-3 mr-1" />
                                {previewLoading ? 'Loading...' : 'Preview'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Attachment Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Files:</span>
                          <span className="ml-2 font-medium text-gray-900">{attachments.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Size:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {(attachments.reduce((total, att) => total + att.size, 0) / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recipients:</span>
                          <span className="ml-2 font-medium text-gray-900">{currentCampaign.total_recipients || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
                    <p className="mt-1 text-sm text-gray-500">This campaign was sent without any file attachments.</p>
                  </div>
                );
              })()}
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
                                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${sender.deliverability_rating === 'Excellent' ? 'bg-green-100 text-green-800' :
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

                  {/* Failed Jobs Section */}
                  {(currentCampaign?.total_failed > 0 || failedJobs.length > 0) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Failed Email Jobs</h4>
                        {loadingFailedJobs && (
                          <div className="text-sm text-gray-500">Loading...</div>
                        )}
                      </div>

                      {failedJobs.length > 0 ? (
                        <div className="space-y-3">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">
                              <strong>Failed Jobs:</strong> {currentCampaign?.total_failed || 0} emails failed to send.
                              You can retry individual jobs or investigate the errors below.
                            </p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Failed At</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {failedJobs.map((job) => (
                                  <tr key={job.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm text-gray-900 break-all">
                                      {job.recipient}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {job.sender_email}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate" title={job.error_message}>
                                      {job.error_message}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                      {new Date(job.failed_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      <button
                                        onClick={() => handleRetryFailedJob(job.id)}
                                        className="text-blue-600 hover:text-blue-900 text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                                      >
                                        Retry
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {currentCampaign?.total_failed > failedJobs.length && (
                            <div className="text-center pt-3">
                              <p className="text-sm text-gray-500">
                                Showing {failedJobs.length} of {currentCampaign.total_failed} failed jobs
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          {loadingFailedJobs ?
                            'Loading failed jobs...' :
                            'No failed jobs found for this campaign.'
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

      {/* Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-screen mx-4 bg-white rounded-lg shadow-xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">File Preview</h3>
                <p className="text-sm text-gray-500">
                  {previewAttachment.name} ({(previewAttachment.size / 1024).toFixed(1)} KB)
                </p>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-auto">
              {/* Image Preview */}
              {previewAttachment.isImage && (
                <div className="text-center">
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    className="max-w-full max-h-96 mx-auto rounded shadow-lg"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      toast.error('Failed to load image preview');
                    }}
                  />
                </div>
              )}

              {/* PDF Preview */}
              {previewAttachment.isPdf && (
                <div className="w-full">
                  <iframe
                    src={previewAttachment.url}
                    className="w-full h-96 border rounded"
                    title={previewAttachment.name}
                    onError={() => {
                      toast.error('Failed to load PDF preview');
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    If PDF doesn't display properly, try downloading the file or opening in a new tab.
                  </p>
                </div>
              )}

              {/* Text File Preview */}
              {previewAttachment.isText && (
                <div className="bg-gray-50 p-4 rounded border">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono max-h-96 overflow-auto">
                    {previewAttachment.content}
                  </pre>
                </div>
              )}

              {/* Microsoft Office Files Preview */}
              {previewAttachment.isOffice && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <HiDocumentText className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Microsoft Office Document</h4>
                        <p className="text-xs text-blue-700">
                          {previewAttachment.category === 'word' && 'Microsoft Word Document (.doc/.docx)'}
                          {previewAttachment.category === 'excel' && 'Microsoft Excel Spreadsheet (.xls/.xlsx)'}
                          {previewAttachment.category === 'powerpoint' && 'Microsoft PowerPoint Presentation (.ppt/.pptx)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Microsoft Office documents require downloading to view properly.
                    </p>

                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = previewAttachment.downloadUrl;
                        a.download = previewAttachment.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        toast.success('Download started');
                      }}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <HiDownload className="h-5 w-5 mr-2" />
                      Download and Open File
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border">
                    <h5 className="font-medium text-gray-900 mb-2">How to view this file:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Click "Download and Open File" above</li>
                      <li>• Open with Microsoft Office, LibreOffice, or Google Docs</li>
                      <li>• For Excel files: Use Microsoft Excel or Google Sheets</li>
                      <li>• For PowerPoint files: Use PowerPoint or Google Slides</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Fallback for any unhandled cases */}
              {!previewAttachment.isImage && !previewAttachment.isPdf && !previewAttachment.isText && !previewAttachment.isOffice && (
                <div className="text-center py-8">
                  <HiDocumentText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Unavailable</h3>
                  <p className="text-gray-600 mb-4">
                    This file type cannot be previewed directly in the browser.
                  </p>
                  <button
                    onClick={() => {
                      // Trigger download as fallback
                      const token = localStorage.getItem('token');
                      const downloadUrl = `/api/campaigns/${currentCampaign.id}/attachments/${previewAttachment.index}/download`;

                      fetch(downloadUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = previewAttachment.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        });
                    }}
                    className="btn btn-primary"
                  >
                    <HiDownload className="h-4 w-4 mr-2" />
                    Download File
                  </button>
                </div>
              )}
            </div>            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closePreview}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail; 