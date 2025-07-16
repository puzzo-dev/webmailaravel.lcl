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

const AccountNew = () => {
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
  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
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
    theme: 'light',
    compact_view: false,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    campaign_completed: true,
    campaign_failed: true,
    new_login: true,
    security_alerts: true,
    weekly_summary: true,
    marketing_emails: false,
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

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    try {
      await dispatch(revokeSession(sessionId)).unwrap();
    } catch (error) {
      console.error('Session revocation failed:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8"></div>
              <span className="ml-3 text-gray-600 text-lg">Loading your account...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HiUser, description: 'Account summary and quick actions' },
    { id: 'profile', name: 'Profile', icon: HiUser, description: 'Personal information and preferences' },
    { id: 'security', name: 'Security', icon: HiShieldCheck, description: 'Password, 2FA, and device management' },
    { id: 'preferences', name: 'Preferences', icon: HiCog, description: 'App settings and customization' },
    { id: 'notifications', name: 'Notifications', icon: HiBell, description: 'Email and alert preferences' },
    { id: 'integrations', name: 'Integrations', icon: HiGlobe, description: 'API keys and external services' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header with Gradient Background */}
        <div className="relative bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="h-24 w-24 md:h-32 md:w-32 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white border-opacity-30 shadow-xl">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl md:text-4xl font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
                  <HiCamera className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
                <p className="text-xl text-white text-opacity-90 mb-1">{user.email}</p>
                <p className="text-white text-opacity-75 mb-4">
                  Member since {formatDate(user.created_at)}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                    <HiStar className="h-4 w-4 mr-1" />
                    {user.role || 'User'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-500 bg-opacity-90">
                    <HiCheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </span>
                  {twoFactorEnabled && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 bg-opacity-90">
                      <HiShieldCheck className="h-4 w-4 mr-1" />
                      2FA Enabled
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:text-right">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-sm text-white text-opacity-75">Active Campaigns</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">98.5%</p>
                  <p className="text-sm text-white text-opacity-75">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex">
              <HiExclamationCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Navigation */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex overflow-x-auto scrollbar-hide px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-6 px-4 border-b-3 font-medium text-sm whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-400 hidden lg:block">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Overview</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            onClick={() => setActiveTab('profile')}
                            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <HiPencil className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="ml-4 text-left">
                              <p className="font-medium text-gray-900">Edit Profile</p>
                              <p className="text-sm text-gray-500">Update your information</p>
                            </div>
                            <HiChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                          </button>
                          
                          <button 
                            onClick={() => setActiveTab('security')}
                            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-2 bg-success-100 rounded-lg">
                              <HiShieldCheck className="h-5 w-5 text-success-600" />
                            </div>
                            <div className="ml-4 text-left">
                              <p className="font-medium text-gray-900">Security Settings</p>
                              <p className="text-sm text-gray-500">Manage 2FA and passwords</p>
                            </div>
                            <HiChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                          </button>
                          
                          <button 
                            onClick={() => setActiveTab('integrations')}
                            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-2 bg-warning-100 rounded-lg">
                              <HiKey className="h-5 w-5 text-warning-600" />
                            </div>
                            <div className="ml-4 text-left">
                              <p className="font-medium text-gray-900">API Keys</p>
                              <p className="text-sm text-gray-500">Manage integrations</p>
                            </div>
                            <HiChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                          </button>
                          
                          <button 
                            onClick={() => setActiveTab('notifications')}
                            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-2 bg-info-100 rounded-lg">
                              <HiBell className="h-5 w-5 text-info-600" />
                            </div>
                            <div className="ml-4 text-left">
                              <p className="font-medium text-gray-900">Notifications</p>
                              <p className="text-sm text-gray-500">Email preferences</p>
                            </div>
                            <HiChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                          </button>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <HiCheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Campaign "Holiday Sale" completed</p>
                              <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <HiMail className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">New sender added: marketing@company.com</p>
                              <p className="text-xs text-gray-500">1 day ago</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <HiShieldCheck className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Two-factor authentication enabled</p>
                              <p className="text-xs text-gray-500">3 days ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Health */}
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Health</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Profile Completion</span>
                            <span className="text-sm font-medium text-gray-900">85%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Security Score</span>
                            <span className="text-sm font-medium text-success-600">Good</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-success-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center mb-3">
                          <HiInformationCircle className="h-5 w-5 text-yellow-600" />
                          <h3 className="text-sm font-semibold text-yellow-800 ml-2">Recommendations</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-yellow-700">
                          <li>• Add a profile picture</li>
                          <li>• Complete your bio</li>
                          <li>• Set up backup codes for 2FA</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
                  <p className="text-gray-600">Manage your personal information and account details</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <HiUser className="h-5 w-5 mr-2 text-primary-600" />
                      Personal Information
                    </h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <HiUser className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="name"
                              value={profileData.name}
                              onChange={handleInputChange}
                              className="input pl-10 bg-white"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <HiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={profileData.email}
                              onChange={handleInputChange}
                              className="input pl-10 bg-white"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <HiPhone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              name="phone"
                              value={profileData.phone}
                              onChange={handleInputChange}
                              className="input pl-10 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <HiLocationMarker className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="location"
                              value={profileData.location}
                              onChange={handleInputChange}
                              placeholder="City, Country"
                              className="input pl-10 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          rows={3}
                          className="input bg-white"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <input
                          type="text"
                          value={user.role || 'User'}
                          className="input bg-gray-100"
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
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <HiLockClosed className="h-5 w-5 mr-2 text-red-600" />
                      Change Password
                    </h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiLockClosed className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                            className="input pl-10 pr-10 bg-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiLockClosed className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            className="input pl-10 pr-10 bg-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiLockClosed className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="new_password_confirmation"
                            value={passwordData.new_password_confirmation}
                            onChange={handlePasswordChange}
                            className="input pl-10 pr-10 bg-white"
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

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <HiInformationCircle className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Password Requirements</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <ul className="list-disc list-inside space-y-1">
                                <li>At least 8 characters long</li>
                                <li>Include uppercase and lowercase letters</li>
                                <li>Include at least one number</li>
                                <li>Include at least one special character</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={userState?.profileLoading}
                          className="btn btn-danger flex items-center"
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

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                  <p className="text-gray-600">Protect your account with advanced security features</p>
                </div>

                <div className="space-y-8">
                  {/* 2FA Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <HiShieldCheck className="h-6 w-6 mr-3 text-green-600" />
                          Two-Factor Authentication
                        </h3>
                        <p className="text-gray-600 mt-2">
                          {twoFactorEnabled
                            ? 'Your account is protected with two-factor authentication.'
                            : 'Add an extra layer of security to your account with 2FA.'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          twoFactorEnabled
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}>
                          {twoFactorEnabled ? (
                            <HiCheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <HiExclamation className="h-4 w-4 mr-2" />
                          )}
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {!twoFactorEnabled ? (
                        <button
                          onClick={handleEnable2FA}
                          disabled={securityLoading}
                          className="btn btn-success flex items-center"
                        >
                          <HiShieldCheck className="h-5 w-5 mr-2" />
                          {securityLoading ? 'Setting up...' : 'Enable 2FA'}
                        </button>
                      ) : (
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDisable2FA}
                            disabled={securityLoading}
                            className="btn btn-danger"
                          >
                            <HiXCircle className="h-5 w-5 mr-2" />
                            {securityLoading ? 'Disabling...' : 'Disable 2FA'}
                          </button>
                          <button className="btn btn-secondary">
                            <HiDownload className="h-5 w-5 mr-2" />
                            Backup Codes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API Keys Section */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                            <HiKey className="h-6 w-6 mr-3 text-blue-600" />
                            API Keys
                          </h3>
                          <p className="text-gray-600 mt-1">Manage your API keys for external integrations</p>
                        </div>
                        <button
                          onClick={() => setShowApiKeyModal(true)}
                          className="btn btn-primary flex items-center"
                        >
                          <HiPlus className="h-5 w-5 mr-2" />
                          Create API Key
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Key
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Used
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {apiKeys.map((key) => (
                            <tr key={key.id} className="hover:bg-gray-50">
                              <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {key.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <code className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-mono">
                                    {key.key.substring(0, 12)}...
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(key.key)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Copy to clipboard"
                                  >
                                    <HiClipboard className="h-4 w-4" />
                                  </button>
                                </div>
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
                                  <HiTrash className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Active Sessions Section */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                            <HiDeviceMobile className="h-6 w-6 mr-3 text-purple-600" />
                            Active Sessions
                          </h3>
                          <p className="text-gray-600 mt-1">Monitor and manage your active login sessions</p>
                        </div>
                        <button className="btn btn-secondary flex items-center">
                          <HiRefresh className="h-4 w-4 mr-2" />
                          Refresh
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Device
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Used
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activeSessions.map((session) => (
                            <tr key={session.id} className="hover:bg-gray-50">
                              <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                                    <HiTrash className="h-5 w-5" />
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

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferences</h2>
                  <p className="text-gray-600">Customize your app experience and display settings</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <HiCog className="h-5 w-5 mr-2 text-purple-600" />
                    General Settings
                  </h3>
                  <form onSubmit={handleGeneralSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select
                          name="timezone"
                          value={generalSettings.timezone}
                          onChange={handleInputChangeSettings}
                          className="input bg-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          name="language"
                          value={generalSettings.language}
                          onChange={handleInputChangeSettings}
                          className="input bg-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                        <select
                          name="date_format"
                          value={generalSettings.date_format}
                          onChange={handleInputChangeSettings}
                          className="input bg-white"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                        <select
                          name="time_format"
                          value={generalSettings.time_format}
                          onChange={handleInputChangeSettings}
                          className="input bg-white"
                        >
                          <option value="12h">12-hour</option>
                          <option value="24h">24-hour</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Compact View</h4>
                          <p className="text-sm text-gray-500">Show more content in less space</p>
                        </div>
                        <input
                          type="checkbox"
                          name="compact_view"
                          checked={generalSettings.compact_view}
                          onChange={handleInputChangeSettings}
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
                          <HiSave className="h-5 w-5 mr-2" />
                        )}
                        Save Preferences
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h2>
                  <p className="text-gray-600">Choose how and when you want to be notified</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Email Notifications */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <HiBell className="h-5 w-5 mr-2 text-green-600" />
                      Email Notifications
                    </h3>
                    <form onSubmit={handleNotificationSubmit} className="space-y-6">
                      <div className="space-y-4">
                        {[
                          { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                          { key: 'campaign_completed', label: 'Campaign Completed', description: 'Notify when campaigns are completed' },
                          { key: 'campaign_failed', label: 'Campaign Failed', description: 'Notify when campaigns fail' },
                          { key: 'new_login', label: 'New Login', description: 'Notify on new device login' },
                          { key: 'security_alerts', label: 'Security Alerts', description: 'Notify on security events' },
                          { key: 'weekly_summary', label: 'Weekly Summary', description: 'Weekly activity summary' },
                          { key: 'marketing_emails', label: 'Marketing Emails', description: 'Product updates and tips' },
                        ].map((notification) => (
                          <div key={notification.key} className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{notification.label}</h4>
                              <p className="text-sm text-gray-500">{notification.description}</p>
                            </div>
                            <input
                              type="checkbox"
                              name={notification.key}
                              checked={notificationSettings[notification.key]}
                              onChange={handleNotificationChange}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </div>
                        ))}
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

                  {/* Telegram Settings */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <HiDeviceMobile className="h-5 w-5 mr-2 text-blue-600" />
                      Telegram Notifications
                    </h3>
                    <form onSubmit={handleTelegramSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bot Token <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="bot_token"
                            value={telegramSettings.bot_token}
                            onChange={handleTelegramChange}
                            className="input bg-white"
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">@BotFather</a> on Telegram.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chat ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="chat_id"
                            value={telegramSettings.chat_id}
                            onChange={handleTelegramChange}
                            className="input bg-white"
                            placeholder="e.g. 123456789 or -1001234567890"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Find your chat ID by messaging your bot and visiting the getUpdates API.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
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

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                      <ol className="list-decimal list-inside text-xs text-blue-800 space-y-1">
                        <li>Create a Telegram bot using @BotFather and copy the token</li>
                        <li>Add your bot to your group/channel (if using group notifications)</li>
                        <li>Send a message to your bot or group, then use the getUpdates API to find your chat ID</li>
                        <li>Paste both values above and test the connection</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
                  <p className="text-gray-600">Connect external services and manage API access</p>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <HiKey className="h-5 w-5 mr-2 text-yellow-600" />
                    API Settings
                  </h3>
                  <form onSubmit={handleApiSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            name="api_key"
                            value={apiSettings.api_key}
                            onChange={handleApiChange}
                            className="input pr-10 bg-white"
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
                        <div className="mt-3 flex space-x-2">
                          <button
                            type="button"
                            onClick={generateNewApiKey}
                            className="btn btn-secondary btn-sm"
                          >
                            Generate New Key
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(apiSettings.api_key)}
                            className="btn btn-secondary btn-sm"
                          >
                            Copy Key
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                        <input
                          type="url"
                          name="webhook_url"
                          value={apiSettings.webhook_url}
                          onChange={handleApiChange}
                          className="input bg-white"
                          placeholder="https://your-domain.com/webhook"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (requests per hour)</label>
                        <input
                          type="number"
                          name="rate_limit"
                          value={apiSettings.rate_limit}
                          onChange={handleApiChange}
                          className="input bg-white"
                          min="100"
                          max="10000"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <HiInformationCircle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">API Usage Guidelines</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Keep your API key secure and never share it publicly</li>
                              <li>Use webhooks to receive real-time updates</li>
                              <li>Respect rate limits to ensure service availability</li>
                              <li>Monitor your API usage in the dashboard</li>
                            </ul>
                          </div>
                        </div>
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
    </div>
  );
};

export default AccountNew;
