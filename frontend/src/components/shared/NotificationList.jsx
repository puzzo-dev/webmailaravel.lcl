import React from 'react';
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
  HiCheckCircle,
  HiXCircle,
  HiTrendingUp,
  HiChartBar,
} from 'react-icons/hi';

const NotificationList = ({
  notifications,
  loading = false,
  onMarkAsRead = null,
  onDelete = null,
  onMarkAllAsRead = null,
  onDeleteAll = null,
  showActions = true,
  emptyMessage = "No notifications",
  className = ""
}) => {
  const getNotificationIcon = (type) => {
    const iconConfig = {
      'campaign_created': HiMail,
      'campaign_status_changed': HiMail,
      'campaign_completed': HiCheckCircle,
      'campaign_failed': HiXCircle,
      'campaign_milestone': HiTrendingUp,
      'high_bounce_rate_alert': HiChartBar,
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
      'campaign_created': 'text-blue-600 bg-blue-100',
      'campaign_status_changed': 'text-blue-600 bg-blue-100',
      'campaign_completed': 'text-green-600 bg-green-100',
      'campaign_failed': 'text-red-600 bg-red-100',
      'campaign_milestone': 'text-purple-600 bg-purple-100',
      'high_bounce_rate_alert': 'text-orange-600 bg-orange-100',
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

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="p-6 text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header Actions */}
      {showActions && (onMarkAllAsRead || onDeleteAll) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-3">
              {onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="btn btn-secondary flex items-center"
                >
                  <HiCheck className="h-5 w-5 mr-2" />
                  Mark All as Read
                </button>
              )}
              {onDeleteAll && (
                <button
                  onClick={onDeleteAll}
                  className="btn btn-danger flex items-center"
                >
                  <HiTrash className="h-5 w-5 mr-2" />
                  Delete All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-6 text-center">
          <HiBell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
          <p className="mt-1 text-sm text-gray-500">
            New notifications will appear here.
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
                    {showActions && (
                      <div className="flex items-center space-x-2">
                        {!notification.read && onMarkAsRead && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-success-600 hover:text-success-900"
                            title="Mark as read"
                          >
                            <HiCheck className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(notification.id)}
                            className="text-danger-600 hover:text-danger-900"
                            title="Delete notification"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList; 