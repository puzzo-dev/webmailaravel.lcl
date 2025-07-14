import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar for desktop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Mobile menu */}
      <MobileMenu 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto focus:outline-none">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 relative z-0 overflow-y-auto py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 