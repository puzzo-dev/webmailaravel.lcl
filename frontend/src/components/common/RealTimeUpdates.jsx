import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { HiBell, HiX, HiCheckCircle, HiExclamation, HiInformationCircle, HiClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const RealTimeUpdates = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real Pusher WebSocket connection
  useEffect(() => {
    let pusher = null;
    let channel = null;
    
    const connectPusher = async () => {
      try {
        // Only connect if we have required environment variables
        if (!process.env.REACT_APP_PUSHER_KEY || !user?.id) {
          return;
        }

        // Dynamically import Pusher to reduce bundle size
        const Pusher = (await import('pusher-js')).default;
        
        // Initialize Pusher connection
        pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
          cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'us2',
          encrypted: true,
          authEndpoint: '/api/broadcasting/auth',
          auth: {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          },
        });

        // Subscribe to user-specific private channel
        channel = pusher.subscribe(`private-user.${user.id}`);
        
        // Connection state handlers
        pusher.connection.bind('connected', () => {
          setIsConnected(true);
        });
        
        pusher.connection.bind('disconnected', () => {
          setIsConnected(false);
        });
        
        pusher.connection.bind('error', (error) => {
          console.error('Real-time connection error:', error);
          setIsConnected(false);
        });

        // Event listeners for real-time updates
        channel.bind('campaign-status-changed', (data) => {
          handleWebSocketMessage({
            type: 'campaign_status',
            data: data
          });
        });

        channel.bind('notification', (data) => {
          handleWebSocketMessage({
            type: 'notification',
            data: data
          });
        });

        channel.bind('analytics-update', (data) => {
          handleWebSocketMessage({
            type: 'analytics_update',
            data: data
          });
        });

        channel.bind('device-detected', (data) => {
          handleWebSocketMessage({
            type: 'device_detected',
            data: data
          });
        });

        channel.bind('subscription-updated', (data) => {
          handleWebSocketMessage({
            type: 'subscription_updated',
            data: data
          });
        });
        
      } catch (error) {
        console.error('Real-time connection failed:', error);
        setIsConnected(false);
      }
    };

    if (user?.id) {
      connectPusher();
    }

    return () => {
      if (channel) {
        channel.unbind_all();
        if (pusher) {
          pusher.unsubscribe(`private-user.${user.id}`);
        }
      }
      if (pusher) {
        pusher.disconnect();
      }
    };
  }, [user?.id]);

  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case 'campaign_status':
        handleCampaignStatusUpdate(message.data);
        break;
      case 'notification':
        handleNotification(message.data);
        break;
      case 'analytics_update':
        handleAnalyticsUpdate(message.data);
        break;
      default:
        break;
    }
  }, []);

  const handleCampaignStatusUpdate = useCallback((data) => {
    // Update campaign status in Redux store
    dispatch({
      type: 'campaigns/updateCampaignStatus',
      payload: {
        campaignId: data.campaign_id,
        status: data.status,
      },
    });
    
    // Add notification
    addNotification({
      type: 'info',
      title: 'Campaign Update',
      message: `Campaign #${data.campaign_id} is now ${data.status}`,
    });
  }, [dispatch]);

  const handleNotification = useCallback((data) => {
    addNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: data.timestamp,
    });
  }, []);

  const handleAnalyticsUpdate = useCallback((data) => {
    // Update analytics in Redux store
    dispatch({
      type: 'analytics/updateRealTimeData',
      payload: data,
    });
  }, [dispatch]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Math.random().toString(36).substr(2, 9),
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <HiExclamation className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <HiExclamation className="h-5 w-5 text-red-500" />;
      case 'info':
        return <HiInformationCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <HiInformationCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className="absolute -top-2 -right-2">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>

      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <HiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <HiBell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <HiX className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-primary-600 hover:text-primary-800 mt-2"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setNotifications([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connection Status Toast */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <HiClock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Reconnecting...</p>
              <p className="text-xs text-yellow-600">Real-time updates temporarily unavailable</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeUpdates; 