import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  EnvelopeIcon,
  UserIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  FunnelIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminSenders = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
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

  // Mock data - replace with actual API calls
  const mockSenders = [
    {
      id: 1,
      name: 'Marketing Team',
      email: 'marketing@example.com',
      domain: { id: 1, name: 'example.com', status: 'active' },
      user: { id: 1, name: 'John Doe', email: 'john@example.com' },
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      stats: {
        campaigns_sent: 45,
        total_emails: 125000,
        success_rate: 98.5,
        last_used: '2024-01-15T14:20:00Z'
      }
    },
    {
      id: 2,
      name: 'Support Team',
      email: 'support@company.com',
      domain: { id: 2, name: 'company.com', status: 'active' },
      user: { id: 2, name: 'Jane Smith', email: 'jane@company.com' },
      is_active: true,
      created_at: '2024-01-14T09:15:00Z',
      stats: {
        campaigns_sent: 12,
        total_emails: 8500,
        success_rate: 99.2,
        last_used: '2024-01-15T11:45:00Z'
      }
    },
    {
      id: 3,
      name: 'Sales Team',
      email: 'sales@example.com',
      domain: { id: 1, name: 'example.com', status: 'active' },
      user: { id: 3, name: 'Mike Johnson', email: 'mike@example.com' },
      is_active: false,
      created_at: '2024-01-13T16:20:00Z',
      stats: {
        campaigns_sent: 8,
        total_emails: 3200,
        success_rate: 97.8,
        last_used: '2024-01-14T10:30:00Z'
      }
    }
  ];

  useEffect(() => {
    fetchSenders();
    fetchDomains();
  }, []);

  const fetchSenders = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setTimeout(() => {
        setSenders(mockSenders);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching senders:', error);
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      // Replace with actual API call
      const mockDomains = [
        { id: 1, name: 'example.com' },
        { id: 2, name: 'company.com' },
        { id: 3, name: 'testdomain.com' }
      ];
      setDomains(mockDomains);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleStatusChange = async (senderId, status) => {
    try {
      // Replace with actual API call
      setSenders(prev => prev.map(sender => 
        sender.id === senderId ? { ...sender, is_active: status } : sender
      ));
      toast.success(`Sender ${status ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating sender status:', error);
      toast.error('Failed to update sender status');
    }
  };

  const handleDelete = async (senderId) => {
    if (!confirm('Are you sure you want to delete this sender?')) return;
    
    try {
      // Replace with actual API call
      setSenders(prev => prev.filter(sender => sender.id !== senderId));
      toast.success('Sender deleted successfully');
    } catch (error) {
      console.error('Error deleting sender:', error);
      toast.error('Failed to delete sender');
    }
  };

  const handleCreateSender = async () => {
    try {
      const newSender = {
        id: Date.now(),
        ...senderForm,
        domain: domains.find(d => d.id === parseInt(senderForm.domain_id)),
        user: { id: 1, name: 'Current User', email: 'user@example.com' },
        created_at: new Date().toISOString(),
        stats: {
          campaigns_sent: 0,
          total_emails: 0,
          success_rate: 0,
          last_used: null
        }
      };
      
      setSenders(prev => [newSender, ...prev]);
      setShowModal(false);
      setSenderForm({ name: '', email: '', domain_id: '', is_active: true });
      toast.success('Sender created successfully');
    } catch (error) {
      console.error('Error creating sender:', error);
      toast.error('Failed to create sender');
    }
  };

  const handleEditSender = async () => {
    try {
      setSenders(prev => prev.map(sender => 
        sender.id === editingSender.id 
          ? { 
              ...sender, 
              ...senderForm,
              domain: domains.find(d => d.id === parseInt(senderForm.domain_id))
            }
          : sender
      ));
      setShowModal(false);
      setEditingSender(null);
      setSenderForm({ name: '', email: '', domain_id: '', is_active: true });
      toast.success('Sender updated successfully');
    } catch (error) {
      console.error('Error updating sender:', error);
      toast.error('Failed to update sender');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSenders.length === 0) {
      toast.error('Please select senders to perform bulk action');
      return;
    }

    try {
      switch (action) {
        case 'activate':
          setSenders(prev => prev.map(sender => 
            selectedSenders.includes(sender.id) ? { ...sender, is_active: true } : sender
          ));
          toast.success(`${selectedSenders.length} senders activated`);
          break;
        case 'deactivate':
          setSenders(prev => prev.map(sender => 
            selectedSenders.includes(sender.id) ? { ...sender, is_active: false } : sender
          ));
          toast.success(`${selectedSenders.length} senders deactivated`);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedSenders.length} senders?`)) {
            setSenders(prev => prev.filter(sender => !selectedSenders.includes(sender.id)));
            toast.success(`${selectedSenders.length} senders deleted`);
          }
          break;
      }
      setSelectedSenders([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const openCreateModal = () => {
    setEditingSender(null);
    setSenderForm({ name: '', email: '', domain_id: '', is_active: true });
    setShowModal(true);
  };

  const openEditModal = (sender) => {
    setEditingSender(sender);
    setSenderForm({
      name: sender.name,
      email: sender.email,
      domain_id: sender.domain.id.toString(),
      is_active: sender.is_active
    });
    setShowModal(true);
  };

  const filteredSenders = senders.filter(sender => {
    return (
      (!filters.status || (filters.status === 'active' ? sender.is_active : !sender.is_active)) &&
      (!filters.domain || sender.domain.name.toLowerCase().includes(filters.domain.toLowerCase())) &&
      (!filters.user || sender.user.name.toLowerCase().includes(filters.user.toLowerCase())) &&
      (!filters.search || 
        sender.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        sender.email.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sender Management</h1>
          <p className="text-gray-600">Manage email senders and their configurations</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Sender
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Senders</p>
              <p className="text-2xl font-bold text-gray-900">{senders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Senders</p>
              <p className="text-2xl font-bold text-gray-900">
                {senders.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {senders.reduce((acc, s) => acc + s.stats.campaigns_sent, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-info-100 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(senders.reduce((acc, s) => acc + s.stats.total_emails, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search senders..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input
              type="text"
              placeholder="Filter by domain..."
              value={filters.domain}
              onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <input
              type="text"
              placeholder="Filter by user..."
              value={filters.user}
              onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSenders.length > 0 && (
          <div className="flex items-center space-x-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">
              {selectedSenders.length} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn btn-sm btn-success"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn btn-sm btn-warning"
              >
                <PauseIcon className="h-4 w-4 mr-1" />
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="btn btn-sm btn-danger"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Senders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedSenders.length === filteredSenders.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSenders(filteredSenders.map(s => s.id));
                      } else {
                        setSelectedSenders([]);
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
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
                  Statistics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSenders.map((sender) => (
                <tr key={sender.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSenders.includes(sender.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSenders(prev => [...prev, sender.id]);
                        } else {
                          setSelectedSenders(prev => prev.filter(id => id !== sender.id));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sender.name}</div>
                      <div className="text-sm text-gray-500">{sender.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{sender.domain.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{sender.user.name}</div>
                      <div className="text-sm text-gray-500">{sender.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sender.is_active 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sender.is_active ? (
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircleIcon className="h-3 w-3 mr-1" />
                      )}
                      {sender.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {sender.stats.campaigns_sent} campaigns
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatNumber(sender.stats.total_emails)} emails ({sender.stats.success_rate}% success)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sender.stats.last_used ? formatDate(sender.stats.last_used) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openEditModal(sender)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(sender.id, !sender.is_active)}
                        className={`${
                          sender.is_active 
                            ? 'text-warning-600 hover:text-warning-900' 
                            : 'text-success-600 hover:text-success-900'
                        }`}
                        title={sender.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {sender.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(sender.id)}
                        className="text-danger-600 hover:text-danger-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Sender Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSender ? 'Edit Sender' : 'Create New Sender'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={senderForm.name}
                    onChange={(e) => setSenderForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter sender name"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={senderForm.email}
                    onChange={(e) => setSenderForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain
                  </label>
                  <select
                    value={senderForm.domain_id}
                    onChange={(e) => setSenderForm(prev => ({ ...prev, domain_id: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="">Select Domain</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={senderForm.is_active}
                    onChange={(e) => setSenderForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Active
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
                  disabled={!senderForm.name || !senderForm.email || !senderForm.domain_id}
                  className="btn btn-primary"
                >
                  {editingSender ? 'Update' : 'Create'} Sender
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
