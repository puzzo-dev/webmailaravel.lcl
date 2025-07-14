import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  GlobeAltIcon, 
  EnvelopeIcon, 
  CogIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { fetchAdminDomains, updateDomainStatus, deleteDomain, testDomainConnection } from '../../store/slices/domainSlice';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';

const AdminDomains = () => {
  const dispatch = useDispatch();
  const { domains, loading, error } = useSelector(state => state.domains);
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

  useEffect(() => {
    dispatch(fetchAdminDomains());
  }, [dispatch]);

  const handleStatusChange = async (domainId, status) => {
    try {
      await dispatch(updateDomainStatus({ domainId, status }));
      dispatch(fetchAdminDomains());
    } catch (error) {
      console.error('Error updating domain status:', error);
    }
  };

  const handleTestConnection = async (domainId) => {
    setTestingConnection(true);
    try {
      await dispatch(testDomainConnection(domainId));
      dispatch(fetchAdminDomains());
    } catch (error) {
      console.error('Error testing domain connection:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedDomains.length === 0) return;
    
    try {
      for (const domainId of selectedDomains) {
        if (action === 'delete') {
          await dispatch(deleteDomain(domainId));
        } else {
          await dispatch(updateDomainStatus({ domainId, status: action }));
        }
      }
      setSelectedDomains([]);
      dispatch(fetchAdminDomains());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const filteredDomains = domains.filter(domain => {
    if (filters.status && domain.status !== filters.status) return false;
    if (filters.user && domain.user_id !== parseInt(filters.user)) return false;
    if (filters.search && !domain.domain.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.hasBounceProcessing === 'true' && !domain.bounce_processing_enabled) return false;
    if (filters.hasBounceProcessing === 'false' && domain.bounce_processing_enabled) return false;
    return true;
  });

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
            onClick={() => {/* Add new domain */}}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add Domain
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
            <span className="text-sm text-blue-800">
              {selectedDomains.length} domain(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('active')}
                className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded hover:bg-green-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('inactive')}
                className="px-3 py-1 text-sm text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
              >
                Deactivate
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
                        setSelectedDomains(filteredDomains.map(d => d.id));
                      } else {
                        setSelectedDomains([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                  SMTP Config
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Processing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDomains.map((domain) => (
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{domain.domain}</div>
                        <div className="text-sm text-gray-500">{domain.dns_status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{domain.user?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{domain.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(domain.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getHealthBadge(domain.health_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {domain.smtp_config ? (
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                          <span>Configured</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <XCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                          <span>Not configured</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {domain.bounce_processing_enabled ? (
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <XCircleIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <span>Disabled</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {formatNumber(domain.sent_count || 0)}
                        </span>
                        <span className="flex items-center">
                          <ChartBarIcon className="w-4 h-4 mr-1 text-green-400" />
                          {domain.delivery_rate || 0}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDomain(domain);
                          setShowDomainModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestConnection(domain.id)}
                        disabled={testingConnection}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Edit domain */}}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(domain.id, domain.status === 'active' ? 'inactive' : 'active')}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        {domain.status === 'active' ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleStatusChange(domain.id, 'suspended')}
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
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-12">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No domains found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Domain Detail Modal */}
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
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <p className="text-sm text-gray-900">{selectedDomain.domain}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner</label>
                  <p className="text-sm text-gray-900">{selectedDomain.user?.name || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDomain.status)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health</label>
                  <div className="mt-1">
                    {getHealthBadge(selectedDomain.health_status)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">DNS Status</label>
                  <p className="text-sm text-gray-900">{selectedDomain.dns_status}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Configuration</label>
                  <p className="text-sm text-gray-900">
                    {selectedDomain.smtp_config ? 'Configured' : 'Not configured'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bounce Processing</label>
                  <p className="text-sm text-gray-900">
                    {selectedDomain.bounce_processing_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statistics</label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-900">Sent: {formatNumber(selectedDomain.sent_count || 0)}</p>
                    <p className="text-sm text-gray-900">Delivery Rate: {selectedDomain.delivery_rate || 0}%</p>
                    <p className="text-sm text-gray-900">Bounce Rate: {selectedDomain.bounce_rate || 0}%</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleTestConnection(selectedDomain.id)}
                  disabled={testingConnection}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={() => setShowDomainModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDomains; 