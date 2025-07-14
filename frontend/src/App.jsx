import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { initializeAuth } from './store/slices/authSlice';

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

// Main Pages
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/campaigns/Campaigns';
import CampaignBuilder from './pages/campaigns/CampaignBuilder';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import Analytics from './pages/analytics/Analytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

// New Feature Pages
import Billing from './pages/billing/Billing';
import SuppressionList from './pages/suppression/SuppressionList';
import Senders from './pages/senders/Senders';
import Domains from './pages/domains/Domains';
import Security from './pages/security/Security';

// Admin Pages
import AdminLogs from './pages/admin/AdminLogs';
import AdminBackups from './pages/admin/AdminBackups';
import AdminPowerMTA from './pages/admin/AdminPowerMTA';
import AdminSystem from './pages/admin/AdminSystem';

// Additional Features
import Templates from './pages/templates/Templates';
import ABTesting from './pages/campaigns/ABTesting';
import Monitoring from './pages/monitoring/Monitoring';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Auth Route Component - redirect authenticated users to dashboard
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.role || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Only initialize auth once on app load
    dispatch(initializeAuth());
  }, []); // Remove dispatch from dependency array to prevent re-initialization

  // Show loading spinner while auth is being initialized
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
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Landing Page - Show for non-authenticated users */}
          {!isAuthenticated && (
            <Route path="/" element={<Landing />} />
          )}

          {/* Auth Routes */}
          <Route path="/login" element={
            <AuthRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </AuthRoute>
          } />
          <Route path="/register" element={
            <AuthRoute>
              <AuthLayout>
                <Register />
              </AuthLayout>
            </AuthRoute>
          } />
          <Route path="/forgot-password" element={
            <AuthRoute>
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            </AuthRoute>
          } />
          <Route path="/reset-password" element={
            <AuthRoute>
              <AuthLayout>
                <ResetPassword />
              </AuthLayout>
            </AuthRoute>
          } />
          <Route path="/verify-2fa" element={
            <AuthRoute>
              <AuthLayout>
                <Verify2FA />
              </AuthLayout>
            </AuthRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <Layout>
                <Campaigns />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/new" element={
            <ProtectedRoute>
              <Layout>
                <CampaignBuilder />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id" element={
            <ProtectedRoute>
              <Layout>
                <CampaignDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/edit" element={
            <ProtectedRoute>
              <Layout>
                <CampaignBuilder />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/templates" element={
            <ProtectedRoute>
              <Layout>
                <Templates />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/ab-testing" element={
            <ProtectedRoute>
              <Layout>
                <ABTesting />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />

          {/* New Feature Routes */}
          <Route path="/billing" element={
            <ProtectedRoute>
              <Layout>
                <Billing />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/suppression-list" element={
            <ProtectedRoute>
              <Layout>
                <SuppressionList />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/senders" element={
            <ProtectedRoute>
              <Layout>
                <Senders />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/domains" element={
            <ProtectedRoute>
              <Layout>
                <Domains />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/security" element={
            <ProtectedRoute>
              <Layout>
                <Security />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/monitoring" element={
            <ProtectedRoute>
              <Layout>
                <Monitoring />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/users" element={
            <AdminRoute>
              <Layout>
                <AdminUsers />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/logs" element={
            <AdminRoute>
              <Layout>
                <AdminLogs />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/backups" element={
            <AdminRoute>
              <Layout>
                <AdminBackups />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/powermta" element={
            <AdminRoute>
              <Layout>
                <AdminPowerMTA />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/system" element={
            <AdminRoute>
              <Layout>
                <AdminSystem />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/campaigns" element={
            <AdminRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Campaigns</h1>
                  <p className="text-gray-600">Admin campaign management coming soon...</p>
                </div>
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/domains" element={
            <AdminRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Domain Management</h1>
                  <p className="text-gray-600">Domain management coming soon...</p>
                </div>
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/billing" element={
            <AdminRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Billing Management</h1>
                  <p className="text-gray-600">Billing management coming soon...</p>
                </div>
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/settings" element={
            <AdminRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h1>
                  <p className="text-gray-600">System settings coming soon...</p>
                </div>
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/security" element={
            <AdminRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Security Settings</h1>
                  <p className="text-gray-600">Security settings coming soon...</p>
                </div>
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/reports" element={
            <AdminRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports</h1>
                  <p className="text-gray-600">Reporting features coming soon...</p>
      </div>
              </Layout>
            </AdminRoute>
          } />

          {/* Redirect authenticated users to dashboard */}
          {isAuthenticated && (
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          )}

          {/* Catch all route - only redirect to / for non-authenticated users */}
          {!isAuthenticated && (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
          
          {/* For authenticated users, redirect unmatched routes to dashboard */}
          {isAuthenticated && (
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
