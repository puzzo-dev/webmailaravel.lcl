import React from 'react';
import { useDashboard } from '../hooks';
import QuickActions from '../components/QuickActions';
import UserDashboard from '../components/UserDashboard';

const Dashboard = () => {
  const {
    dashboardData,
    loading,
    user,
    refreshDashboard
  } = useDashboard();

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
      <UserDashboard data={dashboardData} onRefresh={refreshDashboard} />
    </div>
  );
};

export default Dashboard; 