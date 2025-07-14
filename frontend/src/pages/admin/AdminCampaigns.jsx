import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon, 
  ChartBarIcon,
  FunnelIcon,
  CalendarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { fetchAdminCampaigns, updateCampaignStatus, deleteCampaign } from '../../store/slices/campaignSlice';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';

const AdminCampaigns = () => {
  const dispatch = useDispatch();
  const { campaigns, loading, error } = useSelector(state => state.campaigns);
  const [filters, setFilters] = useState({
    status: '',
    user: '',
    dateRange: '',
    search: ''
  });
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    dispatch(fetchAdminCampaigns());
  }, [dispatch]);

  const handleStatusChange = async (campaignId, status) => {
    try {
      await dispatch(updateCampaignStatus({ campaignId, status }));
      dispatch(fetchAdminCampaigns());
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCampaigns.length === 0) return;
    
    try {
      for (const campaignId of selectedCampaigns) {
        if (action === 'delete') {
          await dispatch(deleteCampaign(campaignId));
        } else {
          await dispatch(updateCampaignStatus({ campaignId, status: action }));
        }
      }
      setSelectedCampaigns([]);
      dispatch(fetchAdminCampaigns());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filters.status && campaign.status !== filters.status) return false;
    if (filters.user && campaign.user_id !== parseInt(filters.user)) return false;
    if (filters.search && !campaign.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

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
            <span className="text-sm text-blue-800">
              {selectedCampaigns.length} campaign(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('scheduled')}
                className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                Schedule
              </button>
              <button
                onClick={() => handleBulkAction('paused')}
                className="px-3 py-1 text-sm text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
              >
                Pause
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCampaigns(filteredCampaigns.map(c => c.id));
                        } else {
                          setSelectedCampaigns([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.subject}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{campaign.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${campaign.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{campaign.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {formatNumber(campaign.sent_count || 0)}
                          </span>
                          <span className="flex items-center">
                            <EyeIcon className="w-4 h-4 mr-1 text-green-400" />
                            {formatNumber(campaign.open_count || 0)}
                          </span>
                          <span className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-1 text-blue-400" />
                            {formatNumber(campaign.click_count || 0)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {/* View details */}}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Edit campaign */}}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(campaign.id, campaign.status === 'paused' ? 'scheduled' : 'paused')}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          {campaign.status === 'paused' ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'failed')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                    {getStatusBadge(campaign.status)}
                  </div>
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    {campaign.user?.name || 'Unknown User'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    {formatNumber(campaign.sent_count || 0)} sent
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    {formatNumber(campaign.open_count || 0)} opens
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{campaign.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${campaign.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatDate(campaign.created_at)}</span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(campaign.id, campaign.status === 'paused' ? 'scheduled' : 'paused')}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      {campaign.status === 'paused' ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns; 