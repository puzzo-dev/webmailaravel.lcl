import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiCog,
  HiServer,
  HiDatabase,
  HiGlobe,
  HiMail,
  HiShieldCheck,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
  HiSave,
  HiRefresh,
  HiEye,
  HiPencil,
  HiTrash,
  HiPlus,
  HiKey,
  HiLockClosed,
  HiUser,
  HiChartBar,
} from 'react-icons/hi';

const AdminSystem = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Mock data - replace with actual API calls
  const systemStatus = {
    status: 'healthy',
    uptime: '15 days, 3 hours, 45 minutes',
    version: '1.0.0',
    last_backup: '2024-01-15T10:30:45Z',
    database_status: 'connected',
    cache_status: 'running',
    queue_status: 'running',
    storage_usage: 75.5,
    memory_usage: 45.2,
    cpu_usage: 23.1,
  };

  const systemConfig = {
    app: {
      name: 'Email Campaign Manager',
      environment: 'production',
      debug: false,
      maintenance_mode: false,
      timezone: 'UTC',
      locale: 'en',
    },
    database: {
      connection: 'sqlite',
      host: 'localhost',
      port: 3306,
      database: 'webmailaravel',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
    },
    mail: {
      driver: 'smtp',
      host: 'smtp.mailtrap.io',
      port: 2525,
      username: 'user@example.com',
      encryption: 'tls',
      from_address: 'noreply@example.com',
      from_name: 'Email Campaign Manager',
    },
    queue: {
      default: 'database',
      connections: {
        database: {
          driver: 'database',
          table: 'jobs',
          queue: 'default',
          retry_after: 90,
        },
      },
    },
    cache: {
      default: 'file',
      stores: {
        file: {
          driver: 'file',
          path: '/storage/framework/cache/data',
        },
      },
    },
    session: {
      driver: 'file',
      lifetime: 120,
      expire_on_close: false,
      encrypt: false,
      files: '/storage/framework/sessions',
      connection: null,
      table: 'sessions',
      store: null,
      lottery: [2, 100],
      cookie: 'laravel_session',
      path: '/',
      domain: null,
      secure: false,
      http_only: true,
      same_site: 'lax',
    },
    logging: {
      default: 'stack',
      channels: {
        stack: {
          driver: 'stack',
          channels: ['single'],
          ignore_exceptions: false,
        },
        single: {
          driver: 'single',
          path: '/storage/logs/laravel.log',
          level: 'debug',
        },
      },
    },
    btcpay: {
      base_url: 'https://btcpay.example.com',
      api_key: 'your-btcpay-api-key',
      store_id: 'your-store-id',
      webhook_secret: 'your-webhook-secret',
      currency: 'USD',
    },
    telegram: {
      bot_token: 'your-telegram-bot-token',
      chat_id: 'your-chat-id',
      enabled: true,
    },
    powermta: {
      base_url: 'http://localhost:8080',
      api_key: 'your-powermta-api-key',
      config_path: '/etc/pmta/config',
      accounting_path: '/var/log/pmta/acct-*.csv',
      fbl_path: '/var/log/pmta/fbl-*.csv',
      diag_path: '/var/log/pmta/diag-*.csv',
    },
  };

  const securitySettings = {
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: true,
    session_timeout: 120,
    max_login_attempts: 5,
    lockout_duration: 15,
    require_2fa: false,
    api_rate_limit: 1000,
    webhook_timeout: 30,
  };

  const handleSaveConfig = async (section, config) => {
    setIsLoading(true);
    try {
      // Implement save config API call
      console.log('Saving config for section:', section, config);
      setShowEditModal(false);
      setSelectedConfig(null);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      // Implement refresh status API call
      console.log('Refreshing system status');
    } catch (error) {
      console.error('Failed to refresh status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'disconnected':
      case 'stopped':
        return 'danger';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'warning':
        return <HiExclamation className="h-4 w-4" />;
      case 'error':
      case 'disconnected':
      case 'stopped':
        return <HiXCircle className="h-4 w-4" />;
      default:
        return <HiInformationCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
            <p className="text-gray-600 mt-1">Manage system settings and monitor system status</p>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={isLoading}
            className="btn btn-secondary flex items-center"
          >
            <HiRefresh className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(systemStatus.status)}-100 text-${getStatusColor(systemStatus.status)}-800`}>
            {getStatusIcon(systemStatus.status)}
            <span className="ml-1">{systemStatus.status}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">{systemStatus.uptime}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Version</p>
            <p className="text-lg font-semibold text-gray-900">{systemStatus.version}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Backup</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(systemStatus.last_backup).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Database</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(systemStatus.database_status)}-100 text-${getStatusColor(systemStatus.database_status)}-800`}>
              {getStatusIcon(systemStatus.database_status)}
              <span className="ml-1">{systemStatus.database_status}</span>
            </span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Storage Usage</p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{systemStatus.storage_usage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    systemStatus.storage_usage > 80 ? 'bg-red-600' : 
                    systemStatus.storage_usage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${systemStatus.storage_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Memory Usage</p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{systemStatus.memory_usage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    systemStatus.memory_usage > 80 ? 'bg-red-600' : 
                    systemStatus.memory_usage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${systemStatus.memory_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">CPU Usage</p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{systemStatus.cpu_usage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    systemStatus.cpu_usage > 80 ? 'bg-red-600' : 
                    systemStatus.cpu_usage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${systemStatus.cpu_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: HiServer },
              { id: 'app', name: 'Application', icon: HiCog },
              { id: 'database', name: 'Database', icon: HiDatabase },
              { id: 'mail', name: 'Mail', icon: HiMail },
              { id: 'queue', name: 'Queue', icon: HiClock },
              { id: 'cache', name: 'Cache', icon: HiGlobe },
              { id: 'session', name: 'Session', icon: HiUser },
              { id: 'logging', name: 'Logging', icon: HiChartBar },
              { id: 'security', name: 'Security', icon: HiShieldCheck },
              { id: 'btcpay', name: 'BTCPay', icon: HiKey },
              { id: 'telegram', name: 'Telegram', icon: HiMail },
              { id: 'powermta', name: 'PowerMTA', icon: HiServer },
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Service Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(systemStatus.database_status)}-100 text-${getStatusColor(systemStatus.database_status)}-800`}>
                        {getStatusIcon(systemStatus.database_status)}
                        <span className="ml-1">{systemStatus.database_status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cache</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(systemStatus.cache_status)}-100 text-${getStatusColor(systemStatus.cache_status)}-800`}>
                        {getStatusIcon(systemStatus.cache_status)}
                        <span className="ml-1">{systemStatus.cache_status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Queue</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(systemStatus.queue_status)}-100 text-${getStatusColor(systemStatus.queue_status)}-800`}>
                        {getStatusIcon(systemStatus.queue_status)}
                        <span className="ml-1">{systemStatus.queue_status}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">System Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Environment</span>
                      <span className="text-sm font-medium">{systemConfig.app.environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Debug Mode</span>
                      <span className="text-sm font-medium">{systemConfig.app.debug ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Maintenance Mode</span>
                      <span className="text-sm font-medium">{systemConfig.app.maintenance_mode ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Timezone</span>
                      <span className="text-sm font-medium">{systemConfig.app.timezone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Tabs */}
          {activeTab !== 'overview' && activeTab !== 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 capitalize">
                  {activeTab} Configuration
                </h4>
                <button
                  onClick={() => {
                    setSelectedConfig(systemConfig[activeTab]);
                    setShowEditModal(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <HiPencil className="h-4 w-4 mr-2" />
                  Edit Configuration
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(systemConfig[activeTab] || {}).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="text-sm text-gray-900 bg-white p-3 rounded-md border">
                        {typeof value === 'boolean' ? (
                          <span className={value ? 'text-success-600' : 'text-gray-500'}>
                            {value ? 'Enabled' : 'Disabled'}
                          </span>
                        ) : typeof value === 'object' ? (
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Security Settings</h4>
                <button
                  onClick={() => {
                    setSelectedConfig(securitySettings);
                    setShowEditModal(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <HiPencil className="h-4 w-4 mr-2" />
                  Edit Security Settings
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h5 className="text-md font-medium text-gray-900 mb-4">Password Policy</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Minimum Length</span>
                      <span className="text-sm font-medium">{securitySettings.password_min_length} characters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Require Uppercase</span>
                      <span className="text-sm font-medium">{securitySettings.password_require_uppercase ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Require Lowercase</span>
                      <span className="text-sm font-medium">{securitySettings.password_require_lowercase ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Require Numbers</span>
                      <span className="text-sm font-medium">{securitySettings.password_require_numbers ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Require Symbols</span>
                      <span className="text-sm font-medium">{securitySettings.password_require_symbols ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h5 className="text-md font-medium text-gray-900 mb-4">Session & Access</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Session Timeout</span>
                      <span className="text-sm font-medium">{securitySettings.session_timeout} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Max Login Attempts</span>
                      <span className="text-sm font-medium">{securitySettings.max_login_attempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lockout Duration</span>
                      <span className="text-sm font-medium">{securitySettings.lockout_duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Require 2FA</span>
                      <span className="text-sm font-medium">{securitySettings.require_2fa ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">API Rate Limit</span>
                      <span className="text-sm font-medium">{securitySettings.api_rate_limit} requests/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Configuration Modal */}
      {showEditModal && selectedConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Configuration</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <HiExclamation className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>• Changes to system configuration may affect application behavior</p>
                        <p>• Some changes may require a system restart to take effect</p>
                        <p>• Make sure to backup your configuration before making changes</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedConfig).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {typeof value === 'boolean' ? (
                        <select
                          defaultValue={value.toString()}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          defaultValue={value}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <input
                          type="text"
                          defaultValue={value}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveConfig(activeTab, selectedConfig)}
                    disabled={isLoading}
                    className="btn btn-primary flex items-center"
                  >
                    <HiSave className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystem; 