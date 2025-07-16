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
import Notifications from './pages/Notifications';
import Account from './pages/Account';

// Feature Pages
import Billing from './pages/billing/Billing';
import SuppressionList from './pages/suppression/SuppressionList';
import Senders from './pages/senders/Senders';
import Domains from './pages/domains/Domains';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';
import AdminBackups from './pages/admin/AdminBackups';
import AdminPowerMTA from './pages/admin/AdminPowerMTA';
import AdminSystem from './pages/admin/AdminSystem';
import SystemSettings from './pages/SystemSettings';
import UserActivity from './pages/UserActivity';
import AdminNotifications from './pages/admin/AdminNotifications';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Auth Route Component
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.role || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// Route Configurations
const authRoutes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword },
  { path: '/verify-2fa', component: Verify2FA },
];

const mainRoutes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/campaigns', component: Campaigns },
  { path: '/campaigns/new', component: CampaignBuilder },
  { path: '/campaigns/:id', component: CampaignDetail },
  { path: '/campaigns/:id/edit', component: CampaignBuilder },
  { path: '/analytics', component: Analytics },
  { path: '/notifications', component: Notifications },
  { path: '/account', component: Account },
  { path: '/activity', component: UserActivity },
];

const featureRoutes = [
  { path: '/billing', component: Billing },
  { path: '/suppression-list', component: SuppressionList },
  { path: '/senders', component: Senders },
  { path: '/domains', component: Domains },
];

const adminRoutes = [
  { path: '/admin', component: AdminDashboard },
  { path: '/admin/users', component: AdminUsers },
  { path: '/admin/logs', component: AdminLogs },
  { path: '/admin/backups', component: AdminBackups },
  { path: '/admin/powermta', component: AdminPowerMTA },
  { path: '/admin/system', component: AdminSystem },
  { path: '/admin/system-settings', component: SystemSettings },
  { path: '/admin/notifications', component: AdminNotifications },
];

const adminPlaceholderRoutes = [
  {
    path: '/admin/campaigns',
    title: 'Admin Campaigns',
    description: 'Admin campaign management coming soon...',
  },
  {
    path: '/admin/domains',
    title: 'Domain Management',
    description: 'Domain management coming soon...',
  },
  {
    path: '/admin/billing',
    title: 'Billing Management',
    description: 'Billing management coming soon...',
  },
  {
    path: '/admin/settings',
    title: 'System Settings',
    description: 'System settings coming soon...',
  },
  {
    path: '/admin/security',
    title: 'Security Settings',
    description: 'Security settings coming soon...',
  },
  {
    path: '/admin/reports',
    title: 'Reports',
    description: 'Reporting features coming soon...',
  },
];

function App() {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, []);

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
          {/* Public Routes */}
          {!isAuthenticated && <Route path="/" element={<Landing />} />}
          
          {/* Auth Routes */}
          {authRoutes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <AuthRoute>
                  <AuthLayout>
                    <Component />
                  </AuthLayout>
                </AuthRoute>
              }
            />
          ))}

          {/* Main Protected Routes */}
          {mainRoutes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Component />
                  </Layout>
                </ProtectedRoute>
              }
            />
          ))}

          {/* Feature Routes */}
          {featureRoutes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Component />
                  </Layout>
                </ProtectedRoute>
              }
            />
          ))}

          {/* Admin Routes */}
          {adminRoutes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <AdminRoute>
                  <Layout>
                    <Component />
                  </Layout>
                </AdminRoute>
              }
            />
          ))}

          {/* Admin Placeholder Routes */}
          {adminPlaceholderRoutes.map(({ path, title, description }) => (
            <Route
              key={path}
              path={path}
              element={
                <AdminRoute>
                  <Layout>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
                      <p className="text-gray-600">{description}</p>
                    </div>
                  </Layout>
                </AdminRoute>
              }
            />
          ))}

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
          {isAuthenticated && <Route path="/" element={<Navigate to="/dashboard" replace />} />}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;