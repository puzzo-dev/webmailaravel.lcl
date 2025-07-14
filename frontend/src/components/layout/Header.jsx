import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  HiMenu,
  HiBell,
  HiSearch,
  HiUser,
  HiCog,
  HiLogout,
  HiChevronDown,
} from 'react-icons/hi';

const Header = ({ onMenuClick, user, onLogout }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications } = useSelector((state) => state.notifications);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <HiMenu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search campaigns, templates..."
                    type="search"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
              >
                <HiBell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <HiBell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                                  <HiBell className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {notifications.length > 5 && (
                      <div className="px-4 py-2 border-t border-gray-200">
                        <button className="w-full text-sm text-primary-600 hover:text-primary-500">
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 bg-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name || 'User'}
                </span>
                <HiChevronDown className="hidden md:block h-4 w-4 text-gray-400" />
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <a
                      href="/profile"
                      className="dropdown-item flex items-center"
                    >
                      <HiUser className="mr-3 h-4 w-4" />
                      Profile
                    </a>
                    <a
                      href="/settings"
                      className="dropdown-item flex items-center"
                    >
                      <HiCog className="mr-3 h-4 w-4" />
                      Settings
                    </a>
                    <button
                      onClick={onLogout}
                      className="dropdown-item flex items-center w-full text-left"
                    >
                      <HiLogout className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header; 