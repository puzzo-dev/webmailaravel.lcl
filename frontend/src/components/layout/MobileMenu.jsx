import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiX, HiLogout, HiInbox } from 'react-icons/hi';

const MobileMenu = ({ isOpen, onClose, user, onLogout }) => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Campaigns', href: '/campaigns' },
    { name: 'Domains', href: '/domains' },
    { name: 'Suppression List', href: '/suppression-list' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Account', href: '/account' },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users' },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between h-16 px-4 bg-primary-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <HiInbox className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-white text-lg font-semibold">EmailCampaign</h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={onClose}
              >
                {item.name}
              </NavLink>
            ))}

            {/* Admin Navigation */}
            {isAdmin && (
              <>
                <div className="pt-6 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </h3>
                </div>
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    onClick={onClose}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* User Menu */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <HiLogout className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu; 