import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  HiBell,
  HiCog,
  HiUser,
  HiLogout,
  HiSearch,
  HiMenu,
  HiX,
  HiInbox,
  HiChartBar,
  HiUser as HiSenders,
  HiGlobe,
  HiMail,
  HiBan,
  HiExclamation,
  HiInformationCircle,
  HiHome,
  HiUsers,
  HiClipboardList,
  HiViewBoards,
  HiViewList,
} from 'react-icons/hi';
import GlobalSearch from '../GlobalSearch';
import { fetchNotifications, markNotificationAsRead } from '../../store/slices/notificationsSlice';
import { switchToAdminView, switchToUserView } from '../../store/slices/authSlice';

const Header = ({ onMenuToggle, user, onLogout }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Get notifications from Redux store
  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notifications);
  const { currentView } = useSelector((state) => state.auth);

  // Fetch notifications on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      await dispatch(markNotificationAsRead(notification.id));
    }
  };

  // Format time helper
  const formatTime = (dateString) => {
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

  // Get notification icon based on type
  const getNotificationIcon = (notification) => {
    const type = notification.notification_type || notification.type || 'info';
    switch (type) {
      case 'success':
        return <HiInbox className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <HiExclamation className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <HiExclamation className="h-4 w-4 text-red-600" />;
      case 'info':
      default:
        return <HiInformationCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  // Get notification background color
  const getNotificationBg = (notification) => {
    const type = notification.notification_type || notification.type || 'info';
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'error':
        return 'bg-red-100';
      case 'info':
      default:
        return 'bg-blue-100';
    }
  };

  const quickActions = [
    { name: 'Campaigns', href: '/campaigns', icon: HiInbox },
    { name: 'Analytics', href: '/analytics', icon: HiChartBar },
    { name: 'Senders', href: '/senders', icon: HiSenders },
    { name: 'Domains', href: '/domains', icon: HiGlobe },
    { name: 'Suppression List', href: '/suppression-list', icon: HiBan },
    { name: 'Settings', href: '/account', icon: HiCog },
  ];

  const adminQuickActions = [
    { name: 'Admin Dashboard', href: '/admin', icon: HiHome },
    { name: 'Users', href: '/admin/users', icon: HiUsers },
    { name: 'Campaigns', href: '/admin/campaigns', icon: HiInbox },
    { name: 'System', href: '/admin/system', icon: HiCog },
    { name: 'Logs', href: '/admin/logs', icon: HiClipboardList },
  ];

  const isAdmin = user?.role === 'admin';
  const isAdminView = currentView === 'admin';
  const currentQuickActions = isAdmin && isAdminView ? adminQuickActions : quickActions;

  // View switching functions for admin users
  const handleSwitchToAdminView = () => {
    dispatch(switchToAdminView());
    navigate('/admin');
    setShowUserMenu(false);
  };

  const handleSwitchToUserView = () => {
    dispatch(switchToUserView());
    navigate('/dashboard');
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <HiMenu className="h-6 w-6" />
            </button>
            
            {/* Global Search */}
            <div className="hidden md:block ml-4">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <HiSearch className="h-4 w-4" />
                <span>Search...</span>
                <span className="text-xs text-gray-400">Ctrl+K</span>
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              {currentQuickActions.map((action) => (
                <a
                  key={`quick-${action.name}`}
                  href={action.href}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={action.name}
                >
                  <action.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <HiBell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.read_at ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className={`h-8 w-8 ${getNotificationBg(notification)} rounded-full flex items-center justify-center`}>
                                {getNotificationIcon(notification)}
                              </div>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title || 'Notification'}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message || ''}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTime(notification.created_at)}
                              </p>
                              {!notification.read_at && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <a 
                      href="/notifications" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all notifications
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.name || 'User'}
                      {isAdmin && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {currentView === 'admin' ? 'Admin View' : 'User View'}
                        </span>
                      )}
                    </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]">
                  <div className="py-1">
                    <a
                      href="/account"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <HiUser className="h-4 w-4 mr-3" />
                      Account
                    </a>
                    {isAdmin && (
                      <>
                        <hr className="my-1" />
                        {currentView === 'user' ? (
                          <button
                            onClick={handleSwitchToAdminView}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <HiViewBoards className="h-4 w-4 mr-3" />
                            Switch to Admin View
                          </button>
                        ) : (
                          <button
                            onClick={handleSwitchToUserView}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <HiViewList className="h-4 w-4 mr-3" />
                            Switch to User View
                          </button>
                        )}
                      </>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <HiLogout className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      {showGlobalSearch && <GlobalSearch />}
    </header>
  );
};

export default Header; 