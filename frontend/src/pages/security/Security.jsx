import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiShieldCheck,
  HiKey,
  HiDeviceMobile,
  HiClock,
  HiTrash,
  HiPlus,
  HiEye,
  HiEyeOff,
  HiQrcode,
  HiDownload,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiLockClosed,
  HiUser,
  HiGlobe,
} from 'react-icons/hi';
import { formatDate } from '../../utils/helpers';

const Security = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('2fa');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Mock data - replace with actual API calls
  const twoFactorEnabled = user?.two_factor_enabled || false;
  const apiKeys = [
    {
      id: 1,
      name: 'API Key 1',
      key: 'sk_test_1234567890abcdef',
      last_used: '2024-01-15',
      created_at: '2024-01-01',
      permissions: ['read', 'write'],
    },
    {
      id: 2,
      name: 'Mobile App',
      key: 'sk_test_abcdef1234567890',
      last_used: '2024-01-10',
      created_at: '2024-01-05',
      permissions: ['read'],
    },
  ];

  const sessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'New York, US',
      ip: '192.168.1.1',
      last_used: '2024-01-15',
      current: true,
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'San Francisco, US',
      ip: '192.168.1.2',
      last_used: '2024-01-14',
      current: false,
    },
  ];

  const devices = [
    {
      id: 1,
      name: 'iPhone 12',
      type: 'mobile',
      last_used: '2024-01-15',
      trusted: true,
    },
    {
      id: 2,
      name: 'MacBook Pro',
      type: 'desktop',
      last_used: '2024-01-14',
      trusted: true,
    },
  ];

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      // Implement 2FA setup logic
      console.log('Setting up 2FA');
      setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
      setBackupCodes(['123456', '234567', '345678', '456789', '567890']);
      setShow2FAModal(true);
    } catch (error) {
      console.error('2FA setup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    
    setIsLoading(true);
    try {
      // Implement 2FA disable logic
      console.log('Disabling 2FA');
    } catch (error) {
      console.error('2FA disable failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName) return;
    
    setIsLoading(true);
    try {
      // Implement API key creation logic
      console.log('Creating API key:', newApiKeyName);
      setShowApiKeyModal(false);
      setNewApiKeyName('');
    } catch (error) {
      console.error('API key creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    
    setIsLoading(true);
    try {
      // Implement API key deletion logic
      console.log('Deleting API key:', keyId);
    } catch (error) {
      console.error('API key deletion failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      // Implement password change logic
      console.log('Changing password');
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    setIsLoading(true);
    try {
      // Implement session revocation logic
      console.log('Revoking session:', sessionId);
    } catch (error) {
      console.error('Session revocation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrustDevice = async (deviceId) => {
    setIsLoading(true);
    try {
      // Implement device trust logic
      console.log('Trusting device:', deviceId);
    } catch (error) {
      console.error('Device trust failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account security and privacy</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: '2fa', name: 'Two-Factor Authentication', icon: HiShieldCheck },
              { id: 'api-keys', name: 'API Keys', icon: HiKey },
              { id: 'sessions', name: 'Active Sessions', icon: HiClock },
              { id: 'devices', name: 'Trusted Devices', icon: HiDeviceMobile },
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
          {/* 2FA Tab */}
          {activeTab === '2fa' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-gray-600 mt-1">
                      {twoFactorEnabled
                        ? 'Your account is protected with two-factor authentication.'
                        : 'Add an extra layer of security to your account.'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      twoFactorEnabled
                        ? 'bg-success-100 text-success-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {twoFactorEnabled ? (
                        <HiCheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <HiExclamation className="h-4 w-4 mr-1" />
                      )}
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {!twoFactorEnabled ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Enable Two-Factor Authentication</h4>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification.
                    </p>
                    <button
                      onClick={handleEnable2FA}
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Setting up...' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Two-Factor Authentication Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm font-medium text-success-600">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Method</span>
                      <span className="text-sm font-medium">Authenticator App</span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDisable2FA}
                        disabled={isLoading}
                        className="btn btn-danger"
                      >
                        {isLoading ? 'Disabling...' : 'Disable 2FA'}
                      </button>
                      <button className="btn btn-secondary">
                        <HiDownload className="h-4 w-4 mr-2" />
                        Backup Codes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="btn btn-primary flex items-center"
                >
                  <HiPlus className="h-5 w-5 mr-2" />
                  Create API Key
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Used
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
                      {apiKeys.map((key) => (
                        <tr key={key.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {key.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {key.key.substring(0, 12)}...
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {key.permissions.join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(key.last_used)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(key.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteApiKey(key.id)}
                              className="text-danger-600 hover:text-danger-900"
                            >
                              <HiTrash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Used
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.device}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {session.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {session.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(session.last_used)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.current
                                ? 'bg-success-100 text-success-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.current ? 'Current' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!session.current && (
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                className="text-danger-600 hover:text-danger-900"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Trusted Devices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <div key={device.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <HiDeviceMobile className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">{device.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{device.type}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.trusted
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {device.trusted ? 'Trusted' : 'Untrusted'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Used:</span>
                        <span className="font-medium">{formatDate(device.last_used)}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      {!device.trusted && (
                        <button
                          onClick={() => handleTrustDevice(device.id)}
                          className="btn btn-primary btn-sm w-full"
                        >
                          Trust Device
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Set Up Two-Factor Authentication</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                  <p className="text-sm text-gray-600 mt-2">
                    Scan this QR code with your authenticator app
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Backup Codes</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-gray-100 p-2 rounded text-center font-mono text-sm">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create API Key</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    placeholder="Enter a name for this API key"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={!newApiKeyName || isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Creating...' : 'Create API Key'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
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

export default Security; 