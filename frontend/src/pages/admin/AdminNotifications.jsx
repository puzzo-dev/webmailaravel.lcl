import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiBell,
  HiRefresh,
  HiPlus,
  HiUsers,
  HiEye,
  HiTrash,
  HiPencil,
  HiX,
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle,
  HiFilter,
  HiSearch,
  HiChartBar,
  HiClock,
  HiMail,
  HiGlobe,
  HiCog,
  HiSelector,
  HiUserGroup,
  HiChatAlt,
} from 'react-icons/hi';
import { adminService } from '../../services/api.js';
import toast from 'react-hot-toast';

// Create Notification Modal Component
const CreateNotificationModal = ({ onClose, onSuccess, users }) => {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    recipient_type: 'all',
    role: 'user',
    user_ids: [],
    title: '',
    message: '',
    type: 'info',
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');

  useEffect(() => {
    if (formData.recipient_type === 'specific') {
      loadUsers();
    }
  }, [formData.recipient_type]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminService.getUsers();
      
      // Handle different possible response structures
      let userData = [];
      if (response.data?.data) {
        userData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else if (response.data?.users) {
        userData = response.data.users;
      }
      
      setAvailableUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.sendBulkNotification(formData);
      toast.success('Notification sent successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setFormData(prev => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId) 
        ? prev.user_ids.filter(id => id !== userId)
        : [...prev.user_ids, userId]
    }));
  };

  const filteredUsers = (Array.isArray(availableUsers) ? availableUsers : []).filter(user => 
    user.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const getRecipientCount = () => {
    switch (formData.recipient_type) {
      case 'all':
        return users;
      case 'active':
        return Math.floor(users * 0.8); // Estimate
      case 'role':
        return formData.role === 'admin' ? Math.floor(users * 0.1) : Math.floor(users * 0.9);
      case 'specific':
        return formData.user_ids.length;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Send New Notification</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="all"
                  name="recipient_type"
                  value="all"
                  checked={formData.recipient_type === 'all'}
                  onChange={(e) => setFormData({...formData, recipient_type: e.target.value})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="all" className="ml-2 block text-sm text-gray-900">
                  <div className="flex items-center">
                    <HiUserGroup className="h-4 w-4 mr-2 text-blue-500" />
                    All Users ({users})
                  </div>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="active"
                  name="recipient_type"
                  value="active"
                  checked={formData.recipient_type === 'active'}
                  onChange={(e) => setFormData({...formData, recipient_type: e.target.value})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  <div className="flex items-center">
                    <HiCheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Active Users (Verified Email)
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="role"
                  name="recipient_type"
                  value="role"
                  checked={formData.recipient_type === 'role'}
                  onChange={(e) => setFormData({...formData, recipient_type: e.target.value})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="role" className="ml-2 block text-sm text-gray-900">
                  <div className="flex items-center">
                    <HiUsers className="h-4 w-4 mr-2 text-purple-500" />
                    By Role
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="specific"
                  name="recipient_type"
                  value="specific"
                  checked={formData.recipient_type === 'specific'}
                  onChange={(e) => setFormData({...formData, recipient_type: e.target.value})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="specific" className="ml-2 block text-sm text-gray-900">
                  <div className="flex items-center">
                    <HiSelector className="h-4 w-4 mr-2 text-orange-500" />
                    Specific Users
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          {formData.recipient_type === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="user">Users</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          )}

          {/* Specific User Selection */}
          {formData.recipient_type === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users ({formData.user_ids.length} selected)
              </label>
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-1 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  disabled={loadingUsers}
                />
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <HiCog className="animate-spin h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Loading users...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.user_ids.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-900">
                          {user.name} ({user.email})
                        </label>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && !loadingUsers && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          {availableUsers.length === 0 ? 'No users available' : 'No users found matching search'}
                        </p>
                        {availableUsers.length === 0 && (
                          <button
                            type="button"
                            onClick={loadUsers}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
                          >
                            Retry loading users
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notification Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="info">Information</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter notification title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={4}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter notification message..."
              required
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="bg-white border rounded-md p-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {formData.type === 'success' && <HiCheckCircle className="h-5 w-5 text-green-500" />}
                  {formData.type === 'warning' && <HiExclamation className="h-5 w-5 text-yellow-500" />}
                  {formData.type === 'error' && <HiExclamation className="h-5 w-5 text-red-500" />}
                  {formData.type === 'info' && <HiInformationCircle className="h-5 w-5 text-blue-500" />}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900">
                    {formData.title || 'Notification Title'}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.message || 'Notification message will appear here...'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Will be sent to approximately {getRecipientCount()} user(s) via email and Telegram (if enabled)
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.message}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <HiCog className="animate-spin h-4 w-4 mr-2" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center">
                  <HiChatAlt className="h-4 w-4 mr-2" />
                  Send Notification
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminNotifications = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, pagination.current_page, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notificationsResponse, dashboardResponse] = await Promise.all([
        adminService.getNotifications({ 
          page: pagination.current_page,
          limit: pagination.per_page,
          filter: filter !== 'all' ? filter : undefined
        }),
        adminService.getDashboard()
      ]);

      setNotifications(notificationsResponse.data.data || []);
      setPagination({
        current_page: notificationsResponse.data.current_page || 1,
        last_page: notificationsResponse.data.last_page || 1,
        per_page: notificationsResponse.data.per_page || 20,
        total: notificationsResponse.data.total || 0,
      });
      
      // Ensure data is an array before filtering
      const notificationsArray = Array.isArray(notificationsResponse.data.data) 
        ? notificationsResponse.data.data 
        : [];
      
      setStats({
        total_notifications: notificationsResponse.data.total || 0,
        unread_notifications: notificationsArray.filter(n => !n.read_at).length || 0,
        total_users: dashboardResponse.data.stats?.total_users || 0,
        recent_activity: notificationsArray.slice(0, 5) || [],
      });
    } catch (error) {
      toast.error('Failed to load notifications data');
      console.error('Admin notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await adminService.deleteNotification(notificationId);
        toast.success('Notification deleted successfully');
        await loadData();
      } catch (error) {
        toast.error('Failed to delete notification');
      }
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await adminService.markNotificationAsRead(notificationId);
      toast.success('Notification marked as read');
      await loadData();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleCreateNotification = async (notificationData) => {
    try {
      await adminService.createNotification(notificationData);
      toast.success('Notification created successfully');
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      toast.error('Failed to create notification');
    }
  };

  const filteredNotifications = (Array.isArray(notifications) ? notifications : []).filter(notification => {
    // Filter by status
    if (filter === 'unread' && notification.read_at) return false;
    if (filter === 'read' && !notification.read_at) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.user?.name?.toLowerCase().includes(searchLower) ||
        notification.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <HiExclamation className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <HiExclamation className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <HiInformationCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <HiExclamation className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need admin privileges to manage notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HiBell className="h-10 w-10 text-primary-600" />
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage system-wide notifications and user alerts
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <HiPlus className="h-4 w-4 mr-2" />
              Send Notification
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <HiRefresh className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiBell className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Notifications</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.total_notifications || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiExclamation className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Unread</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.unread_notifications || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiUsers className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                <dd className="text-3xl font-bold text-gray-900">{stats.total_users || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HiChartBar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Engagement Rate</dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {stats.total_notifications > 0 
                    ? Math.round(((stats.total_notifications - stats.unread_notifications) / stats.total_notifications) * 100)
                    : 0}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <HiFilter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread ({stats.unread_notifications || 0})</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="relative">
              <HiSearch className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notifications, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <tr 
                    key={notification.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      !notification.read_at ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.notification_type || notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title || 'Notification'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {notification.message || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{notification.user?.name}</div>
                      <div className="text-sm text-gray-500">{notification.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        notification.notification_type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.notification_type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.notification_type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.notification_type || notification.type || 'info'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        notification.read_at 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {notification.read_at ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(notification.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedNotification(notification);
                            setShowDetailsModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                        {!notification.read_at && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <HiCheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <HiBell className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || filter !== 'all' ? 'No matching notifications' : 'No notifications found'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Notifications will appear here when they are created.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notification Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="text-sm text-gray-900">{selectedNotification.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <p className="text-sm text-gray-900">{selectedNotification.message}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900">{selectedNotification.notification_type || selectedNotification.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="text-sm text-gray-900">{selectedNotification.user?.name}</p>
                <p className="text-sm text-gray-500">{selectedNotification.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">{new Date(selectedNotification.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900">
                  {selectedNotification.read_at ? `Read on ${new Date(selectedNotification.read_at).toLocaleString()}` : 'Unread'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && <CreateNotificationModal 
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateNotification}
        users={stats.total_users}
      />}
    </div>
  );
};

export default AdminNotifications;
