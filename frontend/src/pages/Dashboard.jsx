import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/api';
import toast from 'react-hot-toast';
import QuickActions from '../components/QuickActions';
import UserDashboard from '../components/UserDashboard';

const Dashboard = () => {
  const { user, currentView } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // If user is admin and in admin view, redirect to admin dashboard
      // But if they're in user view, let them stay on user dashboard
      if (user.role === 'admin' && currentView === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
      fetchDashboardData();
    }
  }, [user, currentView, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use the dedicated dashboard endpoint that provides role-appropriate data
      const response = await analyticsService.getDashboardData();
      
      // Ensure we have the expected data structure
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
      }
      
      // Set empty data structure to prevent component errors
      setDashboardData({
        campaigns: {},
        users: {},
        performance: {},
        deliverability: {},
        revenue: {},
        reputation: {},
        bounce_processing: {},
        suppression: {}
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions user={user} />
      
      {/* User Dashboard with Live Data */}
      <UserDashboard data={dashboardData} onRefresh={fetchDashboardData} />
    </div>
  );
};

export default Dashboard; 