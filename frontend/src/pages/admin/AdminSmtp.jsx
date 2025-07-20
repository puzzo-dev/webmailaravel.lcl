import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiServer as ServerIcon,
  HiCog as CogIcon,
  HiCheckCircle as CheckCircleIcon,
  HiXCircle as XCircleIcon,
  HiExclamationTriangle as ExclamationTriangleIcon,
  HiPlay as PlayIcon,
  HiPause as PauseIcon,
  HiPlus as PlusIcon,
  HiPencil as PencilIcon,
  HiTrash as TrashIcon,
  HiEye as EyeIcon,
  HiEyeSlash as EyeSlashIcon,
  HiKey as KeyIcon,
  HiGlobeAlt as GlobeAltIcon,
  HiEnvelope as EnvelopeIcon,
  HiShieldCheck as ShieldCheckIcon,
  HiClock as ClockIcon,
  HiChartBar as ChartBarIcon
} from 'react-icons/hi2';
import { adminService } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminSmtp = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('configurations');
  const [smtpConfigs, setSmtpConfigs] = useState([]);
  const [domains, setDomains] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [editingConfig, setEditingConfig] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);
  const [configForm, setConfigForm] = useState({
    domain_id: '',
    host: '',
    port: 587,
    encryption: 'tls',
    username: '',
    password: '',
    from_name: '',
    from_email: '',
    is_active: true,
    max_emails_per_hour: 1000,
    bounce_handling: true
  });

  // Check if user has admin access
  useEffect(() => {
    if (user?.role === 'admin') {
    fetchSmtpConfigs();
    fetchDomains();
    }
  }, [user]);

  const fetchSmtpConfigs = async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await adminService.getSmtpConfigs();
      setSmtpConfigs(response.data || []);
    } catch (error) {
      setError('Failed to load SMTP configurations');
      toast.error('Failed to load SMTP configurations');
      console.error('Error fetching SMTP configs:', error);
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

  const handleTestConnection = async (configId) => {
    setTestingConnection(configId);
    try {
      await adminService.testSmtpConnection(configId);
      toast.success('SMTP connection test successful');
      await fetchSmtpConfigs(); // Refresh data
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      toast.error('SMTP connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleStatusChange = async (configId, status) => {
    try {
      setActionLoading(true);
      await adminService.updateSmtpConfigStatus(configId, status);
      toast.success(`SMTP configuration ${status ? 'activated' : 'deactivated'} successfully`);
      await fetchSmtpConfigs(); // Refresh data
    } catch (error) {
      console.error('Error updating SMTP config status:', error);
      toast.error('Failed to update SMTP configuration status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (configId) => {
    if (!confirm('Are you sure you want to delete this SMTP configuration?')) return;
    
    try {
      setActionLoading(true);
      await adminService.deleteSmtpConfig(configId);
      toast.success('SMTP configuration deleted successfully');
      await fetchSmtpConfigs(); // Refresh data
    } catch (error) {
      console.error('Error deleting SMTP config:', error);
      toast.error('Failed to delete SMTP configuration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!configForm.domain_id || !configForm.host || !configForm.username || !configForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.createSmtpConfig(configForm);
      toast.success('SMTP configuration created successfully');
      setShowModal(false);
      resetForm();
      await fetchSmtpConfigs(); // Refresh data
    } catch (error) {
      console.error('Error creating SMTP config:', error);
      toast.error('Failed to create SMTP configuration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditConfig = async () => {
    if (!editingConfig || !configForm.domain_id || !configForm.host || !configForm.username) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.updateSmtpConfig(editingConfig.id, configForm);
      toast.success('SMTP configuration updated successfully');
      setShowModal(false);
      resetForm();
      await fetchSmtpConfigs(); // Refresh data
    } catch (error) {
      console.error('Error updating SMTP config:', error);
      toast.error('Failed to update SMTP configuration');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setConfigForm({
      domain_id: '',
      host: '',
      port: 587,
      encryption: 'tls',
      username: '',
      password: '',
      from_name: '',
      from_email: '',
      is_active: true,
      max_emails_per_hour: 1000,
      bounce_handling: true
    });
    setEditingConfig(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setConfigForm({
      domain_id: config.domain_id || config.domain?.id || '',
      host: config.host,
      port: config.port,
      encryption: config.encryption,
      username: config.username,
      password: '', // Don't populate password for security
      from_name: config.from_name,
      from_email: config.from_email,
      is_active: config.is_active,
      max_emails_per_hour: config.max_emails_per_hour,
      bounce_handling: config.bounce_handling
    });
    setShowModal(true);
  };

  const togglePasswordVisibility = (configId) => {
    setShowPassword(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      error: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
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
                <p>You need admin privileges to manage SMTP configurations.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">SMTP Management</h1>
          <p className="text-gray-600">Manage SMTP configurations for all domains</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add SMTP Config
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
                <p>{error}</p>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
        <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('configurations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configurations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configurations
          </button>
                <button
            onClick={() => setActiveTab('statistics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
            Statistics
                </button>
          </nav>
        </div>

      {/* SMTP Configurations */}
          {activeTab === 'configurations' && (
        <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMTP Server
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Tested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                {smtpConfigs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No SMTP configurations found
                    </td>
                  </tr>
                ) : (
                  smtpConfigs.map((config) => (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {config.domain?.name || 'Unknown Domain'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {config.domain?.id || 'No domain'}
                            </div>
                          </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                          <div className="text-sm font-medium text-gray-900">
                            {config.host}:{config.port}
                            </div>
                          <div className="text-sm text-gray-500">
                            {config.username} • {config.encryption?.toUpperCase()}
                          </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                          <div className="text-sm font-medium text-gray-900">
                            {config.from_name || 'Not Set'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {config.from_email || 'Not Set'}
                          </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(config.is_active ? 'active' : 'inactive')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {config.last_tested ? formatDate(config.last_tested) : 'Never tested'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                            <button
                              onClick={() => handleTestConnection(config.id)}
                              disabled={testingConnection === config.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Test Connection"
                            >
                                <PlayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(config)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Configuration"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(config.id, !config.is_active)}
                            disabled={actionLoading}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title={config.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {config.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(config.id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete Configuration"
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
            </div>
          )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                    </div>
                      </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Configurations</p>
                <p className="text-2xl font-bold text-gray-900">{smtpConfigs.length}</p>
                      </div>
                      </div>
                    </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Configurations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {smtpConfigs.filter(config => config.is_active).length}
                </p>
                          </div>
                        </div>
                      </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                </div>
                  </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactive Configurations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {smtpConfigs.filter(config => !config.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConfig ? 'Edit SMTP Configuration' : 'Create SMTP Configuration'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain *
                  </label>
                  <select
                    value={configForm.domain_id}
                    onChange={(e) => setConfigForm({ ...configForm, domain_id: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    value={configForm.host}
                    onChange={(e) => setConfigForm({ ...configForm, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={configForm.port}
                    onChange={(e) => setConfigForm({ ...configForm, port: parseInt(e.target.value) })}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Encryption
                  </label>
                  <select
                    value={configForm.encryption}
                    onChange={(e) => setConfigForm({ ...configForm, encryption: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={configForm.username}
                    onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })}
                    placeholder="smtp@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={configForm.password}
                    onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={configForm.from_name}
                    onChange={(e) => setConfigForm({ ...configForm, from_name: e.target.value })}
                    placeholder="Your Company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={configForm.from_email}
                    onChange={(e) => setConfigForm({ ...configForm, from_email: e.target.value })}
                    placeholder="noreply@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Emails Per Hour
                  </label>
                  <input
                    type="number"
                    value={configForm.max_emails_per_hour}
                    onChange={(e) => setConfigForm({ ...configForm, max_emails_per_hour: parseInt(e.target.value) })}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configForm.is_active}
                      onChange={(e) => setConfigForm({ ...configForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configForm.bounce_handling}
                      onChange={(e) => setConfigForm({ ...configForm, bounce_handling: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Bounce Handling</span>
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
                  onClick={editingConfig ? handleEditConfig : handleCreateConfig}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Saving...' : (editingConfig ? 'Update Configuration' : 'Create Configuration')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSmtp;
