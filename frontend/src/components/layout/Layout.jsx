import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { hideSubscriptionOverlay } from '../../store/slices/uiSlice';
import toast from 'react-hot-toast';
import { HiCreditCard, HiX, HiStar, HiCheckCircle } from 'react-icons/hi';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import ViewGuard from '../routing/ViewGuard';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { subscriptionOverlay } = useSelector((state) => state.ui);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      toast.error('Logout failed, but redirecting to login');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* View Guard for automatic redirection */}
      <ViewGuard />
      
      {/* Sidebar */}
      <Sidebar 
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
        {/* Header */}
        <Header 
          onMenuToggle={() => setSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative">
            <Outlet />
          </div>
          
          {/* Subscription Overlay - positioned to cover only the main content area */}
          {subscriptionOverlay.isVisible && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <HiCreditCard className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-gray-900">Subscription Required</h2>
                      <p className="text-sm text-gray-600">Upgrade to access premium features</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(hideSubscriptionOverlay())}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      This feature requires an active subscription. Upgrade now to unlock all premium features and maximize your email campaign success.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Unlimited email campaigns</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Advanced analytics and reporting</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Priority customer support</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Custom domain management</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <HiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Advanced security features</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      navigate('/billing');
                      dispatch(hideSubscriptionOverlay());
                    }}
                    className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                  >
                    <HiStar className="h-5 w-5 mr-2" />
                    Subscribe Now
                  </button>
                  <button
                    onClick={() => dispatch(hideSubscriptionOverlay())}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    You can continue using basic features without a subscription
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>© 2024 Email Campaign Manager. All rights reserved.</p>
              <p className="mt-1">
                Developed by{' '}
                <a 
                  href="https://ivarsetech.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  I-Varse Technologies
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout; 