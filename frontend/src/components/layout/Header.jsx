import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
} from 'react-icons/hi';
import GlobalSearch from '../GlobalSearch';

const Header = ({ onMenuToggle, user, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Mock notifications - replace with actual Redux state
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Campaign Sent Successfully',
      message: 'Your newsletter campaign has been sent to 1,234 recipients',
      time: '2 minutes ago',
      read: false,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Domain Reputation Alert',
      message: 'Domain "example.com" reputation dropped to 85%',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'New Feature Available',
      message: 'Sender rotation is now available for better deliverability',
      time: '3 hours ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const quickActions = [
    { name: 'Campaigns', href: '/campaigns', icon: HiInbox },
    { name: 'Analytics', href: '/analytics', icon: HiChartBar },
    { name: 'Senders', href: '/senders', icon: HiSenders },
    { name: 'Domains', href: '/domains', icon: HiGlobe },
    { name: 'Suppression List', href: '/suppression-list', icon: HiBan },
    { name: 'Account', href: '/account', icon: HiCog },
  ];

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
              {quickActions.map((action) => (
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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              {notification.type === 'success' && (
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <HiInbox className="h-4 w-4 text-green-600" />
                                </div>
                              )}
                              {notification.type === 'warning' && (
                                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <HiBell className="h-4 w-4 text-yellow-600" />
                                </div>
                              )}
                              {notification.type === 'info' && (
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <HiCog className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {notification.time}
                              </p>
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
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all notifications
                    </button>
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
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <a
                      href="/account"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <HiUser className="h-4 w-4 mr-3" />
                      Account
                    </a>
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