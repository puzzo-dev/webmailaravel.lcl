import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { initializeAuth } from './store/slices/authSlice';
import { fetchSystemConfig } from './store/slices/systemConfigSlice';
import { useAppName } from './hooks/useSystemConfig';

// Auth Components (small, load eagerly)
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthRoute from './components/auth/AuthRoute';

// Layout Components (small, load eagerly)
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages (small, load eagerly)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Verify2FA from './pages/auth/Verify2FA';

// Landing Page (small, load eagerly)
import Landing from './pages/Landing';

// Lazy-loaded pages (code-split for smaller initial bundle)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Campaigns = lazy(() => import('./pages/campaigns/Campaigns'));
const CampaignBuilder = lazy(() => import('./pages/campaigns/CampaignBuilder'));
const CampaignDetail = lazy(() => import('./pages/campaigns/CampaignDetail'));
const SingleSend = lazy(() => import('./pages/campaigns/SingleSend'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Account = lazy(() => import('./pages/Account'));
const UserActivity = lazy(() => import('./pages/UserActivity'));
const Billing = lazy(() => import('./pages/billing/Billing'));
const SuppressionList = lazy(() => import('./pages/suppression/SuppressionList'));
const Senders = lazy(() => import('./pages/senders/Senders'));
const Domains = lazy(() => import('./pages/domains/Domains'));
const BounceCredentials = lazy(() => import('./pages/bounce-credentials/BounceCredentials'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));
const EmailTracking = lazy(() => import('./pages/EmailTracking'));

// Admin Pages (lazy-loaded, only loaded for admins)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCampaigns = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminDomains = lazy(() => import('./pages/admin/AdminDomains'));
const AdminSenders = lazy(() => import('./pages/admin/AdminSenders'));
const AdminSmtp = lazy(() => import('./pages/admin/AdminSmtp'));
const AdminSystem = lazy(() => import('./pages/admin/AdminSystem'));
const AdminBackups = lazy(() => import('./pages/admin/AdminBackups'));
const AdminLogsAndQueues = lazy(() => import('./pages/admin/AdminLogsAndQueues'));
const AdminPowerMTA = lazy(() => import('./pages/admin/AdminPowerMTA'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminBilling = lazy(() => import('./pages/admin/AdminBilling'));

// Loading fallback for lazy components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, isLoading, currentView } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const appName = useAppName();

  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(fetchSystemConfig());
  }, [dispatch]);

  useEffect(() => {
    if (appName && appName !== 'WebMail Laravel') {
      document.title = appName;
    }
  }, [appName]);

  if (isLoading) {
    return <PageLoader />;
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
        <Suspense fallback={<PageLoader />}>
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
                {/* User Routes */}
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

                {/* Admin Routes */}
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

            {/* 404 fallback */}
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
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
