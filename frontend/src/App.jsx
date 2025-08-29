import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { initializeAuth } from './store/slices/authSlice';
import { fetchSystemConfig } from './store/slices/systemConfigSlice';
import { useAppName } from './hooks/useSystemConfig';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthRoute from './components/auth/AuthRoute';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Verify2FA from './pages/auth/Verify2FA';

// Landing Page
import Landing from './pages/Landing';

// User Pages
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/campaigns/Campaigns';
import CampaignBuilder from './pages/campaigns/CampaignBuilder';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import SingleSend from './pages/campaigns/SingleSend';
import Analytics from './pages/analytics/Analytics';
import Notifications from './pages/Notifications';
import Account from './pages/Account';
import UserActivity from './pages/UserActivity';

// User Feature Pages
import Billing from './pages/billing/Billing';
import SuppressionList from './pages/suppression/SuppressionList';
import Senders from './pages/senders/Senders';
import Domains from './pages/domains/Domains';
import BounceCredentials from './pages/bounce-credentials/BounceCredentials';

// Public Pages
import Unsubscribe from './pages/Unsubscribe';
import EmailTracking from './pages/EmailTracking';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminDomains from './pages/admin/AdminDomains';
import AdminSenders from './pages/admin/AdminSenders';
import AdminSmtp from './pages/admin/AdminSmtp';
import AdminSystem from './pages/admin/AdminSystem';
import AdminBackups from './pages/admin/AdminBackups';
import AdminLogsAndQueues from './pages/admin/AdminLogsAndQueues';
import AdminPowerMTA from './pages/admin/AdminPowerMTA';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminBilling from './pages/admin/AdminBilling';
function App() {
  const { isAuthenticated, isLoading, currentView } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const appName = useAppName();

  useEffect(() => {
    dispatch(initializeAuth());
    // Fetch system config in parallel with auth initialization
    dispatch(fetchSystemConfig());
  }, [dispatch]);

  // Update document title when app name changes
  useEffect(() => {
    if (appName && appName !== 'WebMail Laravel') {
      document.title = appName;
    }
  }, [appName]);

  // Show loading screen while initializing authentication
  // This prevents any routing decisions until auth is determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              duration: 4000,
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={
            !isAuthenticated ? <Landing /> : <Navigate to={currentView === 'admin' ? "/admin" : "/dashboard"} replace />
          } />

          {/* Public Routes - No authentication required */}
          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
          <Route path="/tracking/:action/:emailId" element={<EmailTracking />} />
          <Route path="/tracking/:action/:emailId/:linkId" element={<EmailTracking />} />

          {/* Auth Routes */}
          <Route element={<AuthRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-2fa" element={<Verify2FA />} />
            </Route>
          </Route>

          {/* All Protected Routes - Available to all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* User Routes - Available to all authenticated users */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/new" element={<CampaignBuilder />} />
              <Route path="/campaigns/single-send" element={<SingleSend />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/campaigns/:id/edit" element={<CampaignBuilder />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/account" element={<Account />} />
              <Route path="/activity" element={<UserActivity />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/senders" element={<Senders />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/bounce-credentials" element={<BounceCredentials />} />

              {/* Admin Routes - Only available to admin users */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/suppression-list" element={<SuppressionList />} />
              <Route path="/admin/campaigns" element={<AdminCampaigns />} />
              <Route path="/admin/domains" element={<AdminDomains />} />
              <Route path="/admin/senders" element={<AdminSenders />} />
              <Route path="/admin/smtp" element={<AdminSmtp />} />
              <Route path="/admin/system" element={<AdminSystem />} />
              <Route path="/admin/backups" element={<AdminBackups />} />
              <Route path="/admin/logs" element={<AdminLogsAndQueues />} />
              <Route path="/admin/powermta" element={<AdminPowerMTA />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/billing" element={<AdminBilling />} />
            </Route>
          </Route>

          {/* Test Route */}
          <Route
            path="/test"
            element={
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Test Page</h1>
                  <p>This is a test page to verify routing works.</p>
                </div>
              </Layout>
            }
          />

          {/* 404 fallback for unmatched routes */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-400">404</h1>
                <p className="mt-4 text-xl text-gray-600">Page not found</p>
                <p className="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
                <div className="mt-8">
                  {isAuthenticated ? (
                    <a
                      href={currentView === 'admin' ? '/admin' : '/dashboard'}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg inline-block"
                    >
                      Go to {currentView === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                    </a>
                  ) : (
                    <a
                      href="/"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg inline-block"
                    >
                      Go to Home
                    </a>
                  )}
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;