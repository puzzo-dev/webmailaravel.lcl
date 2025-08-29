import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiGlobeAlt as GlobeAltIcon,
  HiEnvelope as EnvelopeIcon,
  HiCog as CogIcon,
  HiCheckCircle as CheckCircleIcon,
  HiXCircle as XCircleIcon,
  HiExclamationTriangle as ExclamationTriangleIcon,
  HiEye as EyeIcon,
  HiPencil as PencilIcon,
  HiTrash as TrashIcon,
  HiPlay as PlayIcon,
  HiPause as PauseIcon,
  HiShieldCheck as ShieldCheckIcon,
  HiChartBar as ChartBarIcon,
  HiClock as ClockIcon
} from 'react-icons/hi2';
import { adminService } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminDomains = () => {
  const { user } = useSelector((state) => state.auth);
  const [domains, setDomains] = useState([]);

  // Ensure domains is always an array
  const safeDomains = Array.isArray(domains) ? domains : [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    user: '',
    search: '',
    hasBounceProcessing: ''
  });
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // Check if user has admin access
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDomains();
    }
  }, [user, pagination.current_page, filters]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.current_page,
        limit: pagination.per_page,
        ...filters
      };

      const response = await adminService.getDomains(params);

      // Ensure domains is always an array
      const domainsData = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setDomains(domainsData);
      setPagination({
        current_page: response.data.pagination?.current_page || response.pagination?.current_page || 1,
        last_page: response.data.pagination?.last_page || response.pagination?.last_page || 1,
        per_page: response.data.pagination?.per_page || response.pagination?.per_page || 20,
        total: response.data.pagination?.total || response.pagination?.total || 0,
      });
    } catch (error) {
      setError('Failed to load domains');
      toast.error('Failed to load domains');
      console.error('Domains fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (domainId, status) => {
    try {
      setActionLoading(true);
      await adminService.updateDomainStatus(domainId, status);
      toast.success(`Domain status updated to ${status}`);
      await fetchDomains();
    } catch (error) {
      toast.error('Error updating domain status');
      console.error('Error updating domain status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestConnection = async (domainId) => {
    setTestingConnection(true);
    try {
      await adminService.testDomainConnection(domainId);
      toast.success('Domain connection test completed');
      await fetchDomains();
    } catch (error) {
      toast.error('Error testing domain connection');
      console.error('Error testing domain connection:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedDomains.length === 0) return;

    try {
      setActionLoading(true);

      for (const domainId of selectedDomains) {
        if (action === 'delete') {
          await adminService.deleteDomain(domainId);
        } else {
          await adminService.updateDomainStatus(domainId, action);
        }
      }

      toast.success(`Bulk ${action} completed successfully`);
      setSelectedDomains([]);
      await fetchDomains();
    } catch (error) {
      toast.error(`Error performing bulk ${action}`);
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDomain = async (domainId, domainName) => {
    if (!confirm(`Are you sure you want to delete domain "${domainName}"?`)) return;

    try {
      setActionLoading(true);
      await adminService.deleteDomain(domainId);
      toast.success(`Domain "${domainName}" deleted successfully`);
      await fetchDomains();
    } catch (error) {
      toast.error('Error deleting domain');
      console.error('Error deleting domain:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      suspended: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getHealthBadge = (health) => {
    const healthConfig = {
      good: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon },
      critical: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };

    const config = healthConfig[health] || healthConfig.good;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {health}
      </span>
    );
  };

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to manage domains.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
          <p className="text-gray-600">Manage sender domains and SMTP configurations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {/* Add new domain */ }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add Domain
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
                <p>{error}</p>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bounce Processing</label>
            <select
              value={filters.hasBounceProcessing}
              onChange={(e) => setFilters({ ...filters, hasBounceProcessing: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              <option value="true">With Bounce Processing</option>
              <option value="false">Without Bounce Processing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search domains..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', user: '', search: '', hasBounceProcessing: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDomains.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedDomains.length} domain(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('active')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Activate'}
              </button>
              <button
                onClick={() => handleBulkAction('inactive')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Deactivate'}
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

      {/* Domains List */}
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
                        setSelectedDomains(domains.map(domain => domain.id));
                      } else {
                        setSelectedDomains([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SMTP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Processing
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
              {safeDomains.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    No domains found
                  </td>
                </tr>
              ) : (
                safeDomains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDomains.includes(domain.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDomains([...selectedDomains, domain.id]);
                          } else {
                            setSelectedDomains(selectedDomains.filter(id => id !== domain.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{domain.name}</div>
                          {domain.description && (
                            <div className="text-sm text-gray-500">{domain.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {domain.user?.name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(domain.is_active ? 'active' : 'inactive')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getHealthBadge(domain.health_status || 'good')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {domain.smtp_config ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className="ml-1 text-sm text-gray-900">
                          {domain.smtp_config ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {domain.enable_bounce_processing ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="ml-1 text-sm text-gray-900">
                          {domain.enable_bounce_processing ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(domain.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDomain(domain);
                            setShowDomainModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleTestConnection(domain.id)}
                          disabled={testingConnection}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Test Connection"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(domain.id, domain.is_active ? 'inactive' : 'active')}
                          disabled={actionLoading}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                          title={domain.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {domain.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteDomain(domain.id, domain.name)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Domain"
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
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} domains
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

      {/* Domain Details Modal */}
      {showDomainModal && selectedDomain && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Domain Details</h3>
                <button
                  onClick={() => setShowDomainModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <p className="text-sm text-gray-900">{selectedDomain.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner</label>
                  <p className="text-sm text-gray-900">{selectedDomain.user?.name || 'Unknown User'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDomain.is_active ? 'active' : 'inactive')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health</label>
                  <div className="mt-1">
                    {getHealthBadge(selectedDomain.health_status || 'good')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Configured</label>
                  <p className="text-sm text-gray-900">
                    {selectedDomain.smtp_config ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bounce Processing</label>
                  <p className="text-sm text-gray-900">
                    {selectedDomain.enable_bounce_processing ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedDomain.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDomains; 