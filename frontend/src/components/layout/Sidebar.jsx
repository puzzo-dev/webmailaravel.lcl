import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppName } from '../../hooks/useSystemConfig';
import {
  HiHome,
  HiInbox,
  HiChartBar,
  HiUsers,
  HiCog,
  HiBell,
  HiUser,
  HiCreditCard,
  HiShieldCheck,
  HiGlobe,
  HiServer,
  HiDocumentText,
  HiCloud,
  HiCog as HiSettings,
  HiTemplate,
  HiClock,
  HiLogout,
  HiBan,
  HiDatabase,
  HiKey,
  HiEye,
  HiPencil,
  HiTrash,
  HiPlay,
  HiPause,
  HiStop,
  HiViewBoards,
  HiCollection,
  HiDocumentReport,
  HiCog as HiSystem,
  HiCloud as HiBackup,
  HiClipboardList,
  HiServer as HiPowerMTA,
} from 'react-icons/hi';

const userNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HiHome },
  { name: 'Campaigns', href: '/campaigns', icon: HiInbox },
  { name: 'Analytics', href: '/analytics', icon: HiChartBar },
  { name: 'Domains', href: '/domains', icon: HiGlobe },
  { name: 'Bounce Processing', href: '/bounce-credentials', icon: HiShieldCheck },
  { name: 'Billing', href: '/billing', icon: HiCreditCard },
  { name: 'Account', href: '/account', icon: HiUser },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: HiHome },
  { name: 'Users', href: '/admin/users', icon: HiUsers },
  { name: 'Campaigns', href: '/admin/campaigns', icon: HiInbox },
  { name: 'Domains', href: '/admin/domains', icon: HiGlobe },
  { name: 'Senders', href: '/admin/senders', icon: HiServer },
  { name: 'Suppression List', href: '/admin/suppression-list', icon: HiBan },
  { name: 'SMTP', href: '/admin/smtp', icon: HiKey },
  { name: 'System', href: '/admin/system', icon: HiSystem },
  { name: 'Scheduler', href: '/admin/scheduler', icon: HiClock },
  { name: 'Billing', href: '/admin/billing', icon: HiCreditCard },
  { name: 'Backups', href: '/admin/backups', icon: HiBackup },
  { name: 'Logs', href: '/admin/logs', icon: HiClipboardList },
  { name: 'PowerMTA', href: '/admin/powermta', icon: HiPowerMTA },
  { name: 'Notifications', href: '/admin/notifications', icon: HiBell },
];

const Sidebar = ({ _isOpen, _onClose, user, onLogout }) => {
  const location = useLocation();
  const { currentView } = useSelector((state) => state.auth);
  const appName = useAppName();
  const isAdmin = user?.role === 'admin';
  const isAdminView = currentView === 'admin';

  return (
    <div className={`hidden md:flex md:flex-shrink-0`}>
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                  <HiInbox className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-white text-lg font-semibold">{appName}</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {/* User Navigation - Show for regular users OR admin users in user view */}
              {(!isAdmin || (isAdmin && !isAdminView)) && (
                <>
                  <div className="pb-2">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </h3>
                  </div>
                  {userNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 flex-shrink-0 h-6 w-6 ${
                            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </>
              )}
              
              {/* Admin Navigation - Show only for admin users in admin view */}
              {isAdmin && isAdminView && (
                <>
                  <div className="pb-2">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin
                    </h3>
                  </div>
                  {adminNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 flex-shrink-0 h-6 w-6 ${
                            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
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
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    {isAdminView ? 'Admin View' : 'User View'}
                  </span>
                )}
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
    </div>
  );
};

export default Sidebar; 