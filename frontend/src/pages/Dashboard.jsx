import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/api';
import toast from 'react-hot-toast';
import QuickActions from '../components/QuickActions';
import UserDashboard from '../components/UserDashboard';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // If user is admin, redirect to admin dashboard
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
      fetchDashboardData();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use the dedicated dashboard endpoint that provides role-appropriate data
      const response = await analyticsService.getDashboardData();
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard data error:', error);
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