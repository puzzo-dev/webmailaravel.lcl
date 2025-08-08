import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  HiEye as EyeIcon,
  HiPencil as PencilIcon,
  HiTrash as TrashIcon,
  HiPlay as PlayIcon,
  HiPause as PauseIcon,
  HiChartBar as ChartBarIcon,
  HiFunnel as FunnelIcon,
  HiCalendar as CalendarIcon,
  HiUserGroup as UserGroupIcon,
  HiEnvelope as EnvelopeIcon,
  HiCheckCircle as CheckCircleIcon,
  HiXCircle as XCircleIcon,
  HiClock as ClockIcon,
  HiExclamationTriangle as ExclamationIcon
} from 'react-icons/hi2';
import { adminService } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminCampaigns = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [campaigns, setCampaigns] = useState([]);
  
  // Ensure campaigns is always an array
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    user: '',
    dateRange: '',
    search: ''
  });
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // Check if user has admin access
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCampaigns();
    }
  }, [user, pagination.current_page, filters]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.current_page,
        limit: pagination.per_page,
        ...filters
      };
      
      const response = await adminService.getCampaigns(params);
      setCampaigns(response.data || []);
      setPagination({
        current_page: response.pagination?.current_page || 1,
        last_page: response.pagination?.last_page || 1,
        per_page: response.pagination?.per_page || 20,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      setError('Failed to load campaigns');
      toast.error('Failed to load campaigns');
      console.error('Campaigns fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId, status) => {
    try {
      setActionLoading(true);
      
      switch (status) {
        case 'sending':
          await adminService.startCampaign(campaignId);
          toast.success('Campaign started successfully');
          break;
        case 'paused':
          await adminService.pauseCampaign(campaignId);
          toast.success('Campaign paused successfully');
          break;
        case 'stopped':
          await adminService.stopCampaign(campaignId);
          toast.success('Campaign stopped successfully');
          break;
        default:
          toast.error('Unsupported status');
          return;
      }
      
      await fetchCampaigns();
    } catch (error) {
      toast.error('Error updating campaign status');
      console.error('Error updating campaign status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCampaigns.length === 0) return;
    
    try {
      setActionLoading(true);
      
      for (const campaignId of selectedCampaigns) {
        if (action === 'delete') {
          await adminService.deleteCampaign(campaignId);
        } else {
          switch (action) {
            case 'sending':
              await adminService.startCampaign(campaignId);
              break;
            case 'paused':
              await adminService.pauseCampaign(campaignId);
              break;
            case 'stopped':
              await adminService.stopCampaign(campaignId);
              break;
            default:
              console.warn('Unsupported bulk action:', action);
              continue;
          }
        }
      }
      
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedCampaigns([]);
      await fetchCampaigns();
    } catch (error) {
      toast.error(`Error performing bulk ${action}`);
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    if (!confirm(`Are you sure you want to delete campaign "${campaignName}"?`)) return;
    
    try {
      setActionLoading(true);
      await adminService.deleteCampaign(campaignId);
      toast.success(`Campaign "${campaignName}" deleted successfully`);
      await fetchCampaigns();
    } catch (error) {
      toast.error('Error deleting campaign');
      console.error('Error deleting campaign:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: CalendarIcon },
      sending: { color: 'bg-yellow-100 text-yellow-800', icon: PlayIcon },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      paused: { color: 'bg-orange-100 text-orange-800', icon: PauseIcon },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to manage campaigns.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Manage all campaigns across all users</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{typeof error === 'string' ? error : error?.message || 'An error occurred'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', user: '', dateRange: '', search: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedCampaigns.length} campaign(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('sending')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Start'}
              </button>
              <button
                onClick={() => handleBulkAction('paused')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Pause'}
              </button>
              <button
                onClick={() => handleBulkAction('stopped')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Stop'}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                        setSelectedCampaigns(safeCampaigns.map(campaign => campaign.id));
                        } else {
                          setSelectedCampaigns([]);
                        }
                      }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {safeCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No campaigns found
                  </td>
                </tr>
              ) : (
                safeCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCampaigns([...selectedCampaigns, campaign.id]);
                          } else {
                            setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaign.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.subject}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.user?.name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${campaign.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{campaign.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, 'sending')}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Start Campaign"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        {campaign.status === 'sending' && (
                        <button
                            onClick={() => handleStatusChange(campaign.id, 'paused')}
                            disabled={actionLoading}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            title="Pause Campaign"
                        >
                            <PauseIcon className="h-4 w-4" />
                        </button>
                        )}
                        {campaign.status === 'sending' && (
                        <button
                            onClick={() => handleStatusChange(campaign.id, 'stopped')}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Stop Campaign"
                          >
                            <XCircleIcon className="h-4 w-4" />
                        </button>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Campaign"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
                </div>
                
        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} campaigns
                  </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                    </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                    <button 
                  onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                  Next
                    </button>
                  </div>
                </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaigns; 