import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiSave,
  HiShieldCheck,
  HiKey,
  HiDeviceMobile,
  HiCog,
  HiBell,
  HiGlobe,
  HiClock,
  HiTrash,
  HiPlus,
  HiQrcode,
  HiDownload,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiExclamationCircle,
  HiPencil,
  HiCamera,
  HiInformationCircle,
  HiSparkles,
  HiShieldExclamation,
  HiClipboard,
  HiRefresh
} from 'react-icons/hi';
import {
  updateProfile,
  updatePassword,
} from '../store/slices/authSlice';
import {
  fetchUserSettings,
  updateGeneralSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateApiSettings,
  generateApiKey,
  updateTelegramSettings,
  testTelegramConnection
} from '../store/slices/settingsSlice';
import {
  fetchSecuritySettings,
  enable2FA,
  disable2FA,
  verify2FA,
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
  fetchActiveSessions,
  revokeSession,
  fetchTrustedDevices,
  trustDevice,
  changePassword,
  clearError,
  clear2FASetup,
} from '../store/slices/securitySlice';

const Account = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userState = useSelector((state) => state.user);
  const { settings, isLoading: settingsLoading } = useSelector((state) => state.settings);
  const {
    twoFactorEnabled,
    twoFactorSecret,
    qrCode,
    backupCodes,
    apiKeys,
    activeSessions,
    trustedDevices,
    isLoading: securityLoading,
    error,
  } = useSelector((state) => state.security);
  
  // Main tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Settings state
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    api_key: '',
    webhook_url: '',
    rate_limit: 1000,
  });

  // Telegram state
  const [telegramSettings, setTelegramSettings] = useState({
    bot_token: '',
    chat_id: '',
  });
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Security state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [securityPasswordData, setSecurityPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchUserSettings());
      dispatch(fetchSecuritySettings());
      dispatch(fetchApiKeys());
      dispatch(fetchActiveSessions());
      dispatch(fetchTrustedDevices());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (settings) {
      setGeneralSettings(settings.general || generalSettings);
      setNotificationSettings(settings.notifications || notificationSettings);
      setSecuritySettings(settings.security || securitySettings);
      setApiSettings(settings.api || apiSettings);
    }
  }, [settings]);

  useEffect(() => {
    if (settings && settings.telegram) {
      setTelegramSettings({
        bot_token: settings.telegram.bot_token || '',
        chat_id: settings.telegram.chat_id || '',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Profile handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await dispatch(updatePassword(passwordData)).unwrap();
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Settings handlers
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(updateGeneralSettings(generalSettings)).unwrap();
      toast.success('General settings updated successfully');
    } catch (error) {
      toast.error('Failed to update general settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(updateNotificationSettings(notificationSettings)).unwrap();
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(updateSecuritySettings(securitySettings)).unwrap();
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error('Failed to update security settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApiSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(updateApiSettings(apiSettings)).unwrap();
      toast.success('API settings updated successfully');
    } catch (error) {
      toast.error('Failed to update API settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChangeSettings = (e) => {
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

  const generateNewApiKey = async () => {
    try {
      const result = await dispatch(generateApiKey()).unwrap();
      setApiSettings(prev => ({
        ...prev,
        api_key: result.api_key,
      }));
      toast.success('New API key generated');
    } catch (error) {
      toast.error('Failed to generate API key');
    }
  };

  const handleTelegramChange = (e) => {
    const { name, value } = e.target;
    setTelegramSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleTelegramSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(updateTelegramSettings(telegramSettings)).unwrap();
      toast.success('Telegram settings updated successfully');
    } catch (error) {
      toast.error('Failed to update Telegram settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestTelegram = async () => {
    setTelegramLoading(true);
    setTelegramTestResult(null);
    try {
      const result = await dispatch(testTelegramConnection(telegramSettings.chat_id)).unwrap();
      setTelegramTestResult({ success: true, message: 'Test message sent successfully!' });
    } catch (error) {
      setTelegramTestResult({ success: false, message: error?.message || 'Failed to send test message.' });
    } finally {
      setTelegramLoading(false);
    }
  };

  // Security handlers
  const handleEnable2FA = async () => {
    try {
      await dispatch(enable2FA()).unwrap();
      setShow2FAModal(true);
    } catch (error) {
      console.error('2FA setup failed:', error);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    
    try {
      await dispatch(disable2FA()).unwrap();
    } catch (error) {
      console.error('2FA disable failed:', error);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode) return;
    
    try {
      await dispatch(verify2FA(verificationCode)).unwrap();
      setShow2FAModal(false);
      setVerificationCode('');
      dispatch(clear2FASetup());
    } catch (error) {
      console.error('2FA verification failed:', error);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName) return;
    
    try {
      await dispatch(createApiKey({ name: newApiKeyName })).unwrap();
      setShowApiKeyModal(false);
      setNewApiKeyName('');
    } catch (error) {
      console.error('API key creation failed:', error);
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    
    try {
      await dispatch(deleteApiKey(keyId)).unwrap();
    } catch (error) {
      console.error('API key deletion failed:', error);
    }
  };

  const handleChangePassword = async () => {
    if (securityPasswordData.new_password !== securityPasswordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    
    try {
      await dispatch(changePassword(securityPasswordData)).unwrap();
      setShowPasswordModal(false);
      setSecurityPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Password change failed:', error);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    try {
      await dispatch(revokeSession(sessionId)).unwrap();
    } catch (error) {
      console.error('Session revocation failed:', error);
    }
  };

  const handleTrustDevice = async (deviceId) => {
    try {
      await dispatch(trustDevice(deviceId)).unwrap();
    } catch (error) {
      console.error('Device trust failed:', error);
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner h-8 w-8"></div>
            <span className="ml-2 text-gray-600">Loading account...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamationCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Profile', icon: HiUser },
              { id: 'settings', name: 'Settings', icon: HiCog },
              { id: 'security', name: 'Security', icon: HiShieldCheck },
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
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <label className="form-label">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="input pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          className="input pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Role</label>
                      <input
                        type="text"
                        value={user.role || 'User'}
                        className="input bg-gray-50"
                        disabled
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={userState?.profileLoading}
                        className="btn btn-primary flex items-center"
                      >
                        {userState?.profileLoading ? (
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                        ) : (
                          <HiSave className="h-5 w-5 mr-2" />
                        )}
                        Update Profile
                      </button>
                    </div>
                  </form>
                </div>

                {/* Change Password */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="form-label">Current Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiLockClosed className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="input pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <HiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <HiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiLockClosed className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="input pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <HiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <HiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiLockClosed className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="new_password_confirmation"
                          value={passwordData.new_password_confirmation}
                          onChange={handlePasswordChange}
                          className="input pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <HiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <HiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={userState?.profileLoading}
                        className="btn btn-primary flex items-center"
                      >
                        {userState?.profileLoading ? (
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                        ) : (
                          <HiLockClosed className="h-5 w-5 mr-2" />
                        )}
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  <form onSubmit={handleGeneralSubmit} className="space-y-4">
                    <div>
                      <label className="form-label">Timezone</label>
                      <select
                        name="timezone"
                        value={generalSettings.timezone}
                        onChange={handleInputChangeSettings}
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
                        onChange={handleInputChangeSettings}
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
                        onChange={handleInputChangeSettings}
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
                        onChange={handleInputChangeSettings}
                        className="input"
                      >
                        <option value="12h">12-hour</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn btn-primary flex items-center"
                      >
                        {isSubmitting ? (
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                        ) : (
                          <HiSave className="h-5 w-5 mr-2" />
                        )}
                        Save General Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Notification Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                  <form onSubmit={handleNotificationSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
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
                          <h4 className="text-sm font-medium text-gray-900">Campaign Completed</h4>
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
                          <h4 className="text-sm font-medium text-gray-900">Campaign Failed</h4>
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
                          <h4 className="text-sm font-medium text-gray-900">New Login</h4>
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
                          <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
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
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn btn-primary flex items-center"
                      >
                        {isSubmitting ? (
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                        ) : (
                          <HiBell className="h-5 w-5 mr-2" />
                        )}
                        Save Notification Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* API Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">API Settings</h3>
                  <form onSubmit={handleApiSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn btn-primary flex items-center"
                      >
                        {isSubmitting ? (
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                        ) : (
                          <HiGlobe className="h-5 w-5 mr-2" />
                        )}
                        Save API Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Telegram Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Telegram Notification Settings</h3>
                  <form onSubmit={handleTelegramSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Bot Token <span className="text-danger-600">*</span></label>
                        <input
                          type="text"
                          name="bot_token"
                          value={telegramSettings.bot_token}
                          onChange={handleTelegramChange}
                          className="input"
                          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">@BotFather</a> on Telegram.
                        </p>
                      </div>
                      <div>
                        <label className="form-label">Chat ID <span className="text-danger-600">*</span></label>
                        <input
                          type="text"
                          name="chat_id"
                          value={telegramSettings.chat_id}
                          onChange={handleTelegramChange}
                          className="input"
                          placeholder="e.g. 123456789 or -1001234567890"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          <span>Find your chat ID by messaging your bot and visiting <a href="https://api.telegram.org/bot&lt;bot_token&gt;/getUpdates" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">getUpdates</a>.</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-2">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={telegramLoading || !telegramSettings.bot_token || !telegramSettings.chat_id}
                        className="btn btn-secondary"
                      >
                        {telegramLoading ? 'Testing...' : 'Test Connection'}
                      </button>
                      {telegramTestResult && (
                        <span className={telegramTestResult.success ? 'text-success-600' : 'text-danger-600'}>
                          {telegramTestResult.message}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !telegramSettings.bot_token || !telegramSettings.chat_id}
                        className="btn btn-primary flex items-center"
                      >
                        {isSubmitting ? (
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                        ) : (
                          <HiSave className="h-5 w-5 mr-2" />
                        )}
                        Save Telegram Settings
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 text-xs text-gray-500">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal ml-5 mt-1 space-y-1">
                      <li>Create a Telegram bot using <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">@BotFather</a> and copy the token.</li>
                      <li>Add your bot to your group/channel (if using group notifications) and make it an admin.</li>
                      <li>Send a message to your bot or group, then use the <code>getUpdates</code> API to find your chat ID.</li>
                      <li>Paste both values above and test the connection.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* 2FA Section */}
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
                <div className="mt-4">
                  {!twoFactorEnabled ? (
                    <button
                      onClick={handleEnable2FA}
                      disabled={securityLoading}
                      className="btn btn-primary"
                    >
                      {securityLoading ? 'Setting up...' : 'Enable 2FA'}
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDisable2FA}
                        disabled={securityLoading}
                        className="btn btn-danger"
                      >
                        {securityLoading ? 'Disabling...' : 'Disable 2FA'}
                      </button>
                      <button className="btn btn-secondary">
                        <HiDownload className="h-4 w-4 mr-2" />
                        Backup Codes
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* API Keys Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
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
                              {key.last_used ? formatDate(key.last_used) : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(key.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteApiKey(key.id)}
                                className="text-danger-600 hover:text-danger-900"
                                disabled={securityLoading}
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

              {/* Active Sessions Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
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
                        {activeSessions.map((session) => (
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
                                  disabled={securityLoading}
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
                {qrCode && (
                  <div className="text-center">
                    <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                    <p className="text-sm text-gray-600 mt-2">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                )}
                {backupCodes.length > 0 && (
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
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShow2FAModal(false);
                      dispatch(clear2FASetup());
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={!verificationCode || securityLoading}
                    className="btn btn-primary"
                  >
                    {securityLoading ? 'Verifying...' : 'Verify & Enable'}
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
                    disabled={!newApiKeyName || securityLoading}
                    className="btn btn-primary"
                  >
                    {securityLoading ? 'Creating...' : 'Create API Key'}
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

export default Account; 