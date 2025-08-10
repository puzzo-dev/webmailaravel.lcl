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
  HiDownload,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiExclamationCircle,
  HiCamera,
  HiPencil,
  HiChevronRight,
  HiInformationCircle,
  HiStar,
  HiLocationMarker,
  HiSparkles,
  HiRefresh,
  HiClipboard,
  HiExternalLink,
} from 'react-icons/hi';
import {
  updateProfile,
  updatePassword,
} from '../store/slices/authSlice';
import {
  fetchUserSettings,
  updateGeneralSettings,
  updateNotificationSettings,
  updateApiSettings,
  updateSecuritySettings,
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
    email_notifications_enabled: true,
    telegram_notifications_enabled: false,
    telegram_chat_id: '',
    notification_preferences: {
      campaign_completed: { email: true, telegram: false },
      campaign_failed: { email: true, telegram: false },
      campaign_started: { email: false, telegram: false },
      new_login: { email: true, telegram: true },
      security_alerts: { email: true, telegram: true },
      subscription_expiry: { email: true, telegram: false },
      high_bounce_rate: { email: true, telegram: false },
    },
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
    const { name, checked, value, type } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNotificationPreferenceChange = (notificationType, channel, enabled) => {
    setNotificationSettings(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [notificationType]: {
          ...prev.notification_preferences[notificationType],
          [channel]: enabled,
        },
      },
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
              <div className="mt-2 text-sm text-red-700">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</div>
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
                  <form onSubmit={handleNotificationSubmit} className="space-y-6">
                    
                    {/* Channel Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Channels</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <HiMail className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                              <p className="text-xs text-gray-500">Receive notifications via email</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            name="email_notifications_enabled"
                            checked={notificationSettings.email_notifications_enabled}
                            onChange={handleNotificationChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <HiDeviceMobile className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Telegram Notifications</span>
                              <p className="text-xs text-gray-500">Receive notifications via Telegram</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            name="telegram_notifications_enabled"
                            checked={notificationSettings.telegram_notifications_enabled}
                            onChange={handleNotificationChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </div>
                        {notificationSettings.telegram_notifications_enabled && (
                          <div className="mt-2 pl-7">
                            <input
                              type="text"
                              name="telegram_chat_id"
                              value={notificationSettings.telegram_chat_id}
                              onChange={handleNotificationChange}
                              placeholder="Enter your Telegram Chat ID"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Start a chat with our bot @YourBotName and send /start to get your Chat ID
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notification Types */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Types</h4>
                      <div className="space-y-4">
                        {Object.entries({
                          campaign_completed: { title: 'Campaign Completed', desc: 'When campaigns finish successfully' },
                          campaign_failed: { title: 'Campaign Failed', desc: 'When campaigns encounter errors' },
                          campaign_started: { title: 'Campaign Started', desc: 'When campaigns begin sending' },
                          new_login: { title: 'New Login', desc: 'When someone logs into your account' },
                          security_alerts: { title: 'Security Alerts', desc: 'Important security notifications' },
                          subscription_expiry: { title: 'Subscription Expiry', desc: 'When your subscription is about to expire' },
                          high_bounce_rate: { title: 'High Bounce Rate', desc: 'When bounce rates exceed thresholds' },
                        }).map(([key, config]) => (
                          <div key={key} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{config.title}</h5>
                                <p className="text-xs text-gray-500">{config.desc}</p>
                              </div>
                            </div>
                            <div className="flex space-x-6 mt-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={notificationSettings.notification_preferences[key]?.email || false}
                                  onChange={(e) => handleNotificationPreferenceChange(key, 'email', e.target.checked)}
                                  disabled={!notificationSettings.email_notifications_enabled}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                                />
                                <HiMail className="h-4 w-4 text-gray-400 ml-2 mr-1" />
                                <span className="text-sm text-gray-600">Email</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={notificationSettings.notification_preferences[key]?.telegram || false}
                                  onChange={(e) => handleNotificationPreferenceChange(key, 'telegram', e.target.checked)}
                                  disabled={!notificationSettings.telegram_notifications_enabled}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                                />
                                <HiDeviceMobile className="h-4 w-4 text-gray-400 ml-2 mr-1" />
                                <span className="text-sm text-gray-600">Telegram</span>
                              </label>
                            </div>
                          </div>
                        ))}
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <HiKey className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">API Settings</h3>
                        <p className="text-sm text-gray-500">Manage your API keys and integration settings</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Current API Key Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-blue-900">Current API Key</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            apiSettings.api_key ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {apiSettings.api_key ? 'Active' : 'No Key'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiSettings.api_key || 'No API key generated'}
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            readOnly
                            placeholder="Generate an API key to get started"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title={showApiKey ? 'Hide API key' : 'Show API key'}
                            >
                              {showApiKey ? (
                                <HiEyeOff className="h-4 w-4" />
                              ) : (
                                <HiEye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={generateNewApiKey}
                            disabled={isSubmitting}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmitting ? (
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <HiRefresh className="h-4 w-4 mr-2" />
                            )}
                            {apiSettings.api_key ? 'Regenerate Key' : 'Generate Key'}
                          </button>
                          
                          {apiSettings.api_key && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(apiSettings.api_key);
                                  toast.success('API key copied to clipboard!');
                                } catch (error) {
                                  toast.error('Failed to copy API key');
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            >
                              <HiClipboard className="h-4 w-4 mr-2" />
                              Copy Key
                            </button>
                          )}
                        </div>
                        
                        {apiSettings.api_key && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                            <div className="flex items-start">
                              <HiExclamation className="h-5 w-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="text-sm text-amber-700">
                                <p className="font-medium">Keep your API key secure</p>
                                <p className="mt-1">Store it safely and never share it publicly. Regenerating will invalidate the current key.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* API Configuration */}
                    <form onSubmit={handleApiSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Webhook URL
                              <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                            </label>
                            <input
                              type="url"
                              name="webhook_url"
                              value={apiSettings.webhook_url}
                              onChange={handleApiChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              placeholder="https://your-domain.com/webhook"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Receive real-time notifications about campaign events
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rate Limit
                              <span className="text-gray-400 font-normal ml-1">(requests per hour)</span>
                            </label>
                            <select
                              name="rate_limit"
                              value={apiSettings.rate_limit}
                              onChange={handleApiChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                              <option value="100">100 requests/hour (Basic)</option>
                              <option value="500">500 requests/hour (Standard)</option>
                              <option value="1000">1,000 requests/hour (Premium)</option>
                              <option value="5000">5,000 requests/hour (Enterprise)</option>
                              <option value="10000">10,000 requests/hour (Unlimited)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Higher limits may require subscription upgrade
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <HiInformationCircle className="h-4 w-4 mr-2 text-blue-500" />
                            API Usage Guidelines
                          </h5>
                          <ul className="text-xs text-gray-600 space-y-2">
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              Use HTTPS endpoints for secure communication
                            </li>
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              Include your API key in the Authorization header
                            </li>
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              Monitor your usage to avoid rate limits
                            </li>
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              Webhook URLs must return 200 status codes
                            </li>
                          </ul>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <a 
                              href="/api-docs" 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                            >
                              <HiExternalLink className="h-3 w-3 mr-1" />
                              View API Documentation
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <HiSave className="h-4 w-4 mr-2" />
                          )}
                          Save API Settings
                        </button>
                      </div>
                    </form>
                  </div>
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