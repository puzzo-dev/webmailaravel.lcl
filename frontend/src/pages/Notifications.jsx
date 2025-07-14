import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead, deleteAllNotifications } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';
import {
  HiBell,
  HiCheck,
  HiTrash,
  HiEye,
  HiX,
  HiMail,
  HiShieldCheck,
  HiExclamation,
  HiInformationCircle,
} from 'react-icons/hi';

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, isLoading, pagination } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        await dispatch(deleteAllNotifications()).unwrap();
        toast.success('All notifications deleted');
      } catch (error) {
        toast.error('Failed to delete all notifications');
      }
    }
  };

  const getNotificationIcon = (type) => {
    const iconConfig = {
      'campaign': HiMail,
      'security': HiShieldCheck,
      'warning': HiExclamation,
      'info': HiInformationCircle,
      'default': HiBell,
    };

    const Icon = iconConfig[type] || iconConfig.default;
    return <Icon className="h-5 w-5" />;
  };

  const getNotificationColor = (type) => {
    const colorConfig = {
      'campaign': 'text-blue-600 bg-blue-100',
      'security': 'text-red-600 bg-red-100',
      'warning': 'text-yellow-600 bg-yellow-100',
      'info': 'text-green-600 bg-green-100',
      'default': 'text-gray-600 bg-gray-100',
    };

    return colorConfig[type] || colorConfig.default;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HiBell className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">Manage your notifications and alerts</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-secondary flex items-center"
            >
              <HiCheck className="h-5 w-5 mr-2" />
              Mark All as Read
            </button>
            <button
              onClick={handleDeleteAll}
              className="btn btn-danger flex items-center"
            >
              <HiTrash className="h-5 w-5 mr-2" />
              Delete All
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <HiBell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <span>{formatDate(notification.created_at)}</span>
                          {!notification.read && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-success-600 hover:text-success-900"
                            title="Mark as read"
                          >
                            <HiCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-danger-600 hover:text-danger-900"
                          title="Delete notification"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="pagination">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => dispatch(fetchNotifications({ page: pagination.current_page - 1, limit: 20 }))}
                disabled={pagination.current_page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => dispatch(fetchNotifications({ page: pagination.current_page + 1, limit: 20 }))}
                disabled={pagination.current_page === pagination.last_page}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => dispatch(fetchNotifications({ page, limit: 20 }))}
                      className={`pagination-button ${
                        page === pagination.current_page ? 'pagination-button-active' : ''
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Campaign updates</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Security alerts</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System updates</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">In-App Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Real-time updates</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sound alerts</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Desktop notifications</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications; 