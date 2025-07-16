import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  ServerIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatNumber } from '../../utils/helpers';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const AdminSmtp = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
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

  // Mock data
  const mockConfigs = [
    {
      id: 1,
      domain: { id: 1, name: 'example.com' },
      host: 'smtp.gmail.com',
      port: 587,
      encryption: 'tls',
      username: 'smtp@example.com',
      password: 'encrypted_password',
      from_name: 'Example Team',
      from_email: 'noreply@example.com',
      is_active: true,
      max_emails_per_hour: 1000,
      bounce_handling: true,
      created_at: '2024-01-15T10:30:00Z',
      last_tested: '2024-01-15T14:20:00Z',
      stats: {
        emails_sent_today: 450,
        success_rate: 98.5,
        bounce_rate: 1.2,
        complaint_rate: 0.1,
        last_error: null
      }
    },
    {
      id: 2,
      domain: { id: 2, name: 'company.com' },
      host: 'smtp.mailgun.org',
      port: 587,
      encryption: 'tls',
      username: 'postmaster@mg.company.com',
      password: 'encrypted_password',
      from_name: 'Company Support',
      from_email: 'support@company.com',
      is_active: true,
      max_emails_per_hour: 2000,
      bounce_handling: true,
      created_at: '2024-01-14T09:15:00Z',
      last_tested: '2024-01-15T11:45:00Z',
      stats: {
        emails_sent_today: 120,
        success_rate: 99.1,
        bounce_rate: 0.8,
        complaint_rate: 0.05,
        last_error: null
      }
    },
    {
      id: 3,
      domain: { id: 3, name: 'testdomain.com' },
      host: 'smtp.sendgrid.net',
      port: 587,
      encryption: 'tls',
      username: 'apikey',
      password: 'encrypted_api_key',
      from_name: 'Test Team',
      from_email: 'test@testdomain.com',
      is_active: false,
      max_emails_per_hour: 500,
      bounce_handling: false,
      created_at: '2024-01-13T16:20:00Z',
      last_tested: null,
      stats: {
        emails_sent_today: 0,
        success_rate: 0,
        bounce_rate: 0,
        complaint_rate: 0,
        last_error: 'Connection timeout'
      }
    }
  ];

  useEffect(() => {
    fetchSmtpConfigs();
    fetchDomains();
  }, []);

  const fetchSmtpConfigs = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setTimeout(() => {
        setSmtpConfigs(mockConfigs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching SMTP configs:', error);
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      // Replace with actual API call
      const mockDomains = [
        { id: 1, name: 'example.com' },
        { id: 2, name: 'company.com' },
        { id: 3, name: 'testdomain.com' },
        { id: 4, name: 'newdomain.com' }
      ];
      setDomains(mockDomains);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleTestConnection = async (configId) => {
    setTestingConnection(configId);
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSmtpConfigs(prev => prev.map(config => 
        config.id === configId 
          ? { ...config, last_tested: new Date().toISOString() }
          : config
      ));
      
      toast.success('SMTP connection test successful');
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      toast.error('SMTP connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleStatusChange = async (configId, status) => {
    try {
      setSmtpConfigs(prev => prev.map(config => 
        config.id === configId ? { ...config, is_active: status } : config
      ));
      toast.success(`SMTP configuration ${status ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating SMTP config status:', error);
      toast.error('Failed to update SMTP configuration status');
    }
  };

  const handleDelete = async (configId) => {
    if (!confirm('Are you sure you want to delete this SMTP configuration?')) return;
    
    try {
      setSmtpConfigs(prev => prev.filter(config => config.id !== configId));
      toast.success('SMTP configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting SMTP config:', error);
      toast.error('Failed to delete SMTP configuration');
    }
  };

  const handleCreateConfig = async () => {
    try {
      const newConfig = {
        id: Date.now(),
        ...configForm,
        domain: domains.find(d => d.id === parseInt(configForm.domain_id)),
        created_at: new Date().toISOString(),
        last_tested: null,
        stats: {
          emails_sent_today: 0,
          success_rate: 0,
          bounce_rate: 0,
          complaint_rate: 0,
          last_error: null
        }
      };
      
      setSmtpConfigs(prev => [newConfig, ...prev]);
      setShowModal(false);
      resetForm();
      toast.success('SMTP configuration created successfully');
    } catch (error) {
      console.error('Error creating SMTP config:', error);
      toast.error('Failed to create SMTP configuration');
    }
  };

  const handleEditConfig = async () => {
    try {
      setSmtpConfigs(prev => prev.map(config => 
        config.id === editingConfig.id 
          ? { 
              ...config, 
              ...configForm,
              domain: domains.find(d => d.id === parseInt(configForm.domain_id))
            }
          : config
      ));
      setShowModal(false);
      setEditingConfig(null);
      resetForm();
      toast.success('SMTP configuration updated successfully');
    } catch (error) {
      console.error('Error updating SMTP config:', error);
      toast.error('Failed to update SMTP configuration');
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
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setConfigForm({
      domain_id: config.domain.id.toString(),
      host: config.host,
      port: config.port,
      encryption: config.encryption,
      username: config.username,
      password: config.password,
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

  const totalEmailsToday = smtpConfigs.reduce((acc, config) => acc + config.stats.emails_sent_today, 0);
  const averageSuccessRate = smtpConfigs.length > 0 
    ? smtpConfigs.reduce((acc, config) => acc + config.stats.success_rate, 0) / smtpConfigs.length 
    : 0;
  const activeConfigs = smtpConfigs.filter(config => config.is_active).length;

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
          <h1 className="text-2xl font-bold text-gray-900">SMTP Configuration</h1>
          <p className="text-gray-600">Manage SMTP servers and email delivery settings</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add SMTP Config
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ServerIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Configs</p>
              <p className="text-2xl font-bold text-gray-900">{smtpConfigs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Configs</p>
              <p className="text-2xl font-bold text-gray-900">{activeConfigs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-info-100 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emails Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalEmailsToday)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{averageSuccessRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'configurations', name: 'Configurations', icon: CogIcon },
              { id: 'monitoring', name: 'Monitoring', icon: ChartBarIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Configurations Tab */}
          {activeTab === 'configurations' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain & Host
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Connection
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {smtpConfigs.map((config) => (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center">
                              <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{config.domain.name}</span>
                            </div>
                            <div className="text-sm text-gray-500">{config.host}:{config.port}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {config.encryption.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{config.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{config.from_name}</div>
                            <div className="text-sm text-gray-500">{config.from_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              config.is_active 
                                ? 'bg-success-100 text-success-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {config.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {config.last_tested && (
                              <span className="text-xs text-gray-500">
                                Tested {formatDate(config.last_tested)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">{config.stats.emails_sent_today} today</div>
                            <div className="text-gray-500">{config.stats.success_rate}% success</div>
                            {config.stats.last_error && (
                              <div className="text-red-500 text-xs">{config.stats.last_error}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleTestConnection(config.id)}
                              disabled={testingConnection === config.id}
                              className="text-blue-600 hover:text-blue-900"
                              title="Test Connection"
                            >
                              {testingConnection === config.id ? (
                                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <PlayIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(config)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(config.id, !config.is_active)}
                              className={`${
                                config.is_active 
                                  ? 'text-warning-600 hover:text-warning-900' 
                                  : 'text-success-600 hover:text-success-900'
                              }`}
                              title={config.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {config.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(config.id)}
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
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {smtpConfigs.map((config) => (
                  <div key={config.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{config.domain.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.is_active 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Emails Today:</span>
                        <span className="text-sm font-medium text-gray-900">{config.stats.emails_sent_today}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate:</span>
                        <span className="text-sm font-medium text-success-600">{config.stats.success_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bounce Rate:</span>
                        <span className="text-sm font-medium text-warning-600">{config.stats.bounce_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Complaint Rate:</span>
                        <span className="text-sm font-medium text-danger-600">{config.stats.complaint_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rate Limit:</span>
                        <span className="text-sm font-medium text-gray-900">{config.max_emails_per_hour}/hr</span>
                      </div>
                    </div>

                    {config.stats.last_error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Last Error</h3>
                            <div className="mt-2 text-sm text-red-700">{config.stats.last_error}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit SMTP Config Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConfig ? 'Edit SMTP Configuration' : 'Create New SMTP Configuration'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain
                  </label>
                  <select
                    value={configForm.domain_id}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, domain_id: e.target.value }))}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={configForm.host}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={configForm.port}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Encryption
                  </label>
                  <select
                    value={configForm.encryption}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, encryption: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={configForm.username}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="your-email@gmail.com"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={configForm.password}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Your password or app password"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={configForm.from_name}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="Your Company"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={configForm.from_email}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="noreply@domain.com"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Emails Per Hour
                  </label>
                  <input
                    type="number"
                    value={configForm.max_emails_per_hour}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, max_emails_per_hour: parseInt(e.target.value) }))}
                    className="input w-full"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configForm.is_active}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configForm.bounce_handling}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, bounce_handling: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable Bounce Handling
                    </label>
                  </div>
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
                  disabled={!configForm.domain_id || !configForm.host || !configForm.username}
                  className="btn btn-primary"
                >
                  {editingConfig ? 'Update' : 'Create'} Configuration
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
