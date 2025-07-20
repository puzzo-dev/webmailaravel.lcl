import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCampaigns, deleteCampaign, startCampaign, pauseCampaign, stopCampaign, resumeCampaign } from '../../store/slices/campaignSlice';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiSearch,
  HiEye,
  HiPencil,
  HiTrash,
  HiPlay,
  HiPause,
  HiStop,
  HiCalendar,
  HiUserGroup,
  HiMail,
  HiCursorClick,
  HiEyeOff,
  HiFilter,
  HiX,
  HiChevronDown,
  HiChevronUp,
  HiCheck,
  HiSelector,
  HiRefresh,
  HiDownload,
  HiDotsVertical,
} from 'react-icons/hi';
import { debounce } from 'lodash';
import { useSubscriptionError } from '../../hooks/useSubscriptionError';

const Campaigns = () => {
  const dispatch = useDispatch();
  const { campaigns, isLoading, pagination } = useSelector((state) => state.campaigns);
  const { handleSubscriptionError } = useSubscriptionError();
  
  // Ensure campaigns is always an array
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);

  // Use refs to track previous values and prevent infinite loops
  const prevFilters = useRef({ searchTerm, statusFilter, dateFilter, sortBy, sortOrder });
  const isInitialMount = useRef(true);

  // Debounced search function - memoized to prevent recreation
  const debouncedSearch = useCallback(
    debounce((search, status, date, sortBy, sortOrder) => {
      dispatch(fetchCampaigns({ 
        page: 1, 
        limit: 10, 
        search, 
        status, 
        date_filter: date,
        sort_by: sortBy,
        sort_order: sortOrder
      })).catch(error => {
        handleSubscriptionError(error);
      });
    }, 300),
    [] // Empty dependency array to prevent recreation
  );

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    dispatch(fetchCampaigns({ page: 1, limit: 10 })).catch(error => {
      handleSubscriptionError(error);
    });
    }
  }, [dispatch, handleSubscriptionError]);

  // Handle filter changes
  useEffect(() => {
    if (!isInitialMount.current) {
      const currentFilters = { searchTerm, statusFilter, dateFilter, sortBy, sortOrder };
      const prevFiltersValue = prevFilters.current;
      
      // Only trigger search if filters actually changed
      if (
        currentFilters.searchTerm !== prevFiltersValue.searchTerm ||
        currentFilters.statusFilter !== prevFiltersValue.statusFilter ||
        currentFilters.dateFilter !== prevFiltersValue.dateFilter ||
        currentFilters.sortBy !== prevFiltersValue.sortBy ||
        currentFilters.sortOrder !== prevFiltersValue.sortOrder
      ) {
        debouncedSearch(searchTerm, statusFilter, dateFilter, sortBy, sortOrder);
        prevFilters.current = currentFilters;
      }
    }
  }, [searchTerm, statusFilter, dateFilter, sortBy, sortOrder, debouncedSearch]);

  const handlePageChange = (page) => {
    dispatch(fetchCampaigns({ 
      page, 
      limit: 10, 
      search: searchTerm, 
      status: statusFilter,
      date_filter: dateFilter,
      sort_by: sortBy,
      sort_order: sortOrder
    })).catch(error => {
      handleSubscriptionError(error);
    });
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await dispatch(deleteCampaign(campaignId)).unwrap();
        toast.success('Campaign deleted successfully');
      } catch (error) {
        if (!handleSubscriptionError(error)) {
          toast.error('Failed to delete campaign');
        }
      }
    }
  };

  const handleAction = async (campaignId, action) => {
    try {
      switch (action) {
        case 'start':
          await dispatch(startCampaign(campaignId)).unwrap();
          toast.success('Campaign started successfully');
          break;
        case 'pause':
          await dispatch(pauseCampaign(campaignId)).unwrap();
          toast.success('Campaign paused successfully');
          break;
        case 'resume':
          await dispatch(resumeCampaign(campaignId)).unwrap();
          toast.success('Campaign resumed successfully');
          break;
        case 'stop':
          await dispatch(stopCampaign(campaignId)).unwrap();
          toast.success('Campaign stopped successfully');
          break;
        default:
          break;
      }
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error(`Failed to ${action} campaign`);
      }
    }
  };

  const handleBulkAction = async () => {
    if (selectedCampaigns.length === 0 || !bulkAction) return;

    setIsPerformingBulkAction(true);
    try {
      for (const campaignId of selectedCampaigns) {
        if (bulkAction === 'delete') {
          await dispatch(deleteCampaign(campaignId)).unwrap();
        } else {
          await dispatch(handleAction(campaignId, bulkAction)).unwrap();
        }
      }
      toast.success(`Bulk ${bulkAction} completed successfully`);
      setSelectedCampaigns([]);
      setBulkAction('');
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        toast.error(`Failed to perform bulk ${bulkAction}`);
      }
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCampaigns(safeCampaigns.map(c => c.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (campaignId, checked) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'RUNNING': { color: 'bg-success-100 text-success-800', label: 'Running' },
      'PAUSED': { color: 'bg-warning-100 text-warning-800', label: 'Paused' },
      'STOPPED': { color: 'bg-danger-100 text-danger-800', label: 'Stopped' },
      'COMPLETED': { color: 'bg-primary-100 text-primary-800', label: 'Completed' },
      'FAILED': { color: 'bg-red-100 text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActionButtons = (campaign) => {
    const buttons = [];
    
    if (campaign.status === 'DRAFT') {
      buttons.push(
        <button
          key="start"
          onClick={() => handleAction(campaign.id, 'start')}
          className="text-success-600 hover:text-success-900 transition-colors"
          title="Start Campaign"
        >
          <HiPlay className="h-4 w-4" />
        </button>
      );
    }
    
    if (campaign.status === 'RUNNING') {
      buttons.push(
        <button
          key="pause"
          onClick={() => handleAction(campaign.id, 'pause')}
          className="text-warning-600 hover:text-warning-900 transition-colors"
          title="Pause Campaign"
        >
          <HiPause className="h-4 w-4" />
        </button>
      );
    }
    
    if (['RUNNING', 'PAUSED'].includes(campaign.status)) {
      buttons.push(
        <button
          key="stop"
          onClick={() => handleAction(campaign.id, 'stop')}
          className="text-danger-600 hover:text-danger-900 transition-colors"
          title="Stop Campaign"
        >
          <HiStop className="h-4 w-4" />
        </button>
      );
    }
    
    return buttons;
  };

  const hasActiveFilters = searchTerm || statusFilter || dateFilter || sortBy !== 'created_at' || sortOrder !== 'desc';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your email campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => dispatch(fetchCampaigns({ page: 1, limit: 10 }))}
              className="btn btn-secondary flex items-center"
              disabled={isLoading}
            >
              <HiRefresh className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link to="/campaigns/new" className="btn btn-primary flex items-center">
              <HiPlus className="h-5 w-5 mr-2" />
              New Campaign
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Quick Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns by name, subject, or sender..."
              className="input pl-10 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto min-w-[140px]"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="RUNNING">Running</option>
              <option value="PAUSED">Paused</option>
              <option value="STOPPED">Stopped</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn btn-secondary flex items-center ${showAdvancedFilters ? 'btn-primary' : ''}`}
            >
              <HiFilter className="h-5 w-5 mr-2" />
              Filters
              {showAdvancedFilters ? <HiChevronUp className="h-4 w-4 ml-1" /> : <HiChevronDown className="h-4 w-4 ml-1" />}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                </select>
              </div>
              <div>
                <label className="form-label">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input"
                >
                  <option value="created_at">Created Date</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="total_recipients">Recipients</option>
                  <option value="emails_sent">Sent</option>
                  <option value="opens">Opens</option>
                  <option value="clicks">Clicks</option>
                </select>
              </div>
              <div>
                <label className="form-label">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="input"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {safeCampaigns.length} campaign{safeCampaigns.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary text-sm"
                >
                  <HiX className="h-4 w-4 mr-1" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <HiCheck className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="input text-sm"
              >
                <option value="">Select Action</option>
                <option value="start">Start</option>
                <option value="pause">Pause</option>
                <option value="stop">Stop</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || isPerformingBulkAction}
                className="btn btn-primary text-sm"
              >
                {isPerformingBulkAction ? (
                  <div className="loading-spinner h-4 w-4"></div>
                ) : (
                  'Apply'
                )}
              </button>
              <button
                onClick={() => setSelectedCampaigns([])}
                className="btn btn-secondary text-sm"
              >
                <HiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-4"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ) : safeCampaigns.length === 0 ? (
          <div className="p-6 text-center">
            <HiMail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first campaign.'
              }
            </p>
            <div className="mt-6">
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="btn btn-primary">
                  Clear Filters
                </button>
              ) : (
                <Link to="/campaigns/new" className="btn btn-primary">
                  Create Campaign
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell w-4">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.length === safeCampaigns.length && safeCampaigns.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="form-checkbox"
                      />
                    </th>
                    <th className="table-header-cell">Campaign</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Recipients</th>
                    <th className="table-header-cell">Sent</th>
                    <th className="table-header-cell">Opens</th>
                    <th className="table-header-cell">Clicks</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {safeCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="table-row hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.includes(campaign.id)}
                          onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                          className="form-checkbox"
                        />
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <HiUserGroup className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{campaign.total_recipients || 0}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <HiMail className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{campaign.emails_sent || 0}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <HiEye className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{campaign.opens || 0}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <HiCursorClick className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{campaign.clicks || 0}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{formatDate(campaign.created_at)}</div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          {getActionButtons(campaign)}
                          <Link
                            to={`/campaigns/${campaign.id}`}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="View Campaign"
                          >
                            <HiEye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/campaigns/${campaign.id}/edit`}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edit Campaign"
                          >
                            <HiPencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(campaign.id)}
                            className="text-danger-600 hover:text-danger-900 transition-colors"
                            title="Delete Campaign"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="pagination">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-button ${
                            page === pagination.current_page ? 'pagination-button-active' : ''
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Campaigns; 