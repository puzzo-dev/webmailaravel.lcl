import React, { useEffect, Suspense, lazy } from 'react';
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
import PublicLayout from './components/layout/PublicLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import TwoFactor from './pages/auth/TwoFactor';
import Verify2FA from './pages/auth/Verify2FA';

// Landing Page
import Landing from './pages/Landing';

// Email Tracking Page
import EmailTracking from './pages/EmailTracking';

// Unsubscribe Page
import Unsubscribe from './pages/Unsubscribe';

// Routing Components
import SmartRedirect from './components/routing/SmartRedirect';
import LoadingSpinner from './components/common/LoadingSpinner';

import LazyWrapper from './components/common/LazyWrapper';

// Lazy-loaded User Pages (reduce initial bundle size)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Campaigns = lazy(() => import('./pages/campaigns/Campaigns'));
const CampaignBuilder = lazy(() => import('./pages/campaigns/CampaignBuilder'));
const CampaignDetail = lazy(() => import('./pages/campaigns/CampaignDetail'));
const SingleSend = lazy(() => import('./pages/campaigns/SingleSend'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Account = lazy(() => import('./pages/Account'));
const UserActivity = lazy(() => import('./pages/UserActivity'));
const ApiDocumentation = lazy(() => import('./pages/ApiDocumentation'));

// Lazy-loaded User Feature Pages
const Billing = lazy(() => import('./pages/billing/Billing'));
const PaymentStatus = lazy(() => import('./pages/billing/PaymentStatus'));
const SuppressionList = lazy(() => import('./pages/suppression/SuppressionList'));
const Senders = lazy(() => import('./pages/senders/Senders'));
const Domains = lazy(() => import('./pages/domains/Domains'));
const BounceCredentials = lazy(() => import('./pages/bounce-credentials/BounceCredentials'));

// Lazy-loaded Admin Pages (largest components)
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
const AdminScheduler = lazy(() => import('./pages/admin/AdminScheduler'));

function App() {
  const { isAuthenticated, user, isLoading, currentView } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const appName = useAppName();

  useEffect(() => {
    dispatch(initializeAuth());
    // Fetch system config in parallel with auth initialization
    dispatch(fetchSystemConfig());
  }, []);

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
          !isAuthenticated ? <Landing /> : <SmartRedirect />
        } />
        
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/two-factor" element={<TwoFactor />} />
        
        {/* API Documentation - Public Access */}
        <Route path="/api-docs" element={
          <PublicLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <ApiDocumentation />
            </Suspense>
          </PublicLayout>
        } />

        {/* Email Tracking Routes - Public */}
        <Route path="/track/open/:trackingId" element={<EmailTracking />} />
        <Route path="/track/click/:trackingId" element={<EmailTracking />} />
        <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
        
        {/* Auth Routes */}
        <Route element={<AuthRoute />}>
          <Route element={<AuthLayout />}>
          </Route>
        </Route>

        {/* All Protected Routes - Available to all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* User Routes - Available to all authenticated users */}
            <Route path="/dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="/campaigns" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Campaigns />
              </Suspense>
            } />
            <Route path="/campaigns/new" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CampaignBuilder />
              </Suspense>
            } />
            <Route path="/campaigns/single-send" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SingleSend />
              </Suspense>
            } />
            <Route path="/campaigns/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CampaignDetail />
              </Suspense>
            } />
            <Route path="/campaigns/:id/edit" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CampaignBuilder />
              </Suspense>
            } />
            <Route path="/analytics" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Analytics />
              </Suspense>
            } />
            <Route path="/notifications" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Notifications />
              </Suspense>
            } />
            <Route path="/account" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Account />
              </Suspense>
            } />
            <Route path="/activity" element={
              <Suspense fallback={<LoadingSpinner />}>
                <UserActivity />
              </Suspense>
            } />
            <Route path="/billing" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Billing />
              </Suspense>
            } />
            <Route path="/billing/payment-status" element={
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentStatus />
              </Suspense>
            } />
            <Route path="/senders" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Senders />
              </Suspense>
            } />
            <Route path="/domains" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Domains />
              </Suspense>
            } />
            <Route path="/bounce-credentials" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BounceCredentials />
              </Suspense>
            } />

            {/* Admin Routes - Only available to admin users */}
            <Route path="/admin" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            } />
            <Route path="/admin/dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            } />
            <Route path="/admin/users" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminUsers />
              </Suspense>
            } />
            <Route path="/admin/suppression-list" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SuppressionList />
              </Suspense>
            } />
            <Route path="/admin/campaigns" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminCampaigns />
              </Suspense>
            } />
            <Route path="/admin/domains" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDomains />
              </Suspense>
            } />
            <Route path="/admin/senders" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminSenders />
              </Suspense>
            } />
            <Route path="/admin/smtp" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminSmtp />
              </Suspense>
            } />
            <Route path="/admin/system" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminSystem />
              </Suspense>
            } />
            <Route path="/admin/backups" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminBackups />
              </Suspense>
            } />
            <Route path="/admin/logs" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminLogsAndQueues />
              </Suspense>
            } />
            <Route path="/admin/powermta" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminPowerMTA />
              </Suspense>
            } />
            <Route path="/admin/notifications" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminNotifications />
              </Suspense>
            } />
            <Route path="/admin/billing" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminBilling />
              </Suspense>
            } />
            <Route path="/admin/scheduler" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminScheduler />
              </Suspense>
            } />
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
          
          {/* Auth Routes */}
          <Route element={<AuthRoute />}>
            <Route element={<AuthLayout />}>
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
              <Route path="/billing/payment-status" element={<PaymentStatus />} />
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
              <Route path="/admin/scheduler" element={<AdminScheduler />} />
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
                      href={user?.role === 'admin' && currentView === 'admin' ? '/admin' : '/dashboard'} 
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg inline-block"
                    >
                      Go to {user?.role === 'admin' && currentView === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
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