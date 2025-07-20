import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { initializeAuth } from './store/slices/authSlice';
import { hideSubscriptionOverlay } from './store/slices/uiSlice';

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
import Analytics from './pages/analytics/Analytics';
import Notifications from './pages/Notifications';
import Account from './pages/Account';
import UserActivity from './pages/UserActivity';

// User Feature Pages
import Billing from './pages/billing/Billing';
import SuppressionList from './pages/suppression/SuppressionList';
import Senders from './pages/senders/Senders';
import Domains from './pages/domains/Domains';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminDomains from './pages/admin/AdminDomains';
import AdminSenders from './pages/admin/AdminSenders';
import AdminSmtp from './pages/admin/AdminSmtp';
import AdminSystem from './pages/admin/AdminSystem';
import AdminBackups from './pages/admin/AdminBackups';
import AdminLogs from './pages/admin/AdminLogs';
import AdminPowerMTA from './pages/admin/AdminPowerMTA';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminBilling from './pages/admin/AdminBilling';
function App() {
  const { isAuthenticated, user, isLoading, currentView } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, []);

  // Show loading screen while initializing authentication
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
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/campaigns/:id/edit" element={<CampaignBuilder />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/account" element={<Account />} />
              <Route path="/activity" element={<UserActivity />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/suppression-list" element={<SuppressionList />} />
              <Route path="/senders" element={<Senders />} />
              <Route path="/domains" element={<Domains />} />

              {/* Admin Routes - Only available to admin users */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                <Route path="/admin/domains" element={<AdminDomains />} />
                <Route path="/admin/senders" element={<AdminSenders />} />
                <Route path="/admin/smtp" element={<AdminSmtp />} />
                <Route path="/admin/system" element={<AdminSystem />} />
                <Route path="/admin/backups" element={<AdminBackups />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
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

          {/* Redirects */}
          <Route path="*" element={
            isAuthenticated ? (
              currentView === 'admin' ? 
                <Navigate to="/admin" replace /> : 
                <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;