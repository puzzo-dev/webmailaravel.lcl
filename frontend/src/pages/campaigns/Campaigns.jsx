import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCampaigns, deleteCampaign, startCampaign, pauseCampaign, stopCampaign } from '../../store/slices/campaignSlice';
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
} from 'react-icons/hi';

const Campaigns = () => {
  const dispatch = useDispatch();
  const { campaigns, isLoading, pagination } = useSelector((state) => state.campaigns);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    dispatch(fetchCampaigns({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchCampaigns({ page: 1, limit: 10, search: searchTerm, status: statusFilter }));
  };

  const handlePageChange = (page) => {
    dispatch(fetchCampaigns({ page, limit: 10, search: searchTerm, status: statusFilter }));
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await dispatch(deleteCampaign(campaignId)).unwrap();
        toast.success('Campaign deleted successfully');
      } catch (error) {
        toast.error('Failed to delete campaign');
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
        case 'stop':
          await dispatch(stopCampaign(campaignId)).unwrap();
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getActionButtons = (campaign) => {
    const buttons = [];
    
    if (campaign.status === 'draft') {
      buttons.push(
        <button
          key="start"
          onClick={() => handleAction(campaign.id, 'start')}
          className="text-success-600 hover:text-success-900"
          title="Start Campaign"
        >
          <HiPlay className="h-4 w-4" />
        </button>
      );
    }
    
    if (campaign.status === 'active') {
      buttons.push(
        <button
          key="pause"
          onClick={() => handleAction(campaign.id, 'pause')}
          className="text-warning-600 hover:text-warning-900"
          title="Pause Campaign"
        >
          <HiPause className="h-4 w-4" />
        </button>
      );
    }
    
    if (['active', 'paused'].includes(campaign.status)) {
      buttons.push(
        <button
          key="stop"
          onClick={() => handleAction(campaign.id, 'stop')}
          className="text-danger-600 hover:text-danger-900"
          title="Stop Campaign"
        >
          <HiStop className="h-4 w-4" />
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your email campaigns</p>
          </div>
          <Link to="/campaigns/new" className="btn btn-primary flex items-center">
            <HiPlus className="h-5 w-5 mr-2" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns..."
              className="input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="stopped">Stopped</option>
            <option value="completed">Completed</option>
          </select>
          <button type="submit" className="btn btn-primary flex items-center">
            <HiSearch className="h-5 w-5 mr-2" />
            Search
          </button>
        </form>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-6 text-center">
            <HiMail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first campaign.
            </p>
            <div className="mt-6">
              <Link to="/campaigns/new" className="btn btn-primary">
                Create Campaign
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
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
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="table-row">
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
                            className="text-primary-600 hover:text-primary-900"
                            title="View Campaign"
                          >
                            <HiEye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/campaigns/${campaign.id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Campaign"
                          >
                            <HiPencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(campaign.id)}
                            className="text-danger-600 hover:text-danger-900"
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