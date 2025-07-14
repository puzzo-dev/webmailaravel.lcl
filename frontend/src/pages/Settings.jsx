import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  HiCog,
  HiBell,
  HiShieldCheck,
  HiMail,
  HiGlobe,
  HiSave,
  HiEye,
  HiEyeOff,
} from 'react-icons/hi';

const Settings = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    timezone: 'UTC',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    campaign_completed: true,
    campaign_failed: true,
    new_login: true,
    security_alerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    two_factor_auth: false,
    session_timeout: 30,
    max_login_attempts: 5,
    require_password_change: false,
  });

  const [apiSettings, setApiSettings] = useState({
    api_key: 'sk_test_1234567890abcdef',
    webhook_url: '',
    rate_limit: 1000,
  });

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    toast.success('General settings updated successfully');
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    toast.success('Notification settings updated successfully');
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    toast.success('Security settings updated successfully');
  };

  const handleApiSubmit = (e) => {
    e.preventDefault();
    toast.success('API settings updated successfully');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleApiChange = (e) => {
    const { name, value } = e.target;
    setApiSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateNewApiKey = () => {
    const newKey = 'sk_test_' + Math.random().toString(36).substr(2, 9);
    setApiSettings(prev => ({
      ...prev,
      api_key: newKey,
    }));
    toast.success('New API key generated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <HiCog className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and application settings</p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Timezone</label>
                  <select
                    name="timezone"
                    value={generalSettings.timezone}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Language</label>
                  <select
                    name="language"
                    value={generalSettings.language}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date Format</label>
                  <select
                    name="date_format"
                    value={generalSettings.date_format}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Time Format</label>
                  <select
                    name="time_format"
                    value={generalSettings.time_format}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="12h">12-hour</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <HiSave className="h-5 w-5 mr-2" />
                  Save General Settings
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    name="email_notifications"
                    checked={notificationSettings.email_notifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Campaign Completed</h3>
                    <p className="text-sm text-gray-500">Notify when campaigns are completed</p>
                  </div>
                  <input
                    type="checkbox"
                    name="campaign_completed"
                    checked={notificationSettings.campaign_completed}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Campaign Failed</h3>
                    <p className="text-sm text-gray-500">Notify when campaigns fail</p>
                  </div>
                  <input
                    type="checkbox"
                    name="campaign_failed"
                    checked={notificationSettings.campaign_failed}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">New Login</h3>
                    <p className="text-sm text-gray-500">Notify on new device login</p>
                  </div>
                  <input
                    type="checkbox"
                    name="new_login"
                    checked={notificationSettings.new_login}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Security Alerts</h3>
                    <p className="text-sm text-gray-500">Notify on security events</p>
                  </div>
                  <input
                    type="checkbox"
                    name="security_alerts"
                    checked={notificationSettings.security_alerts}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <HiBell className="h-5 w-5 mr-2" />
                  Save Notification Settings
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <input
                    type="checkbox"
                    name="two_factor_auth"
                    checked={securitySettings.two_factor_auth}
                    onChange={handleSecurityChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="form-label">Session Timeout (minutes)</label>
                  <select
                    name="session_timeout"
                    value={securitySettings.session_timeout}
                    onChange={handleSecurityChange}
                    className="input"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Max Login Attempts</label>
                  <select
                    name="max_login_attempts"
                    value={securitySettings.max_login_attempts}
                    onChange={handleSecurityChange}
                    className="input"
                  >
                    <option value={3}>3 attempts</option>
                    <option value={5}>5 attempts</option>
                    <option value={10}>10 attempts</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Require Password Change</h3>
                    <p className="text-sm text-gray-500">Force password change on next login</p>
                  </div>
                  <input
                    type="checkbox"
                    name="require_password_change"
                    checked={securitySettings.require_password_change}
                    onChange={handleSecurityChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <HiShieldCheck className="h-5 w-5 mr-2" />
                  Save Security Settings
                </button>
              </div>
            </form>
          )}

          {activeTab === 'api' && (
            <form onSubmit={handleApiSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="form-label">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      name="api_key"
                      value={apiSettings.api_key}
                      onChange={handleApiChange}
                      className="input pr-10"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiKey ? (
                        <HiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <HiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={generateNewApiKey}
                      className="btn btn-secondary btn-sm"
                    >
                      Generate New Key
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(apiSettings.api_key)}
                      className="btn btn-secondary btn-sm"
                    >
                      Copy Key
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Webhook URL</label>
                  <input
                    type="url"
                    name="webhook_url"
                    value={apiSettings.webhook_url}
                    onChange={handleApiChange}
                    className="input"
                    placeholder="https://your-domain.com/webhook"
                  />
                </div>
                <div>
                  <label className="form-label">Rate Limit (requests per hour)</label>
                  <input
                    type="number"
                    name="rate_limit"
                    value={apiSettings.rate_limit}
                    onChange={handleApiChange}
                    className="input"
                    min="100"
                    max="10000"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center">
                  <HiGlobe className="h-5 w-5 mr-2" />
                  Save API Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 