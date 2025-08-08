import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiEnvelope as EnvelopeIcon,
  HiUser as UserIcon,
  HiGlobeAlt as GlobeAltIcon,
  HiCheckCircle as CheckCircleIcon,
  HiXCircle as XCircleIcon,
  HiExclamationTriangle as ExclamationTriangleIcon,
  HiEye as EyeIcon,
  HiPencil as PencilIcon,
  HiTrash as TrashIcon,
  HiPlay as PlayIcon,
  HiPause as PauseIcon,
  HiChartBar as ChartBarIcon,
  HiFunnel as FunnelIcon,
  HiCalendar as CalendarIcon,
  HiPlus as PlusIcon,
  HiClock as ClockIcon,
  HiPaperAirplane as PaperAirplaneIcon,
  HiXMark as XIcon,
  HiInformationCircle as InformationCircleIcon,
} from 'react-icons/hi2';
import { adminService } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminSenders = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [senders, setSenders] = useState([]);
  const [domains, setDomains] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    domain: '',
    user: '',
    search: ''
  });
  const [selectedSenders, setSelectedSenders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSender, setEditingSender] = useState(null);
  const [senderForm, setSenderForm] = useState({
    name: '',
    email: '',
    domain_id: '',
    is_active: true
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSender, setTestSender] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSender, setIsTestingSender] = useState(false);

  // Check if user has admin access
  useEffect(() => {
    if (user?.role === 'admin') {
    fetchSenders();
    fetchDomains();
    }
  }, [user, pagination.current_page, filters]);

  const fetchSenders = async () => {
    setLoading(true);
    try {
      setError(null);
      const params = {
        page: pagination.current_page,
        limit: pagination.per_page,
        ...filters
      };
      
      const response = await adminService.getSenders(params);
      setSenders(response.data || []);
      setPagination({
        current_page: response.pagination?.current_page || 1,
        last_page: response.pagination?.last_page || 1,
        per_page: response.pagination?.per_page || 20,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      setError('Failed to load senders');
      toast.error('Failed to load senders');
      console.error('Error fetching senders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await adminService.getDomains();
      setDomains(response.data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleStatusChange = async (senderId, status) => {
    try {
      setActionLoading(true);
      await adminService.updateSenderStatus(senderId, status);
      toast.success(`Sender ${status ? 'activated' : 'deactivated'} successfully`);
      await fetchSenders(); // Refresh data
    } catch (error) {
      console.error('Error updating sender status:', error);
      toast.error('Failed to update sender status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (senderId) => {
    if (!confirm('Are you sure you want to delete this sender?')) return;
    
    try {
      setActionLoading(true);
      await adminService.deleteSender(senderId);
      toast.success('Sender deleted successfully');
      await fetchSenders(); // Refresh data
    } catch (error) {
      console.error('Error deleting sender:', error);
      toast.error('Failed to delete sender');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSender = async () => {
    if (!senderForm.name || !senderForm.email || !senderForm.domain_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.createSender(senderForm);
      toast.success('Sender created successfully');
      setShowModal(false);
      setSenderForm({ name: '', email: '', domain_id: '', is_active: true });
      await fetchSenders(); // Refresh data
    } catch (error) {
      console.error('Error creating sender:', error);
      toast.error('Failed to create sender');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSender = async () => {
    if (!editingSender || !senderForm.name || !senderForm.email || !senderForm.domain_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.updateSender(editingSender.id, senderForm);
      toast.success('Sender updated successfully');
      setShowModal(false);
      setEditingSender(null);
      setSenderForm({ name: '', email: '', domain_id: '', is_active: true });
      await fetchSenders(); // Refresh data
    } catch (error) {
      console.error('Error updating sender:', error);
      toast.error('Failed to update sender');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSenders.length === 0) return;
    
    try {
      setActionLoading(true);
      
      for (const senderId of selectedSenders) {
        if (action === 'delete') {
          await adminService.deleteSender(senderId);
        } else {
          await adminService.updateSenderStatus(senderId, action === 'activate');
        }
      }
      
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedSenders([]);
      await fetchSenders(); // Refresh data
    } catch (error) {
      toast.error(`Error performing bulk ${action}`);
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setSenderForm({
      name: '',
      email: '',
      domain_id: '',
      is_active: true
    });
    setEditingSender(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (sender) => {
    setEditingSender(sender);
    setSenderForm({
      name: sender.name,
      email: sender.email,
      domain_id: sender.domain_id || sender.domain?.id || '',
      is_active: sender.is_active
    });
    setShowModal(true);
  };

  const handleTestSender = async () => {
    if (!testSender) {
      toast.error('Please select a sender to test.');
      return;
    }
    
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid test email address.');
      return;
    }
    
    setIsTestingSender(true);
    try {
      await adminService.testSenderConnection(testSender.id, { test_email: testEmail });
      toast.success(`Test email sent successfully to ${testEmail}! Check your inbox for the test email.`);
      setShowTestModal(false);
      setTestSender(null);
      setTestEmail('');
    } catch (error) {
      console.error('Error testing sender:', error);
      toast.error('Failed to send test email: ' + (error.message || 'Unknown error'));
    } finally {
      setIsTestingSender(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      suspended: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
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
                <p>You need admin privileges to manage senders.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Sender Management</h1>
          <p className="text-gray-600">Manage sender addresses for all users</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Sender
        </button>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <select
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search senders..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', domain: '', user: '', search: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSenders.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedSenders.length} sender(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Activate'}
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
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

      {/* Senders List */}
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
                        setSelectedSenders(senders.map(sender => sender.id));
                      } else {
                        setSelectedSenders([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
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
                  Stats
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
              {senders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No senders found
                  </td>
                </tr>
              ) : (
                senders.map((sender) => (
                <tr key={sender.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSenders.includes(sender.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedSenders([...selectedSenders, sender.id]);
                        } else {
                            setSelectedSenders(selectedSenders.filter(id => id !== sender.id));
                        }
                      }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <EnvelopeIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{sender.name}</div>
                      <div className="text-sm text-gray-500">{sender.email}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {sender.domain?.name || 'Unknown Domain'}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sender.user?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{sender.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sender.is_active ? 'active' : 'inactive')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {formatNumber(sender.stats?.campaigns_sent || 0)}
                          </span>
                          <span className="flex items-center">
                            <EnvelopeIcon className="w-4 h-4 mr-1 text-green-400" />
                            {formatNumber(sender.stats?.total_emails || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {sender.stats?.success_rate || 0}% success rate
                    </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sender.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(sender)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Sender"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTestSender(sender);
                          setShowTestModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Test Sender"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(sender.id, !sender.is_active)}
                          disabled={actionLoading}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                        title={sender.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {sender.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(sender.id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Sender"
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
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} senders
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSender ? 'Edit Sender' : 'Create Sender'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={senderForm.name}
                    onChange={(e) => setSenderForm({ ...senderForm, name: e.target.value })}
                    placeholder="Marketing Team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={senderForm.email}
                    onChange={(e) => setSenderForm({ ...senderForm, email: e.target.value })}
                    placeholder="marketing@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain *
                  </label>
                  <select
                    value={senderForm.domain_id}
                    onChange={(e) => setSenderForm({ ...senderForm, domain_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Domain</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={senderForm.is_active}
                      onChange={(e) => setSenderForm({ ...senderForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSender ? handleEditSender : handleCreateSender}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Saving...' : (editingSender ? 'Update Sender' : 'Create Sender')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Sender Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Test Sender</h3>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => { 
                    setShowTestModal(false); 
                    setTestSender(null); 
                    setTestEmail('');
                  }}
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{testSender?.name}</p>
                    <p className="text-sm text-gray-500">{testSender?.email}</p>
                    <p className="text-xs text-gray-400">Domain: {testSender?.domain?.name}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the email address where you want to receive the test email
                  </p>
                </div>
                

              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  onClick={() => { 
                    setShowTestModal(false); 
                    setTestSender(null); 
                    setTestEmail('');
                  }}
                  disabled={isTestingSender}
                >
                  Cancel
                </button>
                <button
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    isTestingSender || !testEmail || !testEmail.includes('@')
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={handleTestSender}
                  disabled={isTestingSender || !testEmail || !testEmail.includes('@')}
                >
                  {isTestingSender ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSenders;
