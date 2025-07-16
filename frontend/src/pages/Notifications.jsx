import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead, deleteAllNotifications } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';
import { HiBell } from 'react-icons/hi';
import NotificationList from '../components/shared/NotificationList';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <HiBell className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Manage your notifications and alerts</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <NotificationList
        notifications={notifications}
        loading={isLoading}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteAll={handleDeleteAll}
        showActions={true}
        emptyMessage="You're all caught up! New notifications will appear here."
      />

      {/* Pagination Info */}
      {pagination && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center text-sm text-gray-500">
            Showing {notifications.length} of {pagination.total} notifications
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 