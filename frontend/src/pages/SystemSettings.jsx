import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiCog,
  HiServer,
  HiMail,
  HiGlobe,
  HiBell,
  HiExclamationTriangle,
  HiCheckCircle,
  HiRefresh,
} from 'react-icons/hi';
import { systemSettingsService } from '../services/api';

const SystemSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [activeTab, setActiveTab] = useState('system_smtp');
  const [settings, setSettings] = useState({
    system_smtp: {
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'tls',
      from_address: '',
      from_name: '',
    },
    webmail: {
      url: '',
      enabled: false,
    },
    system: {
      app_name: '',
      app_url: '',
      timezone: '',
      max_campaigns_per_day: 50,
      max_recipients_per_campaign: 10000,
    },
    notifications: {
      email_enabled: true,
      telegram_enabled: false,
      telegram_bot_token: '',
    },
  });
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check if user has admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setMessage({
        type: 'error',
        text: 'Access denied. Admin role required to view system settings.',
      });
      setLoading(false);
      return;
    }
    
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingsService.getSettings();
      setSettings(response.data);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load system settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await systemSettingsService.updateSettings(settings);
      setMessage({
        type: 'success',
        text: 'System settings updated successfully',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail) {
      setMessage({
        type: 'error',
        text: 'Please enter an email address to test SMTP configuration',
      });
      return;
    }

    try {
      setTestingSmtp(true);
      await systemSettingsService.testSmtp({ email: testEmail });
      setMessage({
        type: 'success',
        text: `Test email sent successfully to ${testEmail}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send test email',
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: 'system_smtp', name: 'System SMTP', icon: HiMail },
    { id: 'webmail', name: 'Webmail', icon: HiGlobe },
    { id: 'system', name: 'System', icon: HiServer },
    { id: 'notifications', name: 'Notifications', icon: HiBell },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamationTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to access system settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <HiCog className="h-8 w-8 mr-3 text-primary-600" />
          System Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Configure system-wide settings including SMTP, webmail, and notifications.
        </p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <div className="flex">
            {message.type === 'success' ? (
              <HiCheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <HiExclamationTriangle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* System SMTP Settings */}
          {activeTab === 'system_smtp' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  System SMTP Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure SMTP settings for system notifications (separate from campaign sending).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.system_smtp.host}
                    onChange={(e) => updateSetting('system_smtp', 'host', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="smtp.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.system_smtp.port}
                    onChange={(e) => updateSetting('system_smtp', 'port', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={settings.system_smtp.username}
                    onChange={(e) => updateSetting('system_smtp', 'username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="your-username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={settings.system_smtp.password}
                    onChange={(e) => updateSetting('system_smtp', 'password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="your-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encryption
                  </label>
                  <select
                    value={settings.system_smtp.encryption}
                    onChange={(e) => updateSetting('system_smtp', 'encryption', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Address
                  </label>
                  <input
                    type="email"
                    value={settings.system_smtp.from_address}
                    onChange={(e) => updateSetting('system_smtp', 'from_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="noreply@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={settings.system_smtp.from_name}
                    onChange={(e) => updateSetting('system_smtp', 'from_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="System Notifications"
                  />
                </div>
              </div>

              {/* Test SMTP */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Test SMTP Configuration</h4>
                <div className="flex space-x-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter email to test SMTP configuration"
                  />
                  <button
                    onClick={handleTestSmtp}
                    disabled={testingSmtp || !testEmail}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {testingSmtp ? (
                      <>
                        <HiRefresh className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Send Test Email'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Webmail Settings */}
          {activeTab === 'webmail' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Webmail Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure webmail URL where users can login to view campaign results and responses.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.webmail.enabled}
                      onChange={(e) => updateSetting('webmail', 'enabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Webmail</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webmail URL
                  </label>
                  <input
                    type="url"
                    value={settings.webmail.url}
                    onChange={(e) => updateSetting('webmail', 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://webmail.example.com"
                    disabled={!settings.webmail.enabled}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Users will be redirected to this URL to view campaign responses and manage emails.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  General System Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure general system settings and limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={settings.system.app_name}
                    onChange={(e) => updateSetting('system', 'app_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="WebMail Laravel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application URL
                  </label>
                  <input
                    type="url"
                    value={settings.system.app_url}
                    onChange={(e) => updateSetting('system', 'app_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://your-app.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={settings.system.timezone}
                    onChange={(e) => updateSetting('system', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="UTC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Campaigns Per Day
                  </label>
                  <input
                    type="number"
                    value={settings.system.max_campaigns_per_day}
                    onChange={(e) => updateSetting('system', 'max_campaigns_per_day', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    max="1000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Recipients Per Campaign
                  </label>
                  <input
                    type="number"
                    value={settings.system.max_recipients_per_campaign}
                    onChange={(e) => updateSetting('system', 'max_recipients_per_campaign', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    max="100000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Notification Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure notification delivery methods and settings.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email_enabled}
                      onChange={(e) => updateSetting('notifications', 'email_enabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Email Notifications</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.telegram_enabled}
                      onChange={(e) => updateSetting('notifications', 'telegram_enabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Telegram Notifications</span>
                  </label>
                </div>

                {settings.notifications.telegram_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram Bot Token
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.telegram_bot_token}
                      onChange={(e) => updateSetting('notifications', 'telegram_bot_token', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Bot token from @BotFather"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <HiRefresh className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
