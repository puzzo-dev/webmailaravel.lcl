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

const AccountEnhanced = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userState = useSelector((state) => state.user);
  
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

            {/* Other tabs placeholder */}
            {(['security', 'preferences', 'notifications', 'integrations'].includes(activeTab)) && (
              <div className="text-center py-12">
                <HiCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
                </h3>
                <p className="text-gray-600">
                  This section is under development. Please use the original account page for now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountEnhanced;
