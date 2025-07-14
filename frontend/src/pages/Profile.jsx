import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, updatePassword } from '../store/slices/authSlice';
import { formatDate } from '../utils/helpers';
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
} from 'react-icons/hi';

const Profile = () => {
  const dispatch = useDispatch();
  const { currentUser, isLoading } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('profile');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h1>
            <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(user?.created_at || new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={user?.role || 'User'}
                    className="input bg-gray-50"
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex items-center"
                >
                  {isLoading ? (
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                  ) : (
                    <HiSave className="h-5 w-5 mr-2" />
                  )}
                  Update Profile
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
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
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex items-center"
                >
                  {isLoading ? (
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                  ) : (
                    <HiLockClosed className="h-5 w-5 mr-2" />
                  )}
                  Change Password
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <HiShieldCheck className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-medium text-blue-900">Two-Factor Authentication</h3>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Enhance your account security by enabling two-factor authentication.
                </p>
                <div className="mt-4">
                  <button className="btn btn-primary btn-sm">
                    Enable 2FA
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-900">Login Sessions</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Manage your active login sessions across different devices.
                </p>
                <div className="mt-4">
                  <button className="btn btn-warning btn-sm">
                    View Sessions
                  </button>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-900">Danger Zone</h3>
                <p className="mt-2 text-sm text-red-700">
                  Permanently delete your account and all associated data.
                </p>
                <div className="mt-4">
                  <button className="btn btn-danger btn-sm">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 